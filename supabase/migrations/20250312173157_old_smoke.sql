/*
  # Vehicle Management System

  1. New Tables
    - `vehicles` - Base vehicle information
    - `vehicle_statuses` - Track vehicle status changes
    
  2. Changes
    - Add VIN and status tracking to vehicles
    - Create status update function
    
  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create vehicles table first
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price decimal(10,2) NOT NULL,
  image text,
  description text,
  features jsonb,
  specifications jsonb,
  market_segment text,
  advantages text[],
  disadvantages text[],
  common_uses text[],
  rating decimal(3,1),
  reviews integer DEFAULT 0,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create status enum type
CREATE TYPE vehicle_status AS ENUM (
  'in_service',
  'maintenance',
  'rented',
  'out_of_service'
);

-- Create vehicle_statuses table
CREATE TABLE IF NOT EXISTS vehicle_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  status vehicle_status NOT NULL,
  reason text,
  expected_return_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
);

-- Add VIN and current status to vehicles table
ALTER TABLE vehicles 
  ADD COLUMN IF NOT EXISTS vin text UNIQUE,
  ADD COLUMN IF NOT EXISTS current_status_id uuid REFERENCES vehicle_statuses (id);

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_vehicle_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vehicle_status_updated_at
  BEFORE UPDATE ON vehicle_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_statuses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all authenticated users for vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to all authenticated users for statuses"
  ON vehicle_statuses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON vehicle_statuses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
  ON vehicle_statuses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update vehicle status
CREATE OR REPLACE FUNCTION update_vehicle_status(
  p_vehicle_id uuid,
  p_status vehicle_status,
  p_reason text DEFAULT NULL,
  p_expected_return_date timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status_id uuid;
BEGIN
  -- Insert new status
  INSERT INTO vehicle_statuses (vehicle_id, status, reason, expected_return_date)
  VALUES (p_vehicle_id, p_status, p_reason, p_expected_return_date)
  RETURNING id INTO v_status_id;

  -- Update vehicle's current status
  UPDATE vehicles
  SET current_status_id = v_status_id,
      available = (p_status = 'in_service')
  WHERE id = p_vehicle_id;

  RETURN v_status_id;
END;
$$;