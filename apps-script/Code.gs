/**
 * ============================================================================
 * SISTEM INFORMASI PELAPORAN KEGIATAN KOKURIKULER
 * SMA DARUL ULUM KEPOHBARU - BOJONEGORO (TAHUN 2026)
 * Tema: Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno, Blitar
 * ============================================================================
 * CARA KONFIGURASI DI GOOGLE APPS SCRIPT:
 * 1. Buka Google Sheets baru (atau buka script.google.com > New Project).
 * 2. Pada Google Sheets: klik menu Extensions > Apps Script.
 * 3. Ganti isi file Code.gs dengan seluruh kode ini.
 * 4. Tambahkan file HTML baru bernama "Index" (File > New > HTML file -> Index)
 *    lalu tempelkan seluruh isi file Index.html.
 * 5. Simpan (Ctrl+S), lalu klik Deploy > New deployment > Select type: Web app.
 *    - Execute as: Me (akun Google Anda)
 *    - Who has access: Anyone (Siapa saja)
 * 6. Klik Deploy & berikan izin akses (Google Sheets & Google Drive).
 * 7. Buka URL Web App -> Login default: Username "Admin", Password "Admin".
 * ============================================================================
 */

var APP_TITLE = 'Sistem Pelaporan Kokurikuler - SMA Darul Ulum Kepohbaru';
var MAIN_ACTIVITY_ID = 'kokurikuler-2026';
var DRIVE_FOLDER_NAME = 'Kokurikuler_SMA_Darul_Ulum_2026';
var TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

var SHEET_DEFS = {
  SchoolProfile: [
    'id', 'schoolName', 'npsn', 'address', 'district', 'regency', 'province',
    'postalCode', 'phone', 'email', 'website', 'principalName', 'principalNip',
    'academicYear', 'updatedBy', 'createdAt', 'updatedAt'
  ],
  Activity: [
    'id', 'name', 'theme', 'year', 'background', 'purpose', 'legalBasis',
    'dayDate', 'departureTime', 'destination', 'destinationAddress',
    'personInCharge', 'chiefExecutive', 'companionTeachersSummary',
    'participantCountTarget', 'fundingSource', 'status', 'createdBy',
    'createdAt', 'updatedAt'
  ],
  Users: [
    'id', 'uid', 'username', 'displayName', 'email', 'role', 'nipOrNisn',
    'className', 'phone', 'status', 'passwordHash', 'createdAt', 'updatedAt'
  ],
  Students: [
    'id', 'activityId', 'nis', 'name', 'className', 'gender', 'parentPhone',
    'participationStatus', 'busGroup', 'notes', 'createdBy', 'createdAt', 'updatedAt'
  ],
  Teachers: [
    'id', 'activityId', 'name', 'nipNuptk', 'position', 'mentoringTask',
    'phone', 'createdBy', 'createdAt', 'updatedAt'
  ],
  Schedules: [
    'id', 'activityId', 'orderNo', 'timeRange', 'activityTitle', 'location',
    'personInCharge', 'notes', 'createdBy', 'createdAt', 'updatedAt'
  ],
  Journals: [
    'id', 'activityId', 'date', 'time', 'location', 'description',
    'attendeesCount', 'condition', 'companionNotes', 'obstacles', 'solutions',
    'authorUid', 'authorName', 'createdAt', 'updatedAt'
  ],
  Documentation: [
    'id', 'activityId', 'title', 'caption', 'mediaType', 'category',
    'capturedDate', 'location', 'fileUrl', 'fileName', 'isAllowedForStudent',
    'uploadedByUid', 'uploadedByName', 'createdAt', 'updatedAt'
  ],
  Reflections: [
    'id', 'activityId', 'studentUid', 'studentName', 'className',
    'newKnowledge', 'historicalValues', 'soekarnoExemplar',
    'memorableExperience', 'nationalismApplication', 'learningConclusion',
    'teacherScore', 'teacherFeedback', 'reviewStatus', 'reviewedByUid',
    'reviewedByName', 'createdAt', 'updatedAt'
  ],
  LkpdSubmissions: [
    'id', 'activityId', 'studentUid', 'studentName', 'className',
    'groupName', 'members', 'sejarah1', 'sejarah2', 'pkn1', 'pkn2',
    'bahasa1', 'bahasa2', 'ekonomi1', 'ekonomi2', 'pai1', 'pai2',
    'geografi1', 'geografi2', 'teacherScore', 'teacherFeedback',
    'reviewStatus', 'reviewedByUid', 'reviewedByName', 'createdAt', 'updatedAt'
  ],
  Evaluations: [
    'id', 'activityId', 'goalAlignment', 'studentParticipationLevel',
    'participantDiscipline', 'activitySuccessRate', 'supportingFactors',
    'obstacles', 'solutions', 'recommendations', 'evaluatorUid',
    'evaluatorName', 'createdAt', 'updatedAt'
  ],
  Reports: [
    'id', 'activityId', 'title', 'reportNumber', 'academicYear', 'status',
    'bab1Background', 'bab1Basis', 'bab1Purpose', 'bab1Benefits',
    'bab2Identity', 'bab2ScheduleTimePlace', 'bab2ParticipantsSummary',
    'bab2TeachersSummary', 'bab2ExecutionNarrative', 'bab3VisitResults',
    'bab3StudentObservations', 'bab3NationalismValues', 'bab3ReflectionSummary',
    'bab4Evaluation', 'bab4SupportingFactors', 'bab4ObstaclesSolutions',
    'bab4Recommendations', 'bab5Conclusion', 'bab5Suggestions',
    'authorUid', 'authorName', 'createdAt', 'updatedAt'
  ],
  Approvals: [
    'id', 'activityId', 'reportId', 'reportTitle', 'status', 'decisionNotes',
    'approverUid', 'approverName', 'approverNip', 'createdAt', 'updatedAt'
  ],
  Archives: [
    'id', 'activityId', 'category', 'title', 'documentNumber', 'documentDate',
    'description', 'fileUrl', 'fileName', 'uploadedByUid', 'uploadedByName',
    'createdAt', 'updatedAt'
  ],
  AuditLogs: [
    'id', 'action', 'module', 'targetId', 'summary', 'actorUid',
    'actorName', 'actorRole', 'createdAt'
  ]
};

