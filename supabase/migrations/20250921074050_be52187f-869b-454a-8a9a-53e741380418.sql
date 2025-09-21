-- Create attendance settings table for controlling attendance timing
CREATE TABLE public.attendance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opening_time TIME NOT NULL DEFAULT '09:00:00',
  closing_time TIME NOT NULL DEFAULT '17:00:00',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance settings
CREATE POLICY "Anyone can view attendance settings" 
ON public.attendance_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert attendance settings" 
ON public.attendance_settings 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update attendance settings" 
ON public.attendance_settings 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete attendance settings" 
ON public.attendance_settings 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_attendance_settings_updated_at
BEFORE UPDATE ON public.attendance_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.attendance_settings (opening_time, closing_time, is_enabled, created_by)
SELECT '09:00:00', '17:00:00', true, id 
FROM auth.users 
WHERE email = (SELECT email FROM auth.users LIMIT 1)
LIMIT 1;