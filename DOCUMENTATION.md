# Curaiva AI — Technical Documentation

> Version 1.0 | Hackathon Build | Theme: Real-Life Healthcare with AI

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [AI Integration (Claude API)](#4-ai-integration-claude-api)
5. [API Reference](#5-api-reference)
6. [Supabase Edge Functions](#6-supabase-edge-functions)
7. [Real-Time Features](#7-real-time-features)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Environment Variables](#9-environment-variables)
10. [Deployment Guide](#10-deployment-guide)
11. [Security Considerations](#11-security-considerations)
12. [Error Handling](#12-error-handling)

---

## 1. Architecture Overview

Curaiva AI follows a **role-based, serverless-first** architecture optimized for rapid development and real-world scale.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│              Next.js 15 App Router + Tailwind CSS            │
└────────────┬───────────────────────────────────┬────────────┘
             │  HTTPS                             │ WebSocket
             ▼                                   ▼
┌────────────────────────┐          ┌─────────────────────────┐
│   Next.js API Routes   │          │   Supabase Realtime      │
│  /api/triage           │          │   (live patient updates) │
│  /api/mental-health    │          └─────────────────────────┘
│  /api/summarize        │
└──────────┬─────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌───────┐   ┌──────────────────────┐
│Claude │   │  Supabase            │
│  API  │   │  ├── Auth            │
│       │   │  ├── PostgreSQL DB   │
│       │   │  ├── Storage         │
└───────┘   │  └── Edge Functions  │
            └──────────────────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
          ┌───────┐        ┌─────────┐
          │ Resend│        │ Termii  │
          │(email)│        │  (SMS)  │
          └───────┘        └─────────┘
```

### Key Design Decisions

**Why Next.js App Router?**
Server Components allow AI API calls to happen server-side, keeping the Anthropic API key secure and reducing client bundle size significantly.

**Why Supabase?**
Supabase provides auth, a relational database, realtime subscriptions, and edge functions in one managed service — ideal for a hackathon where velocity matters. Row Level Security (RLS) enforces data isolation at the database layer, not just the application layer.

**Why Claude API?**
Claude's long context window and instruction-following quality make it ideal for medical triage — it handles nuanced, multi-symptom descriptions far better than simpler models, while its safety training reduces the risk of dangerous health advice.

---

## 2. Database Schema

All tables live in Supabase PostgreSQL. Row Level Security is enabled on every table.

### `profiles`
Extends Supabase `auth.users`. Created automatically on user registration via a trigger.

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'chw')),
  phone       TEXT,
  location    TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `patients`
Extended profile data for users with `role = 'patient'`.

```sql
CREATE TABLE patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date_of_birth   DATE,
  blood_group     TEXT,
  allergies       TEXT[],
  assigned_chw_id UUID REFERENCES profiles(id),
  assigned_doc_id UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `triage_sessions`
Stores each patient symptom check and AI response.

```sql
CREATE TABLE triage_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  symptoms_raw    TEXT NOT NULL,             -- Raw patient input
  severity        TEXT NOT NULL CHECK (severity IN ('low', 'moderate', 'critical')),
  ai_assessment   JSONB NOT NULL,            -- Full Claude response object
  escalated       BOOLEAN DEFAULT FALSE,     -- Whether routed to a doctor
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**`ai_assessment` JSONB shape:**
```json
{
  "likely_conditions": ["string"],
  "severity_score": 1-10,
  "recommended_action": "string",
  "self_care_tips": ["string"],
  "red_flags": ["string"],
  "disclaimer": "string"
}
```

### `consultations`
Doctor-patient messaging threads, each linked to a triage session.

```sql
CREATE TABLE consultations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triage_id        UUID REFERENCES triage_sessions(id),
  patient_id       UUID NOT NULL REFERENCES patients(id),
  doctor_id        UUID NOT NULL REFERENCES profiles(id),
  status           TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  ai_summary       TEXT,                    -- Claude-generated patient brief for the doctor
  priority         TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'critical')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);
```

### `messages`
Individual messages within a consultation.

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id),
  content         TEXT NOT NULL,
  message_type    TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'file')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `mental_health_sessions`
Mental health companion chat history and mood tracking.

```sql
CREATE TABLE mental_health_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  mood_score      INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  session_notes   TEXT,
  crisis_flagged  BOOLEAN DEFAULT FALSE,
  ai_summary      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `mental_health_messages`
Individual messages within a mental health companion session.

```sql
CREATE TABLE mental_health_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES mental_health_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `medications`
Prescriptions tracked per patient.

```sql
CREATE TABLE medications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  dosage          TEXT NOT NULL,
  frequency       TEXT NOT NULL,             -- e.g. "twice daily", "every 8 hours"
  times           TEXT[],                    -- e.g. ["08:00", "20:00"]
  start_date      DATE NOT NULL,
  end_date        DATE,
  prescribed_by   UUID REFERENCES profiles(id),
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `medication_logs`
Individual dose records for adherence tracking.

```sql
CREATE TABLE medication_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES patients(id),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  taken_at      TIMESTAMPTZ,                -- NULL = missed
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security Policies (examples)

```sql
-- Patients can only read their own data
CREATE POLICY "patients_own_data" ON patients
  FOR ALL USING (profile_id = auth.uid());

-- Doctors can read consultations assigned to them
CREATE POLICY "doctors_consultations" ON consultations
  FOR SELECT USING (doctor_id = auth.uid());

-- CHWs can read patients assigned to them
CREATE POLICY "chw_patient_access" ON patients
  FOR SELECT USING (assigned_chw_id = auth.uid());
```

---

## 3. Authentication & Authorization

Curaiva AI uses Supabase Auth with email/password. Role assignment happens at registration.

### Registration Flow

```
User fills registration form
        │
        ▼
POST /api/auth/register
  - Creates Supabase auth user
  - Inserts into profiles (with role)
  - Inserts into patients table (if role = patient)
        │
        ▼
Email verification sent
        │
        ▼
User verifies → redirected to role dashboard
```

### Role-Based Routing (Next.js Middleware)

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request, res: response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const role = profile?.role;
  const path = request.nextUrl.pathname;

  // Enforce role-based path access
  if (path.startsWith('/dashboard/doctor') && role !== 'doctor') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (path.startsWith('/dashboard/chw') && role !== 'chw') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
}
```

---

## 4. AI Integration (Claude API)

All Claude API calls are made server-side in Next.js API Routes or Server Components to keep the API key secure.

### 4.1 Symptom Triage

**Prompt Design:**

```typescript
const TRIAGE_SYSTEM_PROMPT = `
You are a medical triage assistant for Curaiva AI. Your role is to assess patient symptoms
and provide preliminary guidance. You are NOT a replacement for professional medical care.

Always respond in valid JSON with this exact shape:
{
  "severity": "low" | "moderate" | "critical",
  "severity_score": 1-10,
  "likely_conditions": string[],
  "recommended_action": string,
  "self_care_tips": string[],
  "red_flags": string[],
  "escalate_to_doctor": boolean,
  "disclaimer": string
}

Guidelines:
- severity "critical" = escalate_to_doctor must be true
- severity "moderate" = escalate_to_doctor recommended
- severity "low" = self-care appropriate
- Always include a disclaimer reminding the user this is not a diagnosis
- red_flags = symptoms that would warrant immediate emergency care
`.trim();
```

**API Route (`/api/triage/route.ts`):**

```typescript
export async function POST(request: Request) {
  const { symptoms, patientHistory } = await request.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: TRIAGE_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Patient symptoms: ${symptoms}\n\nRelevant history: ${patientHistory || 'None provided'}`
      }]
    })
  });

  const data = await response.json();
  const assessment = JSON.parse(data.content[0].text);

  // Persist to Supabase
  const { data: session } = await supabase
    .from('triage_sessions')
    .insert({
      patient_id: patientId,
      symptoms_raw: symptoms,
      severity: assessment.severity,
      ai_assessment: assessment,
      escalated: assessment.escalate_to_doctor
    })
    .select()
    .single();

  // Auto-create consultation if escalation needed
  if (assessment.escalate_to_doctor) {
    await createConsultation(session.id, patientId);
  }

  return NextResponse.json({ session, assessment });
}
```

### 4.2 Patient Summary for Doctors

When a doctor opens a consultation, Claude generates a concise patient brief:

```typescript
const SUMMARY_PROMPT = `
You are a medical assistant summarizing a patient's health record for a doctor.
Write a concise, clinical patient brief in 3-4 sentences covering:
1. Chief complaint and symptom description
2. Triage severity and AI assessment
3. Relevant medical history (if any)
4. Suggested areas of focus for the consultation

Be clinical, factual, and brief. Do not include disclaimers.
`;
```

### 4.3 Mental Health Companion

The mental health chat uses a multi-turn conversation with a specialized system prompt:

```typescript
const MENTAL_HEALTH_PROMPT = `
You are a compassionate mental health companion for Curaiva AI. You provide emotional support,
evidence-based coping strategies (CBT techniques), and guided exercises.

Your principles:
- Listen actively and validate feelings without judgment
- Offer practical CBT techniques when appropriate (thought records, breathing exercises, etc.)
- Monitor for crisis indicators: active suicidal ideation, self-harm intent, psychosis
- If crisis is detected, immediately respond with crisis resources AND set crisis_flag: true
- You are NOT a therapist — always encourage professional help for serious conditions
- Keep responses warm, concise, and human

Respond in JSON: { "message": string, "crisis_flag": boolean, "suggested_exercise": string | null }
`;
```

**Crisis detection triggers automatic escalation** — sets `crisis_flagged = true` in the database, which triggers a Supabase Edge Function to notify the patient's assigned CHW.

---

## 5. API Reference

All API routes are under `/app/api/`.

### `POST /api/triage`
Submit symptoms for AI triage.

**Request body:**
```json
{
  "symptoms": "I have had a severe headache and fever for 3 days, with neck stiffness",
  "patient_history": "Optional: any known allergies, existing conditions"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "assessment": {
    "severity": "critical",
    "severity_score": 9,
    "likely_conditions": ["Bacterial meningitis (possible)", "Viral meningitis"],
    "recommended_action": "Seek emergency care immediately",
    "self_care_tips": [],
    "red_flags": ["Neck stiffness with fever is a medical emergency"],
    "escalate_to_doctor": true,
    "disclaimer": "This is not a medical diagnosis..."
  }
}
```

---

### `POST /api/mental-health/chat`
Send a message to the mental health companion.

**Request body:**
```json
{
  "session_id": "uuid",
  "message": "I've been feeling really anxious and can't sleep",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }]
}
```

**Response:**
```json
{
  "message": "I hear you — anxiety that disrupts sleep can be exhausting...",
  "crisis_flag": false,
  "suggested_exercise": "4-7-8 breathing technique"
}
```

---

### `POST /api/summarize`
Generate a patient brief for a doctor (called when a consultation is opened).

**Request body:**
```json
{
  "consultation_id": "uuid"
}
```

**Response:**
```json
{
  "summary": "Patient presents with a 3-day history of severe headache..."
}
```

---

### `POST /api/medications/log`
Log a medication dose as taken or missed.

**Request body:**
```json
{
  "medication_log_id": "uuid",
  "status": "taken" | "missed" | "skipped",
  "taken_at": "2024-01-15T08:05:00Z"
}
```

---

### `GET /api/chw/priority-queue`
Returns the CHW's patient list, AI-prioritized by urgency.

**Response:**
```json
{
  "patients": [
    {
      "patient_id": "uuid",
      "full_name": "Ada Okonkwo",
      "priority_score": 92,
      "priority_reason": "3 consecutive missed doses + new triage session today",
      "last_active": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Priority Scoring Algorithm:**
```
priority_score = 
  (missed_doses_last_7_days × 10) +
  (triage_severity_score × 8) +
  (days_since_last_contact × 3) +
  (crisis_flag_active × 40)
```

---

## 6. Supabase Edge Functions

### `send-medication-reminders`
Runs on a cron schedule every hour. Checks `medication_logs` for upcoming doses and sends notifications.

```typescript
// supabase/functions/send-medication-reminders/index.ts
Deno.serve(async () => {
  const upcoming = await supabase
    .from('medication_logs')
    .select('*, medications(*), patients(*, profiles(*))')
    .eq('status', 'pending')
    .gte('scheduled_at', new Date().toISOString())
    .lte('scheduled_at', new Date(Date.now() + 30 * 60 * 1000).toISOString());  // Next 30 min

  for (const log of upcoming.data) {
    await sendSMS(log.patients.profiles.phone, 
      `Reminder: Time to take your ${log.medications.name} (${log.medications.dosage})`);
  }
});
```

### `check-missed-doses`
Runs every 2 hours. Marks overdue pending logs as `missed` and alerts the patient's CHW if 2+ consecutive doses are missed.

### `escalate-crisis`
Triggered immediately when `mental_health_sessions.crisis_flagged` is set to `true` via a database trigger. Notifies the CHW and sends an emergency SMS.

---

## 7. Real-Time Features

Supabase Realtime is used for two live features:

### Doctor Inbox (live new consultations)
```typescript
const channel = supabase
  .channel('doctor-inbox')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'consultations',
    filter: `doctor_id=eq.${doctorId}`
  }, (payload) => {
    // New consultation appears live in inbox
    setConsultations(prev => [payload.new, ...prev]);
  })
  .subscribe();
```

### CHW Dashboard (live patient status)
```typescript
const channel = supabase
  .channel('chw-dashboard')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'medication_logs',
  }, () => {
    // Re-fetch priority queue on any medication update
    refetchPriorityQueue();
  })
  .subscribe();
```

---

## 8. Frontend Architecture

### Route Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx              # Shared dashboard shell (nav, sidebar)
│   ├── patient/
│   │   ├── page.tsx            # Patient home
│   │   ├── triage/page.tsx     # Symptom checker
│   │   ├── mental-health/page.tsx
│   │   ├── medications/page.tsx
│   │   └── consultations/page.tsx
│   ├── doctor/
│   │   ├── page.tsx            # Doctor inbox
│   │   └── consultation/[id]/page.tsx
│   └── chw/
│       ├── page.tsx            # CHW dashboard / priority queue
│       └── patient/[id]/page.tsx
└── api/
    ├── triage/route.ts
    ├── mental-health/
    │   └── chat/route.ts
    ├── summarize/route.ts
    ├── medications/
    │   └── log/route.ts
    └── chw/
        └── priority-queue/route.ts
```

### State Management
Curaiva AI uses React Server Components for data fetching and `useState`/`useReducer` for client-side state. No external state library is needed for the MVP scope.

### Key UI Components

| Component | Location | Description |
|---|---|---|
| `<SymptomInput>` | `components/triage/` | Voice + text input with loading state |
| `<TriageResult>` | `components/triage/` | Severity badge, conditions, self-care tips |
| `<ConsultationThread>` | `components/messaging/` | Real-time message thread |
| `<MoodTracker>` | `components/mental-health/` | Daily mood score slider |
| `<CompanionChat>` | `components/mental-health/` | Multi-turn AI chat UI |
| `<MedCard>` | `components/medication/` | Single medication with dose logging |
| `<PriorityQueue>` | `components/dashboard/` | CHW patient list sorted by score |
| `<PatientBrief>` | `components/dashboard/` | AI-generated patient summary card |

---

## 9. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server-side only) |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `RESEND_API_KEY` | ⚠️ Optional | For email notifications |
| `TERMII_API_KEY` | ⚠️ Optional | For SMS notifications (Nigeria-optimized) |
| `TERMII_SENDER_ID` | ⚠️ Optional | SMS sender name |

> ⚠️ Never expose `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` in client-side code. Only use them in Server Components, API Routes, or Edge Functions.

---

## 10. Deployment Guide

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Supabase Edge Functions

```bash
# Login
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Deploy all edge functions
npx supabase functions deploy
```

### Setting up Cron Jobs (Supabase)

In the Supabase Dashboard → Edge Functions → Schedules:

| Function | Schedule | Description |
|---|---|---|
| `send-medication-reminders` | `0 * * * *` | Every hour |
| `check-missed-doses` | `0 */2 * * *` | Every 2 hours |

---

## 11. Security Considerations

- **API Keys** are never exposed to the client. All AI calls go through Next.js API routes.
- **Row Level Security** is enabled on every Supabase table. Patients cannot access other patients' data at the database level.
- **Role validation** happens both in Next.js middleware (routing) and in API route handlers (before any data operation).
- **Claude AI prompts** include explicit instructions not to provide specific drug dosages, diagnoses, or replace emergency care — reducing liability risk.
- **Crisis escalation** is automatic and does not rely on user action — once `crisis_flagged = true` is set, the edge function fires immediately.

---

## 12. Error Handling

### AI Response Failures
If a Claude API call fails, the triage endpoint returns a safe fallback:

```typescript
catch (error) {
  return NextResponse.json({
    assessment: {
      severity: 'unknown',
      recommended_action: 'We were unable to assess your symptoms. Please contact a healthcare provider directly.',
      escalate_to_doctor: true,    // Fail safe: always escalate on error
    }
  }, { status: 200 });
}
```

### Database Errors
Supabase errors are caught, logged to the server console, and a user-friendly message is returned. No raw database errors are exposed to the client.

### Notification Failures
Email/SMS failures are non-blocking. They are logged to the Edge Function logs but do not cause the parent operation to fail. A retry queue is planned for v2.

---

*Curaiva AI Technical Documentation — Built for the Hackathon, Designed to Scale*