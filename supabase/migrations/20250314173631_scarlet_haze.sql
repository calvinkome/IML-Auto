/*
  # Fix Registration Error Handling

  1. Changes
    - Add unique constraint on email
    - Add transaction handling
    - Improve error logging
    - Fix user creation process
    
  2. Security
    - Maintain RLS policies
    - Add proper error handling
*/

-- Add unique constraint on email if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_email_unique'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;

-- Create or replace the handle_new_user function with transaction handling
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
      'client'::user_role,
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

      RAISE;
  END;
END;
$$;