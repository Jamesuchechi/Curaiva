# Curaiva AI — Full Build TODO

## Agents Assemble: Healthcare AI Endgame Challenge

### Target: $7,500 Grand Prize

> **Strategy: Ship a real product. Real FHIR data. Real UI. Both MCP + A2A. Win.**

---

## TEAM SPLIT (Read This First)

| Developer              | Primary Ownership                                                  |
| ---------------------- | ------------------------------------------------------------------ |
| **Dev 1 — Backend**    | Phase 1 (MCP Server), Phase 3 (Deploy + Prompt Opinion)            |
| **Dev 2 — Frontend**   | Phase 2 (Design System), Phase 4 (Patient UI), Phase 5 (Doctor UI) |
| **Dev 3 — Full-stack** | Phase 4 (Auth + Supabase), Phase 6 (CHW UI), Phase 7 (A2A Agent)   |

**Parallel tracks:** Dev 1 builds the backend while Dev 2 builds the design system and pages. They merge at Phase 4 when the frontend hooks into real MCP tool calls.

**Critical path:**

```
Phase 0 → Phase 0.1 → [Phase 1 ∥ Phase 2] → Phase 3 → [Phase 4 ∥ Phase 5 ∥ Phase 6] → Phase 7 → Phase 8 → Phase 9 → Phase 10
```

---

## PHASE 0 — Setup & Accounts

**Est. 2 hrs · Everyone**

### Accounts (do before anything else)

- [ ] Create **Prompt Opinion** account → promptopinion.com
- [ ] Watch Getting Started video → https://youtu.be/Qvs_QK4meHc
- [ ] Register on **hackathon website**
- [ ] Get **MISTRAL/GROQ API key** → console.MISTRAL/GROQ.com
- [ ] Create **render** account → render.app (free tier)
- [ ] Create **Supabase** project → supabase.com (free tier)
- [ ] Create **Vercel** account → vercel.com (free tier)

### Repository

- [ ] Create GitHub repo: `curaiva-ai` (set to **public**)
- [ ] Create monorepo structure:
  ```
  curaiva-ai/
  ├── mcp-server/        ← Dev 1
  ├── web/               ← Dev 2 + 3 (Next.js app)
  ├── a2a-agent/         ← Dev 3
  └── docs/
  ```
- [ ] Add `.gitignore`, `README.md`, `LICENSE`
- [ ] All team members have push access ✅

### Test FHIR connectivity

- [ ] Run this — confirm real patient data comes back:
  ```bash
  curl https://hapi.fhir.org/baseR4/Patient/592903
  ```
- [ ] Bookmark demo patient IDs: `592903`, `12724`, `88234`, `45611`

**✅ Phase 0 done when:** Repo exists, all accounts created, FHIR test returns data.

---

## PHASE 0.1 — Repository Restructure & Tooling

**Est. 1 hr · Everyone**

> Aligning existing code with the planned monorepo structure.

- [x] Move `sever.ts` to `mcp-server/src/server.ts` (and fix spelling to `server.ts`)
- [x] Move `agent.config.yaml` to `a2a-agent/`
- [x] Move `001_initial.sql` to `supabase/migrations/`
- [x] Move all `.md` files (except README) to `docs/`
- [x] Move `fhir_seed.js` and Postman collection to `scripts/`
- [x] Initialize `mcp-server/package.json` with required MCP/MISTRAL/GROQ deps
- [x] Setup `web/` with Next.js 15 (Phase 2)
- [ ] Add `.cursorrules` or `.editorconfig` for team consistency

**✅ Phase 0.1 done when:** Root is clean, sub-packages are initialized, and server.ts is in its new home.

---

## PHASE 1 — MCP Server (Backend) ✅

**Est. 8 hrs · Dev 1**

> Build the Superpower — 6 FHIR-powered clinical tools

### Init & Run

- [x] `cd mcp-server && npm install` ✅
- [x] Copy `.env.example` → `.env`, fill in `GROQ_API_KEY` ✅
- [x] `npm run dev` — server starts on port 3001 ✅
- [x] `GET /health` returns all 6 tools ✅

### Test Each Tool with Real FHIR Data

