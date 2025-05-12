-- Safe policy creation function
CREATE OR REPLACE FUNCTION public.create_rls_policy(
  table_name TEXT,
  policy_name TEXT,
  policy_cmd TEXT,
  policy_using TEXT
) RETURNS VOID AS $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  -- Check if column exists in USING clause
  IF policy_using ~ '(\w+)\.(\w+)' THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = $1 
      AND column_name = regexp_replace($4, '.*\.(\w+).*', '\1')
    ) INTO col_exists;
    
    IF NOT col_exists THEN
      RAISE EXCEPTION 'Column in USING clause does not exist';
    END IF;
  END IF;
  
  EXECUTE format('CREATE POLICY "%s" ON %I FOR %s USING (%s)', 
                policy_name, table_name, policy_cmd, policy_using);
END;
$$ LANGUAGE plpgsql;

-- Usage example
SELECT public.create_rls_policy(
  'error_logs',
  'Users view own errors',
  'SELECT',
  'user_id = auth.uid()'
);