/**
 * Entry point Web App Google Apps Script
 */
function doGet() {
  ensureDatabaseInitialized_();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Menu opsional saat script menempel pada Google Sheets
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Kokurikuler SMA DU')
      .addItem('Inisialisasi / Perbaiki Sheet Database', 'setupDatabase')
      .addToUi();
  } catch (e) {
    // Abaikan jika dijalankan sebagai standalone script
  }
}

function setupDatabase() {
  var ss = ensureDatabaseInitialized_();
  return { ok: true, spreadsheetUrl: ss.getUrl(), spreadsheetId: ss.getId() };
}

/**
 * Mendapatkan atau membuat Google Spreadsheet sebagai database utama
 */
function getSpreadsheet_() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    ss = null;
  }
  if (ss) return ss;

  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty('SPREADSHEET_ID');
  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (err) {
      // Spreadsheet tidak ditemukan, buat baru di bawah
    }
  }

  var created = SpreadsheetApp.create('DB Kokurikuler SMA Darul Ulum 2026');
  props.setProperty('SPREADSHEET_ID', created.getId());
  return created;
}

/**
 * Memastikan seluruh tab sheet tersedia dan terisi data awal jika masih kosong
 */
function ensureDatabaseInitialized_() {
  var ss = getSpreadsheet_();
  var sheetNames = Object.keys(SHEET_DEFS);

  for (var i = 0; i < sheetNames.length; i++) {
    var name = sheetNames[i];
    var sheet = ss.getSheetByName(name);
    var headers = SHEET_DEFS[name];
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    } else if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }
  }

  // Hapus Sheet1 bawaan jika kosong dan tabel lain sudah ada
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0 && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }

  // Seed default Super Admin (Admin / Admin) jika sheet Users kosong
  var usersRows = readSheetObjects_(ss, 'Users');
  if (usersRows.length === 0) {
    var now = new Date().toISOString();
    appendObjectToSheet_(ss, 'Users', {
      id: 'local-admin',
      uid: 'local-admin',
      username: 'Admin',
      displayName: 'Administrator Sekolah',
      email: 'admin@smadarululum-kepohbaru.sch.id',
      role: 'SUPER_ADMIN',
      nipOrNisn: '-',
      className: '',
      phone: '',
      status: 'active',
      passwordHash: hashPassword_('Admin'),
      createdAt: now,
      updatedAt: now
    });
  }

  // Seed SchoolProfile & Activity awal jika masih kosong
  if (readSheetObjects_(ss, 'SchoolProfile').length === 0) {
    seedInitialSchoolData_(ss);
  }

  return ss;
}

