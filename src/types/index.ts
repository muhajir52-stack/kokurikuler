import type { Timestamp } from 'firebase/firestore';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'KEPALA_SEKOLAH'
  | 'KETUA_PELAKSANA'
  | 'GURU_PENDAMPING'
  | 'SISWA';

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  KEPALA_SEKOLAH: 'Kepala Sekolah',
  KETUA_PELAKSANA: 'Ketua Pelaksana',
  GURU_PENDAMPING: 'Guru Pendamping',
  SISWA: 'Siswa',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Akses penuh seluruh modul, manajemen akun, hak akses, dan pengaturan sistem.',
  KEPALA_SEKOLAH: 'Memantau dasbor, memeriksa hasil evaluasi, dan memberikan persetujuan laporan.',
  KETUA_PELAKSANA: 'Mengelola identitas kegiatan, peserta, guru pendamping, rundown, arsip, dan laporan.',
  GURU_PENDAMPING: 'Mengisi jurnal pelaksanaan, mengunggah dokumentasi, menilai refleksi, dan evaluasi.',
  SISWA: 'Melihat informasi kegiatan, jadwal, dokumentasi yang diizinkan, serta mengisi refleksi belajar.',
};

export type AppModuleId =
  | 'dashboard'
  | 'beranda'
  | 'identitas'
  | 'peserta'
  | 'guru'
  | 'rundown'
  | 'jurnal'
  | 'dokumentasi'
  | 'refleksi'
  | 'lkpd'
  | 'evaluasi'
  | 'laporan'
  | 'arsip'
  | 'pengaturan';

