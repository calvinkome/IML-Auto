/*
  # Fix Registration Attempt Tracking

  1. Changes
    - Drop existing trigger before function
    - Recreate function with proper schema handling
    - Recreate trigger with proper dependencies
    
  2. Security
    - Maintain security context
    - Add proper error handling
*/

-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS before_user_registration ON auth.users;

-- Then drop and recreate the function
DROP FUNCTION IF EXISTS public.track_registration_attempt();

-- Recreate function with fixed schema handling
CREATE OR REPLACE FUNCTION public.track_registration_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_max_attempts constant integer := 5;
  v_block_duration constant interval := interval '30 minutes';
  v_attempt record;
BEGIN
  -- Get existing attempts with explicit schema qualification
  SELECT * INTO v_attempt
  FROM public.registration_attempts
  WHERE email = NEW.email
  AND (blocked_until IS NULL OR blocked_until < now())
  FOR UPDATE;

  IF FOUND THEN
    -- Update existing record
    UPDATE public.registration_attempts
    SET 
      attempt_count = CASE 
        WHEN last_attempt < now() - interval '1 hour' 
        THEN 1 
        ELSE attempt_count + 1 
      END,
      last_attempt = now(),
      blocked_until = CASE 
        WHEN attempt_count >= v_max_attempts 
        THEN now() + v_block_duration
        ELSE NULL 
      END
    WHERE id = v_attempt.id;

    -- Check if blocked
    IF v_attempt.attempt_count >= v_max_attempts THEN
      RAISE EXCEPTION 'Too many registration attempts. Please try again later.';
    END IF;
  ELSE
    -- Create new record with explicit schema qualification
    INSERT INTO public.registration_attempts (
      email, 
      ip_address,
      attempt_count,
      last_attempt
    ) VALUES (
      NEW.email,
      NEW.raw_app_meta_data->>'ip_address',
      1,
      now()
    );
  END IF;

  -- Log attempt for auditing
  INSERT INTO public.error_logs (
    error_message,
    error_context
  ) VALUES (
    'Registration attempt tracked',
    format('email: %s, ip: %s', NEW.email, NEW.raw_app_meta_data->>'ip_address')
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_context
    ) VALUES (
      SQLERRM,
      SQLSTATE,
      format('Failed registration attempt for email: %s', NEW.email)
    );
    RAISE;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER before_user_registration
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.track_registration_attempt();