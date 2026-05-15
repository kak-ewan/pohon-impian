export interface Student {
  id: string;
  name: string;
  photoUrl: string;
}

export interface DreamLeaf {
  id: string;
  studentId: string;
  studentName: string;
  signatureDataUrl: string; // The drawing/writing
  timestamp: string;
  color: string;
}

export interface AppSettings {
  accessCode: string; // Kode untuk mulai menulis harapan & akses admin
  appTitle: string;
  appSubtitle: string;
  logoUrl: string;
  students: Student[];
}
