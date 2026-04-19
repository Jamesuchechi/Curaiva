# Curaiva AI — Hackathon Build TODO
## Agents Assemble: Healthcare AI Endgame Challenge
### Target: $7,500 Grand Prize

> **Strategy: Do both paths. Ship real FHIR data. Win.**

---

## PHASE 0 — Setup & Accounts (2 hrs)
> Do this FIRST before writing a line of code.

- [ ] **Create Prompt Opinion account** at promptopinion.com
- [ ] **Watch the Getting Started video** → https://youtu.be/Qvs_QK4meHc
- [ ] **Register on hackathon website** (devpost or linked page)
- [ ] Get Anthropic API key from console.anthropic.com
- [ ] Create Railway account at railway.app (free tier sufficient)
- [ ] Bookmark HAPI FHIR public server: https://hapi.fhir.org/baseR4
- [ ] Test a FHIR patient fetch manually:
  ```bash
  curl https://hapi.fhir.org/baseR4/Patient/592903
  ```
- [ ] Confirm you can see a Patient resource with real data

**✅ Done when:** You have Prompt Opinion, Railway, and Anthropic accounts ready.

---

## PHASE 1 — MCP Server (8 hrs)
### Build The Superpower

- [ ] `cd mcp-server && npm install`
- [ ] Copy `.env.example` → `.env`, add your `ANTHROPIC_API_KEY`
- [ ] Run dev server: `npm run dev`
- [ ] Test the health endpoint:
  ```bash
  curl http://localhost:3001/health
  ```
  Confirm all 6 tools appear in the tools array.

### Test Each Tool Locally

- [ ] **triage_patient** — test with chest pain symptoms + HAPI patient ID
  ```json
  {
    "symptoms": "severe chest pain radiating to left arm, 30 minutes",
    "patient_id": "592903",
    "include_history": true
  }
  ```
  Expect: `severity: "critical"`, `escalate_to_doctor: true`

- [ ] **get_patient_summary** — test consultation brief
  ```json
  { "patient_id": "592903", "summary_type": "consultation" }
  ```
  Expect: Structured markdown brief with patient data

- [ ] **check_medication_adherence** — test med review
  ```json
  { "patient_id": "592903", "flag_threshold": 3 }
  ```

- [ ] **mental_health_assessment** — test crisis detection
  ```json
  {
    "patient_id": "592903",
    "session_notes": "I feel like there's no point anymore, sometimes I think about not being here",
    "check_fhir_history": true
  }
  ```
  Expect: `crisis_flag: true`, `escalation_action: "emergency_referral"`

- [ ] **generate_chw_priority_queue** — test with multiple patient IDs
  ```json
  { "patient_ids": ["592903", "12724", "88234", "45611"], "max_results": 4 }
  ```

- [ ] **create_consultation_brief** — test pre-consult doc
  ```json
  {
    "patient_id": "592903",
    "chief_complaint": "chest pain",
    "triage_severity": "critical",
    "consultation_type": "urgent"
  }
  ```

- [ ] All 6 tools pass tests with real FHIR data ✅

### Fix & Polish

- [ ] Handle FHIR 404 gracefully (patient not found)
- [ ] Handle FHIR auth errors gracefully
- [ ] Handle Claude API errors with safe fallbacks
- [ ] Add request logging (console.log tool name + patient ID + timestamp)
- [ ] Validate all tool inputs with Zod (already in code, verify it works)

**✅ Done when:** All 6 tools return valid JSON with real FHIR data locally.

---

## PHASE 2 — Deploy MCP Server (2 hrs)
### Get It Live on the Internet

- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Init project: `cd mcp-server && railway init`
- [ ] Add environment variable in Railway dashboard:
  - `ANTHROPIC_API_KEY` = your key
  - `DEFAULT_FHIR_BASE_URL` = `https://hapi.fhir.org/baseR4`
  - `NODE_ENV` = `production`
- [ ] Deploy: `railway up`
- [ ] Note your deployment URL: `https://curaiva-ai-mcp.railway.app`
- [ ] Test deployed health endpoint:
  ```bash
  curl https://curaiva-ai-mcp.railway.app/health
  ```
