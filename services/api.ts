import { APP_CONFIG, MOCK_STUDENTS } from '../constants';
import { ApiResponse, StudentData } from '../types';

export const submitAttendance = async (nis: string): Promise<ApiResponse> => {
  if (APP_CONFIG.USE_DEMO_MODE) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const student = MOCK_STUDENTS.find(s => s.nis === nis);
        if (!student) {
          resolve({ success: false, message: 'Data siswa tidak ditemukan di database.', code: 'NOT_FOUND' });
          return;
        }
        if (nis === '1003') {
           resolve({ success: false, message: `Siswa a.n ${student.nama} sudah absen masuk hari ini.`, code: 'DUPLICATE' });
          return;
        }
        resolve({ success: true, data: { student, timestamp: new Date().toISOString() }, message: 'Absen masuk berhasil dicatat.', code: 'SUCCESS' });
      }, 1000);
    });
  }

  try {
    const response = await fetch(APP_CONFIG.SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'checkIn', nis: nis }),
    });
    return await response.json();
  } catch (error) {
    console.error("API Error", error);
    return { success: false, message: 'Gagal terhubung ke server.', code: 'ERROR' };
  }
};

export const addStudent = async (student: StudentData): Promise<ApiResponse> => {
    if (APP_CONFIG.USE_DEMO_MODE) {
        return new Promise(resolve => setTimeout(() => resolve({ success: true, message: 'Demo: Siswa ditambahkan', code: 'SUCCESS' }), 1000));
    }
    try {
        const response = await fetch(APP_CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'addStudent', data: student }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Gagal menambah data.', code: 'ERROR' };
    }
};

export const importStudents = async (students: StudentData[]): Promise<ApiResponse> => {
    if (APP_CONFIG.USE_DEMO_MODE) {
        return new Promise(resolve => setTimeout(() => resolve({ success: true, message: `Demo: ${students.length} siswa diimport`, code: 'SUCCESS' }), 1500));
    }
    try {
        const response = await fetch(APP_CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'importStudents', data: students }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Gagal import data.', code: 'ERROR' };
    }
};