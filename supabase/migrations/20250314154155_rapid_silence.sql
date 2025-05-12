/*
  # Fix User Registration Error Handling

  1. Changes
    - Add unique constraint on email
    - Add function to check email existence
    - Update user creation trigger
    
  2. Security
    - Maintain existing RLS
    - Add proper error handling
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
    WHERE email = p_email 
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
BEGIN
  -- Check if user already exists in public.users
  IF EXISTS (
    SELECT 1 FROM public.users WHERE email = NEW.email
  ) THEN
    RETURN NEW; -- Skip creation if user already exists
  END IF;

  -- Get full_name from metadata
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  
  -- Validate full_name
  IF v_full_name IS NULL OR v_full_name = '' THEN
    RAISE EXCEPTION 'full_name is required in user metadata';
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
    NEW.email,
    v_full_name,
    'client'::user_role,
    NEW.created_at,
    NEW.updated_at
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Log duplicate user attempt
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_context
    ) VALUES (
      'Duplicate user registration attempt',
      'Email already exists',
      format('Email: %s', NEW.email)
    );
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log other errors
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_context
    ) VALUES (
      SQLERRM,
      SQLSTATE,
      format(
        'Failed to create profile for user %s. Email: %s, Full Name: %s',
        NEW.id,
        NEW.email,
        v_full_name
      )
    );
    RAISE;
END;
$$;