- [x] `triage_patient` → `severity: "critical"`, `escalate_to_doctor: true` ✅
- [x] `get_patient_summary` → structured markdown brief with FHIR data ✅
- [x] `check_medication_adherence` → adherence risk score + CHW alert flag ✅
- [x] `mental_health_assessment` → `crisis_flag: true` on crisis language ✅
- [x] `generate_chw_priority_queue` → ranked list sorted by urgency score ✅
- [x] `create_consultation_brief` → physician-ready pre-consult document ✅

### MCP Hardening & SHARP Validation

- [x] **SHARP Mocking**: Create `scripts/test-mcp-local.sh` to test with mock `sharp_context` ✅
- [x] **FHIR Error Boundaries**: Ensure tools don't crash if optional FHIR resources (e.g. Observations) are missing ✅
- [x] **Provenance Metadata**: Ensure every tool response includes `fhir_resources_used[]` for the UI to display ✅

### Error Handling

- [x] FHIR 404 → graceful error message, no crash ✅
- [x] FHIR auth error → clear message returned ✅
- [x] Claude API timeout → safe fallback response with escalation ✅
- [x] Invalid patient ID → Zod catches it, returns 400 ✅

**✅ Phase 1 done when:** All 6 tools return valid JSON with real FHIR data locally.

---

## PHASE 2 — Design System & Project Setup ✅

**Est. 4 hrs · Dev 2**

> Build the foundation FIRST. Every page sits on top of this. Do not skip.

### Next.js Init

- [x] `npx create-next-app@latest web --typescript --tailwind --app` ✅
- [x] Install deps:
  ````bash
  npm install @supabase/supabase-js @supabase/ssr lucide-react clsx tailwind-merge
  ``` ✅
  ````
- [x] Set up `lib/utils.ts` with `cn()` helper (clsx + tailwind-merge) ✅
- [x] Create `.env.local` with Supabase + MCP server URL ✅

### Design Tokens — `app/globals.css`

Define these CSS variables. All components reference them — never hardcode a colour.

- [x] Background layers: `--bg`, `--bg2`, `--bg3` ✅
- [x] Surface layers: `--surface`, `--surface2` ✅
- [x] Brand: `--green`, `--green-dim`, `--lime`, `--lime-dim` ✅
- [x] Semantic: `--teal`, `--coral`, `--amber`, `--purple`, `--red` ✅
- [x] Text: `--white`, `--muted`, `--light` ✅
- [x] Borders: `--border`, `--border2` ✅
- [x] Shape: `--radius: 14px`, `--radius-sm: 9px`, `--sidebar: 240px` ✅
- [x] **Glassmorphism**: `--glass-bg`, `--glass-border`, `--glass-blur` ✅
- [x] **Glow System**: `--glow-green`, `--glow-red`, `--glow-amber` ✅

### Typography

- [x] Import `Fraunces` (display headings), `Instrument Sans` (body), `DM Mono` (data/code) from Google Fonts ✅
- [x] Apply via CSS variables in `globals.css` ✅
- [x] Verify: headings use Fraunces, body uses Instrument Sans, numbers/IDs use DM Mono ✅

### Shared Component Library — `components/ui/`

Build these before touching any page. Pages consume them.

- [x] `<Card>` — base card with border, background, optional padding variant ✅
- [x] `<Badge>` — severity/status pill: `critical` (red), `moderate` (amber), `low` (teal), `stable` (green), `new` (purple) ✅
- [x] `<Button>` — variants: `primary` (lime), `ghost` (border only), `danger` (red), `icon` (square) ✅
- [x] `<Avatar>` — circular emoji or initials, with size variants ✅
- [x] `<MetricCard>` — label, large value (Fraunces), trend indicator (↑↓ coloured), icon, hover lift ✅
- [x] `<Sparkline>` — canvas-based mini line chart, accepts `data[]`, `color`, `min`, `max` ✅
- [x] `<Spinner>` — animated ring, used on all AI loading states ✅
- [x] `<Skeleton>` — shimmer placeholder, used while data loads ✅
- [x] `<EmptyState>` — icon + heading + sub-text for empty lists ✅
- [x] `<StatusDot>` — blinking dot for live/connected status ✅
- [x] `<Toast>` — success (teal), error (red), warning (amber) notification ✅

### Layout Shell — `app/(dashboard)/layout.tsx`

- [x] Sidebar: Curaiva logo, nav sections, nav items with icons + badges, user card at bottom ✅
- [x] Role-aware nav: Patient nav / Doctor nav / CHW nav switch based on `profile.role` ✅
- [x] Topbar: page title, status pill ("FHIR Connected"), context CTA button ✅
- [x] Main content area: `overflow-y-auto` with custom scrollbar ✅
- [x] Sidebar collapses to icon strip at `< 768px` ✅
- [x] All transitions smooth: `transition-all duration-200` ✅

**✅ Phase 2 done when:** Design system renders correctly, layout shell shows with sidebar + topbar, all shared components exist and look right in isolation.

---

## PHASE 3 — MCP Deploy + Prompt Opinion

**Est. 3 hrs · Dev 1**

### Deploy to render

- [x] `npm install -g @render/cli && render login` ✅
- [x] `cd mcp-server && render init && render up` ✅
- [x] Add env vars in render dashboard: `MISTRAL/GROQ_API_KEY`, `DEFAULT_FHIR_BASE_URL`, `NODE_ENV` ✅
- [x] `curl https://curaiva-ai-mcp.onrender.com/health` → 200 with all 6 tools ✅
- [x] Share the live URL with Dev 2 + 3 — they need it for API routes ✅

