-- ============================================================
-- Curaiva AI — Supabase Migration 001
-- Complete database schema with RLS policies
-- Run via: supabase db push  OR  paste into Supabase SQL editor
-- ============================================================

-- ── Enable required extensions ──────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. profiles ─────────────────────────────────────────────
-- Extends auth.users. Auto-created on registration via trigger.
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'chw')),
  phone           TEXT,
  location        TEXT,
  avatar_url      TEXT,
  fhir_patient_id TEXT,          -- Links to FHIR Patient resource ID
  fhir_base_url   TEXT DEFAULT 'https://hapi.fhir.org/baseR4',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Doctors and CHWs can view profiles of assigned patients
CREATE POLICY "Doctors can view patient profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT doctor_id FROM public.consultations WHERE patient_id = id
    )
    OR auth.uid() IN (
      SELECT chw_id FROM public.patient_assignments WHERE patient_id = id
    )
  );

-- ── 2. patient_assignments ───────────────────────────────────
-- Maps patients to their doctor and CHW
CREATE TABLE IF NOT EXISTS public.patient_assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  chw_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id)
);

ALTER TABLE public.patient_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own assignment"
  ON public.patient_assignments FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors see their assignments"
  ON public.patient_assignments FOR SELECT
  USING (doctor_id = auth.uid());

CREATE POLICY "CHWs see their assignments"
  ON public.patient_assignments FOR SELECT
  USING (chw_id = auth.uid());

-- ── 3. consultations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consultations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES public.profiles(id),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority        TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'critical')),
  chief_complaint TEXT,
  triage_severity TEXT CHECK (triage_severity IN ('low', 'moderate', 'critical')),
  ai_summary      TEXT,           -- Claude-generated pre-consult brief
  fhir_patient_id TEXT,           -- FHIR Patient resource ID used in brief
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own consultations"
  ON public.consultations FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can create consultations"
  ON public.consultations FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors see assigned consultations"
  ON public.consultations FOR SELECT
  USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can update consultations"
  ON public.consultations FOR UPDATE
  USING (doctor_id = auth.uid());

-- Enable Realtime on consultations (for live inbox updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;

-- ── 4. messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id),
  content         TEXT NOT NULL,
  message_type    TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'file', 'ai_summary')),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultation participants can view messages"
  ON public.messages FOR SELECT
  USING (
    consultation_id IN (
      SELECT id FROM public.consultations
      WHERE patient_id = auth.uid() OR doctor_id = auth.uid()
    )
  );

CREATE POLICY "Consultation participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND consultation_id IN (
      SELECT id FROM public.consultations
      WHERE patient_id = auth.uid() OR doctor_id = auth.uid()
    )
  );

-- Enable Realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ── 5. triage_sessions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.triage_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symptoms_raw    TEXT NOT NULL,
  fhir_patient_id TEXT,
  severity        TEXT NOT NULL CHECK (severity IN ('low', 'moderate', 'critical', 'unknown')),
  severity_score  INTEGER CHECK (severity_score BETWEEN 1 AND 10),
  ai_assessment   JSONB NOT NULL DEFAULT '{}',
  escalated       BOOLEAN DEFAULT FALSE,
  consultation_id UUID REFERENCES public.consultations(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.triage_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own triage sessions"
  ON public.triage_sessions FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can create triage sessions"
  ON public.triage_sessions FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors see triage for their patients"
  ON public.triage_sessions FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM public.consultations WHERE doctor_id = auth.uid()
    )
  );

-- ── 6. medications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fhir_med_req_id TEXT,           -- FHIR MedicationRequest resource ID
  name            TEXT NOT NULL,
  dosage          TEXT NOT NULL,
  frequency       TEXT NOT NULL,
  times           TEXT[] DEFAULT '{}',  -- e.g. ['08:00', '20:00']
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date        DATE,
  prescribed_by   UUID REFERENCES public.profiles(id),
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own medications"
  ON public.medications FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can add medications"
  ON public.medications FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors see patient medications"
  ON public.medications FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM public.consultations WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "CHWs see their patient medications"
  ON public.medications FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM public.patient_assignments WHERE chw_id = auth.uid()
    )
  );

-- ── 7. medication_logs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES public.profiles(id),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  taken_at      TIMESTAMPTZ,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own medication logs"
  ON public.medication_logs FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can update own medication logs"
  ON public.medication_logs FOR UPDATE
  USING (patient_id = auth.uid());

