/*
  # Fix Error Handling in User Registration

  1. Changes
    - Remove PG_EXCEPTION_CONTEXT reference
    - Improve error logging
    - Add proper transaction handling
    
  2. Security
    - Maintain RLS policies
    - Add proper error handling
*/

-- Create error_logs table if not exists
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message text NOT NULL,
  error_detail text,
  error_context text,
  registration_context jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for error_logs
CREATE POLICY "Only admins can view error logs"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create or replace the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_full_name text;
  v_email text;
  v_client_ip text;
BEGIN
  -- Get and normalize inputs
  v_full_name := trim(NEW.raw_user_meta_data->>'full_name');
  v_email := lower(NEW.email);
  v_client_ip := current_setting('request.headers', true)::json->>'x-real-ip';

  -- Start transaction
  BEGIN
    -- Check if user already exists
    IF EXISTS (
      SELECT 1 FROM public.users 
      WHERE lower(email) = v_email
    ) THEN
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
          'ip_address', v_client_ip
        )
      );
      
      RAISE EXCEPTION 'Email already registered';
    END IF;

    -- Validate full_name
    IF v_full_name IS NULL OR length(v_full_name) < 2 THEN
      -- Log validation error
      INSERT INTO public.error_logs (
        error_message,
        error_detail,
        error_context,
        registration_context
      ) VALUES (
        'Invalid full name',
        'Full name must be at least 2 characters',
        format('Email: %s', v_email),
        jsonb_build_object(
          'email', v_email,
          'full_name', v_full_name,
          'ip_address', v_client_ip
        )
      );
      
      RAISE EXCEPTION 'Full name must be at least 2 characters';
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
      'user'::user_role,
      NEW.created_at,
      NEW.updated_at
    );

    -- Track successful registration
    INSERT INTO public.registration_attempts (
      email,
      ip_address,
      success,
      attempt_count,
      last_attempt
    ) VALUES (
      v_email,
      v_client_ip,
      true,
      1,
      now()
    )
    ON CONFLICT (email) DO UPDATE
    SET 
      success = true,
      attempt_count = 1,
      last_attempt = now(),
      blocked_until = NULL;

    -- Log successful registration
    INSERT INTO public.error_logs (
      error_message,
      error_context,
      registration_context
    ) VALUES (
      'Registration successful',
      format('User created successfully - Email: %s', v_email),
      jsonb_build_object(
        'email', v_email,
        'user_id', NEW.id,
        'ip_address', v_client_ip
      )
    );

    RETURN NEW;

  EXCEPTION 
    WHEN unique_violation THEN
      -- Update failed registration attempt
      INSERT INTO public.registration_attempts (
        email,
        ip_address,
        success,
        attempt_count,
        last_attempt
      ) VALUES (
        v_email,
        v_client_ip,
        false,
        1,
        now()
      )
      ON CONFLICT (email) DO UPDATE
      SET 
        attempt_count = registration_attempts.attempt_count + 1,
        last_attempt = now(),
        success = false;

      -- Log duplicate registration
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
          'ip_address', v_client_ip,
          'attempt_count', (
            SELECT attempt_count 
            FROM public.registration_attempts 
            WHERE email = v_email
          )
        )
      );

      RAISE;

    WHEN OTHERS THEN
      -- Log unexpected errors
      INSERT INTO public.error_logs (
        error_message,
        error_detail,
        error_context,
        registration_context
      ) VALUES (
        SQLERRM,
        SQLSTATE,
        format('Unexpected error during registration - Email: %s', v_email),
        jsonb_build_object(
          'email', v_email,
          'ip_address', v_client_ip,
          'error_code', SQLSTATE
        )
      );

      RAISE;
  END;
END;
$$;