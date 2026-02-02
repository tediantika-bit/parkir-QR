export const APP_CONFIG = {
  // URL Web App Google Apps Script yang telah dideploy
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyZtc1eynBd4oUAAtfmC703zZTjj9Is62dGIMEW73yT-zICIOVvWeHxMf6sWNnjUGtT/exec', 
  
  // Set ke false karena URL backend sudah tersedia
  USE_DEMO_MODE: false 
};

// Data Mockup untuk Demo Mode (Cadangan jika mode demo diaktifkan kembali)
export const MOCK_STUDENTS = [
  { nis: '1001', nama: 'Ahmad Rizki', kelas: 'XII IPA 1', punyaSim: true },
  { nis: '1002', nama: 'Siti Aminah', kelas: 'XI IPS 2', punyaSim: false },
  { nis: '1003', nama: 'Budi Santoso', kelas: 'XII IPA 3', punyaSim: true },
];