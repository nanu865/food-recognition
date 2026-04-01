import React, { useRef, useState, useCallback } from 'react';
import { Camera as CameraIcon, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';

interface CameraProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export function Camera({ onCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsReady(true);
      }
    } catch (err) {
      setError('Could not access camera. Please check permissions.');
      console.error(err);
    }
  }, []);

  React.useEffect(() => {
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [startCamera]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg');
      onCapture(base64);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
    >
      <div className="relative w-full max-w-2xl aspect-[3/4] bg-neutral-900 overflow-hidden rounded-lg shadow-2xl">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </>
        )}

        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>

        {isReady && (
          <div className="absolute bottom-8 inset-x-0 flex justify-center">
            <button 
              onClick={capture}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-white" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
