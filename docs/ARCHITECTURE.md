# Curaiva AI — System Architecture

> One-page technical reference for judges, reviewers, and contributors.

---

## System Overview

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                         CURAIVA AI ECOSYSTEM                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   ┌─────────────────────────────────────────────────────────────────┐    ║
║   │                    USER LAYER (3 roles)                          │    ║
║   │                                                                  │    ║
║   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │    ║
║   │  │   Patient    │  │    Doctor    │  │  Community Health    │  │    ║
║   │  │  Dashboard   │  │  Workspace   │  │  Worker Dashboard    │  │    ║
║   │  │              │  │              │  │                      │  │    ║
║   │  │  /dashboard  │  │  /dashboard  │  │  /dashboard/chw      │  │    ║
║   │  │  /patient    │  │  /doctor     │  │                      │  │    ║
║   └──┴──────┬───────┴──┴──────┬───────┴──┴──────────┬───────────┴──┘    ║
║             │                 │                      │                   ║
║   ┌─────────▼─────────────────▼──────────────────────▼─────────────┐    ║
║   │                   NEXT.JS 15 APP LAYER                           │    ║
║   │                    (Vercel Edge Network)                         │    ║
║   │                                                                  │    ║
║   │  App Router │ Server Components │ API Routes │ Middleware (Auth) │    ║
║   │                                                                  │    ║
║   │  /api/triage    /api/brief    /api/queue                         │    ║
║   │  /api/summary   /api/adherence  /api/mental-health               │    ║
║   └──────────┬──────────────────────────┬────────────────────────────┘    ║
║              │                          │                                 ║
║              │ MCP tool calls           │ DB queries / Realtime           ║
║              │                          │                                 ║
║   ┌──────────▼──────────┐   ┌──────────▼──────────────────────────┐    ║
║   │  MCP SERVER         │   │  SUPABASE                            │    ║
║   │  (Railway)          │   │                                      │    ║
║   │                     │   │  PostgreSQL   Auth   Realtime        │    ║
║   │  6 Clinical Tools   │   │                                      │    ║
║   │  ─────────────────  │   │  profiles          triage_sessions   │    ║
║   │  triage_patient     │   │  consultations     medications       │    ║
║   │  get_patient_sum.   │   │  messages          medication_logs   │    ║
║   │  check_med_adhere.  │   │  mental_health     crisis_alerts     │    ║
║   │  mental_health_ass. │   │  patient_assign.   chw_visits        │    ║
║   │  gen_chw_priority   │   │                                      │    ║
║   │  create_brief       │   │  RLS on every table                  │    ║
║   └──────────┬──────────┘   └──────────────────────────────────────┘    ║
║              │                                                           ║
║              │ FHIR R4 calls (SHARP context)                             ║
║              │                                                           ║
║   ┌──────────▼──────────────────────────┐                               ║
║   │  CLAUDE API (MISTRAL/GROQ)             │                               ║
║   │  claude-opus-4-6                    │                               ║
║   │                                     │                               ║
║   │  Triage · Summarisation             │                               ║
║   │  Mental Health · Brief Generation   │                               ║
║   └──────────┬──────────────────────────┘                               ║
║              │                                                           ║
║              │ FHIR R4 API calls                                         ║
║              │                                                           ║
║   ┌──────────▼──────────────────────────┐                               ║
║   │  FHIR R4 SERVER                     │                               ║
║   │  (HAPI FHIR / Hospital EHR)         │                               ║
║   │                                     │                               ║
║   │  Patient   Condition   Observation  │                               ║
║   │  MedicationRequest   Encounter      │                               ║
║   └─────────────────────────────────────┘                               ║
║                                                                           ║
║   ┌───────────────────────────────────────────────────────────────┐      ║
║   │  PROMPT OPINION PLATFORM                                       │      ║
║   │                                                                │      ║
║   │  MCP Server Marketplace    A2A Agent Registry                  │      ║
║   │  ──────────────────────    ──────────────────                  │      ║
║   │  Curaiva AI Superpower  ←→ Curaiva AI Agent                    │      ║
║   │  (6 tools published)       (COIN protocol)                     │      ║
║   └───────────────────────────────────────────────────────────────┘      ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Services & Infrastructure

| Service      | Provider       | Purpose                           | URL Pattern                  |
| ------------ | -------------- | --------------------------------- | ---------------------------- |
| Web App      | Vercel         | Next.js frontend, API routes, SSR | `curaiva-ai.vercel.app`      |
| MCP Server   | Railway        | 6 FHIR-powered clinical tools     | `curaiva-ai-mcp.railway.app` |
| Database     | Supabase       | PostgreSQL + Auth + Realtime      | Supabase project URL         |
| AI Engine    | MISTRAL/GROQ   | Claude Opus — all AI inference    | `api.MISTRAL/GROQ.com`       |
| FHIR Server  | HAPI / EHR     | Patient health records (R4)       | `hapi.fhir.org/baseR4`       |
| MCP Registry | Prompt Opinion | Tool + Agent marketplace          | `promptopinion.com`          |

---

## Data Flow — Patient Triage (Critical Path)