function seedInitialSchoolData_(ss) {
  var now = new Date().toISOString();

  appendObjectToSheet_(ss, 'SchoolProfile', {
    id: 'main',
    schoolName: 'SMA Darul Ulum Kepohbaru',
    npsn: '20541289',
    address: 'Jl. Raya Kepohbaru No. 45, Desa Kepoh',
    district: 'Kepohbaru',
    regency: 'Bojonegoro',
    province: 'Jawa Timur',
    postalCode: '62194',
    phone: '(0353) 331452',
    email: 'info@smadarululum-kepohbaru.sch.id',
    website: 'https://smadarululum-kepohbaru.sch.id',
    principalName: 'Drs. H. Ahmad Muhajir, M.Pd.',
    principalNip: '196805141994031007',
    academicYear: '2025/2026',
    updatedBy: 'local-admin',
    createdAt: now,
    updatedAt: now
  });

  appendObjectToSheet_(ss, 'Activity', {
    id: MAIN_ACTIVITY_ID,
    name: 'Kegiatan Kokurikuler Kunjungan Edukatif Sejarah Kebangsaan Tahun 2026',
    theme: 'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno, Presiden Pertama Republik Indonesia',
    year: 2026,
    background: 'Pembelajaran sejarah dan pendidikan karakter kebangsaan menuntut pengalaman belajar kontekstual di luar ruang kelas. Melalui kunjungan edukatif ke Makam dan Museum Ir. Soekarno di Kota Blitar, peserta didik SMA Darul Ulum Kepohbaru - Bojonegoro diharapkan memahami langsung perjuangan Proklamator Kemerdekaan Republik Indonesia.',
    purpose: '1. Memperkuat pemahaman sejarah perjuangan kemerdekaan Indonesia dan peran Ir. Soekarno.\n2. Menumbuhkan sikap nasionalisme, cinta tanah air, dan tanggung jawab kebangsaan.\n3. Mengintegrasikan pembelajaran kokurikuler lintas mata pelajaran melalui observasi lapangan, LKPD, dan refleksi.',
    legalBasis: '1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional.\n2. Permendikbudristek tentang Kurikulum Merdeka dan Penguatan Profil Pelajar Pancasila.\n3. Program Kerja Kurikulum SMA Darul Ulum Kepohbaru Tahun Pelajaran 2025/2026.',
    dayDate: 'Sabtu, 14 Februari 2026',
    departureTime: '05.30 WIB (Halaman SMA Darul Ulum Kepohbaru)',
    destination: 'Kompleks Makam dan Museum Perpustakaan Nasional Bung Karno',
    destinationAddress: 'Jl. Kalasan No. 1, Bendogerit, Kec. Sananwetan, Kota Blitar, Jawa Timur',
    personInCharge: 'Drs. H. Ahmad Muhajir, M.Pd. (Kepala Sekolah)',
    chiefExecutive: 'M. Syafi\'i, S.Pd., M.Pd.',
    companionTeachersSummary: '10 Guru Pendamping & Wali Kelas X, XI, XII',
    participantCountTarget: 120,
    fundingSource: 'Komite Sekolah, Dana BOS Pendamping, dan Kontribusi Mandiri Peserta Didik',
    status: 'Berjalan',
    createdBy: 'local-admin',
    createdAt: now,
    updatedAt: now
  });

  var sampleStudents = [
    { id: 'siswa-1', nis: '20261001', name: 'Ahmad Zaki Al-Farizi', className: 'XI IPA 1', gender: 'L', parentPhone: '081330110001', participationStatus: 'Hadir', busGroup: 'Bus 1' },
    { id: 'siswa-2', nis: '20261002', name: 'Nayla Putri Azzahra', className: 'XI IPA 1', gender: 'P', parentPhone: '081330110002', participationStatus: 'Hadir', busGroup: 'Bus 1' },
    { id: 'siswa-3', nis: '20261003', name: 'Muhammad Rizqi Pratama', className: 'XI IPS 1', gender: 'L', parentPhone: '081330110003', participationStatus: 'Hadir', busGroup: 'Bus 2' },
    { id: 'siswa-4', nis: '20261004', name: 'Siti Nur Halimah', className: 'XI IPS 2', gender: 'P', parentPhone: '081330110004', participationStatus: 'Terdaftar', busGroup: 'Bus 2' },
    { id: 'siswa-5', nis: '20261005', name: 'Dimas Aditya Saputra', className: 'X-A', gender: 'L', parentPhone: '081330110005', participationStatus: 'Hadir', busGroup: 'Bus 3' },
    { id: 'siswa-6', nis: '20261006', name: 'Aulia Rahmawati', className: 'X-B', gender: 'P', parentPhone: '081330110006', participationStatus: 'Hadir', busGroup: 'Bus 3' }
  ];
  for (var s = 0; s < sampleStudents.length; s++) {
    var st = sampleStudents[s];
    appendObjectToSheet_(ss, 'Students', {
      id: st.id,
      activityId: MAIN_ACTIVITY_ID,
      nis: st.nis,
      name: st.name,
      className: st.className,
      gender: st.gender,
      parentPhone: st.parentPhone,
      participationStatus: st.participationStatus,
      busGroup: st.busGroup,
      notes: 'Rombongan ' + st.busGroup,
      createdBy: 'local-admin',
      createdAt: now,
      updatedAt: now
    });
  }

  var sampleTeachers = [
    { id: 'guru-1', name: 'M. Syafi\'i, S.Pd., M.Pd.', nipNuptk: '198204122009031004', position: 'Waka Kurikulum', mentoringTask: 'Ketua Pelaksana & Koordinator Bus 1', phone: '081234560101' },
    { id: 'guru-2', name: 'Hj. Siti Aminah, S.Pd.', nipNuptk: '197911032008012011', position: 'Guru Sejarah Indonesia', mentoringTask: 'Pembimbing Observasi Museum Bung Karno', phone: '081234560102' },
    { id: 'guru-3', name: 'Ahmad Fauzi, S.Ag.', nipNuptk: '198506182011011008', position: 'Guru PAI', mentoringTask: 'Koordinator Doa, Tahlil Makam & Bus 2', phone: '081234560103' },
    { id: 'guru-4', name: 'Rina Kusumawardani, S.Pd.', nipNuptk: '199102252019032009', position: 'Guru PPKn & Pembina OSIS', mentoringTask: 'Koordinator Kedisiplinan & Refleksi Siswa', phone: '081234560104' }
  ];
  for (var t = 0; t < sampleTeachers.length; t++) {
    var tc = sampleTeachers[t];
    appendObjectToSheet_(ss, 'Teachers', {
      id: tc.id,
      activityId: MAIN_ACTIVITY_ID,
      name: tc.name,
      nipNuptk: tc.nipNuptk,
      position: tc.position,
      mentoringTask: tc.mentoringTask,
      phone: tc.phone,
      createdBy: 'local-admin',
      createdAt: now,
      updatedAt: now
    });
  }

  var sampleSchedules = [
    { id: 'rundown-1', orderNo: 1, timeRange: '05.00 - 05.30 WIB', activityTitle: 'Registrasi Peserta & Doa Keberangkatan', location: 'Halaman SMA Darul Ulum Kepohbaru', personInCharge: 'M. Syafi\'i, S.Pd., M.Pd.', notes: 'Seragam batik sekolah dan membawa LKPD.' },
    { id: 'rundown-2', orderNo: 2, timeRange: '05.30 - 09.30 WIB', activityTitle: 'Perjalanan Rombongan Menuju Kota Blitar', location: 'Bojonegoro - Nganjuk - Kediri - Blitar', personInCharge: 'Koordinator Bus', notes: 'Pengarahan lembar observasi sejarah.' },
    { id: 'rundown-3', orderNo: 3, timeRange: '09.30 - 11.15 WIB', activityTitle: 'Ziarah, Tahlil & Observasi Makam Bung Karno', location: 'Pendopo Agung Makam Bung Karno', personInCharge: 'Ahmad Fauzi, S.Ag.', notes: 'Menjaga kekhusyukan doa & ketertiban.' },
    { id: 'rundown-4', orderNo: 4, timeRange: '11.15 - 13.00 WIB', activityTitle: 'Kunjungan Edukatif Museum & Perpustakaan Bung Karno', location: 'Museum Proklamator Bung Karno, Blitar', personInCharge: 'Hj. Siti Aminah, S.Pd.', notes: 'Pengisian instrumen LKPD lintas mapel.' },
    { id: 'rundown-5', orderNo: 5, timeRange: '13.00 - 14.30 WIB', activityTitle: 'ISHOMA & Diskusi Kelompok Hasil Observasi', location: 'Pendopo Pusat Informasi Pariwisata Blitar', personInCharge: 'Rina Kusumawardani, S.Pd.', notes: 'Penyusunan refleksi & foto bersama.' },
    { id: 'rundown-6', orderNo: 6, timeRange: '14.30 - 19.00 WIB', activityTitle: 'Penutupan Kegiatan & Perjalanan Kembali ke Bojonegoro', location: 'Rute Blitar - Kepohbaru', personInCharge: 'M. Syafi\'i, S.Pd., M.Pd.', notes: 'Presensi akhir seluruh peserta.' }
  ];
  for (var r = 0; r < sampleSchedules.length; r++) {
    var sc = sampleSchedules[r];
    appendObjectToSheet_(ss, 'Schedules', {
      id: sc.id,
      activityId: MAIN_ACTIVITY_ID,
      orderNo: sc.orderNo,
      timeRange: sc.timeRange,
      activityTitle: sc.activityTitle,
      location: sc.location,
      personInCharge: sc.personInCharge,
      notes: sc.notes,
      createdBy: 'local-admin',
      createdAt: now,
      updatedAt: now
    });
  }

  appendObjectToSheet_(ss, 'Journals', {
    id: 'jurnal-1',
    activityId: MAIN_ACTIVITY_ID,
    date: '2026-02-14',
    time: '09.45 WIB',
    location: 'Pendopo Makam & Museum Bung Karno Blitar',
    description: 'Rombongan tiba tepat waktu, melaksanakan doa bersama di pendopo makam, serta observasi galeri sejarah museum.',
    attendeesCount: 118,
    condition: 'Lancar',
    companionNotes: 'Siswa mengikuti arahan pemandu dan guru pendamping dengan tertib.',
    obstacles: 'Antrean pengunjung cukup padat pada sesi siang.',
    solutions: 'Kelompok dibagi menjadi dua sesi bergantian antara galeri foto dan perpustakaan.',
    authorUid: 'local-admin',
    authorName: 'Administrator Sekolah',
    createdAt: now,
    updatedAt: now
  });

  appendObjectToSheet_(ss, 'AuditLogs', {
    id: 'audit-init-1',
    action: 'CREATE',
    module: 'Sistem',
    targetId: MAIN_ACTIVITY_ID,
    summary: 'Inisialisasi database Google Sheets sistem kokurikuler 2026',
    actorUid: 'local-admin',
    actorName: 'Administrator Sekolah',
    actorRole: 'SUPER_ADMIN',
    createdAt: now
  });
}

