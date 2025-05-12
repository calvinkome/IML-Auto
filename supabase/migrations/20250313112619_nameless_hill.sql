/*
  # Add User Profiles and Settings

  1. New Tables
    - `profiles` - Extended user profile information
    - `account_settings` - User preferences and settings
    
  2. Changes
    - Add profile management
    - Add account settings
    - Create automatic profile creation
    
  3. Security
    - Enable RLS
    - Add proper policies
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url text,
  bio text,
  location text,
  phone text,
  preferred_language text DEFAULT 'fr',
  timezone text DEFAULT 'Africa/Kinshasa',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create account settings table
CREATE TABLE IF NOT EXISTS public.account_settings (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  two_factor_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR (auth.jwt()->>'role')::text IN ('admin', 'staff'));

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Create policies for account settings
CREATE POLICY "Users can view own settings"
  ON public.account_settings
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR (auth.jwt()->>'role')::text IN ('admin', 'staff'));

CREATE POLICY "Users can update own settings"
  ON public.account_settings
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON public.account_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Create updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_account_settings_updated_at
  BEFORE UPDATE ON public.account_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user_extended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);

  -- Create account settings
  INSERT INTO public.account_settings (id)
  VALUES (NEW.id);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_context
    ) VALUES (
      SQLERRM,
      SQLSTATE,
      format('Failed to create extended profile for user %s', NEW.id)
    );
    RAISE;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created_extended
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_extended();

-- Create indexes
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX idx_account_settings_created_at ON public.account_settings(created_at);