- [ ] Test deployed MCP endpoint responds (even if you can't manually call it without the SDK)

**✅ Done when:** Health check returns 200 with all 6 tools from the Railway URL.

---

## PHASE 3 — Prompt Opinion MCP Integration (3 hrs)
### Connect the Superpower to the Platform

- [ ] Log into Prompt Opinion dashboard
- [ ] Navigate to **Tools / MCP Servers → Add Server**
- [ ] Enter your Railway MCP URL
- [ ] Platform discovers all 6 tools — confirm they appear ✅
- [ ] Test each tool from the Prompt Opinion tool tester:
  - [ ] `triage_patient` with a HAPI FHIR patient ID
  - [ ] `get_patient_summary`
  - [ ] `mental_health_assessment` (test crisis path)
  - [ ] `generate_chw_priority_queue` with 3-4 patient IDs
- [ ] Screenshot: All tools visible in Prompt Opinion ✅
- [ ] Screenshot: Successful tool call with FHIR data ✅
- [ ] Publish MCP server to **Marketplace**
- [ ] Screenshot: Marketplace listing live ✅

**✅ Done when:** All 6 tools are live and callable from Prompt Opinion platform.

---

## PHASE 4 — A2A Agent Configuration (3 hrs)
### Build The Orchestrator

- [ ] In Prompt Opinion, navigate to **Agents → Create New Agent**
- [ ] Set agent name: "Curaiva AI"
- [ ] Paste the system prompt from `a2a-agent/agent-config.yaml`
- [ ] Connect MCP server (the one you just published)
- [ ] Configure COIN intents (accepts / emits) from the config file
- [ ] Set SHARP context fields: fhir_base_url (required), patient_id, fhir_access_token
- [ ] Test these 5 scenarios in the agent chat:

  **Scenario 1 — Triage:**
  ```
  Patient 592903 is reporting severe chest pain and difficulty breathing. Triage now.
  ```
  Expect: Agent calls `triage_patient`, returns critical, doctor escalation

  **Scenario 2 — Pre-consult:**
  ```
  Dr. Obi has a consultation with patient 592903 in 5 minutes. Prepare her brief.
  ```
  Expect: Agent calls `get_patient_summary` + `create_consultation_brief`

  **Scenario 3 — CHW briefing:**
  ```
  Generate today's priority queue for CHW Fatima — patients 592903, 12724, 88234.
  ```
  Expect: Agent calls `generate_chw_priority_queue`, ranked list returned

  **Scenario 4 — Crisis:**
  ```
  Patient 88234 just submitted: "I feel like there's no point anymore."
  ```
  Expect: crisis_flag: true, emergency resources included, escalation recommended

  **Scenario 5 — Medication:**
  ```
  Review medication adherence risk for patient 12724 before their visit tomorrow.
  ```
  Expect: `check_medication_adherence` called, risk score returned

- [ ] All 5 scenarios pass ✅
- [ ] **Publish agent to Marketplace**
- [ ] Screenshot: Agent published and discoverable ✅
- [ ] Test: Can another agent in the platform invoke Curaiva AI via A2A? ✅

**✅ Done when:** Agent is live on Prompt Opinion Marketplace, all 5 scenarios work.

---

## PHASE 5 — Demo Video (3 hrs)
### The 3-Minute Submission Video

> This is as important as the code. Judges watch videos.

**Setup before recording:**
- [ ] Clean browser — no personal info visible
- [ ] Prompt Opinion tab open and logged in
- [ ] HAPI FHIR server confirmed working
- [ ] Test all scenarios one more time

**Script (3 minutes exactly):**

- [ ] **0:00–0:15** — Open with the problem:
  *"4.5 billion people lack adequate healthcare access. Curaiva AI closes that gap."*

- [ ] **0:15–0:45** — Show the MCP Server:
  - Open Railway URL /health → 6 tools visible
  - Show MCP server in Prompt Opinion Marketplace

- [ ] **0:45–1:30** — Live triage demo:
  - On Prompt Opinion, invoke `triage_patient` with patient 592903
  - Show FHIR data being fetched (mention "this is a real HAPI FHIR R4 patient")
  - Show structured critical assessment returned

- [ ] **1:30–2:15** — A2A Agent demo:
  - Open Curaiva AI agent chat
  - "Dr. Obi has a consult with patient 592903 in 5 minutes. Prepare the brief."
  - Show agent calling MCP tools automatically
  - Show physician brief generated

- [ ] **2:15–2:50** — CHW and mental health:
  - Quick: generate CHW queue for 3 patients — show ranked results
  - Quick: mental health crisis message — show crisis_flag: true, resources

- [ ] **2:50–3:00** — Close:
  - Show Marketplace listing
  - *"Curaiva AI — FHIR R4 native, SHARP compliant, live on Prompt Opinion. Built for the Endgame."*

**Recording:**
- [ ] Record with Loom (free, easy shareable link)
- [ ] Keep under 3:00 exactly (hackathon requirement)
- [ ] No dead air — every second counts
- [ ] Test audio before recording

**✅ Done when:** Video is under 3 minutes, shows all components, uploaded to Loom.

---

## PHASE 6 — Submission (1 hr)
### Cross the Finish Line

- [ ] Submit on hackathon website with:
  - [ ] Project title: "Curaiva AI — Healthcare Intelligence Superpower + Orchestrator"
  - [ ] Prompt Opinion Marketplace URL (MCP server)
  - [ ] Prompt Opinion Marketplace URL (A2A agent)
  - [ ] GitHub repository URL (public)
  - [ ] Demo video URL (Loom, under 3 minutes)
  - [ ] Brief description (use the README intro)

- [ ] GitHub repo is public ✅
- [ ] README.md is clear and complete ✅
- [ ] Health endpoint is live on Railway ✅
- [ ] Both MCP server AND A2A agent are published to Prompt Opinion Marketplace ✅
- [ ] Video is unlisted (not private) ✅

**✅ Done when:** Submission is submitted before the deadline.**

---

## PHASE 7 — Judge Extras (if time allows)
### Stuff That Pushes You from Finalist to Winner

- [ ] Add a FHIR test patient seeder script (populate HAPI FHIR with realistic data)
- [ ] Add a second MCP tool: `search_similar_cases` — searches FHIR for patients with similar conditions
- [ ] Write a 1-page technical architecture PDF and include in submission
- [ ] Add a demonstration of agent-to-agent: have another Prompt Opinion agent call Curaiva AI via A2A
- [ ] Add structured FHIR Observation writes (not just reads) — show the agent updating the record

---

## Task Assignment

| Who | Owns |
|---|---|
| **Dev 1 (Backend)** | Phase 1 (MCP server code), Phase 2 (Railway deploy) |
| **Dev 2 (Full-stack)** | Phase 3 (Prompt Opinion integration), Phase 4 (A2A config) |
| **Dev 3 (Any)** | Phase 5 (demo video), Phase 6 (submission), landing page |

**Critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
Do not start Phase 3 until Phase 2 is deployed and health check passes.

---

*Curaiva AI · Agents Assemble Challenge · Prize Target: $7,500 Grand Prize*