-- Fix security vulnerability: Restrict profile access
-- Drop the overly permissive policy that allows everyone to see all profiles
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

-- Create secure policies for profile access
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Admins can view all profiles (needed for admin dashboard functionality)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);