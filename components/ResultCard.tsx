import React from 'react';
import { AttendanceLog } from '../types';
import { CheckCircle, AlertCircle, XCircle, Clock, CreditCard, User } from 'lucide-react';

interface ResultCardProps {
  log: AttendanceLog | null;
  onClose: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ log, onClose }) => {
  if (!log) return null;

  const isSuccess = log.status === 'SUCCESS';
  const isDuplicate = log.status === 'ALREADY_CHECKED_IN';
  
  let bgColor = "bg-white";
  let icon = <CheckCircle className="w-16 h-16 text-green-500" />;
  let title = "Berhasil!";
  let titleColor = "text-green-600";

  if (isDuplicate) {
    icon = <AlertCircle className="w-16 h-16 text-yellow-500" />;
    title = "Sudah Absen";
    titleColor = "text-yellow-600";
  } else if (!isSuccess) {
    icon = <XCircle className="w-16 h-16 text-red-500" />;
    title = "Gagal";
    titleColor = "text-red-600";
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-sm ${bgColor} rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100`}>
        <div className="p-6 flex flex-col items-center text-center">
          <div className="mb-4">
            {icon}
          </div>
          
          <h2 className={`text-2xl font-bold mb-1 ${titleColor}`}>{title}</h2>
          <p className="text-gray-500 mb-6 text-sm">{log.message}</p>

          {(isSuccess || isDuplicate) && log.student && (
            <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <User size={18} />
                </div>
                <div>
                    <p className="text-xs text-gray-400 font-medium uppercase">Nama Siswa</p>
                    <p className="font-semibold text-gray-800">{log.student.nama}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <CreditCard size={18} />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium uppercase">Kelas & NIS</p>
                    <p className="font-semibold text-gray-800">{log.student.kelas} • {log.student.nis}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <Clock size={18} />
                </div>
                <div>
                    <p className="text-xs text-gray-400 font-medium uppercase">Waktu Scan</p>
                    <p className="font-semibold text-gray-800">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </p>
                </div>
              </div>
              
               <div className={`mt-2 px-3 py-1 rounded-md text-xs font-bold inline-block border ${log.student.punyaSim ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                {log.student.punyaSim ? 'SIM TERVERIFIKASI' : 'TIDAK MEMILIKI SIM'}
              </div>
            </div>
          )}

          <button 
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-200"
          >
            Scan Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;