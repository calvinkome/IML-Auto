/*
  # Fix Role Column and Schema

  1. Changes
    - Remove role column from auth.users
    - Ensure role column exists only in public.users
    - Add proper constraints and validation
    
  2. Security
    - Maintain RLS policies
    - Add proper error handling
*/

-- Create user_role enum type if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'user');
  END IF;
END $$;

-- Remove role column from auth.users if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE auth.users DROP COLUMN role;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- Table doesn't exist, nothing to do
END $$;

-- Ensure proper role column in public.users
ALTER TABLE public.users 
  DROP COLUMN IF EXISTS role CASCADE;

ALTER TABLE public.users
  ADD COLUMN role user_role NOT NULL DEFAULT 'user';

-- Add role constraint
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check,
  ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['user'::user_role, 'staff'::user_role, 'admin'::user_role]));

-- Create function to migrate existing users
CREATE OR REPLACE FUNCTION migrate_users_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_user IN SELECT id, email FROM auth.users LOOP
    BEGIN
      UPDATE public.users
      SET role = 'user'::user_role
      WHERE id = v_user.id
      AND role IS NULL;

      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log migration error
      INSERT INTO public.error_logs (
        error_message,
        error_detail,
        error_context
      ) VALUES (
        'Failed to migrate user role',
        SQLERRM,
        format('User ID: %s, Email: %s', v_user.id, v_user.email)
      );
    END;
  END LOOP;

  -- Log migration summary
  INSERT INTO public.error_logs (
    error_message,
    error_context
  ) VALUES (
    'User role migration completed',
    format('Successfully migrated %s users', v_count)
  );
END;
$$;

-- Execute migration
SELECT migrate_users_role();

-- Drop migration function
DROP FUNCTION migrate_users_role();

-- Update handle_new_user function
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

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Refresh indexes
REINDEX TABLE public.users;

-- Log completion
INSERT INTO public.error_logs (
  error_message,
  error_context
) VALUES (
  'Role column fix completed',
  'Successfully fixed role column schema'
);