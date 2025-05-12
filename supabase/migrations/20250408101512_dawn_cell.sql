/*
  # Authentication Setup

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
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

ALTER FUNCTION auth.uid() OWNER TO postgres;

CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = auth, pg_temp
AS $$
  SELECT coalesce(current_setting('request.jwt.claim.role', true), 'anon');
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

-- Grant execute permissions on auth functions
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO authenticated, anon, service_role;

-- Ensure proper table ownership
ALTER TABLE IF EXISTS auth.users OWNER TO postgres;