### Connect to Prompt Opinion

- [x] Prompt Opinion → Tools → Add MCP Server → paste Render URL ✅
- [x] All 6 tools auto-discovered and listed ✅
- [x] Test `triage_patient` from Prompt Opinion tool tester ✅
- [x] Test `mental_health_assessment` crisis path ✅
- [x] 📸 Screenshot: all tools visible in Prompt Opinion ✅
- [x] Publish MCP server to **Marketplace** ✅
- [x] 📸 Screenshot: Marketplace listing live ✅

**✅ Phase 3 done when:** MCP is live on render AND published in Prompt Opinion Marketplace.

---

## PHASE 4 — Auth Pages + Patient Dashboard

**Est. 6 hrs · Dev 2 + Dev 3**

> Patient is the primary end-user. This is the heart of the product.

### Auth Pages (Dev 3)

**`/login` page:**

- [x] Centred card layout on dark background
- [x] Curaiva logo + tagline at top
- [x] Email + password fields with focus states
- [x] "Sign In" button — shows `<Spinner>` while loading
- [x] Error message displayed below form (red text)
- [x] "Don't have an account? Register" link
- [x] Supabase `signInWithPassword()` wired up
- [x] On success → redirect to correct dashboard by role

**`/register` page:**

- [x] Same centred layout
- [x] Name, email, password fields
- [x] **Role selector** — three clickable cards side by side:
  - 🧑 Patient — "Access triage, consultations, and medication tracking"
  - 👨‍⚕️ Doctor — "Manage your consultation inbox and patient briefs"
  - 🌍 Community Health Worker — "Monitor and prioritise your patient community"
  - Selected card: lime border + lime-tinted background
- [x] Supabase `signUp()` + insert into `profiles` table with role
- [x] On success → redirect to role dashboard

**`middleware.ts`:**

- [x] Protect all `/dashboard/*` routes ✅
- [x] Redirect unauthenticated users to `/login` ✅
- [x] Redirect wrong-role users to `/unauthorized` ✅

### Patient Dashboard Page (Dev 2) — `/dashboard/patient`

**Metric strip (4 cards):**

- [x] Health Score — large number in teal, trend arrow
- [x] Medication Adherence — percentage in amber
- [x] Today's Mood — score/10 in purple, emoji
- [x] Open Consultations — count in green

**AI Triage panel:**

- [x] `<textarea>` with placeholder
- [x] Character counter below textarea
- [x] 🎙 Voice Input button — uses Web Speech API, pulses red while recording ✅
- [x] "Assess Symptoms" button — disabled when textarea is empty
- [x] On submit: show `<Spinner>`
- [x] **Wire to MCP:** `POST /api/triage` → `triage_patient` → returns assessment ✅
- [x] Result renders below (animated slide-in): ✅
- [x] **Tool Trace:** Live MCP tool call log visible in UI ✅
- [x] Footer: _"Assessed using FHIR Patient 592903 · Claude Opus via MCP"_ ✅

**Mood tracker:**

- [x] 7-column grid: Mon → Today
- [x] Each column: day label, emoji, score (coloured)
- [x] Today's column: lime border + lime-dim background highlight
- [x] `<Sparkline>` chart below columns
- [x] "Log Today's Mood" → opens modal with slider + emoji preview + save → calls `/api/mental-health` ✅

**Today's Medications:**

