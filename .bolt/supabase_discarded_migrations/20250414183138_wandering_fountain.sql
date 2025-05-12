/*
  # Enhanced User Profile System

  1. New Features
    - Profile preferences and settings
    - Email verification tracking
    - Profile completion status
    - Last activity tracking
    
  2. Security
    - Additional validation
    - Enhanced audit logging
    - Security policies
*/

-- Add profile preferences table
CREATE TABLE public.profile_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  theme text DEFAULT 'light',
  notifications_enabled boolean DEFAULT true,
  marketing_emails_enabled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_language CHECK (language ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

-- Create timezone validation function
CREATE OR REPLACE FUNCTION validate_timezone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_timezone_names 
    WHERE name = NEW.timezone
  ) THEN
    RAISE EXCEPTION 'Invalid timezone: %', NEW.timezone;
  END IF;
  RETURN NEW;
END;
$$;

-- Create timezone validation trigger
CREATE TRIGGER validate_timezone_trigger
  BEFORE INSERT OR UPDATE ON public.profile_preferences
  FOR EACH ROW
  EXECUTE FUNCTION validate_timezone();

-- Add profile metadata
ALTER TABLE public.profiles
  ADD COLUMN email_verified boolean DEFAULT false,
  ADD COLUMN completion_percentage integer 
    GENERATED ALWAYS AS (
      CASE WHEN full_name IS NOT NULL THEN 25 ELSE 0 END +
      CASE WHEN phone IS NOT NULL THEN 25 ELSE 0 END +
      CASE WHEN avatar_url IS NOT NULL THEN 25 ELSE 0 END +
      CASE WHEN email_verified THEN 25 ELSE 0 END
    ) STORED,
  ADD COLUMN last_active_at timestamptz,
  ADD COLUMN login_count integer DEFAULT 0,
  ADD COLUMN failed_login_count integer DEFAULT 0,
  ADD COLUMN locked_until timestamptz,
  ADD CONSTRAINT valid_completion_percentage 
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

-- Create profile activity tracking
CREATE TABLE public.profile_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_activity_type CHECK (
    activity_type IN (
      'login_success',
      'login_failure',
      'logout',
      'password_change',
      'email_change',
      'profile_update',
      'preferences_update'
    )
  )
);

-- Enable RLS
ALTER TABLE public.profile_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for preferences
CREATE POLICY "Users can view own preferences"
  ON public.profile_preferences
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own preferences"
  ON public.profile_preferences
  FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

-- Create policies for activity logs
CREATE POLICY "Users can view own activity logs"
  ON public.profile_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create function to handle profile activity
CREATE OR REPLACE FUNCTION log_profile_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Get profile ID
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- Log activity
  INSERT INTO public.profile_activity_logs (
    profile_id,
    activity_type,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    v_profile_id,
    TG_ARGV[0],
    current_setting('request.headers', true)::json->>'x-real-ip',
    current_setting('request.headers', true)::json->>'user-agent',
    CASE
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'changes', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(row_to_json(NEW)::jsonb - row_to_json(OLD)::jsonb)
        )
      )
      ELSE '{}'::jsonb
    END
  );

  RETURN NEW;
END;
$$;

-- Create triggers for activity logging
CREATE TRIGGER log_profile_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_activity('profile_update');

CREATE TRIGGER log_preferences_update
  AFTER UPDATE ON public.profile_preferences
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_activity('preferences_update');

-- Create function to handle login attempts
CREATE OR REPLACE FUNCTION handle_login_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id uuid;
  v_max_attempts constant integer := 5;
  v_lockout_minutes constant integer := 30;
BEGIN
  -- Get profile ID
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE user_id = NEW.id;

  IF TG_ARGV[0] = 'success' THEN
    -- Reset failed attempts on successful login
    UPDATE public.profiles
    SET 
      failed_login_count = 0,
      locked_until = NULL,
      login_count = login_count + 1,
      last_active_at = now()
    WHERE id = v_profile_id;
  ELSE
    -- Increment failed attempts
    UPDATE public.profiles
    SET 
      failed_login_count = failed_login_count + 1,
      locked_until = CASE 
        WHEN failed_login_count >= v_max_attempts 
        THEN now() + (v_lockout_minutes * interval '1 minute')
        ELSE locked_until
      END
    WHERE id = v_profile_id;
  END IF;

  -- Log activity
  INSERT INTO public.profile_activity_logs (
    profile_id,
    activity_type,
    ip_address,
    user_agent
  ) VALUES (
    v_profile_id,
    CASE WHEN TG_ARGV[0] = 'success' 
      THEN 'login_success'::text 
      ELSE 'login_failure'::text 
    END,
    current_setting('request.headers', true)::json->>'x-real-ip',
    current_setting('request.headers', true)::json->>'user-agent'
  );

  RETURN NEW;
END;
$$;

-- Create indexes
CREATE INDEX idx_profile_preferences_profile_id 
  ON public.profile_preferences(profile_id);
CREATE INDEX idx_profile_activity_logs_profile_id 
  ON public.profile_activity_logs(profile_id);
CREATE INDEX idx_profile_activity_logs_created_at 
  ON public.profile_activity_logs(created_at);
CREATE INDEX idx_profiles_completion_percentage 
  ON public.profiles(completion_percentage);
CREATE INDEX idx_profiles_last_active_at 
  ON public.profiles(last_active_at);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;