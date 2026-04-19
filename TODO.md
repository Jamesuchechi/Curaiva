# Curaiva AI — Build Phases & TODO

> Hackathon build plan broken into phases. Each phase has a clear deliverable.
> Estimated total: **2–3 days** for a team of 2–3 developers.

---

## 🗂 Phase Overview

| Phase | Name | Duration | Deliverable |
|---|---|---|---|
| 0 | Foundation & Setup | 2–3 hrs | Running app, auth, DB |
| 1 | AI Triage Core | 3–4 hrs | Working symptom checker |
| 2 | Doctor Connect | 3–4 hrs | Consultation inbox + messaging |
| 3 | CHW Dashboard | 2–3 hrs | Priority queue live |
| 4 | Mental Health | 2–3 hrs | Companion chat |
| 5 | Medication Tracker | 2 hrs | Med logging + reminders |
| 6 | Polish & Demo Prep | 2–3 hrs | Pitch-ready product |

---

## ⚙️ Phase 0 — Foundation & Setup
**Goal:** Everyone on the team can run the app locally. DB is live. Auth works.

### Project Setup
- [ ] Initialize Next.js 15 project with App Router (`npx create-next-app@latest`)
- [ ] Install and configure Tailwind CSS
- [ ] Set up folder structure (`app/`, `components/`, `lib/`, `types/`)
- [ ] Create `.env.local` with all required environment variables
- [ ] Create `.env.example` (sanitized, for the repo)
- [ ] Initialize Git and push to GitHub

### Supabase Setup
- [ ] Create Supabase project
- [ ] Enable email auth in Supabase Dashboard
- [ ] Write and run migration: `profiles` table
- [ ] Write and run migration: `patients` table
- [ ] Write and run migration: `triage_sessions` table
- [ ] Write and run migration: `consultations` table
- [ ] Write and run migration: `messages` table
- [ ] Write and run migration: `mental_health_sessions` table
- [ ] Write and run migration: `mental_health_messages` table
- [ ] Write and run migration: `medications` table
- [ ] Write and run migration: `medication_logs` table
- [ ] Enable Row Level Security on all tables
- [ ] Write RLS policies for `patient`, `doctor`, `chw` roles
- [ ] Create database trigger: auto-insert into `profiles` on `auth.users` creation

### Supabase Client Setup
- [ ] Create `lib/supabase/client.ts` (browser client)
- [ ] Create `lib/supabase/server.ts` (server component client)
- [ ] Create `lib/supabase/middleware.ts` (middleware client)
- [ ] Test Supabase connection

### Authentication
- [ ] Build `/login` page (email + password form)
- [ ] Build `/register` page (name, email, password, role selector)
- [ ] Wire up Supabase Auth `signInWithPassword` and `signUp`
- [ ] Build `middleware.ts` for protected route enforcement
- [ ] Build role-based redirect after login (patient → `/dashboard/patient`, etc.)
- [ ] Add logout button

### Navigation Shell
- [ ] Build shared `(dashboard)/layout.tsx` with sidebar
- [ ] Sidebar shows role-appropriate links
- [ ] Mobile-responsive nav

**✅ Phase 0 Complete when:** You can register as each of the 3 roles, log in, and land on a blank dashboard page.

---

## 🤖 Phase 1 — AI Symptom Triage
**Goal:** A patient can describe symptoms, get an AI assessment, and have a consultation auto-created if needed.

### Backend
- [ ] Create `lib/claude/triage.ts` — Claude API wrapper with triage system prompt
- [ ] Create `app/api/triage/route.ts` — POST handler
  - [ ] Validate user is authenticated and has `patient` role
  - [ ] Call Claude with symptom input + patient history
  - [ ] Parse and validate JSON response from Claude
  - [ ] Insert triage session into `triage_sessions`
  - [ ] If `escalate_to_doctor = true`, call `createConsultation()` helper
  - [ ] Return assessment to client
