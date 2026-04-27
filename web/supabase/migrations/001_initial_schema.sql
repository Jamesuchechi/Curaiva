-- ============================================================
-- Curaiva AI — Supabase Database Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES TABLE
-- Extends auth.users with role, name, and FHIR patient ID
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name       text,
  role            text        NOT NULL DEFAULT 'patient'
                              CHECK (role IN ('patient', 'doctor', 'chw')),
  fhir_patient_id text,
  fhir_base_url   text        DEFAULT 'https://hapi.fhir.org/baseR4',
  avatar_url      text,
  created_at      timestamptz DEFAULT now()
);

-- 2. CONSULTATIONS TABLE
CREATE TABLE IF NOT EXISTS public.consultations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid        REFERENCES public.profiles (id) ON DELETE CASCADE,
  doctor_id   uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
  status      text        NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open', 'active', 'resolved')),
  ai_summary  text,
  priority    text        DEFAULT 'moderate'
                          CHECK (priority IN ('low', 'moderate', 'critical')),
  created_at  timestamptz DEFAULT now()
);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id   uuid        REFERENCES public.consultations (id) ON DELETE CASCADE,
  sender_id         uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
  content           text        NOT NULL,
  created_at        timestamptz DEFAULT now()
);

-- 4. MEDICATION LOGS TABLE
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid        REFERENCES public.profiles (id) ON DELETE CASCADE,
  medication_id text        NOT NULL,
  scheduled_at  timestamptz,
  taken_at      timestamptz,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'taken', 'missed')),
  created_at    timestamptz DEFAULT now()
);

-- 5. MENTAL HEALTH SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.mental_health_sessions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id     uuid        REFERENCES public.profiles (id) ON DELETE CASCADE,
  mood_score     integer     CHECK (mood_score BETWEEN 1 AND 10),
  session_notes  text,
  crisis_flagged boolean     DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_health_sessions ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read and update their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- CONSULTATIONS: patient sees their own; doctor sees theirs
CREATE POLICY "consultations_patient_select" ON public.consultations
  FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "consultations_patient_insert" ON public.consultations
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- MESSAGES: visible to both parties in the consultation
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
        AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- MEDICATION LOGS: patients see and update their own
CREATE POLICY "medication_logs_select" ON public.medication_logs
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "medication_logs_insert" ON public.medication_logs
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "medication_logs_update" ON public.medication_logs
  FOR UPDATE USING (auth.uid() = patient_id);

-- MENTAL HEALTH SESSIONS: patients see their own
CREATE POLICY "mh_sessions_select" ON public.mental_health_sessions
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "mh_sessions_insert" ON public.mental_health_sessions
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN UP (trigger)
-- If profile creation from the frontend fails (e.g. before
-- email confirmation), this trigger catches it on confirm.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, fhir_patient_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'patient'),
    CASE
      WHEN (NEW.raw_user_meta_data ->> 'role') = 'patient' THEN '592903'
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;  -- no-op if the frontend already inserted it
  RETURN NEW;
END;
$$;

-- Drop if re-running migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- REALTIME (enable for live dashboard subscriptions)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================
-- DONE. Verify with:
--   SELECT * FROM public.profiles LIMIT 5;
--   SELECT * FROM public.consultations LIMIT 5;
-- ============================================================
