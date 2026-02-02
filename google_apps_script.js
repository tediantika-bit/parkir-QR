// SALIN KODE INI KE EDITOR GOOGLE APPS SCRIPT
// JANGAN LUPA: Lakukan "Deploy" -> "New Deployment" setelah update kode ini.

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = sheet.getSheetByName("Logs");
    var dataSheet = sheet.getSheetByName("DataSiswa");
    
    // Pastikan sheet ada
    if (!dataSheet) {
      dataSheet = sheet.insertSheet("DataSiswa");
      dataSheet.appendRow(["NIS", "Nama", "Kelas", "PunyaSIM"]);
    }
    
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action; // 'checkIn', 'addStudent', 'importStudents'
    
    // === ACTION: CHECK IN (ABSENSI) ===
    if (action === 'checkIn') {
      var nis = String(requestData.nis).trim();
      
      // 1. Cari Data Siswa
      var students = dataSheet.getDataRange().getValues();
      var student = null;
      
      for (var i = 1; i < students.length; i++) {
        if (String(students[i][0]) === nis) {
          student = {
            nis: students[i][0],
            nama: students[i][1],
            kelas: students[i][2],
            punyaSim: students[i][3]
          };
          break;
        }
      }
      
      if (!student) {
        return createResponse({
          success: false,
          code: 'NOT_FOUND',
          message: 'NIS ' + nis + ' tidak terdaftar di database.'
        });
      }

      // 2. Validasi Double Entry
      var logs = logSheet.getDataRange().getValues();
      var today = new Date().toLocaleDateString("id-ID");
      
      for (var j = 1; j < logs.length; j++) {
        var logDate = new Date(logs[j][0]).toLocaleDateString("id-ID");
        var logNis = String(logs[j][1]);
        
        if (logDate === today && logNis === nis) {
          return createResponse({
            success: false,
            code: 'DUPLICATE',
            message: 'Siswa a.n ' + student.nama + ' sudah absen hari ini.'
          });
        }
      }

      // 3. Catat Log
      var now = new Date();
      logSheet.appendRow([now, student.nis, student.nama, student.kelas, 'MASUK']);
      
      return createResponse({
        success: true,
        code: 'SUCCESS',
        message: 'Selamat datang, ' + student.nama,
        data: { student: student, timestamp: now.toISOString() }
      });
    }
    
    // === ACTION: ADD STUDENT (MANUAL SATUAN) ===
    else if (action === 'addStudent') {
      var newStudent = requestData.data; // {nis, nama, kelas, punyaSim}
      var sNis = String(newStudent.nis).trim();
      
      // Cek duplikasi NIS
      var existingData = dataSheet.getDataRange().getValues();
      for (var k = 1; k < existingData.length; k++) {
        if (String(existingData[k][0]) === sNis) {
          return createResponse({
            success: false,
            code: 'DUPLICATE',
            message: 'NIS ' + sNis + ' sudah terdaftar atas nama ' + existingData[k][1]
          });
        }
      }
      
      dataSheet.appendRow([
        sNis, 
        newStudent.nama, 
        newStudent.kelas, 
        newStudent.punyaSim
      ]);
      
      return createResponse({
        success: true,
        code: 'SUCCESS',
        message: 'Data siswa berhasil ditambahkan.'
      });
    }
    
    // === ACTION: IMPORT STUDENTS (MASSAL) ===
    else if (action === 'importStudents') {
      var newStudentsList = requestData.data; // Array of objects
      var existingData = dataSheet.getDataRange().getValues();
      var existingNis = existingData.map(function(r) { return String(r[0]); });
      
      var addedCount = 0;
      var failedCount = 0;
      
      var rowsToAdd = [];
      
      for (var m = 0; m < newStudentsList.length; m++) {
        var s = newStudentsList[m];
        var sNis = String(s.nis).trim();
        
        // Skip jika NIS kosong atau sudah ada
        if (sNis === "" || existingNis.indexOf(sNis) !== -1) {
          failedCount++;
          continue;
        }
        
        rowsToAdd.push([
          sNis,
          s.nama,
          s.kelas,
          s.punyaSim
        ]);
        
        // Update list lokal agar tidak double dalam satu batch
        existingNis.push(sNis);
        addedCount++;
      }
      
      if (rowsToAdd.length > 0) {
        // Tulis sekaligus agar lebih cepat
        dataSheet.getRange(dataSheet.getLastRow() + 1, 1, rowsToAdd.length, 4).setValues(rowsToAdd);
      }
      
      return createResponse({
        success: true,
        code: 'SUCCESS',
        message: 'Import selesai. Berhasil: ' + addedCount + ', Gagal/Duplikat: ' + failedCount
      });
    }

    else {
       return createResponse({
        success: false,
        code: 'ERROR',
        message: 'Action tidak dikenali.'
      });
    }

  } catch (error) {
    return createResponse({
      success: false,
      code: 'ERROR',
      message: 'Server Error: ' + error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}