- [ ] Write `createConsultation()` helper — assigns available doctor from `profiles`

### Frontend
- [ ] Build `/dashboard/patient/triage/page.tsx`
- [ ] Build `<SymptomInput>` component
  - [ ] Text area for symptom description
  - [ ] Voice input button (Web Speech API)
  - [ ] Real-time voice-to-text transcription
  - [ ] "Assess my symptoms" submit button with loading state
- [ ] Build `<TriageResult>` component
  - [ ] Severity badge (green / yellow / red) with score
  - [ ] Likely conditions list
  - [ ] Recommended action card
  - [ ] Self-care tips (collapsible list)
  - [ ] Red flags section (if any)
  - [ ] "Talk to a Doctor" CTA button (visible if `escalate = true`)
  - [ ] Disclaimer footer

### TypeScript Types
- [ ] Define `TriageAssessment` interface
- [ ] Define `TriageSession` interface

**✅ Phase 1 Complete when:** Patient enters symptoms, gets a structured AI response with severity rating, and sees a "Talk to a Doctor" button when severity is moderate/critical.

---

## 👨‍⚕️ Phase 2 — Doctor Connect
**Goal:** Doctors have an inbox, can view AI patient summaries, and exchange messages with patients in real time.

### Backend
- [ ] Create `lib/claude/summarize.ts` — patient brief generator prompt
- [ ] Create `app/api/summarize/route.ts` — POST handler
  - [ ] Fetch consultation + triage session + patient history from Supabase
  - [ ] Call Claude to generate brief
  - [ ] Update `consultations.ai_summary` field
- [ ] Create `app/api/messages/route.ts`
  - [ ] POST: insert new message into `messages` table
  - [ ] GET: fetch message history for a consultation

### Frontend — Doctor Side
- [ ] Build `/dashboard/doctor/page.tsx` — inbox
  - [ ] `<ConsultationCard>` — shows patient name, severity badge, time, status
  - [ ] Status filter tabs: Open / In Progress / Resolved
  - [ ] Real-time subscription: new consultations appear instantly (Supabase Realtime)
- [ ] Build `/dashboard/doctor/consultation/[id]/page.tsx`
  - [ ] `<PatientBrief>` — AI-generated summary panel at top
  - [ ] `<ConsultationThread>` — message history
  - [ ] Message input box + send button
  - [ ] "Mark Resolved" button → updates `consultations.status`
  - [ ] Priority badge (normal / urgent / critical)

### Frontend — Patient Side
- [ ] Build `/dashboard/patient/consultations/page.tsx` — patient sees their consultation list
- [ ] Patient can view replies from doctor in the same thread UI

### Real-Time
- [ ] Set up Supabase Realtime channel for doctor inbox (new consultations)
- [ ] Set up Supabase Realtime channel for message threads (live chat)

**✅ Phase 2 Complete when:** A patient is escalated from triage, a doctor sees it in their inbox with an AI brief, they exchange messages, and the doctor marks it resolved.

---

## 🌍 Phase 3 — CHW Dashboard
**Goal:** Community Health Workers have a live, prioritized view of their assigned patients.

### Backend
- [ ] Create priority scoring logic in `lib/priority.ts`
  - [ ] Score = `(missed_doses × 10) + (triage_severity × 8) + (days_since_contact × 3) + (crisis_flag × 40)`
- [ ] Create `app/api/chw/priority-queue/route.ts`
  - [ ] Fetch all patients assigned to CHW
  - [ ] For each patient: calculate priority score
  - [ ] Sort descending by score
  - [ ] Return enriched patient list with `priority_reason` text
- [ ] Create `app/api/chw/schedule-visit/route.ts` — log a planned home visit