```
Patient types symptoms
        │
        ▼
Next.js Client
  POST /api/triage { symptoms, patient_id }
        │
        ▼  (server-side, API key secured)
Next.js API Route
  → Validates Supabase session
  → Calls MCP Server: tools/call triage_patient
        │
        ▼
MCP Server (Railway)
  → Extracts SHARP context { fhir_base_url, patient_id }
  → Fetches from FHIR:
      GET /Patient/{id}
      GET /Condition?patient={id}
      GET /Observation?patient={id}&category=vital-signs
  → Builds structured prompt with FHIR data
  → Calls Claude API (claude-opus-4-6)
  → Parses JSON response
  → Returns: { severity, severity_score, escalate_to_doctor, ... }
        │
        ▼
Next.js API Route
  → Inserts triage_session into Supabase
  → If escalate=true: creates consultation in Supabase
  → Returns assessment to client
        │
        ▼
Patient Dashboard
  → Renders severity badge, recommended action
  → If critical: "Connect to Doctor" button visible
        │
        ▼  (if escalated)
Supabase Realtime
  → Pushes new consultation to Doctor's inbox in real time
        │
        ▼
Doctor Workspace
  → New row appears in inbox
  → Doctor clicks → /api/brief called → create_consultation_brief MCP tool
  → AI brief rendered in Brief Panel
```

---

## Data Flow — Crisis Detection

```
Patient submits mental health session notes
        │
        ▼
POST /api/mental-health { patient_id, session_notes }
        │
        ▼
MCP Server: mental_health_assessment tool
  → Claude analyses for crisis language
  → Returns: { crisis_flag: true, escalation_action: "emergency_referral" }
        │
        ▼
Next.js API Route
  → Inserts mental_health_session { crisis_flagged: true }
        │
        ▼
Supabase Trigger: handle_crisis_flag
  → Auto-inserts crisis_alert for the patient's CHW
        │
        ▼
Supabase Realtime
  → Pushes alert to CHW dashboard instantly
        │
        ▼
CHW Command Centre
  → Red crisis banner appears in Live Alerts panel
  → CHW can acknowledge and take action
```

---

## SHARP Context Propagation

Prompt Opinion bridges EHR session credentials into every MCP tool call via the SHARP extension spec. No custom token handling required.

```json
{
  "sharp_context": {
    "fhir_base_url": "https://hapi.fhir.org/baseR4",
    "fhir_access_token": "Bearer eyJ...",
    "patient_id": "592903",
    "encounter_id": "ENC-998",
    "practitioner_id": "PRAC-44",
    "tenant_id": "curaiva-org-1"
  }
}
```

Each MCP tool calls `extractSharpContext()` at the top, then constructs a `FhirClient` with those credentials. The FHIR access token is never stored — it's used transiently per request.

---

## Security Boundaries

```
PUBLIC (no auth)
  └── Landing page, /login, /register

AUTHENTICATED (Supabase session required)
  └── All /dashboard/* routes
  └── All /api/* routes (session checked server-side)

ROLE-RESTRICTED (session + role check)
  └── /dashboard/patient → role must be 'patient'
  └── /dashboard/doctor  → role must be 'doctor'
  └── /dashboard/chw     → role must be 'chw'

DATABASE LAYER (Row Level Security)
  └── Patients: can only read/write own rows
  └── Doctors: can read consultations where doctor_id = auth.uid()
  └── CHWs: can read patients where chw_id = auth.uid()
  └── Crisis alerts: visible only to the assigned CHW

API KEY LAYER
  └── MISTRAL/GROQ_API_KEY: server-side only, never in browser bundle
  └── SUPABASE_SERVICE_ROLE_KEY: server-side only
  └── FHIR access tokens: passed per-request via SHARP context, never stored
```

---

## Technology Versions

| Package                     | Version | Notes                                |
| --------------------------- | ------- | ------------------------------------ |
| Next.js                     | 15.x    | App Router, Server Components        |
| TypeScript                  | 5.7.x   | Strict mode                          |
| `@modelcontextprotocol/sdk` | 1.15.x  | MCP server + transport               |
| `@MISTRAL/GROQ-ai/sdk`      | 0.52.x  | Claude API client                    |
| `@supabase/supabase-js`     | 2.x     | DB + Auth + Realtime                 |
| `zod`                       | 3.24.x  | Schema validation on all tool inputs |
| `express`                   | 4.21.x  | HTTP server for MCP transport        |

---

## Repository Structure

```
curaiva-ai/
├── mcp-server/              # The Superpower (Option 1: MCP)
│   ├── src/server.ts        # All 6 tools + Express HTTP server
│   ├── package.json
│   ├── tsconfig.json
│   └── railway.toml
│
├── web/                     # The Product (Next.js App)
│   ├── app/
│   │   ├── (auth)/          # Login, Register
│   │   ├── (dashboard)/     # Patient, Doctor, CHW dashboards
│   │   └── api/             # Server-side MCP proxy routes
│   ├── components/
│   │   └── ui/              # Shared design system components
│   └── lib/
│       ├── supabase/        # Supabase clients (browser + server + middleware)
│       └── utils.ts
│
├── a2a-agent/               # The Orchestrator (Option 2: A2A)
│   └── agent-config.yaml    # Prompt Opinion agent configuration
│
├── supabase/
│   └── migrations/
│       └── 001_initial.sql  # Complete DB schema + RLS + triggers
│
├── docs/                    # All project documentation
│   ├── README.md
│   ├── ARCHITECTURE.md      # This file
│   ├── DOCUMENTATION.md
│   ├── SECURITY.md
│   └── TODO.md
│
├── scripts/
│   ├── fhir-seed.js         # Seeds FHIR server with demo patient data
│   └── Curaiva_AI_MCP.postman_collection.json
│
└── .github/
    └── ISSUE_TEMPLATE/
        ├── bug_report.md
        └── feature_request.md
```
