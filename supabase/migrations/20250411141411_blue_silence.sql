/*
  # Fix Function Search Paths

  1. Changes
    - Add SECURITY DEFINER and search_path to all functions
    - Ensure proper schema usage
    - Maintain existing functionality
    
  2. Security
    - Prevent search_path injection
    - Maintain RLS policies
*/

-- Fix update_updated_at function
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

-- Fix check_email_exists function
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = p_email
    AND deleted_at IS NULL
  );
END;
$$;

-- Fix validate_user_data function
CREATE OR REPLACE FUNCTION public.validate_user_data(
  p_email text,
  p_full_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Email format validation
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Name validation
  IF length(p_full_name) < 2 THEN
    RAISE EXCEPTION 'Full name too short';
  END IF;

  -- Check email uniqueness
  IF public.check_email_exists(p_email) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;

  RETURN true;
END;
$$;

-- Fix update_vehicle_status function
CREATE OR REPLACE FUNCTION public.update_vehicle_status(
  p_vehicle_id uuid,
  p_status vehicle_status,
  p_reason text DEFAULT NULL,
  p_expected_return_date timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status_id uuid;
BEGIN
  -- Insert new status
  INSERT INTO vehicle_statuses (
    vehicle_id, 
    status, 
    reason, 
    expected_return_date
  )
  VALUES (
    p_vehicle_id,
    p_status,
    p_reason,
    p_expected_return_date
  )
  RETURNING id INTO v_status_id;

  -- Update vehicle's current status
  UPDATE vehicles
  SET 
    current_status_id = v_status_id,
    available = (p_status = 'in_service')
  WHERE id = p_vehicle_id;

  RETURN v_status_id;
END;
$$;

-- Fix register_user function
CREATE OR REPLACE FUNCTION public.register_user(
  p_email text,
  p_password text,
  p_full_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Validate input data
  PERFORM validate_user_data(p_email, p_full_name);

  -- Generate new UUID
  v_user_id := gen_random_uuid();

  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email']
    ),
    jsonb_build_object(
      'full_name', p_full_name
    ),
    'authenticated',
    'authenticated'
  );

  -- Create user profile
  INSERT INTO public.users (
    id,
    full_name,
    role
  ) VALUES (
    v_user_id,
    p_full_name,
    'user'
  );

  RETURN v_user_id;
EXCEPTION
  WHEN others THEN
    -- Log error details
    INSERT INTO public.error_logs (
      error_message,
      error_detail,
      error_hint,
      error_context
    ) VALUES (
      SQLERRM,
      SQLSTATE,
      'Error during user registration',
      format('email: %s, full_name: %s', p_email, p_full_name)
    );
    RAISE;
END;
$$;

-- Fix cleanup_test_users function
CREATE OR REPLACE FUNCTION public.cleanup_test_users(p_email_pattern text DEFAULT '%@example.com')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Soft delete auth users
  WITH deleted_auth AS (
    UPDATE auth.users
    SET deleted_at = now()
    WHERE email LIKE p_email_pattern
    AND deleted_at IS NULL
    RETURNING id
  )
  -- Delete corresponding profiles
  DELETE FROM public.users
  WHERE id IN (SELECT id FROM deleted_auth);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Log completion
INSERT INTO public.error_logs (
  error_message,
  error_context
) VALUES (
  'Function search paths fixed',
  'Successfully updated all functions with proper search path settings'
);