### Frontend
- [ ] Build `/dashboard/chw/page.tsx` — main dashboard
  - [ ] `<PriorityQueue>` — ranked patient card list
  - [ ] Each card shows: name, priority score, reason badge, last active
  - [ ] Color-coded rows (green / amber / red) by urgency tier
  - [ ] "Message" button — quick message to patient
  - [ ] "Schedule Visit" button — opens modal
  - [ ] Real-time refresh on medication or triage updates
- [ ] Build `/dashboard/chw/patient/[id]/page.tsx` — patient detail view
  - [ ] Recent triage sessions
  - [ ] Medication adherence chart (last 7 days)
  - [ ] Mental health flag indicator
  - [ ] Message thread with patient

**✅ Phase 3 Complete when:** CHW logs in and sees a prioritized list of their patients with color-coded urgency and can send a quick message or schedule a visit.

---

## 🧠 Phase 4 — Mental Health Companion
**Goal:** Patients can have daily AI-powered check-in conversations with mood tracking and crisis escalation.

### Backend
- [ ] Create `lib/claude/mental-health.ts` — mental health companion prompt
- [ ] Create `app/api/mental-health/chat/route.ts`
  - [ ] Accept full conversation history
  - [ ] Call Claude with mental health system prompt + history
  - [ ] Parse response: `{ message, crisis_flag, suggested_exercise }`
  - [ ] Insert message pair into `mental_health_messages`
  - [ ] If `crisis_flag = true`: update `mental_health_sessions.crisis_flagged = true`
- [ ] Create `app/api/mental-health/session/route.ts`
  - [ ] POST: create new session with mood score
  - [ ] GET: fetch today's session (or create if none)
- [ ] Create Supabase database trigger: on `crisis_flagged = true`, insert into a `crisis_alerts` table (picked up by edge function)
- [ ] Write `supabase/functions/escalate-crisis/index.ts` — notifies assigned CHW via SMS

### Frontend
- [ ] Build `/dashboard/patient/mental-health/page.tsx`
  - [ ] `<MoodTracker>` — daily slider (1–10) with emoji indicators
  - [ ] Mood trend sparkline (last 7 days)
  - [ ] "Start check-in" button → opens companion chat
- [ ] Build `<CompanionChat>` component
  - [ ] Chat bubble UI (user right, AI left)
  - [ ] Typing indicator animation
  - [ ] `<ExerciseCard>` — displayed when AI suggests an exercise (e.g., breathing guide)
  - [ ] Crisis banner — displayed when crisis is detected, with emergency contacts
  - [ ] Scroll-to-bottom on new messages

**✅ Phase 4 Complete when:** Patient can start a daily check-in conversation, get CBT suggestions, and a crisis message triggers an alert to their CHW.

---

## 💊 Phase 5 — Medication Tracker
**Goal:** Patients log their medications once and get reminders. CHWs are alerted on missed doses.

### Backend
- [ ] Create `app/api/medications/route.ts`
  - [ ] POST: add new medication (generates `medication_logs` for next 30 days)
  - [ ] GET: fetch active medications for patient
- [ ] Create `app/api/medications/log/route.ts`
  - [ ] POST: mark a dose as taken / missed / skipped
- [ ] Write `supabase/functions/send-medication-reminders/index.ts`
  - [ ] Query `medication_logs` for upcoming doses in next 30 min
  - [ ] Send SMS via Termii (or email via Resend)
- [ ] Write `supabase/functions/check-missed-doses/index.ts`
  - [ ] Mark overdue pending logs as `missed`
  - [ ] If 2+ consecutive missed: insert alert, notify CHW
- [ ] Set up cron schedules in Supabase for both functions

### Frontend
- [ ] Build `/dashboard/patient/medications/page.tsx`
  - [ ] `<MedCard>` per medication — name, dosage, frequency
  - [ ] Today's dose schedule with time slots
  - [ ] "Take Now" button per dose slot → logs as `taken`
  - [ ] Adherence streak counter ("You've taken your meds 6 days in a row! 🎉")
  - [ ] "Add Medication" button → modal form
