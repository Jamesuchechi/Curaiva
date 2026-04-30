-- Add doctor-specific columns to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS specialty TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;

-- Optional: Insert a few mock doctors for testing purposes
DO $$
DECLARE
    v_doctor_id_1 UUID;
    v_doctor_id_2 UUID;
BEGIN
    -- Check if we have any existing doctors. If not, maybe we shouldn't create auth users via SQL (too complex), 
    -- but we can update existing users who have role = 'doctor' with some mock data.
    
    UPDATE public.profiles
    SET specialty = 'General Practice',
        bio = 'Experienced in family medicine and rural healthcare delivery.',
        is_available = true,
        rating = 4.9,
        years_experience = 12
    WHERE role = 'doctor' AND full_name ILIKE '%Nwosu%';
    
    UPDATE public.profiles
    SET specialty = 'Cardiology',
        bio = 'Specialist in cardiovascular health, hypertension management, and preventative care.',
        is_available = true,
        rating = 4.8,
        years_experience = 8
    WHERE role = 'doctor' AND specialty IS NULL;
    
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
