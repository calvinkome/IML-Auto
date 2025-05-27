/*
  # Schema Improvements for Car Rental System

  1. New Tables
    - `vehicle_maintenance` - Track vehicle maintenance history
    - `reviews` - Store customer reviews and ratings
    - `insurance_policies` - Track vehicle insurance information
    - `damage_reports` - Record vehicle damage incidents

  2. Modifications
    - Add maintenance scheduling fields to vehicles table
    - Add insurance tracking fields to vehicles table
    - Add review statistics to vehicles table

  3. Security
    - Enable RLS on all new tables
    - Add appropriate access policies
*/

-- Vehicle Maintenance Table
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  cost NUMERIC(10,2),
  service_date TIMESTAMP WITH TIME ZONE NOT NULL,
  next_service_date TIMESTAMP WITH TIME ZONE,
  performed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX idx_vehicle_maintenance_dates ON vehicle_maintenance(service_date, next_service_date);

ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage maintenance records"
  ON vehicle_maintenance
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_reviews_vehicle ON reviews(vehicle_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reviews for their bookings"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view all reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- Insurance Policies Table
CREATE TABLE IF NOT EXISTS insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL,
  provider TEXT NOT NULL,
  coverage_type TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  premium_amount NUMERIC(10,2) NOT NULL,
  coverage_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_insurance_policies_vehicle ON insurance_policies(vehicle_id);
CREATE INDEX idx_insurance_policies_dates ON insurance_policies(start_date, end_date);
CREATE INDEX idx_insurance_policies_status ON insurance_policies(status);

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage insurance policies"
  ON insurance_policies
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Damage Reports Table
CREATE TABLE IF NOT EXISTS damage_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  reported_by uuid NOT NULL,
  damage_type TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  estimated_cost NUMERIC(10,2),
  repair_status TEXT NOT NULL CHECK (repair_status IN ('pending', 'in_progress', 'completed')),
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_damage_reports_vehicle ON damage_reports(vehicle_id);
CREATE INDEX idx_damage_reports_booking ON damage_reports(booking_id);
CREATE INDEX idx_damage_reports_status ON damage_reports(repair_status);

ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage damage reports"
  ON damage_reports
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'staff')
  ));

CREATE POLICY "Users can view their damage reports"
  ON damage_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = damage_reports.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Add maintenance tracking fields to vehicles
ALTER TABLE vehicles 
  ADD COLUMN IF NOT EXISTS last_maintenance_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_maintenance_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS maintenance_interval_days INTEGER DEFAULT 90;

-- Add insurance tracking fields to vehicles
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS insurance_status TEXT CHECK (insurance_status IN ('insured', 'uninsured', 'pending')),
  ADD COLUMN IF NOT EXISTS current_insurance_id uuid REFERENCES insurance_policies(id);

-- Add review statistics to vehicles
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0.0;

-- Create function to update vehicle review statistics
CREATE OR REPLACE FUNCTION update_vehicle_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vehicles
  SET 
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE vehicle_id = NEW.vehicle_id),
    average_rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE vehicle_id = NEW.vehicle_id)
  WHERE id = NEW.vehicle_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update vehicle review stats
CREATE TRIGGER update_vehicle_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_review_stats();

-- Create function to check maintenance schedule
CREATE OR REPLACE FUNCTION check_vehicle_maintenance_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.next_maintenance_date IS NULL OR NEW.next_maintenance_date <= CURRENT_TIMESTAMP THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type
    )
    SELECT 
      profiles.user_id,
      'Vehicle Maintenance Required',
      format('Vehicle %s is due for maintenance', NEW.name),
      'maintenance'
    FROM profiles
    WHERE profiles.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for maintenance notifications
CREATE TRIGGER check_maintenance_schedule
AFTER INSERT OR UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION check_vehicle_maintenance_schedule();