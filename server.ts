import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';

type UserRole =
  | 'SUPER_ADMIN'
  | 'KEPALA_SEKOLAH'
  | 'KETUA_PELAKSANA'
  | 'GURU_PENDAMPING'
  | 'SISWA';

interface StoredUser {
  id: string;
  uid: string;
  username?: string;
  displayName: string;
  email: string;
  role: UserRole;
  nipOrNisn?: string;
  className?: string;
  phone?: string;
  status: 'active' | 'inactive';
  photoUrl?: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredDb {
  schoolProfile: Record<string, unknown> | null;
  activity: Record<string, unknown> | null;
  students: Record<string, unknown>[];
  teachers: Record<string, unknown>[];
  participants: Record<string, unknown>[];
  schedules: Record<string, unknown>[];
  journals: Record<string, unknown>[];
  documentation: Record<string, unknown>[];
  reflections: Record<string, unknown>[];
  lkpdSubmissions: Record<string, unknown>[];
  evaluations: Record<string, unknown>[];
  reports: Record<string, unknown>[];
  archives: Record<string, unknown>[];
  approvals: Record<string, unknown>[];
  auditLogs: Record<string, unknown>[];
  users: StoredUser[];
  invites: Record<string, unknown>[];
}

interface AuthedRequest extends Request {
  authUser?: StoredUser;
}

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'kokurikuler-db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const SECRET_FILE = path.join(DATA_DIR, '.session-secret');
const MAIN_ACTIVITY_ID = 'kokurikuler-2026';

function ensureDirs(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function getSessionSecret(): string {
  ensureDirs();
  if (fs.existsSync(SECRET_FILE)) {
    return fs.readFileSync(SECRET_FILE, 'utf8').trim();
  }
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, secret, 'utf8');
  return secret;
}

const SESSION_SECRET = getSessionSecret();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

function signToken(uid: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { uid: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid?: string;
      exp?: number;
    };
    if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) return null;
    return { uid: parsed.uid };
  } catch {
    return null;
  }
}

