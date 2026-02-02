import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header.tsx';
import Scanner from './components/Scanner.tsx';
import ResultCard from './components/ResultCard.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import { AttendanceLog, ScanStatus } from './types.ts';
import { submitAttendance } from './services/api.ts';
import { APP_CONFIG } from './constants.ts';
import { History, AlertTriangle, Play, Settings, Download, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>(ScanStatus.IDLE);
  const [lastLog, setLastLog] = useState<AttendanceLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Cek apakah aplikasi sudah berjalan dalam mode standalone (terinstall)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('🚀 Aplikasi dijalankan dalam mode Standalone (PWA)');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('📥 PWA: Event beforeinstallprompt terdeteksi. Aplikasi siap diinstal.');
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA: Aplikasi berhasil diinstal oleh pengguna');
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User menerima instalasi');
      setDeferredPrompt(null);
    } else {
      console.log('User membatalkan instalasi');
    }
  };

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (type: 'SCAN' | 'SUCCESS' | 'WARNING') => {
    if (!audioCtxRef.current) return;
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const now = ctx.currentTime;

    const playNote = (freq: number, startTime: number, duration: number, oscType: OscillatorType = 'sine', volume: number = 0.2) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    if (type === 'SCAN') {
      playNote(880, now, 0.1); 
    } 
    else if (type === 'SUCCESS') {
      playNote(523.25, now, 0.3);        // C5
      playNote(659.25, now + 0.1, 0.3);  // E5
      playNote(783.99, now + 0.2, 0.4);  // G5
    } 
    else if (type === 'WARNING') {
      playNote(220, now, 0.2, 'sawtooth', 0.15);
      playNote(165, now + 0.15, 0.4, 'sawtooth', 0.15);
    }
  };

  const isProcessing = useRef<boolean>(false);

  const handleStartApp = () => {
    initAudio();
    setIsStarted(true);
    setTimeout(() => playSound('SUCCESS'), 300);
  };

  const handleBackToHome = () => {
    setIsStarted(false);
    setScanStatus(ScanStatus.IDLE);
    setShowAdmin(false);
  };

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessing.current || scanStatus === ScanStatus.PROCESSING || scanStatus === ScanStatus.RESULT || showAdmin) {
      return;
    }

    isProcessing.current = true;
    setScanStatus(ScanStatus.PROCESSING);
    playSound('SCAN');

    try {
        const result = await submitAttendance(decodedText);
        
        if (result.code === 'SUCCESS') {
          playSound('SUCCESS');
        } else {
          playSound('WARNING');
        }

        const newLog: AttendanceLog = {
            timestamp: result.data?.timestamp || new Date().toISOString(),
            status: result.code === 'SUCCESS' ? 'SUCCESS' : result.code === 'DUPLICATE' ? 'ALREADY_CHECKED_IN' : result.code === 'NOT_FOUND' ? 'NOT_FOUND' : 'ERROR',
            message: result.message,
            student: result.data?.student || { nis: decodedText, nama: 'Unknown', kelas: '-', punyaSim: false }
        };

        setLastLog(newLog);
        if (newLog.status === 'SUCCESS' || newLog.status === 'ALREADY_CHECKED_IN') {
             setRecentLogs(prev => [newLog, ...prev].slice(0, 5));
        }
        setScanStatus(ScanStatus.RESULT);

    } catch (error) {
        playSound('WARNING');
        setLastLog({
            timestamp: new Date().toISOString(),
            status: 'ERROR',
            message: 'Terjadi kesalahan jaringan atau server.',
            student: { nis: decodedText, nama: 'Error', kelas: '-', punyaSim: false }
        });
        setScanStatus(ScanStatus.RESULT);
    } finally {
        isProcessing.current = false;
    }
  }, [scanStatus, showAdmin]);

  const resetScanner = () => {
    isProcessing.current = false;
    setLastLog(null);
    setScanStatus(ScanStatus.IDLE);
    if (audioCtxRef.current) audioCtxRef.current.resume();
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="bg-white p-6 rounded-full mb-8 shadow-2xl animate-in fade-in zoom-in duration-500">
          <img 
            src="https://iili.io/fLQoCep.png" 
            alt="Logo SMAN 1 Ciruas" 
            className="w-24 h-24 object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2">Sistem Aplikasi Parkir</h1>
        <p className="text-blue-100 mb-8 max-w-xs text-sm font-medium tracking-widest opacity-90 uppercase">SMAN 1 CIRUAS</p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={handleStartApp}
            className="bg-white text-blue-600 font-bold px-10 py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform group"
          >
            <Play size={20} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
            MULAI APLIKASI
          </button>

          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="bg-blue-500/50 text-white font-semibold px-10 py-3 rounded-2xl border border-white/20 flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-blue-500/70"
            >
              <Download size={18} />
              Install di Beranda HP
            </button>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-blue-200 uppercase tracking-widest font-bold">
            <ShieldCheck size={12} />
            Secure Cloud Database
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-6 relative">
      <Header onBackToHome={handleBackToHome} showBackButton={true} />

      <main className="flex-1 container mx-auto px-4 pt-6 max-w-lg">
        
        {APP_CONFIG.USE_DEMO_MODE && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
                <div>
                    <h3 className="text-sm font-bold text-yellow-800">Mode Demo Aktif</h3>
                    <p className="text-xs text-yellow-700 mt-1">
                        Aplikasi menggunakan data mockup.
                    </p>
                </div>
            </div>
        )}

        <div className="mb-6">
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-gray-700">Scan QR Code Siswa</h2>
                  <button 
                    onClick={() => setShowAdmin(true)}
                    className="text-xs flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Settings size={14} />
                    Kelola Data
                  </button>
              </div>
              
              <Scanner 
                onScanSuccess={handleScanSuccess} 
                status={showAdmin ? ScanStatus.PROCESSING : scanStatus}
                resetStatus={resetScanner}
              />
              
              {scanStatus === ScanStatus.PROCESSING && !showAdmin && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium animate-pulse">Memverifikasi data...</p>
                </div>
              )}
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <History className="text-blue-500" size={20} />
                <h3 className="font-semibold text-gray-800">Riwayat Terakhir</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
                {recentLogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm italic">
                        Belum ada aktivitas absensi.
                    </div>
                ) : (
                    recentLogs.map((log, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div>
                                <p className="font-medium text-gray-800">{log.student.nama}</p>
                                <p className="text-xs text-gray-500">{log.student.kelas}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${log.status === 'ALREADY_CHECKED_IN' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                    {new Date(log.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </main>

      {scanStatus === ScanStatus.RESULT && !showAdmin && (
        <ResultCard log={lastLog} onClose={resetScanner} />
      )}
      
      {showAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}
      
      <footer className="text-center p-6 text-gray-400 text-[10px] mt-auto font-medium">
        © 2026 PARKIR QR SMAN 1 CIRUAS &bull; v1.4-PWA &bull; BUILD {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;