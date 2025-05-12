/*
  # User Management System

  1. New Tables
    - `users` - User profiles with roles
    - `sessions` - User session tracking
    - `auth_attempts` - Login attempt tracking
    
  2. Security
    - Enable RLS
    - Add role-based policies
*/

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_sign_in timestamptz,
  CONSTRAINT users_username_length CHECK (char_length(username) >= 3),
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_phone_check CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s-\(\)]+$')
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  refresh_token text,
  user_agent text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CONSTRAINT sessions_expires_check CHECK (expires_at > created_at)
);

-- Create auth_attempts table
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean DEFAULT false,
  attempt_count integer DEFAULT 1,
  last_attempt timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Create policies for sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
  ON public.sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policy for auth attempts
CREATE POLICY "Only admins can view auth attempts"
  ON public.auth_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_username text;
  v_email text;
  v_client_ip text;
  v_error_stack text;
BEGIN
  v_username := lower(trim(NEW.raw_user_meta_data->>'username'));
  v_email := lower(trim(NEW.email));
  v_client_ip := current_setting('request.headers', true)::json->>'x-real-ip';

  IF v_username IS NULL OR length(v_username) < 3 THEN
    RAISE EXCEPTION 'Le nom d''utilisateur doit contenir au moins 3 caractères';
  END IF;

  BEGIN
    INSERT INTO public.users (
      id, username, email, role, full_name,
      created_at, updated_at
    ) VALUES (
      NEW.id, v_username, v_email, 'user',
      NEW.raw_user_meta_data->>'full_name',
      NEW.created_at, NEW.updated_at
    );

    INSERT INTO public.error_logs (
      error_message, error_context, registration_context
    ) VALUES (
      'Registration successful',
      format('User created successfully - Email: %s', v_email),
      jsonb_build_object(
        'email', v_email,
        'username', v_username,
        'user_id', NEW.id,
        'ip_address', v_client_ip
      )
    );

    RETURN NEW;

  EXCEPTION 
    WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_error_stack = PG_EXCEPTION_CONTEXT;

      INSERT INTO public.error_logs (
        error_message, error_detail, error_context,
        registration_context, stack_trace
      ) VALUES (
        'Duplicate registration attempt',
        SQLERRM,
        format('Email: %s or username: %s already exists', v_email, v_username),
        jsonb_build_object(
          'email', v_email,
          'username', v_username,
          'ip_address', v_client_ip
        ),
        v_error_stack
      );
      RAISE;

    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_stack = PG_EXCEPTION_CONTEXT;

      INSERT INTO public.error_logs (
        error_message, error_detail, error_context,
        registration_context, stack_trace
      ) VALUES (
        SQLERRM, SQLSTATE,
        format('Unexpected error during registration - Email: %s', v_email),
        jsonb_build_object(
          'email', v_email,
          'username', v_username,
          'ip_address', v_client_ip,
          'error_code', SQLSTATE
        ),
        v_error_stack
      );
      RAISE;
  END;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON public.sessions(expires_at);
CREATE INDEX idx_auth_attempts_email ON public.auth_attempts(email);
CREATE INDEX idx_auth_attempts_ip ON public.auth_attempts(ip_address);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;