export const DOC_CATEGORIES = [
  'Persiapan keberangkatan',
  'Perjalanan',
  'Kunjungan Makam Bung Karno',
  'Kunjungan Museum Bung Karno',
  'Kegiatan edukasi',
  'Diskusi dan refleksi',
  'Foto bersama',
  'Penutupan kegiatan',
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const ARCHIVE_CATEGORIES = [
  'Surat Izin Kegiatan',
  'Surat Tugas',
  'Proposal',
  'Rencana Anggaran Biaya',
  'Daftar Hadir',
  'Surat Pemberitahuan Orang Tua',
  'Laporan Kegiatan',
  'Dokumentasi',
] as const;

export type ArchiveCategory = (typeof ARCHIVE_CATEGORIES)[number];

export const MAIN_ACTIVITY_ID = 'kokurikuler-2026';
export const SCHOOL_PROFILE_ID = 'main';
export const BOOTSTRAP_ADMIN_EMAIL = 'muhajir52@guru.sma.belajar.id';

export interface UserAccount {
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
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface UserInvite {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  nipOrNisn?: string;
  className?: string;
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface SchoolProfile {
  id: string;
  schoolName: string;
  npsn?: string;
  address: string;
  district?: string;
  regency?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName: string;
  principalNip?: string;
  academicYear: string;
  logoUrl?: string;
  updatedBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Activity {
  id: string;
  name: string;
  theme: string;
  year: number;
  background?: string;
  purpose?: string;
  legalBasis?: string;
  dayDate: string;
  departureTime?: string;
  destination: string;
  destinationAddress?: string;
  personInCharge?: string;
  chiefExecutive?: string;
  companionTeachersSummary?: string;
  participantCountTarget?: number;
  fundingSource?: string;
  status: 'Persiapan' | 'Berjalan' | 'Selesai';
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Student {
  id: string;
  activityId: string;
  nis: string;
  name: string;
  className: string;
  gender: 'L' | 'P';
  parentPhone?: string;
  participationStatus: 'Terdaftar' | 'Hadir' | 'Izin' | 'Tidak Hadir';
  notes?: string;
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Teacher {
  id: string;
  activityId: string;
  name: string;
  nipNuptk?: string;
  position: string;
  mentoringTask: string;
  phone?: string;
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ActivityParticipant {
  id: string;
  activityId: string;
  studentId: string;
  nis: string;
  studentName: string;
  className: string;
  busGroup?: string;
  attendanceStatus: 'Terdaftar' | 'Hadir' | 'Izin' | 'Sakit';
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ActivitySchedule {
  id: string;
  activityId: string;
  orderNo: number;
  timeRange: string;
  activityTitle: string;
  location: string;
  personInCharge: string;
  notes?: string;
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ActivityJournal {
  id: string;
  activityId: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attendeesCount: number;
  condition: 'Lancar' | 'Terkendali' | 'Perlu Perhatian';
  companionNotes?: string;
  obstacles?: string;
  solutions?: string;
  authorUid: string;
  authorName: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ActivityDocumentation {
  id: string;
  activityId: string;
  title: string;
  caption: string;
  mediaType: 'photo' | 'video';
  category: DocCategory;
  capturedDate: string;
  location: string;
  fileUrl: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: number;
  isAllowedForStudent: boolean;
  uploadedByUid: string;
  uploadedByName: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface StudentReflection {
  id: string;
  activityId: string;
  studentUid: string;
  studentName: string;
  className: string;
  newKnowledge: string;
  historicalValues: string;
  soekarnoExemplar: string;
  memorableExperience?: string;
  nationalismApplication?: string;
  learningConclusion: string;
  teacherScore?: number;
  teacherFeedback?: string;
  reviewStatus: 'Menunggu Penilaian' | 'Dinilai';
  reviewedByUid?: string;
  reviewedByName?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface LkpdSubmission {
  id: string;
  activityId: string;
  studentUid: string;
  studentName: string;
  className: string;
  groupName: string;
  members: string;
  sejarah1?: string;
  sejarah2?: string;
  pkn1?: string;
  pkn2?: string;
  bahasa1?: string;
  bahasa2?: string;
  ekonomi1?: string;
  ekonomi2?: string;
  pai1?: string;
  pai2?: string;
  geografi1?: string;
  geografi2?: string;
  teacherScore?: number;
  teacherFeedback?: string;
  reviewStatus: 'Menunggu Penilaian' | 'Dinilai';
  reviewedByUid?: string;
  reviewedByName?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ActivityEvaluation {
  id: string;
  activityId: string;
  goalAlignment: string;
  studentParticipationLevel: string;
  participantDiscipline: string;
  activitySuccessRate: number;
  supportingFactors?: string;
  obstacles?: string;
  solutions?: string;
  recommendations?: string;
  evaluatorUid: string;
  evaluatorName: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ActivityReport {
  id: string;
  activityId: string;
  title: string;
  reportNumber: string;
  academicYear: string;
  status: 'Draft' | 'Menunggu Persetujuan' | 'Disetujui' | 'Revisi';
  bab1Background?: string;
  bab1Basis?: string;
  bab1Purpose?: string;
  bab1Benefits?: string;
  bab2Identity?: string;
  bab2ScheduleTimePlace?: string;
  bab2ParticipantsSummary?: string;
  bab2TeachersSummary?: string;
  bab2ExecutionNarrative?: string;
  bab3VisitResults?: string;
  bab3StudentObservations?: string;
  bab3NationalismValues?: string;
  bab3ReflectionSummary?: string;
  bab4Evaluation?: string;
  bab4SupportingFactors?: string;
  bab4ObstaclesSolutions?: string;
  bab4Recommendations?: string;
  bab5Conclusion?: string;
  bab5Suggestions?: string;
  authorUid: string;
  authorName: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface DigitalArchive {
  id: string;
  activityId: string;
  category: ArchiveCategory;
  title: string;
  documentNumber?: string;
  documentDate: string;
  description?: string;
  fileUrl: string;
  storagePath?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  uploadedByUid: string;
  uploadedByName: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Approval {
  id: string;
  activityId: string;
  reportId: string;
  reportTitle: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Revisi';
  decisionNotes?: string;
  approverUid: string;
  approverName: string;
  approverNip?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'BACKUP';
  module: string;
  targetId: string;
  summary: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  createdAt?: Timestamp | null;
}

export function isStaffRole(role: UserRole): boolean {
  return role !== 'SISWA';
}

export function canAccessModule(role: UserRole, moduleId: AppModuleId): boolean {
  if (role === 'SUPER_ADMIN') return true;
  if (role === 'SISWA') {
    return ['beranda', 'rundown', 'dokumentasi', 'refleksi', 'lkpd'].includes(moduleId);
  }
  if (role === 'KEPALA_SEKOLAH') {
    return moduleId !== 'pengaturan';
  }
  if (role === 'KETUA_PELAKSANA') {
    return moduleId !== 'pengaturan';
  }
  if (role === 'GURU_PENDAMPING') {
    return [
      'dashboard',
      'beranda',
      'identitas',
      'peserta',
      'guru',
      'rundown',
      'jurnal',
      'dokumentasi',
      'refleksi',
      'lkpd',
      'evaluasi',
      'laporan',
      'arsip',
    ].includes(moduleId);
  }
  return false;
}
