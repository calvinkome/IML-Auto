/*
  # Fix Registration Email Uniqueness

  1. Changes
    - Add email uniqueness check function
    - Improve error handling for duplicate emails
    - Add registration attempt tracking
    
  2. Security
    - Prevent duplicate registrations
    - Track failed attempts
*/

-- Create function to check if email exists
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE lower(email) = lower(p_email)
    AND deleted_at IS NULL
  );
END;
$$;

-- Update handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_full_name text;
  v_email text;
BEGIN
  -- Get and normalize inputs
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_email := lower(NEW.email);
  
  -- Check for existing user first
  IF public.check_email_exists(v_email) THEN
    -- Log duplicate attempt
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_context,
      registration_context
    ) VALUES (
      'Duplicate registration attempt',
      'Email already exists',
      format('Email: %s', v_email),
      jsonb_build_object(
        'email', v_email,
        'attempt_time', now()
      )
    );
    RAISE EXCEPTION 'Email already registered' USING ERRCODE = 'unique_violation';
  END IF;

  -- Validate full_name
  IF v_full_name IS NULL OR length(trim(v_full_name)) < 2 THEN
    RAISE EXCEPTION 'Full name must be at least 2 characters long';
  END IF;

  -- Create user profile
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_email,
    v_full_name,
    'client'::user_role,
    NEW.created_at,
    NEW.updated_at
  );

  -- Track successful registration
  INSERT INTO public.registration_attempts (
    email,
    ip_address,
    success,
    attempt_count
  ) VALUES (
    v_email,
    current_setting('request.headers', true)::json->>'x-real-ip',
    true,
    1
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Update registration attempts
    INSERT INTO public.registration_attempts (
      email,
      ip_address,
      success,
      attempt_count
    ) VALUES (
      v_email,
      current_setting('request.headers', true)::json->>'x-real-ip',
      false,
      1
    )
    ON CONFLICT (email) DO UPDATE
    SET 
      attempt_count = registration_attempts.attempt_count + 1,
      last_attempt = now(),
      success = false;

    RAISE EXCEPTION 'Email already registered';
  WHEN OTHERS THEN
    -- Log other errors
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_context,
      registration_context
    ) VALUES (
      SQLERRM,
      SQLSTATE,
      format('Registration failed - Email: %s, Full Name: %s', v_email, v_full_name),
      jsonb_build_object(
        'email', v_email,
        'attempt_time', now(),
        'error_code', SQLSTATE
      )
    );
    RAISE;
END;
$$;