/**
 * ============================================================================
 * KEAMANAN & AUTENTIKASI (SHA-256 + HMAC TOKEN)
 * ============================================================================
 */
function getSecret_() {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('SESSION_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + '-' + Utilities.getUuid();
    props.setProperty('SESSION_SECRET', secret);
  }
  return secret;
}

function bytesToHex_(bytes) {
  var out = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i] & 0xff;
    if (b < 16) out += '0';
    out += b.toString(16);
  }
  return out;
}

function hashPassword_(password) {
  var salt = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + password);
  return salt + ':' + bytesToHex_(digest);
}

function verifyPassword_(password, storedHash) {
  if (!storedHash) return false;
  var parts = String(storedHash).split(':');
  if (parts.length !== 2) return String(password) === String(storedHash);
  var salt = parts[0];
  var expected = parts[1];
  var actual = bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + password));
  return actual === expected;
}

function signToken_(uid) {
  var payloadObj = { uid: uid, exp: Date.now() + TOKEN_TTL_MS };
  var payloadB64 = Utilities.base64EncodeWebSafe(JSON.stringify(payloadObj));
  var sigBytes = Utilities.computeHmacSha256Signature(payloadB64, getSecret_());
  var sigB64 = Utilities.base64EncodeWebSafe(sigBytes);
  return payloadB64 + '.' + sigB64;
}

