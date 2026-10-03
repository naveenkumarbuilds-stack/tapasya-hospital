-- ==============================================================================
-- TAPASYA HOSPITAL - SUPABASE DATABASE SCHEMA
-- Project ID: wpvbfbcsnxuqwqdgrdeq
-- Run this in your Supabase Dashboard -> SQL Editor -> Click 'Run'
-- ==============================================================================

-- 1. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  patient_age INTEGER,
  patient_gender TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  doctor_id TEXT,
  doctor_name TEXT,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'confirmed',
  urgency TEXT DEFAULT 'routine',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Inquiries Table (for contact form messages & emergency callback requests)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  department TEXT,
  message TEXT NOT NULL,
  is_emergency_callback BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 4. Set Access Policies for Website (anon / public access)
-- Allow anyone to book an appointment
CREATE POLICY "Allow public inserts into appointments"
  ON public.appointments
  FOR INSERT
  TO public, anon
  WITH CHECK (true);

-- Allow customers to look up appointments by reference & phone
CREATE POLICY "Allow public select on appointments"
  ON public.appointments
  FOR SELECT
  TO public, anon
  USING (true);

-- Allow status updates (such as completion, confirmation, or cancellation)
CREATE POLICY "Allow public update on appointments"
  ON public.appointments
  FOR UPDATE
  TO public, anon
  USING (true)
  WITH CHECK (true);

-- Allow anyone to submit a contact inquiry
CREATE POLICY "Allow public inserts into inquiries"
  ON public.inquiries
  FOR INSERT
  TO public, anon
  WITH CHECK (true);

-- Allow reading inquiries
CREATE POLICY "Allow public select on inquiries"
  ON public.inquiries
  FOR SELECT
  TO public, anon
  USING (true);

-- Create helpful index for quick lookups
CREATE INDEX IF NOT EXISTS idx_appointments_ref ON public.appointments (reference_number);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments (patient_phone);
