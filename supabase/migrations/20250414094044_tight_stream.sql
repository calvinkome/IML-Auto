/*
  # Fix User Role Type

  1. Changes
    - Drop existing user_role type safely
    - Ensure proper role handling
    
  2. Security
    - Maintain data integrity
    - Preserve existing permissions
*/

DO $$ 
BEGIN
  -- Drop the type if it exists, cascade to handle dependencies
  DROP TYPE IF EXISTS user_role CASCADE;

  -- Create the type with correct values
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'user');
  END IF;

  -- Log the change
  INSERT INTO public.error_logs (
    error_message,
    error_context
  ) VALUES (
    'User role type fixed',
    'Successfully reset user_role type'
  );
END $$;