function verifyToken_(token) {
  if (!token || String(token).indexOf('.') < 0) return null;
  var parts = String(token).split('.');
  if (parts.length !== 2) return null;
  var payloadB64 = parts[0];
  var sigB64 = parts[1];
  var expectedSig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payloadB64, getSecret_()));
  if (sigB64 !== expectedSig) return null;
  try {
    var decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(payloadB64)).getDataAsString();
    var parsed = JSON.parse(decoded);
    if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function sanitizeUser_(u) {
  var copy = {};
  var keys = Object.keys(u);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] !== 'passwordHash') copy[keys[i]] = u[keys[i]];
  }
  return copy;
}

function requireAuthUser_(token) {
  var parsed = verifyToken_(token);
  if (!parsed) throw new Error('Sesi login tidak valid atau telah berakhir. Silakan login ulang.');
  var ss = ensureDatabaseInitialized_();
  var users = readSheetObjects_(ss, 'Users');
  for (var i = 0; i < users.length; i++) {
    if (users[i].uid === parsed.uid) {
      if (users[i].status !== 'active') throw new Error('Akun Anda sedang dinonaktifkan oleh Admin.');
      return { ss: ss, user: users[i] };
    }
  }
  throw new Error('Akun pengguna tidak ditemukan.');
}

function isStaff_(role) {
  return role !== 'SISWA';
}

/**
 * Login menggunakan Username atau Email + Password
 */
function loginUser(identifier, password) {
  var ss = ensureDatabaseInitialized_();
  var cleanId = String(identifier || '').trim().toLowerCase();
  var rawPass = String(password || '');
  if (!cleanId || !rawPass) {
    return { ok: false, error: 'Username/email dan kata sandi wajib diisi.' };
  }

  var users = readSheetObjects_(ss, 'Users');
  var found = null;
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (
      (u.username && String(u.username).trim().toLowerCase() === cleanId) ||
      (u.email && String(u.email).trim().toLowerCase() === cleanId)
    ) {
      found = u;
      break;
    }
  }

  if (!found || !verifyPassword_(rawPass, found.passwordHash)) {
    return { ok: false, error: 'Username/email atau kata sandi tidak sesuai.' };
  }
  if (found.status !== 'active') {
    return { ok: false, error: 'Akun Anda sedang dinonaktifkan oleh Admin.' };
  }

  return {
    ok: true,
    token: signToken_(found.uid),
    user: sanitizeUser_(found)
  };
}

