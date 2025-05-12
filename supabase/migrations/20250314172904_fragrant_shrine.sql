/*
  # Fix Registration Error Handling

  1. Changes
    - Add success column to registration_attempts
    - Fix handle_new_user function to properly handle errors
    - Add better error logging
    - Fix email uniqueness checks
    
  2. Security
    - Maintain RLS policies
    - Improve error handling
*/

-- Add success column to registration_attempts if not exists
ALTER TABLE public.registration_attempts 
  ADD COLUMN IF NOT EXISTS success boolean DEFAULT false;

-- Create or replace the handle_new_user function with improved error handling
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

  BEGIN
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
      v_client_ip,
      true,
      1
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

      RAISE EXCEPTION 'Email already registered';

    WHEN OTHERS THEN
      -- Log unexpected errors
      INSERT INTO public.error_logs (
        error_message,
        error_detail,
        error_context,
        registration_context,
        stack_trace
      ) VALUES (
        SQLERRM,
        SQLSTATE,
        format('Unexpected error during registration - Email: %s', v_email),
        jsonb_build_object(
          'email', v_email,
          'ip_address', v_client_ip,
          'error_code', SQLSTATE
        ),
        format('%s %s %s', SQLSTATE, SQLERRM, PG_EXCEPTION_CONTEXT)
      );

      RAISE EXCEPTION 'Database error saving new user';
  END;
END;
$$;