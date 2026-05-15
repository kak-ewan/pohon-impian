import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, X, Plus, Trash2, Key, Users, Save, CircleDot, FileText } from 'lucide-react';
import { Student, AppSettings, DreamLeaf } from '../types';
import { APPSCRIPT_URL } from '../constants';
import { jsPDF } from 'jspdf';
import { exportLeavesToPDF } from '../lib/pdfExport';

interface AdminPanelProps {
  settings: AppSettings;
  leaves: DreamLeaf[];
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateLeaves: (leaves: DreamLeaf[]) => void;
  onClose: () => void;
}

export default function AdminPanel({ settings, leaves, onUpdateSettings, onUpdateLeaves, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'students' | 'leaves' | 'password'>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [localLeaves, setLocalLeaves] = useState<DreamLeaf[]>(leaves);
  const [newStudent, setNewStudent] = useState({ name: '', photoUrl: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === localSettings.accessCode) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Password salah!');
    }
  };

  const addStudent = () => {
    if (!newStudent.name) return;
    const student: Student = {
      id: Date.now().toString(),
      name: newStudent.name,
      photoUrl: newStudent.photoUrl
    };
    setLocalSettings(prev => ({
      ...prev,
      students: [...prev.students, student]
    }));
    setNewStudent({ name: '', photoUrl: '' });
  };

  const removeStudent = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id)
    }));
    setDeleteConfirmId(null);
  };

  const clearAllStudents = () => {
    setLocalSettings(prev => ({ ...prev, students: [] }));
    setDeleteConfirmId(null);
  };

  const removeLeaf = async (id: string) => {
    setLocalLeaves(prev => prev.filter(leaf => leaf.id !== id));
    setDeleteConfirmId(null);

    // Sync deletion to sheet
    if (!APPSCRIPT_URL) return;
    try {
      await fetch(APPSCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_LEAF',
          data: { id }
        })
      });
    } catch (err) {
      console.error('Failed to sync individual leaf deletion:', err);
    }
  };

  const handleExportPDF = () => {
    exportLeavesToPDF(localLeaves, localSettings);
  };

  const handleSyncToSheet = async () => {
    if (!APPSCRIPT_URL) {
      setError('APP SCRIPT URL belum diatur. Sinkronisasi dinonaktifkan.');
      setIsSyncing(false);
      return;
    }
    setIsSyncing(true);
    try {
      // Sync students
      await fetch(APPSCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'SYNC_STUDENTS',
          data: localSettings.students
        })
      });

      // Sync general settings
      await fetch(APPSCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'SYNC_SETTINGS',
          data: {
            appTitle: localSettings.appTitle,
            appSubtitle: localSettings.appSubtitle,
            logoUrl: localSettings.logoUrl,
            accessCode: localSettings.accessCode
          }
        })
      });
    } catch (err) {
      console.error('Failed to sync to sheet:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveAll = async () => {
    await handleSyncToSheet();
    onUpdateSettings(localSettings);
    onUpdateLeaves(localLeaves);
    onClose();
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.form 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onSubmit={handleLogin}
          className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl overflow-hidden relative"
        >
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Key className="text-blue-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Panel Admin</h2>
            <p className="text-gray-500 mb-8">Masukan kode akses untuk melanjutkan</p>
            
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Kode Akses"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-colors mb-2"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mb-4 font-medium">{error}</p>}
            
            <button
              type="submit"
              className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
            >
              Masuk
            </button>
          </div>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Settings className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Administrator Dashboard</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveAll}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${isSyncing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
            >
              {isSyncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Simpan Perubahan
                </>
              )}
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeTab === 'general' ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-white'}`}
            >
              <Settings size={20} />
              Pengaturan Umum
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeTab === 'students' ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-white'}`}
            >
              <Users size={20} />
              Manajemen Siswa
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeTab === 'leaves' ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-white'}`}
            >
              <CircleDot size={20} />
              Daftar Bola Harapan
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeTab === 'password' ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-white'}`}
            >
              <Key size={20} />
              Ganti Password/Kode
            </button>
          </div>

          {/* Main Area */}
          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'general' && (
              <div className="max-w-2xl space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Settings className="text-blue-500" size={24} />
                    Identitas Aplikasi
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Judul Aplikasi</label>
                    <input
                      type="text"
                      value={localSettings.appTitle}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, appTitle: e.target.value }))}
                      placeholder="Contoh: Pohon Impian"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-400 italic ml-1">Judul yang muncul di header dan halaman utama.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Subjudul Aplikasi</label>
                    <input
                      type="text"
                      value={localSettings.appSubtitle}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, appSubtitle: e.target.value }))}
                      placeholder="Contoh: Harapan Masa Depanku"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-400 italic ml-1">Teks kecil di bawah judul.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1 text-green-600">Kode Akses Siswa (PENTING)</label>
                    <input
                      type="text"
                      value={localSettings.accessCode}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, accessCode: e.target.value }))}
                      placeholder="Contoh: 1234"
                      className="w-full px-4 py-3 rounded-xl border-2 border-green-100 focus:border-green-500 outline-none transition-colors font-mono font-bold text-green-800"
                    />
                    <p className="text-xs text-gray-400 italic ml-1">Para siswa harus memasukkan kode ini sebelum dapat menulis di pohon.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">URL Logo Sekolah</label>
                    <input
                      type="text"
                      value={localSettings.logoUrl}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-400 italic ml-1">Gunakan URL gambar (gambar akan menggantikan ikon pohon di header).</p>
                    
                    {localSettings.logoUrl && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Preview Logo</span>
                        <div className="w-24 h-24 bg-white rounded-xl shadow-md overflow-hidden flex items-center justify-center p-2">
                          <img src={localSettings.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
                  <h3 className="font-bold text-blue-800 mb-4 text-lg">Tambah Siswa Baru</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-blue-600 ml-1">Nama Lengkap</label>
                      <input
                        type="text"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full px-4 py-3 rounded-xl border-2 border-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-blue-600 ml-1">URL Foto (Opsional)</label>
                      <input
                        type="text"
                        value={newStudent.photoUrl}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, photoUrl: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addStudent}
                    className="mt-4 flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-md active:scale-95"
                  >
                    <Plus size={20} />
                    Tambah Data Siswa
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                      Daftar Siswa 
                      <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full uppercase tracking-wider">{localSettings.students.length} Total</span>
                    </h3>
                    {localSettings.students.length > 0 && (
                      <div className="flex items-center gap-2">
                        {deleteConfirmId === 'clear-students' ? (
                          <div className="flex items-center gap-2 bg-red-50 p-1 rounded-lg border border-red-100 animate-in slide-in-from-right-1">
                            <span className="text-[10px] font-bold text-red-600 px-1">Hapus Semua?</span>
                            <button 
                              onClick={clearAllStudents}
                              className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-md font-bold hover:bg-red-600 transition-colors"
                            >
                              Ya
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              className="bg-gray-200 text-gray-700 text-[10px] px-2 py-1 rounded-md font-bold hover:bg-gray-300 transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeleteConfirmId('clear-students')}
                            className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors border border-red-100"
                          >
                            <Trash2 size={14} />
                            Hapus Semua Siswa
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {localSettings.students.map((student) => (
                      <div key={student.id} className="flex items-center gap-3 p-4 bg-white border-2 border-gray-100 rounded-2xl group relative overflow-hidden transition-all hover:border-blue-200">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center border-2 border-gray-50 shadow-sm">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="text-gray-300" size={24} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 truncate">{student.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate uppercase">{student.id}</p>
                        </div>
                        
                        {deleteConfirmId === `student-${student.id}` ? (
                          <div className="flex items-center gap-1 animate-in slide-in-from-right-1">
                            <button 
                              onClick={() => removeStudent(student.id)}
                              className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-md font-bold"
                            >
                              Ya
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-md font-bold"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(`student-${student.id}`)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leaves' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                    Bola Harapan Siswa yang Tumbuh
                    <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full uppercase tracking-wider">{localLeaves.length} Total</span>
                  </h3>
                  {localLeaves.length > 0 && (
                    <div className="flex items-center gap-2">
                       <button 
                          onClick={handleExportPDF}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors border border-blue-100"
                        >
                          <FileText size={14} />
                          Ekspor PDF
                        </button>
                       {deleteConfirmId === 'clear-leaves' ? (
                          <div className="flex items-center gap-2 bg-red-50 p-1 rounded-lg border border-red-100 animate-in slide-in-from-right-1">
                            <span className="text-[10px] font-bold text-red-600 px-1">Bersihkan?</span>
                            <button 
                              onClick={async () => { 
                                setLocalLeaves([]); 
                                setDeleteConfirmId(null); 
                                // Sync to sheet
                                if (!APPSCRIPT_URL) return;
                                try {
                                  await fetch(APPSCRIPT_URL, {
                                    method: 'POST',
                                    mode: 'no-cors',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      action: 'CLEAR_LEAVES'
                                    })
                                  });
                                } catch (err) {
                                  console.error('Failed to sync clear action:', err);
                                }
                              }}
                              className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-md font-bold hover:bg-red-600 transition-colors"
                            >
                              Ya
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              className="bg-gray-200 text-gray-700 text-[10px] px-2 py-1 rounded-md font-bold hover:bg-gray-300 transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeleteConfirmId('clear-leaves')}
                            className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors border border-red-100"
                          >
                            <Trash2 size={14} />
                            Bersihkan Semua Harapan
                          </button>
                        )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {localLeaves.map((leaf) => (
                    <div key={leaf.id} className="flex flex-col p-4 bg-white border-2 border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full" style={{ backgroundColor: leaf.color }} />
                          <div>
                            <p className="font-bold text-gray-800">{leaf.studentName}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Harapan dibuat pada: {new Date(leaf.timestamp).toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                        
                        {deleteConfirmId === `leaf-${leaf.id}` ? (
                          <div className="flex items-center gap-1 animate-in slide-in-from-right-1">
                            <button 
                              onClick={() => removeLeaf(leaf.id)}
                              className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-md font-bold"
                            >
                              Ya
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-md font-bold"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(`leaf-${leaf.id}`)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                      <div className="w-full aspect-video bg-gray-50 rounded-2xl overflow-hidden shadow-inner border border-gray-100 flex items-center justify-center p-4">
                        <img src={leaf.signatureDataUrl} alt="" className="max-w-full max-h-full object-contain" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="max-w-md space-y-6">
                <h3 className="font-bold text-gray-800 text-lg">Ganti Password Akses</h3>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Password/Kode Baru</label>
                  <input
                    type="text"
                    value={localSettings.accessCode}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, accessCode: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none font-mono font-black text-blue-700"
                  />
                  <p className="text-xs text-gray-400 leading-relaxed italic">
                    Password ini digunakan UNTUK KEDUA HAL: panel admin dan akses masuk siswa untuk menulis harapan. Simpan kredensial ini baik-baik.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