- [ ] `<AddMedicationModal>` — name, dosage, frequency, times, start date

**✅ Phase 5 Complete when:** Patient adds a medication, sees today's schedule, logs a dose, and missing 2 consecutive doses triggers a CHW alert.

---

## ✨ Phase 6 — Polish & Demo Prep
**Goal:** The product looks great, the demo flows are rehearsed, and the app is deployed.

### UI Polish
- [ ] Consistent loading states on all AI-powered actions (skeleton loaders, spinners)
- [ ] Empty states for all list views (no consultations yet, no medications yet, etc.)
- [ ] Toast notifications for success/error actions
- [ ] Responsive design check — all views work on mobile
- [ ] Dark/light mode (optional but impressive)
- [ ] Curaiva AI logo / branding in the nav

### Demo Data
- [ ] Seed script: create 1 demo patient, 1 demo doctor, 1 demo CHW account
- [ ] Seed script: pre-populate 2–3 triage sessions with varying severity
- [ ] Seed script: pre-populate consultation thread with messages
- [ ] Seed script: add 3 medications with some missed doses
- [ ] Seed script: add mental health session history with mood scores

### Error Handling
- [ ] All API routes have try/catch with safe fallbacks
- [ ] Claude API failure returns a graceful "unable to assess" message
- [ ] Form validation on all inputs

### Deployment
- [ ] Deploy to Vercel (`vercel --prod`)
- [ ] Set all environment variables in Vercel dashboard
- [ ] Deploy Supabase Edge Functions (`supabase functions deploy`)
- [ ] Set up cron job schedules in Supabase
- [ ] Smoke test all three user flows on the live URL

### Demo Script (Practice These Flows)
- [ ] **Flow 1 — Patient:** Register → Describe symptoms → See AI triage → Get escalated → View consultation
- [ ] **Flow 2 — Doctor:** Log in → See inbox with AI brief → Reply to patient → Mark resolved
- [ ] **Flow 3 — CHW:** Log in → See priority list → Click on high-priority patient → View history → Send message

### Presentation Prep
- [ ] Rehearse the 3 demo flows (aim for under 4 minutes total)
- [ ] Have the pitch deck open as backup
- [ ] Prepare a 1-sentence product pitch: *"Curaiva AI is a unified, AI-powered health platform that connects patients, doctors, and community health workers — solving access, diagnosis, mental health, and medication adherence in one product."*
- [ ] Prepare answers to likely judge questions:
  - "How do you handle medical liability?" → AI is a triage tool, not a diagnosis. Always escalates critical cases. Includes disclaimers.
  - "What happens in areas with no internet?" → Offline SMS mode planned for v2 via Termii.
  - "How do you verify doctors?" → Manual verification flow + license number field in v2.

---

## 🚀 Stretch Goals (If Time Allows)

- [ ] **Voice-first triage** — entire triage flow via voice, no typing needed
- [ ] **Multi-language support** — Hausa, Yoruba, Igbo for Nigerian reach
- [ ] **Offline mode** — PWA with service workers for low-connectivity areas
- [ ] **Analytics dashboard** — health trends per community for CHWs
- [ ] **Appointment booking** — schedule in-person doctor visits
- [ ] **Lab result upload** — patients upload photos of lab results for AI analysis

---

## 📋 Task Assignment Suggestion

| Developer | Phases |
|---|---|
| Dev 1 (Backend-leaning) | Phase 0 (Supabase/Auth), Phase 1 (AI Triage API), Phase 5 (Edge Functions) |
| Dev 2 (Frontend-leaning) | Phase 1 (Triage UI), Phase 2 (Doctor UI), Phase 3 (CHW Dashboard UI) |
| Dev 3 (Full-stack) | Phase 2 (Realtime), Phase 4 (Mental Health), Phase 6 (Polish + Deploy) |

---

*Built for the Hackathon · Theme: Real-Life Healthcare with AI · Curaiva AI*