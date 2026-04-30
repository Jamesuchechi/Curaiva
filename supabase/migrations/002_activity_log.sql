-- ============================================================
-- Curaiva AI — Migration 002
-- Adds activity_log table for the patient dashboard feed.
-- Populated by triggers on key tables.
-- Run via: Supabase SQL Editor
-- ============================================================

-- ── patient_assignments (dependency) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.patient_assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  chw_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id)
);

ALTER TABLE public.patient_assignments ENABLE ROW LEVEL SECURITY;

-- If these policies already exist from a prior run, creating them might throw, 
-- but normally Supabase handles CREATE POLICY IF NOT EXISTS or we can just ignore.
-- Note: Postgres doesn't support CREATE POLICY IF NOT EXISTS until v14, 
-- so it's safer to just execute them and ignore errors if they exist.
DO $$ BEGIN
  CREATE POLICY "Patients see own assignment" ON public.patient_assignments FOR SELECT USING (patient_id = auth.uid());
  CREATE POLICY "Doctors see their assignments" ON public.patient_assignments FOR SELECT USING (doctor_id = auth.uid());
  CREATE POLICY "CHWs see their assignments" ON public.patient_assignments FOR SELECT USING (chw_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── activity_log ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN (
    'triage_submitted', 'consultation_created', 'consultation_resolved',
    'medication_taken', 'medication_missed', 'mood_logged',
    'doctor_response', 'chw_visit_scheduled', 'chw_visit_completed',
    'crisis_alert'
  )),
  title       TEXT NOT NULL,
  description TEXT,
  severity    TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  reference_id UUID,   -- FK to source record (triage, consult, med log, etc.)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients see own activity"
  ON public.activity_log FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Doctors see patient activity for their consultations"
  ON public.activity_log FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM public.consultations WHERE doctor_id = auth.uid()
    )
  );

CREATE POLICY "CHWs see their patient activity"
  ON public.activity_log FOR SELECT
  USING (
    patient_id IN (
      SELECT patient_id FROM public.patient_assignments WHERE chw_id = auth.uid()
    )
  );

-- Allow server-side inserts (service role only)
CREATE POLICY "Service role can insert activity"
  ON public.activity_log FOR INSERT
  WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS idx_activity_log_patient ON public.activity_log(patient_id, created_at DESC);

-- ── Trigger: log activity when triage session created ─────────
CREATE OR REPLACE FUNCTION public.log_triage_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_log (patient_id, event_type, title, description, severity, reference_id)
  VALUES (
    NEW.patient_id,
    'triage_submitted',
    'AI Triage Assessment',
    'Severity: ' || NEW.severity || ' — ' || COALESCE(
      (NEW.ai_assessment->>'primary_concern'), 'Assessment complete'
    ),
    CASE NEW.severity WHEN 'critical' THEN 'critical' WHEN 'moderate' THEN 'warning' ELSE 'info' END,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_triage_activity ON public.triage_sessions;
CREATE TRIGGER on_triage_activity
  AFTER INSERT ON public.triage_sessions
  FOR EACH ROW EXECUTE FUNCTION public.log_triage_activity();

-- ── Trigger: log activity when consultation created ───────────
CREATE OR REPLACE FUNCTION public.log_consultation_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_log (patient_id, event_type, title, description, severity, reference_id)
  VALUES (
    NEW.patient_id,
    'consultation_created',
    'Consultation Requested',
    'A consultation request was submitted with priority: ' || NEW.priority,
    CASE NEW.priority WHEN 'critical' THEN 'critical' WHEN 'urgent' THEN 'warning' ELSE 'info' END,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_consultation_activity ON public.consultations;
CREATE TRIGGER on_consultation_activity
  AFTER INSERT ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.log_consultation_activity();

-- ── Trigger: log activity when mood logged ────────────────────
CREATE OR REPLACE FUNCTION public.log_mood_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_log (patient_id, event_type, title, description, severity, reference_id)
  VALUES (
    NEW.patient_id,
    'mood_logged',
    'Mood Logged',
    'Mood score recorded: ' || NEW.mood_score || '/10',
    CASE
      WHEN NEW.mood_score <= 3 THEN 'warning'
      WHEN NEW.crisis_flagged THEN 'critical'
      ELSE 'info'
    END,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_mood_activity ON public.mental_health_sessions;
CREATE TRIGGER on_mood_activity
  AFTER INSERT ON public.mental_health_sessions
  FOR EACH ROW EXECUTE FUNCTION public.log_mood_activity();

-- ── Trigger: log activity when medication taken ───────────────
CREATE OR REPLACE FUNCTION public.log_medication_activity()
RETURNS TRIGGER AS $$
DECLARE
  med_name TEXT;
BEGIN
  SELECT name INTO med_name FROM public.medications WHERE id = NEW.medication_id;

  IF NEW.status = 'taken' AND (OLD IS NULL OR OLD.status != 'taken') THEN
    INSERT INTO public.activity_log (patient_id, event_type, title, description, severity, reference_id)
    VALUES (
      NEW.patient_id,
      'medication_taken',
      'Medication Logged',
      COALESCE(med_name, 'Medication') || ' dose logged as taken',
      'info',
      NEW.id
    );
  ELSIF NEW.status = 'missed' AND (OLD IS NULL OR OLD.status != 'missed') THEN
    INSERT INTO public.activity_log (patient_id, event_type, title, description, severity, reference_id)
    VALUES (
      NEW.patient_id,
      'medication_missed',
      'Missed Dose',
      COALESCE(med_name, 'Medication') || ' dose was missed',
      'warning',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_medication_log_activity ON public.medication_logs;
CREATE TRIGGER on_medication_log_activity
  AFTER INSERT OR UPDATE ON public.medication_logs
  FOR EACH ROW EXECUTE FUNCTION public.log_medication_activity();

-- ════════════════════════════════════════════════════════════
-- Migration 002 complete.
-- Added: activity_log table, 4 triggers for auto-population
-- ════════════════════════════════════════════════════════════