function verifySession(token) {
  try {
    var ctx = requireAuthUser_(token);
    return { ok: true, user: sanitizeUser_(ctx.user) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Mengambil seluruh data sesuai hak akses peran (RBAC)
 */
function getBootstrapData(token) {
  var ctx = requireAuthUser_(token);
  var ss = ctx.ss;
  var user = ctx.user;
  var staff = isStaff_(user.role);
  var superAdmin = user.role === 'SUPER_ADMIN';

  var schoolProfiles = readSheetObjects_(ss, 'SchoolProfile');
  var activities = readSheetObjects_(ss, 'Activity');
  var schedules = readSheetObjects_(ss, 'Schedules').sort(function(a, b) {
    return Number(a.orderNo || 0) - Number(b.orderNo || 0);
  });

  var allDocs = readSheetObjects_(ss, 'Documentation');
  var docsFiltered = staff ? allDocs : allDocs.filter(function(d) {
    return d.isAllowedForStudent === true || String(d.isAllowedForStudent) === 'true';
  });

  var allReflections = readSheetObjects_(ss, 'Reflections');
  var reflectionsFiltered = staff ? allReflections : allReflections.filter(function(r) {
    return r.studentUid === user.uid;
  });

  var allLkpd = readSheetObjects_(ss, 'LkpdSubmissions');
  var lkpdFiltered = staff ? allLkpd : allLkpd.filter(function(l) {
    return l.studentUid === user.uid;
  });

  var usersList = [];
  if (superAdmin) {
    var rawUsers = readSheetObjects_(ss, 'Users');
    for (var i = 0; i < rawUsers.length; i++) {
      usersList.push(sanitizeUser_(rawUsers[i]));
    }
  }

  return {
    ok: true,
    spreadsheetUrl: ss.getUrl(),
    schoolProfile: schoolProfiles[0] || null,
    activity: activities[0] || null,
    schedules: schedules,
    documentation: docsFiltered,
    reflections: reflectionsFiltered,
    lkpdSubmissions: lkpdFiltered,
    students: staff ? readSheetObjects_(ss, 'Students') : [],
    teachers: staff ? readSheetObjects_(ss, 'Teachers') : [],
    journals: staff ? readSheetObjects_(ss, 'Journals') : [],
    evaluations: staff ? readSheetObjects_(ss, 'Evaluations') : [],
    reports: staff ? readSheetObjects_(ss, 'Reports') : [],
    approvals: staff ? readSheetObjects_(ss, 'Approvals') : [],
    archives: staff ? readSheetObjects_(ss, 'Archives') : [],
    auditLogs: staff ? readSheetObjects_(ss, 'AuditLogs').slice(0, 100) : [],
    users: usersList
  };
}

/**
 * ============================================================================
 * OPERASI CRUD & MANAJEMEN AKUN
 * ============================================================================
 */
function saveSchoolProfile(token, data) {
  var ctx = requireAuthUser_(token);
  if (ctx.user.role !== 'SUPER_ADMIN') throw new Error('Hanya Super Admin yang dapat mengubah identitas sekolah.');
  var now = new Date().toISOString();
  var payload = Object.assign({}, data, {
    id: 'main',
    updatedBy: ctx.user.uid,
    updatedAt: now
  });
  upsertObjectById_(ctx.ss, 'SchoolProfile', payload);
  appendAudit_(ctx.ss, ctx.user, 'UPDATE', 'Identitas Sekolah', 'main', 'Memperbarui identitas sekolah');
  return getBootstrapData(token);
}

function saveActivity(token, data) {
  var ctx = requireAuthUser_(token);
  if (['SUPER_ADMIN', 'KETUA_PELAKSANA'].indexOf(ctx.user.role) < 0) {
    throw new Error('Akses ditolak untuk mengubah identitas kegiatan.');
  }
  var now = new Date().toISOString();
  var payload = Object.assign({}, data, {
    id: MAIN_ACTIVITY_ID,
    createdBy: data.createdBy || ctx.user.uid,
    updatedAt: now
  });
  upsertObjectById_(ctx.ss, 'Activity', payload);
  appendAudit_(ctx.ss, ctx.user, 'UPDATE', 'Identitas Kegiatan', MAIN_ACTIVITY_ID, 'Menyimpan identitas kegiatan');
  return getBootstrapData(token);
}

function upsertRecord(token, sheetName, item) {
  var ctx = requireAuthUser_(token);
  var user = ctx.user;
  var staff = isStaff_(user.role);

  var allowedStaffSheets = {
    Students: ['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING'],
    Teachers: ['SUPER_ADMIN', 'KETUA_PELAKSANA'],
    Schedules: ['SUPER_ADMIN', 'KETUA_PELAKSANA'],
    Journals: ['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING'],
    Documentation: ['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING'],
    Evaluations: ['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING', 'KEPALA_SEKOLAH'],
    Reports: ['SUPER_ADMIN', 'KETUA_PELAKSANA'],
    Archives: ['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING']
  };

  var now = new Date().toISOString();
  var record = Object.assign({}, item);

  if (sheetName === 'Reflections' || sheetName === 'LkpdSubmissions') {
    if (!record.id) {
      record.id = sheetName.toLowerCase() + '-' + Date.now();
      record.activityId = MAIN_ACTIVITY_ID;
      record.studentUid = user.uid;
      record.reviewStatus = 'Menunggu Penilaian';
      record.createdAt = now;
    } else {
      var existingList = readSheetObjects_(ctx.ss, sheetName);
      var existing = null;
      for (var i = 0; i < existingList.length; i++) {
        if (existingList[i].id === record.id) { existing = existingList[i]; break; }
      }
      if (existing && !staff && (existing.studentUid !== user.uid || existing.reviewStatus === 'Dinilai')) {
        throw new Error('Tidak memiliki izin mengubah data yang sudah dinilai.');
      }
    }
    record.updatedAt = now;
    upsertObjectById_(ctx.ss, sheetName, record);
    if (staff) appendAudit_(ctx.ss, user, 'UPDATE', sheetName, record.id, 'Menyimpan ' + sheetName);
    return getBootstrapData(token);
  }

  var roles = allowedStaffSheets[sheetName];
  if (!roles || roles.indexOf(user.role) < 0) {
    throw new Error('Anda tidak memiliki izin mengelola modul ' + sheetName + '.');
  }

  var isNew = !record.id;
  if (isNew) {
    record.id = sheetName.toLowerCase() + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    record.activityId = MAIN_ACTIVITY_ID;
    record.createdAt = now;
    if (sheetName === 'Journals' || sheetName === 'Reports') {
      record.authorUid = user.uid;
      record.authorName = user.displayName;
    } else if (sheetName === 'Documentation' || sheetName === 'Archives') {
      record.uploadedByUid = user.uid;
      record.uploadedByName = user.displayName;
    } else if (sheetName === 'Evaluations') {
      record.evaluatorUid = user.uid;
      record.evaluatorName = user.displayName;
    } else {
      record.createdBy = user.uid;
    }
  }
  record.updatedAt = now;

  upsertObjectById_(ctx.ss, sheetName, record);
  appendAudit_(ctx.ss, user, isNew ? 'CREATE' : 'UPDATE', sheetName, record.id, (isNew ? 'Menambah ' : 'Memperbarui ') + sheetName);
  return getBootstrapData(token);
}

function deleteRecord(token, sheetName, id) {
  var ctx = requireAuthUser_(token);
  var user = ctx.user;

  if (sheetName === 'Reflections' || sheetName === 'LkpdSubmissions') {
    var rows = readSheetObjects_(ctx.ss, sheetName);
    var target = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) { target = rows[i]; break; }
    }
    if (!target) throw new Error('Data tidak ditemukan.');
    if (user.role !== 'SUPER_ADMIN' && (target.studentUid !== user.uid || target.reviewStatus === 'Dinilai')) {
      throw new Error('Tidak memiliki izin menghapus data ini.');
    }
  } else if (!isStaff_(user.role)) {
    throw new Error('Akses ditolak.');
  }

  deleteObjectById_(ctx.ss, sheetName, id);
  appendAudit_(ctx.ss, user, 'DELETE', sheetName, id, 'Menghapus data ' + sheetName + ' (' + id + ')');
  return getBootstrapData(token);
}

function gradeStudentItem(token, sheetName, id, score, feedback) {
  var ctx = requireAuthUser_(token);
  if (['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING'].indexOf(ctx.user.role) < 0) {
    throw new Error('Hanya Guru Pendamping / Panitia yang dapat memberi nilai.');
  }
  if (sheetName !== 'Reflections' && sheetName !== 'LkpdSubmissions') {
    throw new Error('Target penilaian tidak valid.');
  }
  var rows = readSheetObjects_(ctx.ss, sheetName);
  var found = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === id) { found = rows[i]; break; }
  }
  if (!found) throw new Error('Data siswa tidak ditemukan.');

  found.teacherScore = Math.max(0, Math.min(100, Number(score || 0)));
  found.teacherFeedback = String(feedback || '');
  found.reviewStatus = 'Dinilai';
  found.reviewedByUid = ctx.user.uid;
  found.reviewedByName = ctx.user.displayName;
  found.updatedAt = new Date().toISOString();

  upsertObjectById_(ctx.ss, sheetName, found);
  appendAudit_(ctx.ss, ctx.user, 'UPDATE', sheetName, id, 'Menilai ' + sheetName + ' skor ' + found.teacherScore);
  return getBootstrapData(token);
}

