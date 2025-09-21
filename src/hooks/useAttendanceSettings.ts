import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AttendanceSettings {
  id: string;
  opening_time: string;
  closing_time: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useAttendanceSettings() {
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching attendance settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Pick<AttendanceSettings, 'opening_time' | 'closing_time' | 'is_enabled'>>) => {
    try {
      if (!settings?.id) {
        // Create new settings if none exist
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
          .from('attendance_settings')
          .insert({
            ...newSettings,
            created_by: user.id
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      } else {
        // Update existing settings
        const { data, error } = await supabase
          .from('attendance_settings')
          .update(newSettings)
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      }

      toast({
        title: "Success",
        description: "Attendance settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating attendance settings:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance settings",
        variant: "destructive",
      });
    }
  };

  const isAttendanceAllowed = () => {
    if (!settings || !settings.is_enabled) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS format
    
    return currentTime >= settings.opening_time && currentTime <= settings.closing_time;
  };

  const getTimeStatus = () => {
    if (!settings) return { allowed: false, message: "Attendance settings not configured" };
    
    if (!settings.is_enabled) {
      return { allowed: false, message: "Attendance is currently disabled" };
    }

    const allowed = isAttendanceAllowed();
    if (allowed) {
      return { 
        allowed: true, 
        message: `Attendance is open until ${settings.closing_time}` 
      };
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8);
    
    if (currentTime < settings.opening_time) {
      return { 
        allowed: false, 
        message: `Attendance opens at ${settings.opening_time}` 
      };
    } else {
      return { 
        allowed: false, 
        message: `Attendance closed at ${settings.closing_time}` 
      };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSettings,
    isAttendanceAllowed,
    getTimeStatus,
    refreshSettings: fetchSettings
  };
}