export interface StudentData {
  nis: string;
  nama: string;
  kelas: string;
  punyaSim: boolean;
}

export interface AttendanceLog {
  timestamp: string;
  student: StudentData;
  status: 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'NOT_FOUND' | 'ERROR';
  message: string;
}

export enum ScanStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
}

export interface ApiResponse {
  success: boolean;
  data?: {
    student: StudentData;
    timestamp: string;
  };
  message: string;
  code: 'SUCCESS' | 'DUPLICATE' | 'NOT_FOUND' | 'ERROR';
}