import { useState, useEffect } from 'react';
import { Student, AttendanceFormData } from '@/types/attendance';

const STORAGE_KEY = 'attendance_records';
const DEVICE_KEY = 'device_submissions';

export function useAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<Student[]>([]);
  const [deviceSubmissions, setDeviceSubmissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load data from localStorage
    const savedRecords = localStorage.getItem(STORAGE_KEY);
    const savedSubmissions = localStorage.getItem(DEVICE_KEY);
    
    if (savedRecords) {
      setAttendanceRecords(JSON.parse(savedRecords));
    }
    
    if (savedSubmissions) {
      setDeviceSubmissions(new Set(JSON.parse(savedSubmissions)));
    }
  }, []);

  const saveToStorage = (records: Student[], submissions: Set<string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    localStorage.setItem(DEVICE_KEY, JSON.stringify(Array.from(submissions)));
  };

  const generateDeviceId = (): string => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  const submitAttendance = (
    formData: AttendanceFormData,
    location: { latitude: number; longitude: number }
  ): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      const deviceId = generateDeviceId();
      const submissionKey = `${formData.rollNumber}_${formData.event}_${deviceId}`;
      
      // Check for duplicate submission
      if (deviceSubmissions.has(submissionKey)) {
        resolve({
          success: false,
          message: 'You have already marked attendance for this event from this device.'
        });
        return;
      }

      const newRecord: Student = {
        id: Math.random().toString(36).substr(2, 9),
        studentName: formData.studentName,
        rollNumber: formData.rollNumber,
        section: formData.section,
        event: formData.event,
        timestamp: new Date(),
        location,
        deviceId
      };

      const updatedRecords = [...attendanceRecords, newRecord];
      const updatedSubmissions = new Set([...deviceSubmissions, submissionKey]);

      setAttendanceRecords(updatedRecords);
      setDeviceSubmissions(updatedSubmissions);
      saveToStorage(updatedRecords, updatedSubmissions);

      resolve({
        success: true,
        message: 'Your attendance has been marked successfully!'
      });
    });
  };

  const getFilteredRecords = (filters: {
    section?: string;
    event?: string;
  }) => {
    return attendanceRecords.filter(record => {
      if (filters.section && record.section !== filters.section) return false;
      if (filters.event && record.event !== filters.event) return false;
      return true;
    });
  };

  const exportToCSV = (records: Student[]): string => {
    const headers = ['Full Name', 'Roll Number', 'Section', 'Event', 'Date', 'Time', 'Latitude', 'Longitude'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        record.studentName,
        record.rollNumber,
        record.section,
        record.event,
        record.timestamp.toLocaleDateString(),
        record.timestamp.toLocaleTimeString(),
        record.location.latitude.toString(),
        record.location.longitude.toString()
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  return {
    attendanceRecords,
    submitAttendance,
    getFilteredRecords,
    exportToCSV,
    totalRecords: attendanceRecords.length
  };
}