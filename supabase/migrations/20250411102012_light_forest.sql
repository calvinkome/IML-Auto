/*
  # Fix Role Column and Permissions

  1. Changes
    - Ensure role column exists with proper type
    - Add missing permissions
    - Fix policies
    
  2. Security
    - Maintain RLS
    - Add proper constraints
*/

-- Create user_role enum type if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'user');
  END IF;
END $$;

-- Drop existing users table if exists
DROP TABLE IF EXISTS public.users CASCADE;

-- Recreate users table with proper constraints
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['user'::user_role, 'staff'::user_role, 'admin'::user_role]))
);

-- Create unique index on email
CREATE UNIQUE INDEX users_email_unique_idx ON public.users (lower(email));

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'::user_role
  );

  -- Log successful registration
  INSERT INTO public.error_logs (
    error_message,
    error_context
  ) VALUES (
    'User registration successful',
    format('User created - ID: %s, Email: %s', NEW.id, NEW.email)
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
      format('Email: %s', NEW.email)
    );
    RAISE;
  
  WHEN OTHERS THEN
    -- Log unexpected errors
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_context
    ) VALUES (
      SQLERRM,
      SQLSTATE,
      format('Failed to create user profile - Email: %s', NEW.email)
    );
    RAISE;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Migrate existing users if any
INSERT INTO public.users (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'user'::user_role
FROM auth.users
ON CONFLICT (id) DO NOTHING;