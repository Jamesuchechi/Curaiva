# Changelog — Curaiva AI

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2025-07-01 · Agents Assemble Submission

### Added

- **MCP Server** — 6 FHIR-powered clinical tools published to Prompt Opinion Marketplace
  - `triage_patient` — AI symptom triage with FHIR history enrichment
  - `get_patient_summary` — Brief, full, and consultation-mode patient summaries
  - `check_medication_adherence` — Risk scoring + CHW alert recommendations
  - `mental_health_assessment` — Crisis detection + CBT recommendations
  - `generate_chw_priority_queue` — AI-ranked patient watchlist for CHWs
  - `create_consultation_brief` — Pre-consult physician documentation
- **A2A Agent** — Curaiva AI orchestrator published to Prompt Opinion Marketplace
  - COIN protocol intents: accepts `triage_request`, `consultation_prep`, `chw_briefing`, `mental_health_check`, `medication_review`
  - Emits: `triage_result`, `clinical_brief_ready`, `crisis_alert`, `chw_queue_ready`
- **SHARP Context Compliance** — All tools read `fhir_base_url`, `patient_id`, `fhir_access_token` from SHARP context
- **FHIR R4 Integration** — All tools fetch real patient data from HAPI FHIR (Patient, Condition, MedicationRequest, Observation, Encounter)
- **Patient Dashboard** — Triage panel, mood tracker, medication logger, activity feed
- **Doctor Workspace** — Real-time inbox, AI brief panel, MCP tool call log, analytics
- **CHW Command Centre** — AI priority queue, live alerts, patient drawer, community health stats
- **Auth System** — Role-based registration (Patient / Doctor / CHW), Supabase Auth, protected routes
- **Design System** — Fraunces + Instrument Sans + DM Mono typography, dark theme, full component library
- **Database** — 10 Supabase tables with RLS on every table, Realtime on 4 tables, crisis alert trigger
- **FHIR Seed Script** — Seeds 4 complete demo patients with conditions, medications, observations
- **Postman Collection** — 10 pre-configured requests covering all 6 MCP tools

---

## [0.3.0] — 2025-06-20 · Integration Sprint

### Added

- Supabase Realtime subscriptions on consultations and messages
- Crisis alert auto-trigger via PostgreSQL function on `crisis_flagged = true`
- Next.js API routes proxying all 6 MCP tools (server-side, API key secured)
- MCP tool call log in Doctor Workspace (live, animated)

### Changed

- Moved all Claude API calls server-side — API key no longer in client bundle
- FHIR fetch errors now return graceful fallbacks instead of crashing

### Fixed

- Race condition in CHW queue refresh causing stale data display
- Triage result not showing when FHIR patient had no existing conditions

---

## [0.2.0] — 2025-06-12 · UI Sprint

### Added

- All three role dashboards (Patient, Doctor, CHW)
- Role-based redirect after login
- Shared component library: Card, Badge, Button, MetricCard, Sparkline, Skeleton, Toast
- CSS design token system (no hardcoded colours anywhere)
- Mood tracker 7-day grid with sparkline chart
- Medication dose logging with animated state transitions
- Doctor consultation inbox with filter tabs
- AI Brief Panel with skeleton loading and slide-in animation
- CHW patient detail drawer (slide-in from right)
- Priority queue with colour-coded urgency tiers

### Changed

- Layout shell sidebar now collapses to icon strip at 768px
- All loading states converted to `<Skeleton>` shimmer

---

## [0.1.0] — 2025-06-05 · Foundation

### Added

- Next.js 15 project with App Router and TypeScript
- MCP Server with Express HTTP transport
- First 3 MCP tools: `triage_patient`, `get_patient_summary`, `create_consultation_brief`
- FHIR R4 client reading from HAPI public test server
- Supabase project with initial schema (profiles, consultations, messages)
- Login and Register pages with Supabase Auth
- Deployed MCP server to render
- Registered MCP server on Prompt Opinion platform

---

_Curaiva AI — Built for the Agents Assemble: Healthcare AI Endgame Challenge_
