-- Apply policies safely
BEGIN;

-- Example usage for error_logs
SELECT public.create_rls_policy(
  'error_logs',
  'Users view own errors',
  'SELECT',
  'user_id = auth.uid()'
);

SELECT public.create_rls_policy(
  'error_logs',
  'Admins manage all errors',
  'ALL',
  'auth.role() = ''admin'''
);

-- Add other policies here following the same pattern
COMMIT;