- [x] Medication list rendered with status dots
- [x] Each row: medication name, dosage, schedule
- [x] Dose dots: teal = taken, red = missed, grey = pending
- [x] "Log Dose" button per pending dose slot
  - Click → `PATCH /api/medications/log` → marks as taken ✅
  - Button turns to "✓ Taken" — dot turns teal ✅
- [x] Adherence streak banner if 5+ days in a row: "🔥 6-day streak!"

**Recent Activity feed:**

- [x] Chronological list of events (triage, doctor replies, missed doses, mental health flags)
- [x] Each: coloured icon in rounded square, description, relative timestamp
- [x] Show 5 items max → "View all" link

**✅ Phase 4 done when:** Patient registers, logs in, runs real triage via MCP, sees Critical badge, logs a dose.

---

## PHASE 5 — Doctor Workspace UI ✅

**Est. 6 hrs · Dev 2**

> Speed and signal. A busy doctor must read the most important thing in 5 seconds.

### Doctor Dashboard Page — `/dashboard/doctor`

**Metric strip (4 cards):**

- [x] Open Consultations — count in coral, "X critical" warning sub-text
- [x] Avg Response Time — minutes in amber, trend down = good
- [x] Patients Seen This Week — count in teal
- [x] AI Briefs Ready — count in lime

**Consultation Inbox (left ~55% of content area):**

- [x] Filter tabs: All / Critical / Moderate / Resolved — updates list
- [x] **Supabase Realtime** subscription on `consultations` table filtered by `doctor_id`
  - New consultations slide in from top automatically — no refresh needed
- [x] Each inbox row:
  - Unread: lime 3px left border indicator
  - Critical: subtle red background tint
  - Patient avatar (emoji/initials)
  - Patient name — bold if unread
  - AI preview snippet in muted text (truncated at 1 line)
  - `<Badge>` severity top-right
  - Relative timestamp
  - Hover: background darkens slightly
- [x] Clicking a row → loads the AI Brief panel (no navigation, stays on same page)

**AI Brief Panel (right ~45% of content area):**

- [x] Default: centred `<EmptyState>` — "Select a consultation to load the AI brief"
- [x] Loading: `<Skeleton>` shimmer on all text sections
- [x] **Wire to MCP:** clicking a row calls `POST /api/brief` → `create_consultation_brief` tool
- [x] Loaded state:
  - Patient name, age, gender — header row
  - `FHIR R4 · SHARP` monospace badge in lime (shows data provenance)
  - ⚠ Alert banner (red background) if `triage_severity === "critical"`
  - **CHIEF COMPLAINT** — plain text
  - **ACTIVE PROBLEMS** — conditions as `<Badge variant="condition">` tags (purple)
  - **CURRENT MEDICATIONS** — med names as amber tags
  - **RECENT OBSERVATIONS** — vitals in a small table (DM Mono values)
  - **SUGGESTED FOCUS AREAS** — numbered list, each item is a specific clinical action
  - "Reply to Patient" primary button (lime)
  - "Mark Resolved" ghost button
- [x] Reply → opens inline text editor below, "Send" posts message to `messages` table

**MCP Tool Call Log (below brief panel):**

- [x] Live log of every MCP call made this session
- [x] Each entry (DM Mono font):
  - Tool name in lime
  - HTTP status badge (200 OK in teal / error in red)
  - Timestamp (HH:MM:SS)
  - Patient ID + FHIR resources used in muted text
- [x] New entries insert at top with `slideIn` animation
- [x] Shows judges exactly how MCP integration works — keep it visible during demo

**Analytics cards (bottom row, 3 cards):**

- [x] Consults This Week — `<Sparkline>` bar chart Mon–Fri
- [x] Severity Distribution — canvas donut chart (critical / moderate / low)
- [x] FHIR Resource Usage — horizontal bar per resource type (Patient, Condition, MedicationRequest, Observation)

**✅ Phase 5 done when:** Doctor sees inbox, clicks a consult, real AI brief generates via MCP, MCP log updates, doctor can reply.

---

## PHASE 6 — CHW Command Centre UI

**Est. 5 hrs · Dev 3**

> The priority queue is the "wow" moment in the demo. Make it undeniable.

### CHW Dashboard Page — `/dashboard/chw`

**Metric strip (4 cards):**

