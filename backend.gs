/**
 * BACKEND GOOGLE APPS SCRIPT
 * 
 * Petunjuk Penggunaan:
 * 1. Buka Google Sheets baru.
 * 2. Klik Menu 'Extensions' -> 'Apps Script'.
 * 3. Hapus semua kode yang ada dan tempelkan kode ini.
 * 4. Klik ikon Simpan (Save).
 * 5. Jalankan fungsi 'setupSheet' (pilih di dropdown atas lalu klik Run) untuk membuat sheet yang diperlukan.
 * 6. Klik tombol 'Deploy' -> 'New Deployment'.
 * 7. Pilih tipe 'Web App'.
 *    - Description: Pohon Impian Backend
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 8. Salin URL Web App yang muncul.
 * 9. Tempelkan URL tersebut ke file 'src/constants.ts' di proyek Anda.
 */

// Fungsi untuk inisialisasi awal (Jalankan sekali di editor Script)
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet Harapan
  var sheetHarapan = ss.getSheetByName("Harapan Siswa") || ss.insertSheet("Harapan Siswa");
  sheetHarapan.clear();
  sheetHarapan.getRange(1, 1, 1, 7).setValues([[
    "ID Harapan", "Timestamp", "Nama Siswa", "URL Foto", "Konten (Base64)", "Status", "ID Siswa"
  ]]).setFontWeight("bold").setBackground("#d9ead3");
  sheetHarapan.setFrozenRows(1);
  sheetHarapan.setColumnWidth(5, 300);

  // Sheet Siswa
  var sheetSiswa = ss.getSheetByName("Daftar Siswa") || ss.insertSheet("Daftar Siswa");
  sheetSiswa.clear();
  sheetSiswa.getRange(1, 1, 1, 3).setValues([[
    "ID Siswa", "Nama Lengkap", "URL Foto"
  ]]).setFontWeight("bold").setBackground("#c9daf8");
  sheetSiswa.setFrozenRows(1);

  // Sheet Pengaturan
  var sheetConfig = ss.getSheetByName("Pengaturan") || ss.insertSheet("Pengaturan");
  sheetConfig.clear();
  sheetConfig.getRange(1, 1, 1, 2).setValues([[
    "Kunci", "Nilai"
  ]]).setFontWeight("bold").setBackground("#fff2cc");
  sheetConfig.setFrozenRows(1);
  
  // Initial default settings
  sheetConfig.getRange(2, 1, 4, 2).setValues([
    ["Judul Aplikasi", "Pohon Impian"],
    ["Subjudul Aplikasi", "Harapan Masa Depanku"],
    ["URL Logo", ""],
    ["Kode Akses", "1234"]
  ]);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var params = JSON.parse(e.postData.contents);
  var action = params.action;
  var data = params.data;
  
  if (action === 'ADD_LEAF') {
    var sheet = ss.getSheetByName("Harapan Siswa") || ss.getSheets()[0];
    sheet.appendRow([
      data.id,
      new Date(),
      data.nama,
      data.foto,
      data.konten,
      'aku berharap suatu saat akan',
      data.studentId
    ]);
  } else if (action === 'DELETE_LEAF') {
    var sheet = ss.getSheetByName("Harapan Siswa");
    if (sheet) {
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] == data.id) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }
  } else if (action === 'SYNC_STUDENTS') {
    var sheet = ss.getSheetByName("Daftar Siswa") || ss.insertSheet("Daftar Siswa");
    sheet.clear();
    sheet.getRange(1, 1, 1, 3).setValues([["ID Siswa", "Nama Lengkap", "URL Foto"]]).setFontWeight("bold");
    
    if (data && data.length > 0) {
      var rows = data.map(function(s) {
        return [s.id, s.name, s.photoUrl || ''];
      });
      sheet.getRange(2, 1, rows.length, 3).setValues(rows);
    }
  } else if (action === 'SYNC_SETTINGS') {
    var sheet = ss.getSheetByName("Pengaturan") || ss.insertSheet("Pengaturan");
    sheet.clear();
    sheet.getRange(1, 1, 1, 2).setValues([["Kunci", "Nilai"]]).setFontWeight("bold");
    
    var rows = [
      ["Judul Aplikasi", data.appTitle || ''],
      ["Subjudul Aplikasi", data.appSubtitle || ''],
      ["URL Logo", data.logoUrl || ''],
      ["Kode Akses", data.accessCode || '']
    ];
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  } else if (action === 'CLEAR_LEAVES') {
    var sheet = ss.getSheetByName("Harapan Siswa");
    if (sheet) {
      // Clear everything below header
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {
    settings: {
      appTitle: 'Pohon Impian',
      appSubtitle: 'Harapan Masa Depanku',
      logoUrl: ''
    },
    students: [],
    leaves: []
  };

  // Get Settings
  var sheetConfig = ss.getSheetByName("Pengaturan");
  if (sheetConfig) {
    var values = sheetConfig.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] === "Judul Aplikasi") data.settings.appTitle = values[i][1];
      if (values[i][0] === "Subjudul Aplikasi") data.settings.appSubtitle = values[i][1];
      if (values[i][0] === "URL Logo") data.settings.logoUrl = values[i][1];
      if (values[i][0] === "Kode Akses") data.settings.accessCode = values[i][1];
    }
  }

  // Get Students
  var sheetSiswa = ss.getSheetByName("Daftar Siswa");
  if (sheetSiswa) {
    var values = sheetSiswa.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      data.students.push({
        id: values[i][0],
        name: values[i][1],
        photoUrl: values[i][2]
      });
    }
  }

  // Get Leaves
  var sheetHarapan = ss.getSheetByName("Harapan Siswa");
  if (sheetHarapan) {
    var values = sheetHarapan.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      data.leaves.push({
        id: values[i][0],
        timestamp: new Date(values[i][1]).getTime(),
        studentName: values[i][2],
        studentPhoto: values[i][3],
        signatureDataUrl: values[i][4],
        status: values[i][5],
        studentId: values[i][6],
        position: { x: Math.random() * 80 + 10, y: Math.random() * 60 + 10 }, // Randomize visually on load
        rotation: Math.random() * 360,
        color: '#fecaca' // Default color
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
