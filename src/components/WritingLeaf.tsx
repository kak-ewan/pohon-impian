import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2, Eraser, Check, X, User } from 'lucide-react';
import { Student } from '../types';

interface WritingLeafProps {
  students: Student[];
  finishedStudentIds: string[];
  onSave: (studentId: string, signatureDataUrl: string) => void;
  onCancel: () => void;
  ballColor: string;
}

export default function WritingLeaf({ students, finishedStudentIds, onSave, onCancel, ballColor }: WritingLeafProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const isFinished = (id: string) => finishedStudentIds.includes(id);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 3;
  }, [selectedStudent]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoordinates(e.nativeEvent);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e.nativeEvent);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    if (!selectedStudent || !hasDrawn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(selectedStudent.id, canvas.toDataURL('image/png'));
  };

  if (!selectedStudent) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-3xl flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden"
      >
        <div className="w-full max-w-5xl h-full flex flex-col bg-white/60 rounded-[50px] shadow-2xl border border-white overflow-hidden">
          <div className="p-8 pb-4 flex justify-between items-center bg-white/40 border-b border-white/50">
            <div>
              <h2 className="text-3xl font-black text-green-900 tracking-tighter uppercase leading-none mb-2">Pilih Nama Kamu</h2>
              <p className="text-xs font-black text-green-700/60 uppercase tracking-[0.2em]">Klik foto kamu yang redup untuk mulai menulis harapan</p>
            </div>
            <button 
              onClick={onCancel}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-sm border border-gray-100 transition-all hover:scale-110"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-3">
              {students.map((student) => {
                const done = isFinished(student.id);
                return (
                  <button
                    key={student.id}
                    disabled={done}
                    onClick={() => setSelectedStudent(student)}
                    className={`relative flex flex-col items-center p-2 rounded-xl transition-all group ${
                      done 
                        ? 'bg-green-500 shadow-xl scale-95 opacity-100 cursor-default' 
                        : 'bg-white shadow-sm hover:shadow-xl hover:scale-110 active:scale-95 opacity-40 hover:opacity-100'
                    }`}
                  >
                    {done && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-lg z-10">
                        <Check size={8} className="text-green-500" />
                      </div>
                    )}
                    
                    <div className="relative mb-1">
                      {done && (
                        <div className="absolute inset-0 bg-white/50 rounded-full blur-lg animate-pulse" />
                      )}
                      {student.photoUrl ? (
                        <img 
                          src={student.photoUrl} 
                          alt={student.name} 
                          className={`w-10 h-10 rounded-full object-cover border-2 shadow-md ${done ? 'border-white' : 'border-green-50'}`}
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-md ${done ? 'border-white bg-green-400' : 'border-green-50 bg-green-50'}`}>
                          <User className={`w-5 h-5 ${done ? 'text-white' : 'text-green-300'}`} />
                        </div>
                      )}
                    </div>
                    
                    <span className={`text-[9px] font-black text-center truncate w-full uppercase tracking-tighter ${done ? 'text-white' : 'text-gray-800'}`}>
                      {student.name}
                    </span>
                    {done && (
                      <span className="text-[7px] font-black text-white/60 uppercase tracking-[0.1em] mt-0.5">Sudah Mengirim</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-8 pt-4 bg-white/40 border-t border-white/50 flex justify-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
                <span className="text-[10px] font-black text-green-900 uppercase tracking-widest leading-none">Sudah Menulis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white border border-gray-200 opacity-40 shadow-sm" />
                <span className="text-[10px] font-black text-green-900 uppercase tracking-widest leading-none opacity-40">Belum Menulis</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative flex flex-col items-center w-full h-full justify-center"
    >
      <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/40 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/50 shadow-sm"
        >
          <span className="text-xs font-black text-green-900 uppercase tracking-[0.2em]">
            "aku berharap suatu saat akan"
          </span>
        </motion.div>
      </div>

      <div 
        className="relative w-full aspect-square max-w-[320px] flex flex-col items-center justify-center p-6 shadow-2xl overflow-hidden rounded-full flex-shrink-0"
        style={{ 
          backgroundColor: ballColor 
        }}
      >
        {/* Canvas for writing */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
        
        {/* Floating Tools */}
        <div className="absolute bottom-6 right-6 flex gap-2">
          <button 
            onClick={clearCanvas}
            className="p-2 bg-white/50 backdrop-blur-md rounded-full text-red-600 hover:bg-white transition-colors shadow-lg"
            title="Hapus"
          >
            <Eraser size={18} />
          </button>
        </div>
      </div>

      {/* Controls Below Ball */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-400 rounded-full font-black shadow-lg hover:bg-gray-50 transition-all border-2 border-gray-100 text-xs uppercase"
        >
          <span>Batal</span>
        </button>
        <button
          onClick={handleSave}
          disabled={!hasDrawn}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black shadow-xl transition-all text-xs uppercase tracking-wider ${
            hasDrawn 
              ? 'bg-green-500 text-white hover:bg-green-600 scale-105 active:scale-95' 
              : 'bg-gray-300 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Check size={18} />
          <span>Kirim Bola!</span>
        </button>
      </div>

      {/* Selected Student Badge */}
      <div className="absolute -top-4 left-0 right-0 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl shadow-xl border-2 border-green-50">
          {selectedStudent.photoUrl ? (
            <img src={selectedStudent.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <User className="text-green-500 w-4 h-4" />
            </div>
          )}
          <div>
            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest leading-none mb-0.5">Penulis</p>
            <p className="text-sm font-black text-gray-800 leading-none">{selectedStudent.name}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