- [ ] My Patients — total count in purple
- [ ] Urgent Visits — count in red
- [ ] Missed Doses Across Community — count in amber
- [ ] Visits Done This Week — count in teal + progress indicator

**AI Priority Queue (main section, ~65% width):**

- [ ] Section header: "AI Priority Queue" + "Generated HH:MM · FHIR R4" badge
- [ ] **Wire to MCP:** on page load → `POST /api/queue` → `generate_chw_priority_queue` with CHW's patient IDs
- [ ] Loading: `<Skeleton>` shimmer on 5 rows
- [ ] Each queue row:
  - Left border colour: red (`score ≥ 75`), amber (`50–74`), teal (`< 50`)
  - Large priority score (Fraunces serif, colour-matched to border)
  - Patient name + age
  - Priority reason in muted text (from AI)
  - Two contextual action buttons:
    - Score 75+: "Visit Now" (primary) + "Call"
    - Score 50–74: "Visit" + "Message" (primary)
    - Score < 50: "Visit" + "Check In" (primary)
- [ ] Sort controls: Score ↓ / Name A–Z / Last Contact
- [ ] "Refresh Queue" button → re-calls MCP tool, animates row reordering

**Patient Detail Drawer:**

- [ ] Clicking any queue row opens a right-side drawer (slides in 300ms)
- [ ] Drawer shows:
  - Patient name, age, gender, FHIR ID
  - Recent triage assessment (from Supabase)
  - Medication list with adherence dots (last 7 days)
  - Mental health mood trend (7-day mini chart)
  - Message input textarea + "Send Message" button
  - "Schedule Visit" button → simple date picker, saves to Supabase
- [ ] Drawer closes on Escape key or clicking the backdrop overlay

**Live Alerts panel (right ~35%):**

- [ ] **Supabase Realtime** on `crisis_alerts` + `medication_logs` tables
- [ ] Each alert: coloured dot (red = crisis, amber = missed dose, teal = doctor reply), description, relative time
- [ ] Crisis alerts: full red background band — impossible to miss
- [ ] "Acknowledge" button → removes from feed
- [ ] Empty state: "✓ No active alerts"

**Community Health summary card:**

- [ ] Avg medication adherence % (DM Mono, coloured)
- [ ] Active conditions count
- [ ] Critical patients count (red)
- [ ] Weekly visit progress bar (lime fill, grey track, "7 / 12" label)

**✅ Phase 6 done when:** CHW logs in, sees real AI priority queue from FHIR, crisis alert is visible, drawer opens with patient history, message can be sent.

---

## PHASE 7 — A2A Agent + API Routes

**Est. 4 hrs · Dev 3**

### A2A Agent on Prompt Opinion

- [ ] Prompt Opinion → Agents → Create New Agent → name: "Curaiva AI"
- [ ] Paste system prompt from `a2a-agent/agent-config.yaml`
- [ ] Connect MCP server, configure COIN intents, set SHARP context fields
- [ ] Test all 5 scenarios (triage, pre-consult, CHW briefing, crisis, medication)
- [ ] All 5 pass ✅
- [ ] Publish to Marketplace ✅
- [ ] 📸 Screenshot: Agent listed in Prompt Opinion Marketplace

### Next.js API Routes (wire UI → MCP securely)

All routes: check Supabase session first, then call MCP. API key never exposed to browser.

- [ ] `POST /api/triage` → `triage_patient`
- [ ] `POST /api/summary` → `get_patient_summary`
- [ ] `POST /api/brief` → `create_consultation_brief`
- [ ] `POST /api/adherence` → `check_medication_adherence`
- [ ] `POST /api/mental-health` → `mental_health_assessment`
- [ ] `POST /api/queue` → `generate_chw_priority_queue`
- [ ] `PATCH /api/medications/log` → update `medication_logs` in Supabase
- [ ] `POST /api/messages` → insert into `messages` in Supabase

### Supabase Tables

- [ ] `profiles` — id, full_name, role, fhir_patient_id
- [ ] `consultations` — patient_id, doctor_id, status, ai_summary, priority, created_at
- [ ] `messages` — consultation_id, sender_id, content, created_at
- [ ] `medication_logs` — patient_id, medication_id, scheduled_at, taken_at, status
- [ ] `mental_health_sessions` — patient_id, mood_score, session_notes, crisis_flagged, created_at
- [ ] Realtime enabled on: `consultations`, `messages`
- [ ] RLS policies on every table — patients only see their own data ✅