CREATE POLICY "CHWs see their patient medication logs"
  ON public.medication_logs FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM public.patient_assignments WHERE chw_id = auth.uid()
    )
  );

-- ── 8. mental_health_sessions ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mental_health_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood_score     INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  session_notes  TEXT,
  ai_assessment  JSONB DEFAULT '{}',
  crisis_flagged BOOLEAN DEFAULT FALSE,
  escalation_action TEXT DEFAULT 'none',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mental_health_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own mental health sessions"
  ON public.mental_health_sessions FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can create sessions"
  ON public.mental_health_sessions FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "CHWs see crisis-flagged sessions for their patients"
  ON public.mental_health_sessions FOR SELECT
  USING (
    crisis_flagged = TRUE
    AND patient_id IN (
      SELECT patient_id FROM public.patient_assignments WHERE chw_id = auth.uid()
    )
  );

-- Enable Realtime on mental health sessions (for crisis alerts)
ALTER PUBLICATION supabase_realtime ADD TABLE public.mental_health_sessions;

-- ── 9. crisis_alerts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crisis_alerts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.profiles(id),
  chw_id          UUID REFERENCES public.profiles(id),
  session_id      UUID REFERENCES public.mental_health_sessions(id),
  alert_type      TEXT DEFAULT 'mental_health' CHECK (alert_type IN ('mental_health', 'medication', 'triage', 'vital_sign')),
  severity        TEXT DEFAULT 'critical',
  message         TEXT NOT NULL,
  acknowledged    BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.crisis_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CHWs see alerts for their patients"
  ON public.crisis_alerts FOR SELECT
  USING (chw_id = auth.uid());

CREATE POLICY "CHWs can acknowledge alerts"
  ON public.crisis_alerts FOR UPDATE
  USING (chw_id = auth.uid());

-- Enable Realtime on crisis alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.crisis_alerts;

-- ── 10. chw_visits ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chw_visits (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chw_id        UUID NOT NULL REFERENCES public.profiles(id),
  patient_id    UUID NOT NULL REFERENCES public.profiles(id),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  completed_at  TIMESTAMPTZ,
  status        TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chw_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CHWs manage their own visits"
  ON public.chw_visits FOR ALL
  USING (chw_id = auth.uid());

CREATE POLICY "Patients see their scheduled visits"
  ON public.chw_visits FOR SELECT
  USING (patient_id = auth.uid());

-- ── Trigger: auto-create profile on signup ───────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Trigger: auto-create crisis alert on crisis flag ────────
CREATE OR REPLACE FUNCTION public.handle_crisis_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.crisis_flagged = TRUE AND (OLD.crisis_flagged IS NULL OR OLD.crisis_flagged = FALSE) THEN
    INSERT INTO public.crisis_alerts (
      patient_id, chw_id, session_id, alert_type, severity, message
    )
    SELECT
      NEW.patient_id,
      pa.chw_id,
      NEW.id,
      'mental_health',
      'critical',
      'Mental health crisis detected by AI — immediate follow-up required.'
    FROM public.patient_assignments pa
    WHERE pa.patient_id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_crisis_flag ON public.mental_health_sessions;
CREATE TRIGGER on_crisis_flag
  AFTER INSERT OR UPDATE ON public.mental_health_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_crisis_flag();

-- ── Trigger: updated_at timestamps ──────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Indexes for performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);
CREATE INDEX IF NOT EXISTS idx_messages_consultation ON public.messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_patient ON public.medication_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_status ON public.medication_logs(status);
CREATE INDEX IF NOT EXISTS idx_triage_sessions_patient ON public.triage_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_mental_health_patient ON public.mental_health_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_chw ON public.crisis_alerts(chw_id);
CREATE INDEX IF NOT EXISTS idx_patient_assignments_chw ON public.patient_assignments(chw_id);

-- ════════════════════════════════════════════════════════════
-- Migration complete.
-- Tables: profiles, patient_assignments, consultations,
--         messages, triage_sessions, medications,
--         medication_logs, mental_health_sessions,
--         crisis_alerts, chw_visits
-- Triggers: handle_new_user, handle_crisis_flag, set_updated_at
-- Realtime: consultations, messages, mental_health_sessions, crisis_alerts
-- ════════════════════════════════════════════════════════════