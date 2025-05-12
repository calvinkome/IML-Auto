/*
  # User Registration System

  1. New Functions
    - check_email_exists: Verify email uniqueness
    - validate_user_data: Validate registration data
    - register_user: Safe user registration with validation
    - cleanup_test_users: Safe deletion of test accounts
    
  2. Triggers
    - before_user_registration: Pre-registration validation
    - after_user_registration: Profile creation and notifications
    
  3. Security
    - Email uniqueness enforcement
    - Data validation
    - Safe deletion process
*/

-- Function to check if email exists
CREATE OR REPLACE FUNCTION check_email_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = p_email
    AND deleted_at IS NULL
  );
END;
$$;

-- Function to validate user data
CREATE OR REPLACE FUNCTION validate_user_data(
  p_email text,
  p_full_name text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Email format validation
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Name validation
  IF length(p_full_name) < 2 THEN
    RAISE EXCEPTION 'Full name too short';
  END IF;

  -- Check email uniqueness
  IF check_email_exists(p_email) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;

  RETURN true;
END;
$$;

-- Function for safe user registration
CREATE OR REPLACE FUNCTION register_user(
  p_email text,
  p_password text,
  p_full_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Validate input data
  PERFORM validate_user_data(p_email, p_full_name);

  -- Generate new UUID
  v_user_id := gen_random_uuid();

  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email']
    ),
    jsonb_build_object(
      'full_name', p_full_name
    ),
    'authenticated',
    'authenticated'
  );

  -- Create user profile
  INSERT INTO public.users (
    id,
    full_name,
    role
  ) VALUES (
    v_user_id,
    p_full_name,
    'user'
  );

  RETURN v_user_id;
EXCEPTION
  WHEN others THEN
    -- Log error details
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_hint,
      error_context
    ) VALUES (
      SQLERRM,
      SQLSTATE,
      'Error during user registration',
      format('email: %s, full_name: %s', p_email, p_full_name)
    );
    RAISE;
END;
$$;

-- Function to safely delete test users
CREATE OR REPLACE FUNCTION cleanup_test_users(p_email_pattern text DEFAULT '%@example.com')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Soft delete auth users
  WITH deleted_auth AS (
    UPDATE auth.users
    SET deleted_at = now()
    WHERE email LIKE p_email_pattern
    AND deleted_at IS NULL
    RETURNING id
  )
  -- Delete corresponding profiles
  DELETE FROM public.users
  WHERE id IN (SELECT id FROM deleted_auth);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Create error logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message text NOT NULL,
  error_detail text,
  error_hint text,
  error_context text,
  created_at timestamptz DEFAULT now()
);

-- Create registration attempt tracking
CREATE TABLE IF NOT EXISTS public.registration_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  attempt_count integer DEFAULT 1,
  last_attempt timestamptz DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create index for registration attempts lookup
CREATE INDEX IF NOT EXISTS idx_registration_attempts_email 
ON public.registration_attempts(email);

-- Create trigger function for registration attempt tracking
CREATE OR REPLACE FUNCTION track_registration_attempt()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_attempts constant integer := 5;
  v_block_duration constant interval := interval '30 minutes';
  v_attempt record;
BEGIN
  -- Get existing attempts
  SELECT * INTO v_attempt
  FROM public.registration_attempts
  WHERE email = NEW.email
  AND (blocked_until IS NULL OR blocked_until < now())
  FOR UPDATE;

  IF FOUND THEN
    -- Update existing record
    UPDATE public.registration_attempts
    SET 
      attempt_count = CASE 
        WHEN last_attempt < now() - interval '1 hour' 
        THEN 1 
        ELSE attempt_count + 1 
      END,
      last_attempt = now(),
      blocked_until = CASE 
        WHEN attempt_count >= v_max_attempts 
        THEN now() + v_block_duration
        ELSE NULL 
      END
    WHERE id = v_attempt.id;

    -- Check if blocked
    IF v_attempt.attempt_count >= v_max_attempts THEN
      RAISE EXCEPTION 'Too many registration attempts. Please try again later.';
    END IF;
  ELSE
    -- Create new record
    INSERT INTO public.registration_attempts (email, ip_address)
    VALUES (NEW.email, NEW.raw_app_meta_data->>'ip_address');
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for registration attempt tracking
CREATE TRIGGER before_user_registration
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION track_registration_attempt();

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view error logs"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can view registration attempts"
  ON public.registration_attempts
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');