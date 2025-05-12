/*
  # Fix User Role Column

  1. Changes
    - Drop dependent policies first
    - Modify role column
    - Recreate policies
    
  2. Security
    - Maintain RLS
    - Add proper error handling
*/

-- Drop dependent policies first
DROP POLICY IF EXISTS "Only admins can view error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Now we can safely modify the role column
ALTER TABLE public.users 
  DROP COLUMN IF EXISTS role CASCADE;

ALTER TABLE public.users
  ADD COLUMN role user_role NOT NULL DEFAULT 'user';

-- Add role constraint
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['user'::user_role, 'staff'::user_role, 'admin'::user_role]));

-- Recreate email unique index
DROP INDEX IF EXISTS users_email_unique_idx;
CREATE UNIQUE INDEX users_email_unique_idx ON public.users (lower(email));

-- Create function to safely migrate users
CREATE OR REPLACE FUNCTION migrate_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_user IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
    BEGIN
      INSERT INTO public.users (id, email, full_name, role)
      VALUES (
        v_user.id,
        v_user.email,
        COALESCE(v_user.raw_user_meta_data->>'full_name', v_user.email),
        'user'::user_role
      )
      ON CONFLICT (id) DO UPDATE
      SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name
      WHERE public.users.role = 'user';

      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log migration error
      INSERT INTO public.error_logs (
        error_message,
        error_detail,
        error_context
      ) VALUES (
        'Failed to migrate user',
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
    'User migration completed',
    format('Successfully migrated %s users', v_count)
  );
END;
$$;

-- Execute migration
SELECT migrate_auth_users();

-- Drop migration function
DROP FUNCTION migrate_auth_users();

-- Recreate policies
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;