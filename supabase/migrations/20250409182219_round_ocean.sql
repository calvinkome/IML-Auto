/*
  # User Registration Handler

  1. Changes
    - Create function to handle new user registration
    - Create trigger to auto-create public.users records
    
  2. Security
    - Use SECURITY DEFINER for proper permissions
    - Set search_path for security
    - Add proper error handling
*/

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insert new user into public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user',
    NEW.created_at,
    NEW.updated_at
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
      SQLERRM,
      format('Email already exists: %s', NEW.email)
    );
    RAISE;
  
  WHEN OTHERS THEN
    -- Log unexpected errors
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_context
    ) VALUES (
      'Error in handle_new_user',
      SQLERRM,
      format('Failed to create user profile - Email: %s', NEW.email)
    );
    RAISE;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;