**✅ Phase 7 done when:** All 3 dashboards call real MCP tools. A2A agent live on Marketplace.

---

## PHASE 8 — UI Polish & QA

**Est. 4 hrs · Everyone**

> This is what separates a winner from a participant.

### Loading States (every page, every AI call)

- [ ] `<Skeleton>` shimmer on all data that loads async
- [ ] `<Spinner>` inside buttons while submitting
- [ ] Graceful error states on all MCP calls: "Unable to load — try again"
- [ ] Empty states on all list views

### Micro-interactions

- [ ] Sidebar nav: hover tint + active lime highlight + 3px left border
- [ ] Critical `<Badge>`: subtle pulse animation
- [ ] `<MetricCard>`: hover lifts `translateY(-1px)` + deeper shadow
- [ ] Triage result panel: `fadeUp` slide-in animation
- [ ] Inbox rows: hover background transition
- [ ] Queue rows: border-left colour transition on hover
- [ ] Buttons: `scale(0.97)` on active state
- [ ] "Log Dose" → "✓ Taken": colour + text transition, dot fills teal
- [ ] MCP log entries: `slideIn` from top on each new entry

### Responsive Check

- [ ] 1440px (primary design target) — looks great ✅
- [ ] 1024px (laptop) — still readable ✅
- [ ] 768px (tablet) — sidebar collapses ✅

### Full End-to-End QA

**Patient flow:**

- [ ] Register as Patient → Patient Dashboard ✅
- [ ] Type chest pain symptoms → Critical triage via MCP ✅
- [ ] "Connect to Doctor" → consultation created ✅
- [ ] Log 2 medication doses → dots update ✅
- [ ] Log mood 7/10 → sparkline updates ✅

**Doctor flow:**

- [ ] Log in as Doctor → Doctor Workspace ✅
- [ ] New consultation appears in inbox (Realtime) ✅
- [ ] Click → AI brief loads via `create_consultation_brief` MCP call ✅
- [ ] MCP tool log shows all 3 tool calls ✅
- [ ] Reply to patient → message saved ✅

**CHW flow:**

- [ ] Log in as CHW → CHW Command Centre ✅
- [ ] Priority queue loads from `generate_chw_priority_queue` MCP call ✅
- [ ] Crisis alert visible in live alerts panel ✅
- [ ] Click patient row → drawer slides in ✅
- [ ] Send message → saved in Supabase ✅

### The "Winner's Circle" Features (Phase 8 Extensions)

- [ ] **AI Thought Trace**: UI component showing real-time MCP tool calls and FHIR resource access
- [ ] **Data Provenance Badges**: Small hoverable badges on all AI text showing "Source: FHIR Observation/Condition"
- [ ] **A11y Audit**: Pass WCAG 2.1 contrast checks on all severity badges
- [ ] **Micro-animations**: Staggered list entries and pulse effects on critical alerts

**✅ Phase 8 done when:** All 3 roles work end-to-end, no broken states, UI is polished and demo-ready with high-end aesthetics.

---

## PHASE 9 — Deploy Frontend + Demo Video

**Est. 4 hrs · Dev 2 + Dev 3**

### Deploy to Vercel

- [/] `cd web && vercel --prod` (Build verified locally ✅)
- [ ] Add env vars in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `MISTRAL/GROQ_API_KEY`
  - `MCP_SERVER_URL=https://curaiva-ai-mcp.onrender.com`
- [ ] Test live URL — all 3 roles work end-to-end ✅

### Seed Demo Accounts

- [ ] Demo patient → email: patient@curaiva.ai, FHIR ID: 592903
- [ ] Demo doctor → email: doctor@curaiva.ai, assigned to demo patient
- [ ] Demo CHW → email: chw@curaiva.ai, assigned 4 demo patients
- [ ] Verify all 3 logins work cleanly before recording ✅

### Demo Video Script (3 min MAXIMUM)

Rehearse this 3 times. Every second counts.

- [ ] **0:00–0:12** — Hook:
      _"4.5 billion people lack healthcare access. Curaiva AI fixes that — with MCP, A2A, and real FHIR data."_

- [ ] **0:12–0:40** — The Superpower:
  - Show `https://curaiva-ai-mcp.render.app/health` → 6 tools in JSON
  - Cut to Prompt Opinion Marketplace → MCP listed, tools visible

