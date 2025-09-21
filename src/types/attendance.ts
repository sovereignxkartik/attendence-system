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

export const SECTIONS = ['Section A', 'Section B', 'Section C', 'Section D'] as const;
export const EVENTS = ['Annual Day', 'Sports Meet', 'Cultural Fest', 'Academic Conference'] as const;

export type Section = typeof SECTIONS[number];
export type Event = typeof EVENTS[number];