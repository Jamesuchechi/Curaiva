# Curaiva AI — Security Policy

> **Healthcare AI systems demand exceptional data handling. This document explains exactly how Curaiva AI protects patient data, credentials, and clinical information.**

---

## Our Core Security Principle

**Curaiva AI does not store, cache, or persist any FHIR patient data.**

Every FHIR query is made at request time, processed transiently in memory, and discarded immediately after the response is returned. No patient health records are written to our database. The only data we store in Supabase is what the patient or clinician explicitly creates inside the Curaiva platform (consultation messages, mood logs, medication logs, triage session records).

---

## Data Classification

| Data Type                   | Where Stored                                     | Who Can Access                         | Encrypted             |
| --------------------------- | ------------------------------------------------ | -------------------------------------- | --------------------- |
| User credentials            | Supabase Auth                                    | User only                              | ✅ (Supabase managed) |
| Profile (name, role, phone) | Supabase `profiles`                              | User + assigned clinicians (RLS)       | ✅ at rest            |
| FHIR health records         | **Not stored** — fetched per-request             | N/A                                    | N/A                   |
| Triage session results      | Supabase `triage_sessions`                       | Patient + assigned doctor (RLS)        | ✅ at rest            |
| Consultation messages       | Supabase `messages`                              | Patient + doctor in consultation (RLS) | ✅ at rest            |
| Mood/mental health logs     | Supabase `mental_health_sessions`                | Patient + CHW if crisis (RLS)          | ✅ at rest            |
| Medication logs             | Supabase `medication_logs`                       | Patient + assigned CHW (RLS)           | ✅ at rest            |
| FHIR access tokens          | **Not stored** — transient per-request via SHARP | N/A                                    | N/A                   |
| API keys                    | Server-side env vars only                        | Deployment environment                 | ✅                    |

---

## Authentication & Authorization

### User Authentication

- All authentication is handled by **Supabase Auth** (industry-standard, SOC 2 certified)
- Passwords are hashed and never stored in plain text
- Sessions use short-lived JWTs with automatic refresh
- All API routes validate the Supabase session server-side before executing

### Role-Based Access Control

Three roles exist: `patient`, `doctor`, `chw`. Each role sees only what it needs:

- **Patients** can only read and write their own records
- **Doctors** can read consultations and patient data for their assigned patients only
- **CHWs** can read patient data for their assigned community patients only
- **No cross-role data leakage** is possible — enforced at the database layer, not just the application layer

### Row Level Security (RLS)

Every table in the Curaiva database has RLS enabled. This means even if an API bug existed, a user's database query would never return another user's data — PostgreSQL enforces this at the query level:

```sql
-- Example: Patients can only see their own triage sessions
CREATE POLICY "Patients see own triage sessions"
  ON public.triage_sessions FOR SELECT
  USING (patient_id = auth.uid());
```

RLS is enabled on: `profiles`, `patient_assignments`, `consultations`, `messages`, `triage_sessions`, `medications`, `medication_logs`, `mental_health_sessions`, `crisis_alerts`, `chw_visits`.

---

## API Key Management

| Key                             | Location                             | Accessible To                                     |
| ------------------------------- | ------------------------------------ | ------------------------------------------------- |
| `GROQ_API_KEY`                 | Server environment variable          | Next.js server-side only, render server-side only |
| `MISTRAL_API_KEY`              | Server environment variable          | Next.js server-side only, render server-side only |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server environment variable          | Next.js server-side only                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-accessible                    | Browser (this key has RLS enforced)               |
| FHIR access tokens              | Passed per-request via SHARP context | MCP server only, discarded after response         |

**The Groq and Mistral API keys are never included in the client-side JavaScript bundle.** All AI calls are made through Next.js API routes (server-side) or the MCP server (server-side). The browser never has direct access to these AI providers.

---

## FHIR Data Handling

### How FHIR data flows through Curaiva

```
EHR / FHIR Server
      │
      │  Bearer token (SHARP context)
      ▼
MCP Server (render)
      │
      │  Fetches patient data at request time
      │  Processes with Groq/Mistral APIs
      │  Returns structured assessment
      │  FHIR data discarded from memory
      ▼
Next.js API Route
      │
      │  Returns assessment to client
      │  Stores only the AI result (not raw FHIR data) in Supabase
      ▼
Client Dashboard
```

**At no point is raw FHIR data written to the Curaiva database.** We store the _AI assessment output_ (e.g., severity score, recommended action), not the raw patient health record.

### SHARP Context Security

FHIR access tokens are provided by Prompt Opinion's SHARP context propagation mechanism. These tokens:

- Come from the connected EHR system's OAuth session
- Are valid only for the duration of the SHARP session
- Are never logged, stored, or written to disk by Curaiva
- Are used only to authenticate the FHIR API request within that tool call

---

## Transport Security

- All communications use **HTTPS/TLS 1.2+** — no plain HTTP in production
- render enforces HTTPS on all deployed endpoints
- Vercel enforces HTTPS on all deployed endpoints
- Supabase enforces HTTPS on all API and database connections
- WebSocket connections (Supabase Realtime) use WSS (WebSocket Secure)

---

## Mental Health Crisis Protocol

Curaiva AI includes automatic crisis detection in the mental health assessment tool. When a crisis is flagged:

1. `crisis_flag: true` is returned by the AI assessment
2. Emergency resources are always included in the response
3. A `crisis_alert` record is created in Supabase automatically via a database trigger
4. The patient's assigned Community Health Worker receives an immediate Realtime notification
5. The patient is shown crisis resources and encouraged to seek immediate help

**Curaiva does not claim to replace emergency services.** All crisis responses include instructions to contact local emergency services and include international crisis helpline references.

---

## PHI and Compliance Considerations

> **Important disclaimer for deploying organisations:**

Curaiva AI is an AI tool designed to assist healthcare workflows. Deploying organisations are responsible for:

1. **HIPAA compliance** (US): Executing a Business Associate Agreement (BAA) with Supabase, Groq, and Mistral before processing real PHI in production
2. **NDPA compliance** (Nigeria): Ensuring patient data handling complies with the Nigeria Data Protection Act 2023
3. **GDPR compliance** (EU/UK): Ensuring appropriate data processing agreements and user consent mechanisms are in place
4. **EHR integration security**: Ensuring FHIR server credentials (access tokens) are provisioned with the minimum required scopes (read-only on Patient, Condition, MedicationRequest, Observation)
5. **Audit logging**: Implementing server-side audit logs for all PHI access in regulated environments

**Curaiva AI's architecture is designed to minimise PHI exposure**, but compliance responsibility ultimately rests with the deploying healthcare organisation.

---

## Vulnerability Reporting

If you discover a security vulnerability in Curaiva AI, please report it responsibly:

- **Email:** security@curaiva.ai _(set up before going to production)_
- **Do not** open a public GitHub issue for security vulnerabilities
- **Include:** Description of the vulnerability, steps to reproduce, potential impact
- **Response time:** We aim to acknowledge all reports within 48 hours

---

## Dependency Security

- Dependencies are audited with `npm audit` before every deployment
- No dependencies with known high/critical vulnerabilities are permitted in production
- Supabase, Groq/Mistral SDKs, and MCP SDK are actively maintained packages from reputable publishers

---

_Last updated: 2025 — Curaiva AI v1.0.0_
