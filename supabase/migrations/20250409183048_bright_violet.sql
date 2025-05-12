/*
  # Login Attempt Tracking

  1. Changes
    - Create login_attempts table
    - Add email validation function
    - Update user creation handling
    
  2. Security
    - Enable RLS
    - Add admin-only policies
*/

-- Create user_role enum type if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'user');
  END IF;
END $$;

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create login attempts table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean DEFAULT false,
  attempt_count integer DEFAULT 1,
  last_attempt timestamptz DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for login attempts
CREATE POLICY "Only admins can view login attempts"
  ON public.login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for login attempts
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address);

-- Function to validate email format
CREATE OR REPLACE FUNCTION public.is_valid_email(email text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- Update handle_new_user function with improved validation
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
  -- Get and validate inputs
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_email := lower(NEW.email);
  
  -- Validate inputs
  IF v_full_name IS NULL OR length(trim(v_full_name)) < 2 THEN
    RAISE EXCEPTION 'Full name must be at least 2 characters long';
  END IF;

  IF NOT public.is_valid_email(v_email) THEN
    RAISE EXCEPTION 'Invalid email format';
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

  -- Log successful registration
  INSERT INTO public.error_logs (
    error_message,
    error_context
  ) VALUES (
    'User registration successful',
    format('User created - ID: %s, Email: %s', NEW.id, v_email)
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Log duplicate registration attempt
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_context
    ) VALUES (
      'Duplicate user registration attempt',
      'Email already exists',
      format('Email: %s', v_email)
    );
    RAISE EXCEPTION 'Email already registered';
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
        'Registration failed - Email: %s, Full Name: %s',
        v_email,
        v_full_name
      )
    );
    RAISE;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;