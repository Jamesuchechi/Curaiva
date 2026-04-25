# Curaiva AI — Demo Script

## 3-Minute Submission Video · Word-for-Word

> **Print this. Rehearse 3 times minimum. Record on the 4th run.**
> Every line is timed. Every tab is pre-opened. No improvising.

---

## PRE-RECORDING CHECKLIST

> Do this 30 minutes before recording. Do not skip any step.

**Browser setup:**

- [ ] Chrome — freshly opened, no other tabs visible, no personal bookmarks showing
- [ ] Tab 1: `https://curaiva-ai-mcp.render.app/health`
- [ ] Tab 2: Prompt Opinion — logged in, MCP server page open
- [ ] Tab 3: Prompt Opinion — Marketplace listing for Curaiva AI MCP
- [ ] Tab 4: Curaiva AI web app — `https://curaiva-ai.vercel.app/login`
- [ ] Tab 5: Prompt Opinion — Curaiva AI A2A Agent chat open

**Credentials ready (pre-filled, do not type live):**

- [ ] Patient login: `patient@curaiva.ai` / `Demo1234!`
- [ ] Doctor login: `doctor@curaiva.ai` / `Demo1234!`
- [ ] CHW login: `chw@curaiva.ai` / `Demo1234!`

**Final system check:**

- [ ] render health endpoint returns 200 ✅
- [ ] Patient dashboard loads after login ✅
- [ ] Triage tool returns "critical" for chest pain ✅
- [ ] Doctor inbox shows at least 1 consultation ✅
- [ ] CHW queue shows 3+ patients ranked ✅
- [ ] Audio test: record 10 seconds, play back, confirm clear ✅

**Recording tool:** Loom (screen + webcam, or screen only)

---

## THE SCRIPT

---

### SEGMENT 1 — THE PROBLEM & HOOK

**Duration: 0:00 – 0:15**
**Tab: Tab 4 (web app login page)**

> _Speak clearly. Do not rush. This is the only moment where the judges decide whether to keep watching._

**Say:**

_"4.5 billion people around the world cannot access a doctor when they need one. Diagnosis comes too late. Medications go untaken. Mental health goes unaddressed. Curaiva AI closes every one of those gaps — with MCP, A2A, and real FHIR data."_

**Action:** While speaking, the login page is visible — shows Curaiva branding. Nothing to click here.

---

### SEGMENT 2 — THE SUPERPOWER (MCP SERVER)

**Duration: 0:15 – 0:42**
**Tab: Tab 1 → Tab 2 → Tab 3**

**Action:** Switch to Tab 1 (`/health` endpoint)

**Say:**

_"This is our MCP server, live on render. Six FHIR-powered clinical tools — triage, patient summarisation, medication adherence, mental health assessment, CHW prioritisation, and consultation briefing."_

**Action:** Let the JSON response be visible for 2–3 seconds. Then switch to Tab 2 (Prompt Opinion MCP server page).

**Say:**

_"It's registered on the Prompt Opinion platform — SHARP compliant, discoverable, and callable by any agent in the ecosystem."_

**Action:** Switch to Tab 3 (Marketplace listing). Scroll briefly to show the tool list.

**Say:**

_"Published to the Marketplace. Any healthcare agent can now invoke these tools."_

---

### SEGMENT 3 — PATIENT DASHBOARD (LIVE TRIAGE)

**Duration: 0:42 – 1:20**
**Tab: Tab 4 (web app)**

**Action:** Switch to Tab 4. Log in as patient. Dashboard loads.

**Say:**

_"This is the Patient Dashboard. Let's run a real triage."_

**Action:** Click the triage textarea. Type — or paste — this:

> `"I have severe chest pain radiating to my left arm. Started 30 minutes ago. I am also very short of breath and feeling dizzy."`

**Action:** Click "Assess Symptoms". Loading spinner appears.

**Say:**

_"Under the hood, this is calling our triage_patient MCP tool — which fetches the patient's FHIR conditions and vitals in real time, then sends everything to Claude for assessment."_

**Action:** Wait for result. When the Critical badge appears:

**Say:**

_"Critical severity. Escalation recommended. The patient sees clear guidance and a direct button to connect to a doctor."_

**Action:** Click "Connect to Doctor Now" button.

**Say:**

_"That creates a consultation — and it appears in the doctor's inbox instantly."_

---

### SEGMENT 4 — DOCTOR WORKSPACE (AI BRIEF)

**Duration: 1:20 – 2:00**
**Tab: Tab 4 (web app — switch to doctor login)**

**Action:** Log out as patient. Log in as `doctor@curaiva.ai`. Doctor dashboard loads.

