-- Add expiration_date column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ DEFAULT NULL; 