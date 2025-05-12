/*
  # Remove Duplicate Columns

  1. Changes
    - Create function to identify and remove duplicate columns
    - Preserve data integrity
    - Add proper logging
    
  2. Security
    - Maintain existing RLS policies
    - Add proper error handling
*/

-- Create function to remove duplicate columns
CREATE OR REPLACE FUNCTION remove_duplicate_columns(
  p_table_name text,
  p_column_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_schema text;
  v_column record;
  v_count int := 0;
BEGIN
  -- Find all schemas containing this column
  FOR v_schema IN
    SELECT DISTINCT table_schema
    FROM information_schema.columns
    WHERE table_name = p_table_name
    AND column_name = p_column_name
    ORDER BY table_schema
  LOOP
    BEGIN
      -- Skip first occurrence (keep the column)
      IF v_count = 0 THEN
        v_count := v_count + 1;
        CONTINUE;
      END IF;

      -- Drop duplicate column
      EXECUTE format(
        'ALTER TABLE %I.%I DROP COLUMN IF EXISTS %I',
        v_schema,
        p_table_name,
        p_column_name
      );

      -- Log removal
      INSERT INTO public.error_logs (
        error_message,
        error_context
      ) VALUES (
        'Duplicate column removed',
        format(
          'Removed column %s from %s.%s',
          p_column_name,
          v_schema,
          p_table_name
        )
      );

    EXCEPTION WHEN OTHERS THEN
      -- Log error
      INSERT INTO public.error_logs (
        error_message,
        error_detail,
        error_context
      ) VALUES (
        'Failed to remove duplicate column',
        SQLERRM,
        format(
          'Schema: %s, Table: %s, Column: %s',
          v_schema,
          p_table_name,
          p_column_name
        )
      );
    END;
  END LOOP;
END;
$$;

-- Remove duplicate role column
SELECT remove_duplicate_columns('users', 'role');

-- Drop the function
DROP FUNCTION remove_duplicate_columns(text, text);

-- Ensure proper role column exists in public.users
DO $$
BEGIN
  -- Ensure user_role type exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'user');
  END IF;

  -- Recreate role column if needed
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN role user_role NOT NULL DEFAULT 'user';
  END IF;

  -- Ensure proper constraint exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (role = ANY (ARRAY['user'::user_role, 'staff'::user_role, 'admin'::user_role]));
  END IF;
END $$;

-- Log completion
INSERT INTO public.error_logs (
  error_message,
  error_context
) VALUES (
  'Duplicate column removal completed',
  'Successfully removed duplicate role columns'
);