**Say:**

_"Doctor workspace. The consultation just created is here — marked Critical."_

**Action:** Click the consultation row in the inbox.

**Say:**

_"Clicking it triggers create_consultation_brief — our MCP tool fetches the patient's complete FHIR record and Claude writes a pre-consultation brief in seconds."_

**Action:** The AI brief panel populates. Point briefly to the MCP tool log.

**Say:**

_"This log shows exactly what happened: Patient FHIR record fetched, triage severity passed in, brief generated. The doctor knows everything before typing a single word."_

**Action:** Briefly gesture at the sections — Active Problems, Medications, Suggested Focus Areas.

**Say:**

_"Active problems, medications, recent vitals, clinical focus areas — all from real FHIR data."_

---

### SEGMENT 5 — CHW DASHBOARD + A2A AGENT

**Duration: 2:00 – 2:45**
**Tab: Tab 4 (CHW login) → Tab 5 (A2A Agent)**

**Action:** Log out as doctor. Log in as `chw@curaiva.ai`. CHW dashboard loads.

**Say:**

_"CHW Command Centre. Our generate_chw_priority_queue tool has ranked every patient by urgency — scored by missed doses, triage history, and clinical complexity."_

**Action:** Point to the top patient row (score 94+).

**Say:**

_"94 urgency score — three missed doses plus a critical triage this morning. This CHW knows exactly who to visit first, without guessing."_

**Action:** Switch to Tab 5 — Prompt Opinion A2A Agent chat.

**Say:**

_"And this is our A2A Agent — the full intelligence orchestrator. Published to the Prompt Opinion Marketplace. Let me show it in action."_

**Action:** Type in the agent chat:

> `"Generate today's priority queue for CHW Fatima — patients 592903, 12724, 88234."`

**Action:** Agent responds, calling generate_chw_priority_queue.

**Say:**

_"The agent orchestrates the tools, speaks the COIN protocol, and is invokable by any other agent in the ecosystem."_

---

### SEGMENT 6 — CLOSE

**Duration: 2:45 – 3:00**
**Tab: Tab 3 (Marketplace)**

**Action:** Switch to Tab 3 — Prompt Opinion Marketplace showing both the MCP server and A2A agent listings.

**Say:**

_"Curaiva AI. FHIR R4 native. SHARP compliant. Three real clinical dashboards. Six MCP tools. One A2A agent. All live on Prompt Opinion."_

_(Brief pause — 1 second)_

_"Built for the Endgame."_

**Action:** Stop recording.

---

## TIMING BREAKDOWN

| Segment            | Duration | Cumulative |
| ------------------ | -------- | ---------- |
| 1 — Hook           | 15s      | 0:15       |
| 2 — MCP Server     | 27s      | 0:42       |
| 3 — Patient Triage | 38s      | 1:20       |
| 4 — Doctor Brief   | 40s      | 2:00       |
| 5 — CHW + A2A      | 45s      | 2:45       |
| 6 — Close          | 15s      | 3:00       |

**Total: exactly 3:00**

---

## COMMON MISTAKES TO AVOID

- ❌ Explaining what you're about to do — just do it
- ❌ Saying "um", "so", "basically", "essentially"
- ❌ Scrolling around looking for something — know where everything is
- ❌ Waiting silently while things load — pre-fill your words
- ❌ Recording in one long take with errors — cut and restart a segment if needed
- ❌ Starting with "Hi my name is..." — judges know who you are from the submission

---

## IF SOMETHING BREAKS DURING RECORDING

**FHIR server slow:** Say _"while the FHIR data loads..."_ — fill the gap, don't go silent

**Triage returns unexpected severity:** Accept it, pivot — _"The AI assessed this as moderate — let me show the critical path with another symptom."_ Then type `"crushing chest pain, left arm pain, sweating"` and run again.

**MCP tool call fails:** Switch immediately to the Postman collection, run the tool from there, show the JSON response. Say _"Here's the tool output directly."_

**Login fails:** Use the backup — have the dashboard pre-loaded in an additional incognito tab.

**A2A agent slow:** Say _"The agent is orchestrating the tool calls in real time — this is COIN protocol in action."_ — fill the gap confidently.

---

## AFTER RECORDING

- [ ] Watch it back fully — no exceptions
- [ ] Confirm it is under 3:00
- [ ] Confirm audio is clear throughout
- [ ] Upload to Loom → set to "Anyone with the link can view"
- [ ] Copy the link into the submission form
- [ ] Do not share publicly until after the deadline (protect your idea)

---

_Curaiva AI · Demo Script v1.0 · Agents Assemble Challenge_
