import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ScanStatus } from '../types';
import { Camera } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  status: ScanStatus;
  resetStatus: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, status }) => {
  const [isPermitted, setIsPermitted] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const transitionLock = useRef<boolean>(false);
  const regionId = "html5qr-code-full-region";

  useEffect(() => {
    // If we are already processing or have a result, we don't need the scanner
    if (status === ScanStatus.PROCESSING || status === ScanStatus.RESULT) {
      return;
    }

    const startScanner = async () => {
      if (transitionLock.current) return;
      
      try {
        transitionLock.current = true;

        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(regionId, { verbose: false });
        }

        // If already scanning, don't start again
        if (scannerRef.current.isScanning) {
          transitionLock.current = false;
          return;
        }

        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          setIsPermitted(true);
          const cameraId = cameras.find(device => 
            device.label.toLowerCase().includes('back')
          )?.id || cameras[0].id;

          await scannerRef.current.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            },
            (decodedText) => {
              // Only call success if we are still in a scanning state
              onScanSuccess(decodedText);
            },
            () => {} // Silent on frame-by-frame failures
          );
        } else {
          alert("Kamera tidak ditemukan!");
        }
      } catch (err) {
        console.error("Error starting scanner", err);
        setIsPermitted(false);
      } finally {
        transitionLock.current = false;
      }
    };

    startScanner();

    return () => {
      const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
          try {
            await scannerRef.current.stop();
          } catch (err) {
            console.warn("Error stopping scanner during cleanup", err);
          }
        }
      };
      stopScanner();
    };
  }, [status, onScanSuccess]);

  // We hide the UI but keep the component mounted if status is PROCESSING or RESULT
  // to let the cleanup function handle the stop() call gracefully when the component 
  // actually unmounts or status changes.
  const isHidden = status === ScanStatus.PROCESSING || status === ScanStatus.RESULT;

  return (
    <div className={`w-full max-w-md mx-auto relative overflow-hidden rounded-xl bg-black shadow-lg ${isHidden ? 'hidden' : 'block'}`}>
      {!isPermitted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 p-4 text-center">
          <Camera className="w-12 h-12 mb-2 opacity-50" />
          <p>Meminta izin kamera...</p>
        </div>
      )}
      <div id={regionId} className="w-full h-full min-h-[300px]" />
      <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/50 py-2 mx-4 rounded-full backdrop-blur-sm pointer-events-none">
        Arahkan kamera ke QR Code Siswa
      </div>
    </div>
  );
};

export default Scanner;