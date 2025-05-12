/*
  # Fix Error Logs Policy

  1. Changes
    - Drop existing policy before recreation
    - Add proper error handling
    - Maintain existing functionality
    
  2. Security
    - Maintain RLS policies
    - Add proper error handling
*/

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Only admins can view error logs" ON public.error_logs;

-- Create error_logs table if not exists
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message text NOT NULL,
  error_detail text,
  error_context text,
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

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_full_name text;
BEGIN
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
    'user'::user_role,
    NEW.created_at,
    NEW.updated_at
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
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

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Update user policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    role = 'admin'
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;