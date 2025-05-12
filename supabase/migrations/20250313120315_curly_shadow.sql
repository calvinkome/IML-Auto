/*
  # Fix Authentication Schema and User Registration

  1. Changes
    - Create auth schema with proper ownership
    - Create essential auth functions
    - Set up proper role inheritance
    - Fix user registration process
    
  2. Security
    - Ensure proper schema ownership
    - Grant minimal required permissions
*/

-- Create auth schema if not exists (owned by postgres)
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION postgres;

-- Create auth functions with proper ownership
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = auth, pg_temp
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

ALTER FUNCTION auth.uid() OWNER TO postgres;

CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = auth, pg_temp
AS $$
  SELECT COALESCE(current_setting('request.jwt.claim.role', true), 'anon');
$$;

ALTER FUNCTION auth.role() OWNER TO postgres;

-- Create roles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOINHERIT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOINHERIT;
  END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated, anon, service_role;
GRANT ALL ON SCHEMA auth TO postgres;

-- Fix user registration function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.users (
    id,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous'),
    'user',
    NEW.created_at,
    NEW.updated_at
  );

  -- Create extended profile
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);

  -- Create account settings
  INSERT INTO public.account_settings (id)
  VALUES (NEW.id);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_context
    ) VALUES (
      SQLERRM,
      SQLSTATE,
      format('Failed to create profile for user %s', NEW.id)
    );
    RAISE;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Recreate trigger with proper ownership
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permissions on auth functions
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO authenticated, anon, service_role;

-- Ensure proper table ownership
ALTER TABLE IF EXISTS auth.users OWNER TO postgres;