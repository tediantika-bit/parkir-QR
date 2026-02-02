import React, { useState } from 'react';
import { X, Upload, Plus, Save, Database, AlertCircle } from 'lucide-react';
import { addStudent, importStudents } from '../services/api.ts';
import { StudentData } from '../types.ts';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState<StudentData>({
    nis: '',
    nama: '',
    kelas: '',
    punyaSim: false
  });

  const [bulkText, setBulkText] = useState('');

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis || !formData.nama || !formData.kelas) {
        setFeedback({ type: 'error', message: 'Mohon lengkapi semua field wajib.' });
        return;
    }
    
    setLoading(true);
    setFeedback(null);
    
    try {
        const res = await addStudent(formData);
        if (res.success) {
            setFeedback({ type: 'success', message: res.message });
            setFormData({ nis: '', nama: '', kelas: '', punyaSim: false });
        } else {
            setFeedback({ type: 'error', message: res.message });
        }
    } catch (err) {
        setFeedback({ type: 'error', message: 'Gagal menghubungi server.' });
    } finally {
        setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkText.trim()) return;
    
    setLoading(true);
    setFeedback(null);

    try {
        const lines = bulkText.trim().split('\n');
        const students: StudentData[] = [];

        lines.forEach(line => {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 3) {
                const hasSim = parts[3]?.toLowerCase().startsWith('y') || parts[3]?.toLowerCase() === 'true';
                students.push({
                    nis: parts[0],
                    nama: parts[1],
                    kelas: parts[2],
                    punyaSim: hasSim
                });
            }
        });

        if (students.length === 0) {
            setFeedback({ type: 'error', message: 'Format data tidak valid. Gunakan format CSV.' });
            setLoading(false);
            return;
        }

        const res = await importStudents(students);
        if (res.success) {
            setFeedback({ type: 'success', message: res.message });
            setBulkText('');
        } else {
            setFeedback({ type: 'error', message: res.message });
        }

    } catch (err) {
        setFeedback({ type: 'error', message: 'Terjadi kesalahan saat memproses data.' });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-2">
                <Database className="text-blue-600" size={20} />
                <h2 className="font-bold text-gray-800">Kelola Data Siswa</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
            </button>
        </div>

        <div className="flex border-b border-gray-200">
            <button 
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => { setActiveTab('manual'); setFeedback(null); }}
            >
                <div className="flex items-center justify-center gap-2">
                    <Plus size={16} /> Input Manual
                </div>
            </button>
            <button 
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'bulk' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                onClick={() => { setActiveTab('bulk'); setFeedback(null); }}
            >
                <div className="flex items-center justify-center gap-2">
                    <Upload size={16} /> Input Massal
                </div>
            </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            {feedback && (
                <div className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p>{feedback.message}</p>
                </div>
            )}

            {activeTab === 'manual' ? (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">NIS</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Contoh: 1024"
                            value={formData.nis}
                            onChange={e => setFormData({...formData, nis: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Nama Lengkap</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Contoh: Budi Santoso"
                            value={formData.nama}
                            onChange={e => setFormData({...formData, nama: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kelas</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Contoh: XII IPA 2"
                            value={formData.kelas}
                            onChange={e => setFormData({...formData, kelas: e.target.value})}
                        />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="hasSim"
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                            checked={formData.punyaSim}
                            onChange={e => setFormData({...formData, punyaSim: e.target.checked})}
                        />
                        <label htmlFor="hasSim" className="text-sm text-gray-700 font-medium">Siswa membawa SIM C?</label>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full mt-4 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                    >
                        {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Data</>}
                    </button>
                </form>
            ) : (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                        <p className="font-semibold mb-1">Format Input (CSV):</p>
                        <code className="block bg-white p-2 rounded border border-blue-200 text-xs">
                            NIS, Nama Lengkap, Kelas, PunyaSIM (Y/N)
                        </code>
                    </div>
                    
                    <textarea 
                        className="w-full h-48 p-3 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Tempel data Excel/CSV di sini..."
                        value={bulkText}
                        onChange={e => setBulkText(e.target.value)}
                    ></textarea>

                    <button 
                        onClick={handleBulkSubmit}
                        disabled={loading || !bulkText.trim()}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                    >
                         {loading ? 'Mengunggah...' : <><Upload size={18} /> Upload Data Massal</>}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;