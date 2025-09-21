export interface Student {
  id: string;
  studentName: string;
  rollNumber: string;
  section: string;
  event: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  deviceId: string;
}

export interface AttendanceFormData {
  studentName: string;
  rollNumber: string;
  section: string;
  event: string;
}

export interface LocationValidation {
  isValid: boolean;
  distance?: number;
  message: string;
}

export const SECTIONS = ['CSAI-1', 'CSAI-2', 'CSAI-3', 'CSAI-4'] as const;
export const EVENTS = ['Technical Training', 'Verbal Lecture', 'Aptitude Lecture', 'CDC Event'] as const;

export type Section = typeof SECTIONS[number];
export type Event = typeof EVENTS[number];
