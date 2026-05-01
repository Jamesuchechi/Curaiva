
-- Clean up existing if any
DROP POLICY IF EXISTS "profiles_select_consulted" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_providers" ON public.profiles;

-- Allow patients and doctors in a consultation to see each other's profiles
CREATE POLICY "profiles_select_consulted" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE (c.patient_id = public.profiles.id AND c.doctor_id = auth.uid())
         OR (c.doctor_id = public.profiles.id AND c.patient_id = auth.uid())
    )
  );

-- Allow anyone to see providers (doctors/chw) for discovery
CREATE POLICY "profiles_select_providers" ON public.profiles
  FOR SELECT USING (role IN ('doctor', 'chw'));
