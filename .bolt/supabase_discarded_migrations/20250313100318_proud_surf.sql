/*
  # Configure Authentication Permissions

  1. Changes
    - Grant schema usage permissions
    - Set proper schema ownership
    - Configure table-level permissions
    - Set up Row Level Security
    
  2. Security
    - Enable RLS on auth tables
    - Add policies for data access
    - Ensure proper role separation
*/

-- Step 1: Grant schema usage permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO service_role;

-- Step 2: Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres;

GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon;
GRANT INSERT, UPDATE ON auth.users TO authenticated;

-- Step 3: Set schema ownership
ALTER SCHEMA auth OWNER TO postgres;

-- Step 4: Enable RLS and create policies
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "users_select_own_data" 
ON auth.users
FOR SELECT
USING (
  auth.uid() = id OR 
  auth.role() = 'service_role'
);

-- Policy for users to update their own data
CREATE POLICY "users_update_own_data" 
ON auth.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 5: Ensure proper function ownership and permissions
DO $$
DECLARE
  _sql text;
BEGIN
  FOR _sql IN 
    SELECT 'ALTER FUNCTION ' || quote_ident(n.nspname) || '.' || quote_ident(p.proname) || '(' ||
           pg_get_function_identity_arguments(p.oid) || ') OWNER TO postgres;'
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth'
  LOOP
    EXECUTE _sql;
  END LOOP;
END $$;