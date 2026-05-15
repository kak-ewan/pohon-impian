/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, TreePine, Leaf, Sparkles, MessageCircleHeart, X, Maximize, Minimize, Unlock, Lock, ArrowRight, Eye, EyeOff, CircleDot, RotateCw, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

import WritingLeaf from './components/WritingLeaf.tsx';
import DreamTree3D from './components/DreamTree3D.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import { exportLeavesToPDF } from './lib/pdfExport';
import { Student, DreamLeaf, AppSettings } from './types.ts';
import { APPSCRIPT_URL } from './constants.ts';

const LEAF_COLORS = [
  '#ff4d4d', // vibrant red
  '#ff9f43', // vibrant orange
  '#feca57', // yellow-gold
  '#48dbfb', // sky blue
  '#ff9ff3', // pink
  '#54a0ff', // blue
  '#5f27cd', // violet
  '#1dd1a1', // sea green
  '#ee5253', // red-pink
  '#0abde3', // ocean blue
];

const INITIAL_SETTINGS: AppSettings = {
  accessCode: '1234',
  appTitle: 'Pohon Impian',
  appSubtitle: 'Harapan Masa Depanku',
  logoUrl: '',
  students: []
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('dream_tree_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [leaves, setLeaves] = useState<DreamLeaf[]>(() => {
    const saved = localStorage.getItem('dream_tree_leaves');
    return saved ? JSON.parse(saved) : [];
  });

  const [isWriting, setIsWriting] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedLeaf, setSelectedLeaf] = useState<DreamLeaf | null>(null);
  const [showUI, setShowUI] = useState(true);
  const [currentLeafColor, setCurrentLeafColor] = useState(LEAF_COLORS[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(0.15);

  // Sync from sheet on load
  useEffect(() => {
    const fetchData = async () => {
      if (!APPSCRIPT_URL) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(APPSCRIPT_URL);
        if (response.ok) {
          const data = await response.json();
          // Merge settings
          if (data.settings) {
            setSettings(prev => {
              const newSettings = { 
                ...prev, 
                ...data.settings,
                // Ensure accessCode is prioritized from sheet
                accessCode: data.settings.accessCode || data.settings.adminPasswordHash || prev.accessCode || INITIAL_SETTINGS.accessCode
              };
              localStorage.setItem('dream_tree_settings', JSON.stringify(newSettings));
              return newSettings;
            });
          }
          // Set students
          if (data.students) {
            const sanitizedStudents = data.students.map((s: any) => ({
              ...s,
              id: String(s.id)
            }));
            setSettings(prev => {
              const newSettings = { ...prev, students: sanitizedStudents };
              localStorage.setItem('dream_tree_settings', JSON.stringify(newSettings));
              return newSettings;
            });
          }
          // Set leaves
          if (data.leaves) {
            const sanitizedLeaves = data.leaves.map((l: any) => ({
              ...l,
              id: String(l.id),
              studentId: String(l.studentId || '')
            }));
            setLeaves(sanitizedLeaves);
            localStorage.setItem('dream_tree_leaves', JSON.stringify(sanitizedLeaves));
          }
        }
      } catch (err) {
        console.error('Failed to sync with Google Sheet on load:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter students who haven't written a hope yet
  const availableStudents = settings.students.filter(
    student => !leaves.some(leaf => leaf.studentId === student.id)
  );

  const toggleFullscreen = () => {
    try {
      const doc = document as any;
      const element = document.documentElement as any;

      if (!isFullscreen) {
        const requestMethod = 
          element.requestFullscreen || 
          element.webkitRequestFullscreen || 
          element.mozRequestFullScreen || 
          element.msRequestFullscreen;

        if (requestMethod) {
          requestMethod.call(element).catch((err: any) => {
            console.error(`Fullscreen failed: ${err.message}`);
          });
          setIsFullscreen(true);
        }
      } else {
        const exitMethod = 
          doc.exitFullscreen || 
          doc.webkitExitFullscreen || 
          doc.mozCancelFullScreen || 
          doc.msExitFullscreen;
        
        if (exitMethod) {
          exitMethod.call(doc);
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error("Fullscreen toggle error:", error);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('dream_tree_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('dream_tree_leaves', JSON.stringify(leaves));
  }, [leaves]);

  const handleStartWriting = () => {
    const randomColor = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
    setCurrentLeafColor(randomColor);
    setIsWriting(true);
  };

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (authInput === settings.accessCode) {
      setIsAuthorized(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      // Shake effect or feedback
      setTimeout(() => setAuthError(false), 500);
    }
  };

  const handleSaveLeaf = async (studentId: string, signatureDataUrl: string) => {
    const student = settings.students.find(s => s.id === studentId);
    if (!student) return;

    const newLeaf: DreamLeaf = {
      id: Date.now().toString(),
      studentId,
      studentName: student.name,
      signatureDataUrl,
      timestamp: new Date().toISOString(),
      color: currentLeafColor
    };

    setLeaves(prev => [...prev, newLeaf]);
    setIsWriting(false);

    // Festive effect
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: LEAF_COLORS
    });

    // Send to AppScript directly
    if (!APPSCRIPT_URL) {
      return;
    }
    try {
      await fetch(APPSCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ADD_LEAF',
          data: {
            id: newLeaf.id,
            nama: student.name,
            foto: student.photoUrl,
            konten: signatureDataUrl,
            timestamp: newLeaf.timestamp,
            studentId
          }
        })
      });
    } catch (err) {
      console.error('Failed to sync with Spreadsheet:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans relative">
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center"
          >
            <div className="relative mb-8">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 bg-green-50 rounded-[30px] flex items-center justify-center shadow-lg border-2 border-green-100"
              >
                <TreePine className="text-green-500 w-12 h-12" />
              </motion.div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-bounce shadow-md flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-green-800 tracking-tight uppercase mb-2">Memuat Data</h2>
            <p className="text-sm font-bold text-green-600 animate-pulse uppercase tracking-[0.2em]">Sinkronisasi data...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background 3D Scene */}
      <DreamTree3D leaves={leaves} onLeafClick={setSelectedLeaf} rotationSpeed={rotationSpeed} />

      {/* Access Code Modal */}
      <AnimatePresence>
        {!isAuthorized && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-white/20 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ 
                scale: 1, 
                y: 0,
                x: authError ? [0, -10, 10, -10, 10, 0] : 0
              }}
              className="bg-white rounded-[50px] shadow-2xl p-10 w-full max-w-md flex flex-col items-center border border-white"
            >
              <div className="w-20 h-20 bg-green-50 rounded-[30px] flex items-center justify-center mb-6 shadow-sm border border-green-100 rotate-6">
                <Lock className="text-green-600 w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-green-950 mb-2 uppercase tracking-tighter text-center">Masukkan Kode</h2>
              <p className="text-green-800/60 text-xs font-black uppercase tracking-widest mb-8 text-center leading-relaxed">
                Silahkan minta kode akses ke Bapak/Ibu Guru untuk mulai menulis harapan.
              </p>
              
              <form onSubmit={handleAuthorize} className="w-full">
                <div className="relative mb-4">
                  <input 
                    type="password"
                    value={authInput}
                    onChange={(e) => setAuthInput(e.target.value)}
                    placeholder="Ketik Kode Di Sini..."
                    className="w-full px-8 py-5 rounded-3xl bg-green-50 border-2 border-green-100 text-center text-2xl font-black text-green-900 focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all placeholder:text-green-200"
                    autoFocus
                  />
                  {authError && (
                    <p className="mt-4 text-center text-red-500 text-xs font-black uppercase tracking-widest animate-pulse">Kode Salah! Coba Lagi.</p>
                  )}
                </div>
                <button 
                  type="submit"
                  className="w-full py-5 bg-green-500 hover:bg-green-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                >
                  <span>Masuk</span>
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Header Overlay */}
      <AnimatePresence>
        {showUI && (
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 h-24 px-8 flex justify-end items-center z-[60] pointer-events-none"
          >
            {/* Center Logo & Title */}
            <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col items-center gap-2 bg-white/40 backdrop-blur-md px-8 py-3 rounded-3xl border border-white/50 pointer-events-auto shadow-sm min-w-[280px]">
          {settings.logoUrl ? (
            <div className="w-10 h-10 bg-white rounded-lg shadow-md overflow-hidden flex items-center justify-center border border-white/50 p-1">
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center rotate-3">
              <TreePine className="text-green-500" size={20} />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-xl font-black text-green-900 tracking-tight leading-none uppercase">{settings.appTitle || 'Pohon Impian'}</h1>
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mt-1 opacity-80">{settings.appSubtitle || 'Harapan Masa Depanku'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm pointer-events-auto">
            <MessageCircleHeart className="text-red-400 animate-pulse" size={20} />
            <span className="text-sm font-black text-green-900 uppercase tracking-tight">
              {leaves.length} Harapan
            </span>
          </div>

          <div className="flex gap-2 pointer-events-auto items-center">
            {/* Rotation Speed Control - Integrated into header */}
            <div className="hidden sm:flex items-center gap-3 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/40 shadow-sm transition-all hover:bg-white/60">
              <RotateCw 
                size={14} 
                className={`text-green-800 ${rotationSpeed > 0 ? "animate-spin" : ""}`} 
                style={{ animationDuration: `${2 / (rotationSpeed || 1)}s` }} 
              />
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={rotationSpeed} 
                onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                className="w-20 h-1 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
            </div>

            <button 
              onClick={() => exportLeavesToPDF(leaves, settings)}
              className="p-3 bg-white/40 backdrop-blur-md rounded-full text-green-900 hover:bg-white/60 transition-all border border-white/50 shadow-sm group"
              title="Ekspor PDF Harapan"
            >
              <FileText size={20} className="group-hover:scale-110 transition-transform" />
            </button>

            <button 
              onClick={() => setIsAdminOpen(true)}
              className="p-3 bg-white/40 backdrop-blur-md rounded-full text-green-900 hover:bg-white/60 transition-all border border-white/50 shadow-sm group"
              title="Admin Panel"
            >
              <SettingsIcon size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </motion.header>
      )}
      </AnimatePresence>

      {/* Main Interaction Overlay */}
      <AnimatePresence>
        {showUI && (
          <motion.main 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-end z-50 p-8 md:p-16 lg:p-24"
          >
            <div className="w-full max-w-sm pointer-events-auto flex flex-col items-center">
              <AnimatePresence mode="wait">
                {!isWriting ? (
                  <motion.div 
                    key="welcome-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex flex-col items-center text-center w-full bg-white/20 backdrop-blur-xl p-8 rounded-[40px] border border-white/30 shadow-2xl"
                  >
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-green-200 rounded-full blur-2xl opacity-50 animate-pulse scale-150" />
                  <div className="relative w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center rotate-6 border-2 border-green-50">
                    <Sparkles className="text-yellow-400 w-8 h-8" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-green-950 mb-2 uppercase tracking-tighter">
                  <span className="text-green-600">Tuliskan</span> Harapanmu
                </h2>
                <p className="text-green-900/60 mb-6 text-[10px] font-bold leading-relaxed max-w-[320px] uppercase tracking-[0.2em] opacity-80">
                  Tempelkan harapanmu di pohon impian!
                </p>
                <button
                  onClick={handleStartWriting}
                  disabled={availableStudents.length === 0}
                  className={`group relative flex items-center gap-4 px-10 py-5 rounded-3xl font-black text-lg shadow-2xl transition-all active:scale-95 ${
                    availableStudents.length > 0 
                      ? 'bg-green-500 text-white shadow-green-200 hover:bg-green-600 hover:scale-105' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <CircleDot className="group-hover:scale-110 transition-transform w-6 h-6" />
                  <span>{availableStudents.length > 0 ? 'Ambil Bola Harapan' : 'Sudah Semua'}</span>
                </button>
                {availableStudents.length === 0 && (
                  <p className="mt-4 text-[10px] font-black text-green-700 bg-white/40 px-5 py-2 rounded-full border border-green-200 uppercase tracking-widest shadow-sm">
                    Pohon sudah penuh dengan harapan! 🌳✨
                  </p>
                )}
              </motion.div>
            ) : (
              <WritingLeaf 
                students={settings.students}
                finishedStudentIds={leaves.map(l => l.studentId)}
                ballColor={currentLeafColor}
                onSave={handleSaveLeaf}
                onCancel={() => setIsWriting(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.main>
      )}
      </AnimatePresence>

      {/* Bottom Right Controls */}
      <div className="fixed bottom-8 right-8 z-[70] flex flex-col gap-4">
        {/* Toggle UI */}
        <button 
          onClick={() => setShowUI(!showUI)}
          className="w-14 h-14 bg-white/80 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center text-green-700 hover:text-green-900 transition-all hover:scale-110 active:scale-90 border border-white"
          title={showUI ? "Hide UI" : "Show UI"}
        >
          {showUI ? <EyeOff size={24} /> : <Eye size={24} />}
        </button>

        <AnimatePresence>
          {showUI && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="flex flex-col gap-4 items-end"
            >
              <button 
                onClick={toggleFullscreen}
                className="w-14 h-14 bg-white/80 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center text-green-700 hover:text-green-900 transition-all hover:scale-110 active:scale-90 border border-white"
              >
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Leaf Detail Modal */}
      <AnimatePresence>
        {selectedLeaf && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
              className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden relative border-8 border-white"
              style={{ backgroundColor: selectedLeaf.color }}
            >
              <button 
                onClick={() => setSelectedLeaf(null)}
                className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-xl text-gray-800 shadow-sm z-10 transition-colors"
              >
                <X size={20} />
              </button>
 
              <div className="p-8 flex flex-col items-center">
                <div className="mb-10 text-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 opacity-70">Harapan dari</p>
                  <h3 className="text-3xl font-black text-gray-800 tracking-tight leading-none uppercase">{selectedLeaf.studentName}</h3>
                </div>
 
                <div className="w-full aspect-square max-w-[280px] bg-white/40 rounded-full flex items-center justify-center p-8 shadow-inner relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-xl shadow-md border border-white/50 whitespace-nowrap">
                      <p className="text-[10px] font-black text-green-900 uppercase tracking-[0.2em]">
                        "Suatu saat nanti, aku akan..."
                      </p>
                    </div>
                  </div>
                  <img src={selectedLeaf.signatureDataUrl} alt="" className="w-full h-full object-contain pointer-events-none relative z-10" />
                </div>
 
                <div className="mt-8 flex items-center gap-2 text-gray-500 font-bold uppercase tracking-wider text-[8px] opacity-60">
                  <Sparkles size={10} className="text-yellow-500" />
                  <span>Dibuat pada {new Date(selectedLeaf.timestamp).toLocaleString('id-ID')}</span>
                  <Sparkles size={10} className="text-yellow-500" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPanel 
            settings={settings}
            leaves={leaves}
            onUpdateSettings={setSettings}
            onUpdateLeaves={setLeaves}
            onClose={() => setIsAdminOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