function submitApprovalDecision(token, reportId, reportTitle, status, decisionNotes) {
  var ctx = requireAuthUser_(token);
  if (['SUPER_ADMIN', 'KEPALA_SEKOLAH'].indexOf(ctx.user.role) < 0) {
    throw new Error('Hanya Kepala Sekolah atau Super Admin yang dapat memberi persetujuan.');
  }
  var now = new Date().toISOString();
  var schoolProfiles = readSheetObjects_(ctx.ss, 'SchoolProfile');
  var principalNip = schoolProfiles[0] ? schoolProfiles[0].principalNip : '-';

  upsertObjectById_(ctx.ss, 'Approvals', {
    id: 'approval-' + reportId,
    activityId: MAIN_ACTIVITY_ID,
    reportId: reportId,
    reportTitle: reportTitle,
    status: status,
    decisionNotes: decisionNotes || '',
    approverUid: ctx.user.uid,
    approverName: ctx.user.displayName,
    approverNip: principalNip || '-',
    createdAt: now,
    updatedAt: now
  });

  var reports = readSheetObjects_(ctx.ss, 'Reports');
  for (var i = 0; i < reports.length; i++) {
    if (reports[i].id === reportId) {
      reports[i].status = status === 'Disetujui' ? 'Disetujui' : (status === 'Revisi' || status === 'Ditolak' ? 'Revisi' : 'Menunggu Persetujuan');
      reports[i].updatedAt = now;
      upsertObjectById_(ctx.ss, 'Reports', reports[i]);
      break;
    }
  }

  appendAudit_(ctx.ss, ctx.user, 'APPROVE', 'Persetujuan Laporan', reportId, 'Status: ' + status);
  return getBootstrapData(token);
}

