# Pohon Impian (Dream Tree) 3D

Sebuah aplikasi 3D interaktif untuk mengumpulkan dan menampilkan harapan siswa. Dibuat dengan React, Three.js, dan disinkronkan dengan Google Spreadsheet.

## Persiapan Deploy (Vercel/Netlify)

Aplikasi ini menggunakan **Google Apps Script** sebagai backend untuk menyimpan data ke Google Spreadsheet secara gratis.

### 1. Persiapan Google Spreadsheet
1. Buat Google Spreadsheet baru.
2. Buat tiga Sheet dengan nama:
   - `Settings`
   - `Students`
   - `Leaves`
3. Isi header kolom sesuai dengan kode di `backend.gs`.

### 2. Deploy Google Apps Script
1. Di Spreadsheet, buka **Extensions > Apps Script**.
2. Salin isi file `backend.gs` ke jendela Apps Script.
3. Klik **Deploy > New Deployment**.
4. Pilih type **Web App**.
5. Atur "Who has access" menjadi **Anyone**.
6. Salin **Web App URL** yang dihasilkan.

### 3. Konfigurasi Client (Vercel)
Saat melakukan proses `import` di Vercel/GitHub:
1. Masukkan variabel lingkungan berikut:
   - `VITE_APPSCRIPT_URL`: (Masukkan URL Web App dari langkah 2)
2. Deploy!

## Pengembangan Lokal

1. Clone repositori.
2. Jalankan `npm install`.
3. Buat file `.env` dan isi `VITE_APPSCRIPT_URL`.
4. Jalankan `npm run dev`.

## Lisensi
Apache-2.0
