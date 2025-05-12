/*
  # Fix Authentication Registration

  1. Changes
    - Add missing auth schema extensions and functions
    - Fix user registration trigger
    - Add proper error handling
    
  2. Security
    - Enable RLS
    - Add security policies
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table with proper constraints if not exists
CREATE TABLE IF NOT EXISTS auth.users (
  instance_id uuid DEFAULT uuid_generate_v4(),
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  aud character varying(255),
  role character varying(255),
  email character varying(255),
  encrypted_password character varying(255),
  email_confirmed_at timestamp with time zone DEFAULT now(),
  invited_at timestamp with time zone,
  confirmation_token character varying(255),
  confirmation_sent_at timestamp with time zone,
  recovery_token character varying(255),
  recovery_sent_at timestamp with time zone,
  email_change_token_new character varying(255),
  email_change character varying(255),
  email_change_sent_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  is_super_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  phone character varying(255) DEFAULT NULL::character varying,
  phone_confirmed_at timestamp with time zone,
  phone_change character varying(255) DEFAULT ''::character varying,
  phone_change_token character varying(255) DEFAULT ''::character varying,
  phone_change_sent_at timestamp with time zone,
  email_change_token_current character varying(255) DEFAULT ''::character varying,
  email_change_confirm_status smallint DEFAULT 0,
  banned_until timestamp with time zone,
  reauthentication_token character varying(255) DEFAULT ''::character varying,
  reauthentication_sent_at timestamp with time zone,
  is_sso_user boolean DEFAULT false,
  deleted_at timestamp with time zone,
  is_anonymous boolean DEFAULT false,
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_email_check CHECK (((email = lower(email)) AND (length(email) <= 255))),
  CONSTRAINT users_phone_check CHECK ((length(phone) <= 255))
);

-- Drop existing trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate required data
  IF NEW.raw_user_meta_data->>'full_name' IS NULL THEN
    RAISE EXCEPTION 'full_name is required in raw_user_meta_data';
  END IF;

  -- Create user profile with error handling
  BEGIN
    INSERT INTO public.users (
      id,
      full_name,
      role,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      'user',
      NEW.created_at,
      NEW.updated_at
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error and re-raise
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

  RETURN NEW;
END;
$$;

-- Create new trigger with proper timing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create or replace policies
CREATE POLICY "Public users are viewable by everyone"
  ON auth.users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own user data"
  ON auth.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own user data"
  ON auth.users FOR UPDATE
  USING (auth.uid() = id);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users (email) WHERE deleted_at IS NULL;

-- Create function to check email uniqueness
CREATE OR REPLACE FUNCTION auth.check_email_unique()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = NEW.email
    AND id != NEW.id
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'email % already exists', NEW.email;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for email uniqueness check
CREATE TRIGGER check_email_unique_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.check_email_unique();