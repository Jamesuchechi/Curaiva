-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert', 'message')),
    link TEXT, -- Optional path to navigate to (e.g. /dashboard/patient/consultations)
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true); -- In a production app, restrict this to service_role or specific triggers

-- Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Optional: Automated notification triggers
-- For example: when a new message is sent, notify the recipient
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_id UUID;
    v_sender_name TEXT;
BEGIN
    -- Determine recipient
    -- If sender is the patient, recipient is the doctor
    -- If sender is the doctor, recipient is the patient
    SELECT 
        CASE 
            WHEN NEW.sender_id = c.patient_id THEN c.doctor_id
            ELSE c.patient_id
        END,
        p.full_name
    INTO v_recipient_id, v_sender_name
    FROM public.consultations c
    JOIN public.profiles p ON p.id = NEW.sender_id
    WHERE c.id = NEW.consultation_id;

    IF v_recipient_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            v_recipient_id,
            'New Message',
            v_sender_name || ' sent you a message: ' || left(NEW.content, 50),
            'message',
            CASE 
                WHEN (SELECT role FROM public.profiles WHERE id = v_recipient_id) = 'patient' 
                THEN '/dashboard/patient/consultations'
                ELSE '/dashboard/doctor/consultations/' || NEW.consultation_id
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message_notification
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_message_notification();