function createInitialDb(): StoredDb {
  const now = new Date().toISOString();
  const initialStudents = [
    { id: 'siswa-1', nis: '20261001', name: 'Ahmad Zaki Al-Farizi', className: 'XI IPA 1', gender: 'L', parentPhone: '081330110001', participationStatus: 'Hadir', bus: 'Bus 1' },
    { id: 'siswa-2', nis: '20261002', name: 'Nayla Putri Azzahra', className: 'XI IPA 1', gender: 'P', parentPhone: '081330110002', participationStatus: 'Hadir', bus: 'Bus 1' },
    { id: 'siswa-3', nis: '20261003', name: 'Muhammad Rizqi Pratama', className: 'XI IPS 1', gender: 'L', parentPhone: '081330110003', participationStatus: 'Hadir', bus: 'Bus 2' },
    { id: 'siswa-4', nis: '20261004', name: 'Siti Nur Halimah', className: 'XI IPS 2', gender: 'P', parentPhone: '081330110004', participationStatus: 'Terdaftar', bus: 'Bus 2' },
    { id: 'siswa-5', nis: '20261005', name: 'Dimas Aditya Saputra', className: 'X-A', gender: 'L', parentPhone: '081330110005', participationStatus: 'Hadir', bus: 'Bus 3' },
    { id: 'siswa-6', nis: '20261006', name: 'Aulia Rahmawati', className: 'X-B', gender: 'P', parentPhone: '081330110006', participationStatus: 'Hadir', bus: 'Bus 3' },
  ];

  return {
    schoolProfile: {
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
      logoUrl: '',
      updatedBy: 'local-admin',
      createdAt: now,
      updatedAt: now,
    },
    activity: {
      id: MAIN_ACTIVITY_ID,
      name: 'Kegiatan Kokurikuler Kunjungan Edukatif Sejarah Kebangsaan Tahun 2026',
      theme: 'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno, Presiden Pertama Republik Indonesia',
      year: 2026,
      background:
        'Pembelajaran sejarah dan pendidikan karakter kebangsaan menuntut pengalaman belajar kontekstual di luar ruang kelas. Melalui kunjungan edukatif ke Makam dan Museum Ir. Soekarno di Kota Blitar, peserta didik SMA Darul Ulum Kepohbaru – Bojonegoro diharapkan dapat memahami secara langsung perjuangan Proklamator Kemerdekaan Republik Indonesia, meneladani semangat nasionalisme, persatuan, dan pengabdian kepada bangsa.',
      purpose:
        '1. Memperkuat pemahaman sejarah perjuangan kemerdekaan Indonesia dan peran Ir. Soekarno.\n2. Menumbuhkan sikap nasionalisme, cinta tanah air, dan tanggung jawab kebangsaan peserta didik.\n3. Mengintegrasikan pembelajaran kokurikuler lintas mata pelajaran melalui observasi lapangan, LKPD, dan refleksi ilmiah.',
      legalBasis:
        '1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional.\n2. Permendikbudristek tentang Kurikulum Merdeka dan Penguatan Profil Pelajar Pancasila.\n3. Program Kerja Kurikulum dan Kesiswaan SMA Darul Ulum Kepohbaru Tahun Pelajaran 2025/2026.',
      dayDate: 'Sabtu, 14 Februari 2026',
      departureTime: '05.30 WIB (Halaman SMA Darul Ulum Kepohbaru)',
      destination: 'Kompleks Makam dan Museum Perpustakaan Nasional Bung Karno',
      destinationAddress: 'Jl. Kalasan No. 1, Bendogerit, Kec. Sananwetan, Kota Blitar, Jawa Timur',
      personInCharge: 'Drs. H. Ahmad Muhajir, M.Pd. (Kepala Sekolah)',
      chiefExecutive: 'M. Syafi’i, S.Pd., M.Pd.',
      companionTeachersSummary: '10 Guru Pendamping & Wali Kelas X, XI, XII',
      participantCountTarget: 120,
      fundingSource: 'Komite Sekolah, Dana BOS Pendamping, dan Kontribusi Mandiri Peserta Didik',
      status: 'Berjalan',
      createdBy: 'local-admin',
      createdAt: now,
      updatedAt: now,
    },
    students: initialStudents.map((st) => ({
      id: st.id,
      activityId: MAIN_ACTIVITY_ID,
      nis: st.nis,
      name: st.name,
      className: st.className,
      gender: st.gender,
      parentPhone: st.parentPhone,
      participationStatus: st.participationStatus,
      notes: `Rombongan ${st.bus}`,
      createdBy: 'local-admin',
      createdAt: now,
      updatedAt: now,
    })),
    participants: initialStudents.map((st) => ({
      id: `part-${st.id}`,
      activityId: MAIN_ACTIVITY_ID,
      studentId: st.id,
      nis: st.nis,
      studentName: st.name,
      className: st.className,
      busGroup: st.bus,
      attendanceStatus: st.participationStatus === 'Hadir' ? 'Hadir' : 'Terdaftar',
      createdBy: 'local-admin',
      createdAt: now,
      updatedAt: now,
    })),
    teachers: [
      {
        id: 'guru-1',
        activityId: MAIN_ACTIVITY_ID,
        name: 'M. Syafi’i, S.Pd., M.Pd.',
        nipNuptk: '198204122009031004',
        position: 'Wakil Kepala Sekolah Bidang Kurikulum',
        mentoringTask: 'Ketua Pelaksana & Koordinator Rombongan Bus 1',
        phone: '081234560101',
        createdBy: 'local-admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'guru-2',
        activityId: MAIN_ACTIVITY_ID,
        name: 'Hj. Siti Aminah, S.Pd.',
        nipNuptk: '197911032008012011',
        position: 'Guru Sejarah Indonesia',
        mentoringTask: 'Pembimbing Observasi Sejarah Museum Bung Karno',
        phone: '081234560102',
        createdBy: 'local-admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'guru-3',
        activityId: MAIN_ACTIVITY_ID,
        name: 'Ahmad Fauzi, S.Ag.',
        nipNuptk: '198506182011011008',
        position: 'Guru Pendidikan Agama Islam',
        mentoringTask: 'Koordinator Doa, Tahlil Makam & Pembina Rombongan Bus 2',
        phone: '081234560103',
        createdBy: 'local-admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'guru-4',
        activityId: MAIN_ACTIVITY_ID,
        name: 'Rina Kusumawardani, S.Pd.',
        nipNuptk: '199102252019032009',
        position: 'Guru PPKn & Pembina OSIS',
        mentoringTask: 'Koordinator Kedisiplinan, Absensi & Refleksi Siswa',
        phone: '081234560104',
        createdBy: 'local-admin',
        createdAt: now,
        updatedAt: now,
      },
    ],
    schedules: [
      {
        id: 'rundown-1',
        activityId: MAIN_ACTIVITY_ID,
        orderNo: 1,
        timeRange: '05.00 - 05.30 WIB',
        activityTitle: 'Registrasi Peserta, Pengecekan Perlengkapan & Doa Keberangkatan',
        location: 'Halaman SMA Darul Ulum Kepohbaru',
        personInCharge: 'M. Syafi’i, S.Pd., M.Pd.',
        notes: 'Seluruh siswa mengenakan seragam batik sekolah dan membawa buku catatan observasi.',
        createdBy: 'local-admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rundown-2',
        activityId: MAIN_ACTIVITY_ID,
        orderNo: 2,
        timeRange: '05.30 - 09.30 WIB',
        activityTitle: 'Perjalanan Rombongan Menuju Kota Blitar',
        location: 'Rute Bojonegoro – Nganjuk – Kediri – Blitar',
        personInCharge: 'Koordinator Tiap Bus',
        notes: 'Pemberian pengarahan lembar kerja observasi sejarah selama perjalanan.',
        createdBy: 'local-admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rundown-3',
        activityId: MAIN_ACTIVITY_ID,
        orderNo: 3,
        timeRange: '09.30 - 11.15 WIB',
        activityTitle: 'Ziarah, Tahlil Bersama, dan Observasi Area Makam Bung Karno',
        location: 'Pendopo Agung Makam Bung Karno, Bendogerit, Blitar',
        personInCharge: 'Ahmad Fauzi, S.Ag.',
        notes: 'Menjaga ketertiban, kekhusyukan doa, serta mencatat arsitektur pendopo.',
        createdBy: 'local-admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rundown-4',
        activityId: MAIN_ACTIVITY_ID,
        orderNo: 4,
        timeRange: '11.15 - 13.00 WIB',
        activityTitle: 'Kunjungan Edukatif Museum & Perpustakaan Proklamator Bung Karno',
        location: 'Gedung Museum & Galeri Koleksi Sejarah Blitar',
        personInCharge: 'Hj. Siti Aminah, S.Pd.',
        notes: 'Siswa mencatat artefak perjuangan, naskah pidato, dan dokumentasi foto sejarah.',
        createdBy: 'local-admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rundown-5',
        activityId: MAIN_ACTIVITY_ID,
        orderNo: 5,
        timeRange: '13.00 - 14.30 WIB',
        activityTitle: 'ISHOMA & Diskusi Kelompok Hasil Observasi Lapangan',
        location: 'Area Pendopo Pusat Informasi Pariwisata Blitar',
        personInCharge: 'Rina Kusumawardani, S.Pd.',
        notes: 'Penyusunan ringkasan refleksi nilai nasionalisme dan foto bersama.',
        createdBy: 'local-admin',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rundown-6',
        activityId: MAIN_ACTIVITY_ID,
        orderNo: 6,
        timeRange: '14.30 - 19.00 WIB',
        activityTitle: 'Penutupan Kegiatan Lapangan & Perjalanan Kembali ke Bojonegoro',
        location: 'Rute Blitar – Kepohbaru, Bojonegoro',
        personInCharge: 'M. Syafi’i, S.Pd., M.Pd.',
        notes: 'Presensi akhir seluruh peserta sebelum kepulangan ke rumah masing-masing.',
        createdBy: 'local-admin',
        createdAt: now,
        updatedAt: now,
      },
    ],
    journals: [
      {
        id: 'jurnal-initial-1',
        activityId: MAIN_ACTIVITY_ID,
        date: '2026-02-14',
        time: '09.45 WIB',
        location: 'Pendopo Makam & Museum Bung Karno Blitar',
        description:
          'Rombongan SMA Darul Ulum tiba tepat waktu di lokasi, dilanjutkan dengan apel singkat, doa bersama di pendopo makam, dan pembagian kelompok observasi menuju galeri museum.',
        attendeesCount: 118,
        condition: 'Lancar',
        companionNotes: 'Siswa mengikuti arahan pemandu dan guru pendamping dengan sangat tertib.',
        obstacles: 'Antrean pengunjung umum cukup padat pada pukul 10.30 WIB.',
        solutions: 'Kelompok dibagi menjadi dua sesi bergantian antara area perpustakaan dan galeri foto sejarah.',
        authorUid: 'local-admin',
        authorName: 'Administrator Sekolah',
        createdAt: now,
        updatedAt: now,
      },
    ],
    documentation: [
      {
        id: 'doc-initial-1',
        activityId: MAIN_ACTIVITY_ID,
        title: 'Kompleks Pendopo Makam Bung Karno Blitar',
        caption:
          'Area pendopo utama Makam Ir. Soekarno saat rombongan SMA Darul Ulum Kepohbaru melaksanakan ziarah dan doa kebangsaan.',
        mediaType: 'photo',
        category: 'Kunjungan Makam Bung Karno',
        capturedDate: '2026-02-14',
        location: 'Makam Bung Karno, Blitar',
        fileUrl: '/src/assets/images/hero_bung_karno_museum_1795413124475.jpg',
        fileName: 'hero_bung_karno_museum.jpg',
        isAllowedForStudent: true,
        uploadedByUid: 'local-admin',
        uploadedByName: 'Administrator Sekolah',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'doc-initial-2',
        activityId: MAIN_ACTIVITY_ID,
        title: 'Sesi Observasi Koleksi Sejarah di Museum',
        caption:
          'Peserta didik mencatat materi sejarah dan mendengarkan pemaparan guru pendamping selama kunjungan galeri museum.',
        mediaType: 'photo',
        category: 'Kunjungan Museum Bung Karno',
        capturedDate: '2026-02-14',
        location: 'Museum Proklamator Bung Karno, Blitar',
        fileUrl: '/src/assets/images/doc_museum_edukasi_1795413124561.jpg',
        fileName: 'doc_museum_edukasi.jpg',
        isAllowedForStudent: true,
        uploadedByUid: 'local-admin',
        uploadedByName: 'Administrator Sekolah',
        createdAt: now,
        updatedAt: now,
      },
    ],
    reflections: [],
    lkpdSubmissions: [],
    evaluations: [],
    reports: [],
    archives: [],
    approvals: [],
    auditLogs: [
      {
        id: 'init-1',
        action: 'CREATE',
        module: 'Sistem',
        targetId: MAIN_ACTIVITY_ID,
        summary: 'Inisialisasi sistem pelaporan kegiatan kokurikuler SMA Darul Ulum 2026',
        actorUid: 'local-admin',
        actorName: 'Administrator Sekolah',
        actorRole: 'SUPER_ADMIN',
        createdAt: now,
      },
    ],
    users: [
      {
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
        photoUrl: '',
        passwordHash: hashPassword('Admin'),
        createdAt: now,
        updatedAt: now,
      },
    ],
    invites: [],
  };
}