function createOrUpdateUser(token, userData) {
  var ctx = requireAuthUser_(token);
  if (ctx.user.role !== 'SUPER_ADMIN') {
    throw new Error('Hanya Admin / Super Admin yang dapat menambahkan akun.');
  }
  var username = String(userData.username || '').trim();
  var email = String(userData.email || '').trim().toLowerCase();
  var displayName = String(userData.displayName || '').trim();
  var password = String(userData.password || '');
  if (!displayName || (!username && !email)) {
    throw new Error('Nama lengkap dan username atau email wajib diisi.');
  }

  var effectiveEmail = email || (username.toLowerCase().replace(/[^a-z0-9]/g, '') + '@smadarululum.local');
  var users = readSheetObjects_(ctx.ss, 'Users');
  var now = new Date().toISOString();

  var existing = null;
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (
      String(u.email).toLowerCase() === effectiveEmail ||
      (username && u.username && String(u.username).toLowerCase() === username.toLowerCase())
    ) {
      existing = u;
      break;
    }
  }

  if (existing) {
    existing.displayName = displayName;
    if (username) existing.username = username;
    existing.email = effectiveEmail;
    existing.role = userData.role || existing.role;
    existing.nipOrNisn = userData.nipOrNisn || '';
    existing.className = userData.className || '';
    if (password.trim()) existing.passwordHash = hashPassword_(password.trim());
    existing.updatedAt = now;
    upsertObjectById_(ctx.ss, 'Users', existing);
    appendAudit_(ctx.ss, ctx.user, 'UPDATE', 'Manajemen Akun', existing.uid, 'Memperbarui akun ' + (username || effectiveEmail));
  } else {
    if (!password.trim()) throw new Error('Kata sandi wajib diisi untuk pengguna baru.');
    var newUid = 'usr-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    appendObjectToSheet_(ctx.ss, 'Users', {
      id: newUid,
      uid: newUid,
      username: username,
      displayName: displayName,
      email: effectiveEmail,
      role: userData.role || 'SISWA',
      nipOrNisn: userData.nipOrNisn || '',
      className: userData.className || '',
      phone: '',
      status: 'active',
      passwordHash: hashPassword_(password.trim()),
      createdAt: now,
      updatedAt: now
    });
    appendAudit_(ctx.ss, ctx.user, 'CREATE', 'Manajemen Akun', newUid, 'Menambah akun ' + (username || effectiveEmail));
  }

  return getBootstrapData(token);
}

function updateUserRoleStatus(token, uid, role, status) {
  var ctx = requireAuthUser_(token);
  if (ctx.user.role !== 'SUPER_ADMIN') throw new Error('Akses ditolak.');
  var users = readSheetObjects_(ctx.ss, 'Users');
  for (var i = 0; i < users.length; i++) {
    if (users[i].uid === uid) {
      users[i].role = role;
      users[i].status = status;
      users[i].updatedAt = new Date().toISOString();
      upsertObjectById_(ctx.ss, 'Users', users[i]);
      appendAudit_(ctx.ss, ctx.user, 'UPDATE', 'Hak Akses', uid, 'Peran ' + users[i].displayName + ' -> ' + role + ' (' + status + ')');
      break;
    }
  }
  return getBootstrapData(token);
}

/**
 * Unggah berkas dokumentasi / arsip langsung ke Google Drive
 */
function uploadFileToDrive(token, fileName, mimeType, base64Data) {
  var ctx = requireAuthUser_(token);
  if (!isStaff_(ctx.user.role)) throw new Error('Hanya guru/panitia yang dapat mengunggah berkas.');

  var cleanB64 = String(base64Data || '');
  if (cleanB64.indexOf(',') >= 0) cleanB64 = cleanB64.split(',')[1];
  var bytes = Utilities.base64Decode(cleanB64);
  var blob = Utilities.newBlob(bytes, mimeType || 'application/octet-stream', fileName || 'berkas');

  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(DRIVE_FOLDER_NAME);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = file.getId();
  var isImage = String(mimeType || '').indexOf('image/') === 0;
  var directUrl = isImage
    ? 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200'
    : 'https://drive.google.com/file/d/' + fileId + '/view';

  return {
    ok: true,
    fileUrl: directUrl,
    fileName: file.getName(),
    fileId: fileId
  };
}

/**
 * ============================================================================
 * HELPER GOOGLE SHEETS ORM
 * ============================================================================
 */
function readSheetObjects_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var list = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (!row[0] && row.join('') === '') continue;
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    list.push(obj);
  }
  return list;
}

function appendObjectToSheet_(ss, sheetName, obj) {
  var sheet = ss.getSheetByName(sheetName);
  var headers = SHEET_DEFS[sheetName];
  var row = [];
  for (var c = 0; c < headers.length; c++) {
    var val = obj[headers[c]];
    row.push(val === undefined || val === null ? '' : val);
  }
  sheet.appendRow(row);
}

function upsertObjectById_(ss, sheetName, obj) {
  var sheet = ss.getSheetByName(sheetName);
  var headers = SHEET_DEFS[sheetName];
  var values = sheet.getDataRange().getValues();
  var idCol = headers.indexOf('id');
  var rowIdx = -1;

  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === String(obj.id)) {
      rowIdx = r + 1;
      break;
    }
  }

  var rowData = [];
  for (var c = 0; c < headers.length; c++) {
    var key = headers[c];
    var val = obj[key];
    if (val === undefined && rowIdx > 0) {
      val = values[rowIdx - 1][c];
    }
    rowData.push(val === undefined || val === null ? '' : val);
  }

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function deleteObjectById_(ss, sheetName, id) {
  var sheet = ss.getSheetByName(sheetName);
  var headers = SHEET_DEFS[sheetName];
  var idCol = headers.indexOf('id');
  var values = sheet.getDataRange().getValues();
  for (var r = values.length - 1; r >= 1; r--) {
    if (String(values[r][idCol]) === String(id)) {
      sheet.deleteRow(r + 1);
      break;
    }
  }
}

function appendAudit_(ss, user, action, module, targetId, summary) {
  if (!isStaff_(user.role)) return;
  appendObjectToSheet_(ss, 'AuditLogs', {
    id: 'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    action: action,
    module: module,
    targetId: targetId,
    summary: summary,
    actorUid: user.uid,
    actorName: user.displayName,
    actorRole: user.role,
    createdAt: new Date().toISOString()
  });
}
