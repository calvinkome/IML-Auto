/*
  # Fix Auth Schema Permissions

  1. Changes
    - Grant proper permissions on auth schema
    - Fix ownership issues
    - Add missing role grants
    
  2. Security
    - Ensure proper access control
    - Maintain RLS policies
*/

-- Ensure postgres role has proper permissions
GRANT ALL ON SCHEMA auth TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres;

-- Grant usage to service roles
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Grant specific table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated, service_role;
GRANT INSERT, UPDATE ON auth.users TO anon, authenticated, service_role;

-- Ensure sequences are accessible
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated, service_role;

-- Reset ownership of auth schema objects to postgres
ALTER SCHEMA auth OWNER TO postgres;
ALTER TABLE auth.users OWNER TO postgres;

-- Ensure functions are owned by postgres
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT proname, proargtypes::regtype[] as arg_types
        FROM pg_proc
        WHERE pronamespace = 'auth'::regnamespace
    LOOP
        EXECUTE format(
            'ALTER FUNCTION auth.%I(%s) OWNER TO postgres',
            func_record.proname,
            array_to_string(func_record.arg_types, ',')
        );
    END LOOP;
END $$;

-- Ensure proper role inheritance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'authenticated'
  ) THEN
    CREATE ROLE authenticated;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'anon'
  ) THEN
    CREATE ROLE anon;
  END IF;
END $$;

-- Grant role hierarchy
GRANT anon TO authenticated;
GRANT authenticated TO service_role;

-- Recreate essential auth functions with proper ownership
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = auth, pg_temp
AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    ),
    ''
  )::uuid
$$;

ALTER FUNCTION auth.uid() OWNER TO postgres;

CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = auth, pg_temp
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
  )::text
$$;

ALTER FUNCTION auth.role() OWNER TO postgres;