function readDb(): StoredDb {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as StoredDb;
  if (!raw.users || raw.users.length === 0) {
    const fallback = createInitialDb();
    raw.users = fallback.users;
    writeDb(raw);
  }
  return raw;
}

function writeDb(db: StoredDb): void {
  ensureDirs();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function sanitizeUser(u: StoredUser): Omit<StoredUser, 'passwordHash'> {
  const { passwordHash: _ignored, ...rest } = u;
  return rest;
}

function isStaff(role: UserRole): boolean {
  return role !== 'SISWA';
}

function clamp(val: unknown, maxLen: number): string {
  const s = typeof val === 'string' ? val.trim() : String(val ?? '').trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function appendAudit(
  db: StoredDb,
  user: StoredUser,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'BACKUP',
  module: string,
  targetId: string,
  summary: string
): void {
  if (!isStaff(user.role)) return;
  db.auditLogs.unshift({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    module: clamp(module, 80),
    targetId: clamp(targetId, 128),
    summary: clamp(summary, 500),
    actorUid: user.uid,
    actorName: user.displayName,
    actorRole: user.role,
    createdAt: new Date().toISOString(),
  });
  if (db.auditLogs.length > 100) {
    db.auditLogs = db.auditLogs.slice(0, 100);
  }
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const verified = token ? verifyToken(token) : null;
  if (!verified) {
    res.status(401).json({ error: 'Sesi login tidak valid atau telah kedaluwarsa.' });
    return;
  }
  const db = readDb();
  const user = db.users.find((u) => u.uid === verified.uid);
  if (!user || user.status !== 'active') {
    res.status(401).json({ error: 'Akun tidak ditemukan atau sedang dinonaktifkan.' });
    return;
  }
  req.authUser = user;
  next();
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '30mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --- Local Authentication Routes ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const identifier = String(req.body?.identifier || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!identifier || !password) {
      res.status(400).json({ error: 'Username/email dan kata sandi wajib diisi.' });
      return;
    }

    const db = readDb();
    const found = db.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === identifier) ||
        u.email.toLowerCase() === identifier
    );

    if (!found || !verifyPassword(password, found.passwordHash)) {
      res.status(401).json({ error: 'Username/email atau kata sandi tidak sesuai.' });
      return;
    }

    if (found.status !== 'active') {
      res.status(403).json({ error: 'Akun Anda sedang dinonaktifkan oleh Admin.' });
      return;
    }

    const token = signToken(found.uid);
    res.json({ token, user: sanitizeUser(found) });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
    res.json({ user: sanitizeUser(req.authUser!) });
  });

  // --- Data Read Route (RBAC Filtered) ---
  app.get('/api/data', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    const db = readDb();
    const staff = isStaff(user.role);
    const superAdmin = user.role === 'SUPER_ADMIN';

    res.json({
      schoolProfile: db.schoolProfile,
      activity: db.activity,
      participants: db.participants,
      schedules: [...db.schedules].sort((a, b) => Number(a.orderNo || 0) - Number(b.orderNo || 0)),
      documentation: staff
        ? db.documentation
        : db.documentation.filter((d) => d.isAllowedForStudent === true),
      reflections: staff
        ? db.reflections
        : db.reflections.filter((r) => r.studentUid === user.uid),
      lkpdSubmissions: staff
        ? db.lkpdSubmissions
        : db.lkpdSubmissions.filter((l) => l.studentUid === user.uid),
      students: staff ? db.students : [],
      teachers: staff ? db.teachers : [],
      journals: staff ? db.journals : [],
      evaluations: staff ? db.evaluations : [],
      reports: staff ? db.reports : [],
      archives: staff ? db.archives : [],
      approvals: staff ? db.approvals : [],
      auditLogs: staff ? db.auditLogs : [],
      users: superAdmin ? db.users.map(sanitizeUser) : [],
      invites: superAdmin ? db.invites : [],
    });
  });

  // --- File Upload Route ---
  app.post('/api/upload', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.authUser!;
    if (!isStaff(user.role)) {
      res.status(403).json({ error: 'Hanya guru/panitia yang dapat mengunggah berkas.' });
      return;
    }
    const fileName = String(req.body?.fileName || 'file.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
    const base64Data = String(req.body?.base64Data || '');
    if (!base64Data) {
      res.status(400).json({ error: 'Data berkas kosong.' });
      return;
    }
    const cleanB64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Buffer.from(cleanB64, 'base64');
    const savedName = `${Date.now()}_${fileName}`;
    ensureDirs();
    fs.writeFileSync(path.join(UPLOADS_DIR, savedName), buffer);
    res.json({
      fileUrl: `/uploads/${savedName}`,
      storagePath: `uploads/${savedName}`,
      fileName,
      fileSize: buffer.length,
    });
  });

  // --- User Management (SUPER_ADMIN only) ---
  app.post('/api/users', requireAuth, (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    if (actor.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Hanya Admin/Super Admin yang dapat menambahkan akun.' });
      return;
    }
    const email = clamp(req.body?.email, 160).toLowerCase();
    const username = clamp(req.body?.username, 60);
    const displayName = clamp(req.body?.displayName, 120);
    const password = String(req.body?.password || '');
    const role = (req.body?.role || 'SISWA') as UserRole;
    const nipOrNisn = clamp(req.body?.nipOrNisn, 40);
    const className = clamp(req.body?.className, 40);

    if (!displayName || (!email && !username)) {
      res.status(400).json({ error: 'Nama lengkap dan username/email wajib diisi.' });
      return;
    }

    const db = readDb();
    const now = new Date().toISOString();
    const effectiveEmail = email || `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@smadarululum.local`;

    const duplicate = db.users.find(
      (u) =>
        u.email.toLowerCase() === effectiveEmail ||
        (username && u.username && u.username.toLowerCase() === username.toLowerCase())
    );

    if (duplicate) {
      duplicate.displayName = displayName;
      duplicate.role = role;
      duplicate.nipOrNisn = nipOrNisn;
      duplicate.className = className;
      if (username) duplicate.username = username;
      if (password.trim()) duplicate.passwordHash = hashPassword(password.trim());
      duplicate.updatedAt = now;
      appendAudit(db, actor, 'UPDATE', 'Akun Pengguna', duplicate.uid, `Memperbarui akun ${duplicate.username || duplicate.email}`);
      writeDb(db);
      res.json({ user: sanitizeUser(duplicate) });
      return;
    }

    if (!password.trim()) {
      const inviteIdx = db.invites.findIndex((i) => String(i.email).toLowerCase() === effectiveEmail);
      const inviteRecord = {
        id: effectiveEmail,
        email: effectiveEmail,
        displayName,
        role,
        nipOrNisn,
        className,
        createdBy: actor.uid,
        createdAt: now,
        updatedAt: now,
      };
      if (inviteIdx >= 0) db.invites[inviteIdx] = inviteRecord;
      else db.invites.push(inviteRecord);
      appendAudit(db, actor, 'CREATE', 'Hak Akses Pengguna', effectiveEmail, `Menetapkan undangan peran ${role} untuk ${effectiveEmail}`);
      writeDb(db);
      res.json({ invite: inviteRecord });
      return;
    }

    const newUid = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newUser: StoredUser = {
      id: newUid,
      uid: newUid,
      ...(username ? { username } : {}),
      displayName,
      email: effectiveEmail,
      role,
      nipOrNisn,
      className,
      phone: '',
      status: 'active',
      photoUrl: '',
      passwordHash: hashPassword(password.trim()),
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(newUser);
    appendAudit(db, actor, 'CREATE', 'Akun Pengguna', newUid, `Membuat akun login ${username || effectiveEmail} (${role})`);
    writeDb(db);
    res.json({ user: sanitizeUser(newUser) });
  });

  app.patch('/api/users/:uid', requireAuth, (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    if (actor.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = readDb();
    const target = db.users.find((u) => u.uid === req.params.uid);
    if (!target) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }
    if (req.body?.role) target.role = req.body.role as UserRole;
    if (req.body?.status) target.status = req.body.status as 'active' | 'inactive';
    target.updatedAt = new Date().toISOString();
    appendAudit(db, actor, 'UPDATE', 'Hak Akses Pengguna', target.uid, `Mengubah peran ${target.displayName} menjadi ${target.role} (${target.status})`);
    writeDb(db);
    res.json({ user: sanitizeUser(target) });
  });

  app.delete('/api/invites/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    if (actor.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = readDb();
    db.invites = db.invites.filter((i) => i.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

  // --- School Profile & Activity ---
  app.put('/api/school-profile', requireAuth, (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    if (actor.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Hanya Super Admin yang dapat mengubah identitas sekolah.' });
      return;
    }
    const db = readDb();
    const now = new Date().toISOString();
    db.schoolProfile = {
      ...(db.schoolProfile || { id: 'main', createdAt: now }),
      ...req.body,
      id: 'main',
      logoUrl: '',
      updatedBy: actor.uid,
      updatedAt: now,
    };
    appendAudit(db, actor, 'UPDATE', 'Pengaturan Sekolah', 'main', 'Memperbarui identitas sekolah');
    writeDb(db);
    res.json(db.schoolProfile);
  });

  app.put('/api/activity', requireAuth, (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    if (!['SUPER_ADMIN', 'KETUA_PELAKSANA'].includes(actor.role)) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = readDb();
    const now = new Date().toISOString();
    db.activity = {
      ...(db.activity || { id: MAIN_ACTIVITY_ID, createdBy: actor.uid, createdAt: now }),
      ...req.body,
      id: MAIN_ACTIVITY_ID,
      updatedAt: now,
    };
    appendAudit(db, actor, 'UPDATE', 'Identitas Kegiatan', MAIN_ACTIVITY_ID, 'Menyimpan identitas kegiatan kokurikuler');
    writeDb(db);
    res.json(db.activity);
  });

  // --- Students ---
  app.post('/api/students', requireAuth, (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    if (!['SUPER_ADMIN', 'KETUA_PELAKSANA'].includes(actor.role)) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = readDb();
    const now = new Date().toISOString();
    const id = `siswa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const busGroup = clamp(req.body?.busGroup || 'Bus 1', 60);
    const student = {
      id,
      activityId: MAIN_ACTIVITY_ID,
      nis: clamp(req.body?.nis, 30),
      name: clamp(req.body?.name, 120),
      className: clamp(req.body?.className, 40),
      gender: req.body?.gender === 'P' ? 'P' : 'L',
      parentPhone: clamp(req.body?.parentPhone, 30),
      participationStatus: req.body?.participationStatus || 'Terdaftar',
      notes: clamp(req.body?.notes, 500),
      createdBy: actor.uid,
      createdAt: now,
      updatedAt: now,
    };
    db.students.push(student);
    db.participants.push({
      id: `part-${id}`,
      activityId: MAIN_ACTIVITY_ID,
      studentId: id,
      nis: student.nis,
      studentName: student.name,
      className: student.className,
      busGroup,
      attendanceStatus: student.participationStatus === 'Hadir' ? 'Hadir' : student.participationStatus === 'Izin' ? 'Izin' : 'Terdaftar',
      createdBy: actor.uid,
      createdAt: now,
      updatedAt: now,
    });
    appendAudit(db, actor, 'CREATE', 'Data Peserta', id, `Menambahkan siswa ${student.name}`);
    writeDb(db);
    res.json(student);
  });

  app.patch('/api/students/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    if (!['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING'].includes(actor.role)) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = readDb();
    const idx = db.students.findIndex((s) => s.id === req.params.id);
    if (idx < 0) {
      res.status(404).json({ error: 'Siswa tidak ditemukan.' });
      return;
    }
    const now = new Date().toISOString();
    const { busGroup, ...rest } = req.body || {};
    db.students[idx] = { ...db.students[idx], ...rest, updatedAt: now };
    const pIdx = db.participants.findIndex((p) => p.id === `part-${req.params.id}`);
    if (pIdx >= 0) {
      db.participants[pIdx] = {
        ...db.participants[pIdx],
        ...(rest.nis !== undefined && { nis: rest.nis }),
        ...(rest.name !== undefined && { studentName: rest.name }),
        ...(rest.className !== undefined && { className: rest.className }),
        ...(busGroup !== undefined && { busGroup }),
        ...(rest.participationStatus !== undefined && {
          attendanceStatus:
            rest.participationStatus === 'Hadir'
              ? 'Hadir'
              : rest.participationStatus === 'Izin'
              ? 'Izin'
              : 'Terdaftar',
        }),
        updatedAt: now,
      };
    }
    appendAudit(db, actor, 'UPDATE', 'Data Peserta', req.params.id, `Memperbarui data peserta ${db.students[idx].name}`);
    writeDb(db);
    res.json(db.students[idx]);
  });

  app.delete('/api/students/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    if (!['SUPER_ADMIN', 'KETUA_PELAKSANA'].includes(actor.role)) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = readDb();
    db.students = db.students.filter((s) => s.id !== req.params.id);
    db.participants = db.participants.filter((p) => p.id !== `part-${req.params.id}`);
    appendAudit(db, actor, 'DELETE', 'Data Peserta', req.params.id, `Menghapus data peserta ${req.params.id}`);
    writeDb(db);
    res.json({ ok: true });
  });

  // --- Generic Staff Collection Helpers ---
  const registerStaffCrud = (
    route: string,
    key: 'teachers' | 'schedules' | 'journals' | 'documentation' | 'evaluations' | 'reports' | 'archives',
    moduleLabel: string,
    allowedRoles: UserRole[]
  ) => {
    app.post(`/api/${route}`, requireAuth, (req: AuthedRequest, res: Response) => {
      const actor = req.authUser!;
      if (!allowedRoles.includes(actor.role)) {
        res.status(403).json({ error: 'Akses ditolak.' });
        return;
      }
      const db = readDb();
      const now = new Date().toISOString();
      const id = `${route}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const extraOwner =
        key === 'journals' || key === 'reports'
          ? { authorUid: actor.uid, authorName: actor.displayName }
          : key === 'documentation' || key === 'archives'
          ? { uploadedByUid: actor.uid, uploadedByName: actor.displayName }
          : key === 'evaluations'
          ? { evaluatorUid: actor.uid, evaluatorName: actor.displayName }
          : { createdBy: actor.uid };
      const item = {
        ...req.body,
        id,
        activityId: MAIN_ACTIVITY_ID,
        ...extraOwner,
        createdAt: now,
        updatedAt: now,
      };
      db[key].push(item);
      appendAudit(db, actor, 'CREATE', moduleLabel, id, `Menambahkan data pada ${moduleLabel}`);
      writeDb(db);
      res.json(item);
    });

    app.patch(`/api/${route}/:id`, requireAuth, (req: AuthedRequest, res: Response) => {
      const actor = req.authUser!;
      if (!allowedRoles.includes(actor.role)) {
        res.status(403).json({ error: 'Akses ditolak.' });
        return;
      }
      const db = readDb();
      const idx = db[key].findIndex((x) => x.id === req.params.id);
      if (idx < 0) {
        res.status(404).json({ error: 'Data tidak ditemukan.' });
        return;
      }
      if (key === 'reports' && db[key][idx].status === 'Disetujui' && actor.role !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Laporan yang telah disetujui terkunci.' });
        return;
      }
      db[key][idx] = { ...db[key][idx], ...req.body, updatedAt: new Date().toISOString() };
      appendAudit(db, actor, 'UPDATE', moduleLabel, req.params.id, `Memperbarui data pada ${moduleLabel}`);
      writeDb(db);
      res.json(db[key][idx]);
    });

    app.delete(`/api/${route}/:id`, requireAuth, (req: AuthedRequest, res: Response) => {
      const actor = req.authUser!;
      if (!allowedRoles.includes(actor.role)) {
        res.status(403).json({ error: 'Akses ditolak.' });
        return;
      }
      const db = readDb();
      db[key] = db[key].filter((x) => x.id !== req.params.id);
      appendAudit(db, actor, 'DELETE', moduleLabel, req.params.id, `Menghapus data pada ${moduleLabel}`);
      writeDb(db);
      res.json({ ok: true });
    });
  };

  registerStaffCrud('teachers', 'teachers', 'Guru Pendamping', ['SUPER_ADMIN', 'KETUA_PELAKSANA']);
  registerStaffCrud('schedules', 'schedules', 'Agenda Rundown', ['SUPER_ADMIN', 'KETUA_PELAKSANA']);
  registerStaffCrud('journals', 'journals', 'Jurnal Pelaksanaan', ['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING']);
  registerStaffCrud('documentation', 'documentation', 'Dokumentasi', ['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING']);
  registerStaffCrud('evaluations', 'evaluations', 'Evaluasi Kegiatan', ['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING', 'KEPALA_SEKOLAH']);
  registerStaffCrud('reports', 'reports', 'Laporan Otomatis', ['SUPER_ADMIN', 'KETUA_PELAKSANA']);
  registerStaffCrud('archives', 'archives', 'Arsip Digital', ['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING']);

  // --- Reflections & LKPD (Student Owner or Staff Grading) ---
  const registerStudentSubmission = (
    route: string,
    key: 'reflections' | 'lkpdSubmissions',
    moduleLabel: string
  ) => {
    app.post(`/api/${route}`, requireAuth, (req: AuthedRequest, res: Response) => {
      const actor = req.authUser!;
      const db = readDb();
      const now = new Date().toISOString();
      const id = `${route}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const item = {
        ...req.body,
        id,
        activityId: MAIN_ACTIVITY_ID,
        studentUid: actor.uid,
        reviewStatus: 'Menunggu Penilaian',
        createdAt: now,
        updatedAt: now,
      };
      delete (item as Record<string, unknown>).teacherScore;
      delete (item as Record<string, unknown>).teacherFeedback;
      db[key].push(item);
      appendAudit(db, actor, 'CREATE', moduleLabel, id, `Menambahkan ${moduleLabel}`);
      writeDb(db);
      res.json(item);
    });

    app.patch(`/api/${route}/:id`, requireAuth, (req: AuthedRequest, res: Response) => {
      const actor = req.authUser!;
      const db = readDb();
      const idx = db[key].findIndex((x) => x.id === req.params.id);
      if (idx < 0) {
        res.status(404).json({ error: 'Data tidak ditemukan.' });
        return;
      }
      const existing = db[key][idx];
      const now = new Date().toISOString();
      const canGrade = ['SUPER_ADMIN', 'KETUA_PELAKSANA', 'GURU_PENDAMPING'].includes(actor.role);

      if (req.body?.reviewStatus === 'Dinilai' && canGrade) {
        db[key][idx] = {
          ...existing,
          teacherScore: Math.max(0, Math.min(100, Number(req.body.teacherScore ?? 0))),
          teacherFeedback: clamp(req.body.teacherFeedback, 1000),
          reviewStatus: 'Dinilai',
          reviewedByUid: actor.uid,
          reviewedByName: actor.displayName,
          updatedAt: now,
        };
        appendAudit(db, actor, 'UPDATE', moduleLabel, req.params.id, `Menilai ${moduleLabel} skor ${req.body.teacherScore}`);
      } else if (actor.role === 'SUPER_ADMIN' || (existing.studentUid === actor.uid && existing.reviewStatus === 'Menunggu Penilaian')) {
        const { teacherScore: _s, teacherFeedback: _f, reviewStatus: _r, ...editable } = req.body || {};
        db[key][idx] = { ...existing, ...editable, updatedAt: now };
      } else {
        res.status(403).json({ error: 'Tidak memiliki izin memperbarui data ini.' });
        return;
      }
      writeDb(db);
      res.json(db[key][idx]);
    });

    app.delete(`/api/${route}/:id`, requireAuth, (req: AuthedRequest, res: Response) => {
      const actor = req.authUser!;
      const db = readDb();
      const existing = db[key].find((x) => x.id === req.params.id);
      if (!existing) {
        res.status(404).json({ error: 'Data tidak ditemukan.' });
        return;
      }
      const allowed =
        actor.role === 'SUPER_ADMIN' ||
        (existing.studentUid === actor.uid && existing.reviewStatus === 'Menunggu Penilaian');
      if (!allowed) {
        res.status(403).json({ error: 'Akses ditolak.' });
        return;
      }
      db[key] = db[key].filter((x) => x.id !== req.params.id);
      appendAudit(db, actor, 'DELETE', moduleLabel, req.params.id, `Menghapus ${moduleLabel}`);
      writeDb(db);
      res.json({ ok: true });
    });
  };

  registerStudentSubmission('reflections', 'reflections', 'Refleksi Siswa');
  registerStudentSubmission('lkpd', 'lkpdSubmissions', 'Instrumen LKPD');

  // --- Approvals ---
  app.post('/api/approvals', requireAuth, (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    if (!['SUPER_ADMIN', 'KEPALA_SEKOLAH'].includes(actor.role)) {
      res.status(403).json({ error: 'Hanya Kepala Sekolah atau Super Admin yang dapat menyetujui laporan.' });
      return;
    }
    const db = readDb();
    const now = new Date().toISOString();
    const reportId = String(req.body?.reportId || '');
    const approvalId = `approval-${reportId}`;
    const status = String(req.body?.status || 'Disetujui');
    const record = {
      id: approvalId,
      activityId: MAIN_ACTIVITY_ID,
      reportId,
      reportTitle: clamp(req.body?.reportTitle, 250),
      status,
      decisionNotes: clamp(req.body?.decisionNotes, 2000),
      approverUid: actor.uid,
      approverName: actor.displayName,
      approverNip: String(db.schoolProfile?.principalNip || actor.nipOrNisn || '-'),
      createdAt: now,
      updatedAt: now,
    };
    const existingIdx = db.approvals.findIndex((a) => a.id === approvalId);
    if (existingIdx >= 0) db.approvals[existingIdx] = { ...db.approvals[existingIdx], ...record };
    else db.approvals.push(record);

    const rIdx = db.reports.findIndex((r) => r.id === reportId);
    if (rIdx >= 0) {
      db.reports[rIdx].status =
        status === 'Disetujui' ? 'Disetujui' : status === 'Revisi' || status === 'Ditolak' ? 'Revisi' : 'Menunggu Persetujuan';
      db.reports[rIdx].updatedAt = now;
    }
    appendAudit(db, actor, 'APPROVE', 'Persetujuan Laporan', reportId, `Status persetujuan: ${status}`);
    writeDb(db);
    res.json(record);
  });

  // --- Audit Log ---
  app.post('/api/audit', requireAuth, (req: AuthedRequest, res: Response) => {
    const actor = req.authUser!;
    const db = readDb();
    appendAudit(
      db,
      actor,
      req.body?.action || 'CREATE',
      String(req.body?.module || 'Sistem'),
      String(req.body?.targetId || 'system'),
      String(req.body?.summary || '-')
    );
    writeDb(db);
    res.json({ ok: true });
  });

  // --- Frontend Serving (Vite Dev Middleware vs Production Dist) ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
