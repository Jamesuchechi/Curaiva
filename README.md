# 🏥 Curaiva AI

### Agents Assemble: The Healthcare AI Endgame Challenge

> **A Healthcare Superpower (MCP) + Intelligence Orchestrator (A2A)**
> Built on Prompt Opinion · FHIR R4 Native · SHARP Context Compliant

[![MCP](https://img.shields.io/badge/MCP-Compliant-0d9488)](https://modelcontextprotocol.io)
[![A2A](https://img.shields.io/badge/A2A-Agent-7c3aed)](https://promptopinion.com)
[![FHIR R4](https://img.shields.io/badge/FHIR-R4-e85d2e)](https://hl7.org/fhir/R4/)
[![SHARP](https://img.shields.io/badge/SHARP-Compliant-0891b2)](https://docs.promptopinion.com/sharp)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3-f55036)](https://groq.com)
[![Mistral](https://img.shields.io/badge/Mistral-Large-ff7000)](https://mistral.ai)

---

## What Is Curaiva AI?

Curaiva AI is a **dual-path hackathon submission** for the Agents Assemble challenge:

| Path                      | What We Built                                 | Prize Target |
| ------------------------- | --------------------------------------------- | ------------ |
| **Option 1 — Superpower** | MCP Server with 6 FHIR-powered clinical tools | Grand Prize  |
| **Option 2 — Agent**      | A2A healthcare orchestrator on Prompt Opinion | Grand Prize  |

Together they form a complete, interoperable healthcare AI system — discoverable and invokable by any agent in the Prompt Opinion ecosystem.

---

## The Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PROMPT OPINION PLATFORM                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Curaiva AI  ←  A2A AGENT                    │   │
│  │   Receives clinical queries via COIN protocol        │   │
│  │   Orchestrates MCP tools · Emits structured results  │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │ MCP tool calls                         │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │         Curaiva AI  ←  MCP SERVER                   │   │
│  │   triage_patient · get_patient_summary               │   │
│  │   check_medication_adherence · mental_health_assess  │   │
│  │   generate_chw_priority_queue · consultation_brief   │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │ SHARP context / FHIR calls             │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │         FHIR R4 SERVER                               │   │
│  │   Patient · Condition · MedicationRequest            │   │
│  │   Observation · Encounter · DiagnosticReport         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## The 6 MCP Tools (The Superpower)

| Tool                          | What It Does                                                     | FHIR Resources Used                                           |
| ----------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| `triage_patient`              | AI severity scoring (low/moderate/critical) + escalation routing | Patient, Condition, Observation                               |
| `get_patient_summary`         | FHIR-powered clinical brief for any summary type                 | Patient, Condition, MedicationRequest, Observation, Encounter |
| `check_medication_adherence`  | Adherence risk scoring + CHW alert recommendations               | Patient, MedicationRequest                                    |
| `mental_health_assessment`    | Mood tracking, CBT guidance, crisis detection + escalation       | Patient, Observation (survey)                                 |
| `generate_chw_priority_queue` | AI-ranked patient watchlist for Community Health Workers         | Patient, Condition, MedicationRequest, Observation            |
| `create_consultation_brief`   | Pre-consult physician documentation with clinical focus areas    | Patient, Condition, MedicationRequest, Observation            |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/curaiva-ai.git
cd curaiva-ai/mcp-server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in GROQ_API_KEY, MISTRAL_API_KEY and optionally DEFAULT_FHIR_BASE_URL
```

### 3. Run the MCP Server

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

Server starts at `http://localhost:3001`

- Health check: `GET /health`
- MCP endpoint: `POST /mcp` (Prompt Opinion connects here)

### 4. Deploy to render

```bash
# Install render CLI
npm install -g @render/cli

# Login and deploy
render login
render init
render up
```

Add `GROQ_API_KEY` and `MISTRAL_API_KEY` in render dashboard → Variables.

Your MCP server URL will be: `https://your-app.render.app/mcp`

### 5. Register on Prompt Opinion

1. Create account at [promptopinion.com](https://promptopinion.com)
2. Navigate to **Marketplace → Add MCP Server**
3. Paste your render URL: `https://your-app.render.app/mcp`
4. Platform will discover all 6 tools automatically
5. Configure A2A Agent using `a2a-agent/agent-config.yaml`
6. Publish to Marketplace

---

## FHIR Integration

Curaiva AI reads real patient data from any FHIR R4 compliant server.

### SHARP Context Propagation

Prompt Opinion passes EHR session credentials via SHARP context on every tool call:

```json
{
  "sharp_context": {
    "fhir_base_url": "https://your-ehr.fhir.com/baseR4",
    "fhir_access_token": "Bearer eyJ...",
    "patient_id": "12724",
    "encounter_id": "ENC-998",
    "practitioner_id": "PRAC-44"
  }
}
```

No token handling needed — Prompt Opinion bridges EHR session credentials automatically.

### Testing with Public FHIR Servers

During development, use these free public FHIR R4 servers:

| Server     | URL                                      | Notes                           |
| ---------- | ---------------------------------------- | ------------------------------- |
| HAPI FHIR  | `https://hapi.fhir.org/baseR4`           | Public, no auth, rich test data |
| NLM Lforms | `https://lforms-fhir.nlm.nih.gov/baseR4` | US NLM maintained               |
| Aidbox     | Your sandbox URL                         | Free tier available             |

Sample patient IDs on HAPI FHIR to test with: `592903`, `12724`, `88234`

---

## A2A Agent Capabilities

The Curaiva AI agent on Prompt Opinion can:

**Receive** intents from other agents:

- `triage_request` — another agent sends patient symptoms for assessment
- `consultation_prep` — another agent requests a pre-consult brief
- `medication_review` — pharmacy agent requests adherence analysis
- `mental_health_check` — wellness agent sends session notes for assessment
- `chw_briefing` — scheduling agent requests today's priority queue

**Emit** results to other agents:

- `triage_result` — severity + escalation flag
- `clinical_brief_ready` — structured physician document
- `crisis_alert` — immediate escalation with emergency resources
---

### A2A Simulation & Verification

Verify the Agent-to-Agent (COIN) protocol exchange:

- **Live Demo Route:** `POST /api/a2a-demo` (Full COIN Intent Router — accepts `triage_request`, etc.)
- **CLI Demo:** `node scripts/a2a-demo.js` (Simulates agent discovery and exchange)
- **A2A Specs:** `a2a-agent/coin-exchange-example.yaml` (Structured protocol examples)

---

## Demo Script (3-Minute Video)

Follow this exact sequence for the submission video:

### Minute 1 — The Superpower

1. Open `https://your-app.render.app/health` — show 6 tools live
2. On Prompt Opinion, show MCP server connected with all tools visible
3. Invoke `triage_patient` directly:
   - Patient ID: `592903` (HAPI FHIR)
   - Symptoms: "Severe chest pain radiating to left arm, started 30 minutes ago"
   - Show: Critical severity, FHIR data fetched, escalate_to_doctor: true

### Minute 2 — The Agent in Action

4. Open the Curaiva AI agent chat on Prompt Opinion
5. Type: "Dr. Obi has a consult with patient 592903 in 5 minutes. What do they need to know?"
6. Agent calls `get_patient_summary` + `create_consultation_brief` via MCP
7. Show the structured physician brief generated from real FHIR data

### Minute 3 — The Ecosystem

8. Type: "Generate today's priority queue for CHW Fatima — patients 101, 204, 387, 512."
9. Agent calls `generate_chw_priority_queue`, show ranked results
10. Show Marketplace listing — agent is discoverable by other agents in ecosystem
11. End: "Curaiva AI — FHIR-powered, SHARP-compliant, live on Prompt Opinion."

---

## Project Structure

```
curaiva-ai/
├── mcp-server/                 # The Superpower (Option 1)
│   ├── src/
│   │   └── server.ts           # All 6 MCP tools + Express HTTP server
│   ├── package.json
│   ├── tsconfig.json
│   ├── render.toml            # One-click render deployment
│   └── .env.example
│
├── a2a-agent/                  # The Agent (Option 2)
│   └── agent-config.yaml       # Prompt Opinion agent configuration
│
├── docs/
│   ├── README.md               # This file
│   ├── DOCUMENTATION.md        # Full technical reference
│   └── TODO.md                 # Build phases
│
└── landing/
    └── index.html              # Product landing page
```

---

## Why This Wins

| Judging Criterion         | Curaiva AI                                                                      |
| ------------------------- | ------------------------------------------------------------------------------- |
| **MCP Compliance**        | ✅ Full MCP server, HTTP/SSE transport, Zod-validated schemas                   |
| **A2A Integration**       | ✅ COIN-compliant agent, published to Prompt Opinion Marketplace                |
| **FHIR Integration**      | ✅ Reads real FHIR R4 data — Patient, Condition, MedicationRequest, Observation |
| **SHARP Compliance**      | ✅ Extracts fhir_base_url, fhir_access_token, patient_id from SHARP context     |
| **Real Healthcare Value** | ✅ Solves 4 critical gaps: access, diagnosis, mental health, adherence          |
| **Marketplace Ready**     | ✅ Discoverable and invokable by other platform agents                          |
| **Demo Quality**          | ✅ Live FHIR data, real AI responses, 3-minute video                            |
| **AI Stack**              | ✅ Mistral Large for clinical triage reasoning · Groq/Llama 3.3 for sub-second brief generation |

---

## License

MIT — Built for the Agents Assemble: Healthcare AI Endgame Challenge.