- [ ] **0:40–1:20** — Patient Dashboard:
  - Log in as patient@curaiva.ai
  - Type "severe chest pain, shortness of breath" → Assess Symptoms
  - Show Critical badge appearing, self-care tips, "Connect to Doctor" button
  - Click it → consultation created

- [ ] **1:20–2:00** — Doctor Workspace:
  - Log in as doctor@curaiva.ai
  - New consultation appears in inbox (real-time)
  - Click it → AI brief generates (point to MCP tool log)
  - Say: _"This brief was generated by calling `create_consultation_brief` against real FHIR data — Patient 592903"_
  - Reply to patient

- [ ] **2:00–2:40** — CHW Command Centre + A2A:
  - Log in as chw@curaiva.ai
  - Show priority queue — point out "94 urgency score" patient
  - Briefly show A2A agent on Prompt Opinion invoking a query
  - Show Marketplace listing (both MCP + Agent)

- [ ] **2:40–3:00** — Close:
      _"Curaiva AI — FHIR R4 native, SHARP compliant, three real dashboards, live on Prompt Opinion. Built for the Endgame."_

- [ ] Record with Loom
- [ ] Under 3:00 exactly ✅
- [ ] Test audio before recording ✅
- [ ] No dead air, no fumbling

---

## PHASE 10 — Submission

**Est. 1 hr · Anyone**

- [ ] GitHub repo is public ✅
- [ ] README.md complete ✅
- [ ] MCP server live on render ✅
- [ ] A2A agent live on Prompt Opinion Marketplace ✅
- [ ] Frontend live on Vercel ✅
- [ ] Demo video on Loom (anyone with link) ✅

**Submit with:**

- [ ] Title: `Curaiva AI — Healthcare Intelligence Superpower + Orchestrator`
- [ ] Prompt Opinion MCP Marketplace URL
- [ ] Prompt Opinion A2A Agent Marketplace URL
- [ ] GitHub repo URL
- [ ] Live app URL (Vercel)
- [ ] Demo video URL (Loom, under 3 min)

---

## UI PAGES TRACKER

| Page                    | Route                                 | Owner | Phase | Done? |
| ----------------------- | ------------------------------------- | ----- | ----- | ----- |
| Login                   | `/login`                              | Dev 3 | 4     | [ ]   |
| Register                | `/register`                           | Dev 3 | 4     | [ ]   |
| Patient Dashboard       | `/dashboard/patient`                  | Dev 2 | 4     | [ ]   |
| Patient — Mental Health | `/dashboard/patient/mental-health`    | Dev 2 | 5     | [x]   |
| Patient — Medications   | `/dashboard/patient/medications`      | Dev 2 | 4     | [ ]   |
| Patient — Consultations | `/dashboard/patient/consultations`    | Dev 2 | 5     | [x]   |
| Doctor — Workspace      | `/dashboard/doctor`                   | Dev 2 | 5     | [x]   |
| Doctor — Consult Detail | `/dashboard/doctor/consultation/[id]` | Dev 2 | 5     | [x]   |
| CHW — Command Centre    | `/dashboard/chw`                      | Dev 3 | 6     | [ ]   |
| CHW — Patient Drawer    | (component, not page)                 | Dev 3 | 6     | [ ]   |
| Unauthorized            | `/unauthorized`                       | Dev 3 | 4     | [ ]   |

---

## STRETCH GOALS (after submission)

- [ ] Voice-first triage — entire flow via voice, no typing
- [ ] Multi-language — Hausa, Yoruba, Igbo UI + triage
- [ ] PWA — works offline for low-connectivity areas
- [ ] FHIR Observation writes — agent updates the EHR record, not just reads
- [ ] `search_similar_cases` — 7th MCP tool, finds patients with matching symptom patterns
- [ ] Agent-to-agent demo — another Prompt Opinion agent calls Curaiva via A2A live in the video

---

_Curaiva AI · Agents Assemble Challenge · $7,500 Grand Prize · Built to win._

Add MCP Server: Go to Tools in Prompt Opinion and add your render URL: https://curaiva-ai-mcp-production.up.render.app/mcp
Verify: Ensure all 6 tools (triage, summary, adherence, etc.) are auto-discovered.
Test: Try running triage_patient with a test prompt like "I have a sharp pain in my chest" to confirm the AI and FHIR connection are working through the live server.
Publish: If it looks good, publish it to the Marketplace so it's ready for the judges.
