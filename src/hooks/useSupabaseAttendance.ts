import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface AttendanceRecord {
  id: string;
  student_name: string;
  roll_number: string;
  section: string;
  event: string;
  latitude: number;
  longitude: number;
  location_name?: string;
  created_at: string;
  updated_at: string;
}

interface AttendanceFormData {
  studentName: string;
  rollNumber: string;
  section: string;
  event: string;
}

interface AttendanceFilters {
  section?: string;
  event?: string;
  search?: string;
}

export const useSupabaseAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAttendance = async () => {
    // Only fetch if user is authenticated (for admin dashboard)
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      // Only show error toast if user is authenticated
      if (user) {
        toast({
          title: "Error",
          description: "Failed to fetch attendance records",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  const submitAttendance = async (
    formData: AttendanceFormData,
    location: { latitude: number; longitude: number }
  ) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .insert([
          {
            student_name: formData.studentName,
            roll_number: formData.rollNumber,
            section: formData.section,
            event: formData.event,
            latitude: location.latitude,
            longitude: location.longitude,
            location_name: 'Campus Location',
          }
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Attendance recorded successfully!",
      });

      // Refresh the records only if user is authenticated
      if (user) {
        fetchAttendance();
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error submitting attendance:', error);
      
      let errorMessage = 'Failed to record attendance';
      if (error.message?.includes('duplicate')) {
        errorMessage = 'Attendance already recorded for this student';
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  };

  const getFilteredRecords = (filters: AttendanceFilters) => {
    return attendanceRecords.filter(record => {
      const matchesSection = !filters.section || record.section === filters.section;
      const matchesEvent = !filters.event || record.event === filters.event;
      const matchesSearch = !filters.search || 
        record.student_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.roll_number.toLowerCase().includes(filters.search.toLowerCase());

      return matchesSection && matchesEvent && matchesSearch;
    });
  };

  const exportToCSV = (records: AttendanceRecord[]) => {
    const headers = ['Student Name', 'Roll Number', 'Section', 'Event', 'Date', 'Time', 'Location'];
    
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        `"${record.student_name}"`,
        `"${record.roll_number}"`,
        `"${record.section}"`,
        `"${record.event}"`,
        `"${new Date(record.created_at).toLocaleDateString()}"`,
        `"${new Date(record.created_at).toLocaleTimeString()}"`,
        `"${record.location_name || 'Campus'}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Attendance data exported successfully!",
    });
  };

  return {
    attendanceRecords,
    loading,
    submitAttendance,
    getFilteredRecords,
    exportToCSV,
    refreshAttendance: fetchAttendance,
    totalRecords: attendanceRecords.length,
  };
};