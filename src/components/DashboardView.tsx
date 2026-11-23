import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { seedInitialSchoolData } from '../lib/seedData';
import type { AppModuleId } from '../types';

interface DashboardViewProps {
  onNavigate: (moduleId: AppModuleId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { firebaseUser, userProfile, effectiveRole } = useAuth();
  const {
    loading,
    activity,
    students,
    teachers,
    schedules,
    journals,
    documentation,
    reflections,
    lkpdSubmissions,
    evaluations,
    reports,
    archives,
    approvals,
    auditLogs,
  } = useData();

  const [seeding, setSeeding] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState<string | null>(null);

  const canSeed =
    effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'KETUA_PELAKSANA';

  const handleSeed = async () => {
    if (!firebaseUser) return;
    setSeeding(true);
    setSeedFeedback(null);
    try {
      await seedInitialSchoolData(
        firebaseUser.uid,
        userProfile?.displayName || firebaseUser.displayName || 'Administrator'
      );
      setSeedFeedback('Data awal kegiatan tahun 2026 berhasil dimuat ke Firestore.');
    } catch (err) {
      setSeedFeedback(err instanceof Error ? err.message : 'Gagal memuat data awal.');
    } finally {
      setSeeding(false);
    }
  };

  // Report completeness calculation across 7 core pillars
  const completenessChecks = useMemo(
    () => [
      { label: 'Identitas Kegiatan', done: Boolean(activity?.name), module: 'identitas' as AppModuleId },
      { label: 'Data Peserta Didik', done: students.length > 0, module: 'peserta' as AppModuleId },
      { label: 'Guru Pendamping', done: teachers.length > 0, module: 'guru' as AppModuleId },
      { label: 'Rundown Kegiatan', done: schedules.length > 0, module: 'rundown' as AppModuleId },
      { label: 'Jurnal Pelaksanaan', done: journals.length > 0, module: 'jurnal' as AppModuleId },
      { label: 'Dokumentasi Foto/Video', done: documentation.length > 0, module: 'dokumentasi' as AppModuleId },
      { label: 'Evaluasi & Laporan', done: evaluations.length > 0 && reports.length > 0, module: 'laporan' as AppModuleId },
    ],
    [activity, students, teachers, schedules, journals, documentation, evaluations, reports]
  );

  const completedCount = completenessChecks.filter((c) => c.done).length;
  const completenessPct = Math.round((completedCount / completenessChecks.length) * 100);

  // Chart 1: Participants by class
  const participantsByClass = useMemo(() => {
    const map = new Map<string, { kelas: string; Hadir: number; Terdaftar: number }>();
    for (const s of students) {
      const entry = map.get(s.className) || { kelas: s.className, Hadir: 0, Terdaftar: 0 };
      if (s.participationStatus === 'Hadir') entry.Hadir += 1;
      else entry.Terdaftar += 1;
      map.set(s.className, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.kelas.localeCompare(b.kelas));
  }, [students]);

  // Chart 2: Student Engagement (Reflections submitted across classes)
  const studentEngagementByClass = useMemo(() => {
    const map = new Map<
      string,
      { kelas: string; Dinilai: number; 'Menunggu Penilaian': number; total: number }
    >();
    for (const s of students) {
      if (!map.has(s.className)) {
        map.set(s.className, {
          kelas: s.className,
          Dinilai: 0,
          'Menunggu Penilaian': 0,
          total: 0,
        });
      }
    }
    for (const r of reflections) {
      const cls = r.className || 'Lainnya';
      const entry = map.get(cls) || {
        kelas: cls,
        Dinilai: 0,
        'Menunggu Penilaian': 0,
        total: 0,
      };
      if (r.reviewStatus === 'Dinilai') {
        entry.Dinilai += 1;
      } else {
        entry['Menunggu Penilaian'] += 1;
      }
      entry.total += 1;
      map.set(cls, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.kelas.localeCompare(b.kelas));
  }, [reflections, students]);

  const avgReflectionScore = useMemo(() => {
    const graded = reflections.filter((r) => typeof r.teacherScore === 'number');
    if (graded.length === 0) return null;
    const sum = graded.reduce((acc, r) => acc + (r.teacherScore || 0), 0);
    return Math.round((sum / graded.length) * 10) / 10;
  }, [reflections]);

  const latestEval = evaluations[0];
  const latestApproval = approvals[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#A37B14] mb-1">
            DASBOR ANALITIK KEGIATAN · TAHUN PELAKSANAAN {activity?.year || 2026}
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#0F2547] text-balance">
            {activity?.name || 'Kegiatan Kokurikuler Kunjungan Edukatif Tahun 2026'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {activity?.theme ||
              'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno, Presiden Pertama Republik Indonesia'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!activity && canSeed && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C9A227] hover:bg-[#B48A1E] text-[#081429] text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <Database className="w-4 h-4" />
              <span>{seeding ? 'Menyiapkan Data...' : 'Inisialisasi Data Awal 2026'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('laporan')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F2547] hover:bg-[#173463] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#E0BD4F]" />
            <span>Buka Laporan Otomatis</span>
          </button>
        </div>
      </div>

      {seedFeedback && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-800">
          {seedFeedback}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Peserta & Pendamping</span>
            <Users className="w-4 h-4 text-[#0F2547]" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums">{students.length}</p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {students.filter((s) => s.participationStatus === 'Hadir').length} hadir · {teachers.length} guru pendamping
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">LKPD & Refleksi</span>
            <FileSpreadsheet className="w-4 h-4 text-[#0F2547]" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums">{lkpdSubmissions.length + reflections.length}</p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {lkpdSubmissions.length} LKPD · {reflections.length} refleksi siswa
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Dokumentasi & Laporan</span>
            <FileText className="w-4 h-4 text-[#0F2547]" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 tabular-nums">{reports.length}</p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {documentation.length} media · {latestApproval ? `Status: ${latestApproval.status}` : reports[0]?.status || 'Belum disusun'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Kelengkapan Laporan</span>
            <TrendingUp className="w-4 h-4 text-[#A37B14]" />
          </div>
          <p className="text-2xl font-semibold text-[#0F2547] tabular-nums">{completenessPct}%</p>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-[#C9A227] rounded-full transition-all duration-300"
              style={{ width: `${completenessPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Grafik Peserta Didik per Kelas
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan peserta hadir dan terdaftar berdasarkan kelas
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('peserta')}
              className="text-xs font-medium text-[#0F2547] hover:underline whitespace-nowrap cursor-pointer"
            >
              Kelola Peserta
            </button>
          </div>
          <div className="h-64 w-full">
            {participantsByClass.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Belum ada data peserta untuk ditampilkan.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={participantsByClass} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="kelas" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip />
                  <Bar dataKey="Hadir" fill="#0F2547" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Terdaftar" fill="#C9A227" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Student Engagement
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                Distribusi refleksi siswa yang dikirimkan per kelas ({reflections.length} total refleksi)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('refleksi')}
              className="text-xs font-medium text-[#0F2547] hover:underline whitespace-nowrap cursor-pointer"
            >
              Lihat Refleksi
            </button>
          </div>
          <div className="h-64 w-full">
            {reflections.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                <p className="text-sm text-slate-400">
                  Belum ada refleksi pembelajaran siswa yang dikirimkan.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('refleksi')}
                  className="text-xs font-semibold text-[#0F2547] hover:underline cursor-pointer"
                >
                  Buka Modul Observasi & Refleksi
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={studentEngagementByClass}
                  margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="kelas" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="Dinilai"
                    stackId="engagement"
                    fill="#0F2547"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="Menunggu Penilaian"
                    stackId="engagement"
                    fill="#C9A227"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Completeness, Timeline & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Kelengkapan Laporan & Ringkasan Hasil */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Status Kelengkapan Data
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Kesiapan komponen penyusunan laporan pertanggungjawaban
            </p>
            <div className="space-y-2.5">
              {completenessChecks.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onNavigate(item.module)}
                  className="w-full flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0 text-left hover:bg-slate-50 px-2 rounded transition-colors cursor-pointer"
                >
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      item.done ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {item.done ? 'Lengkap' : 'Perlu Diisi'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">Ringkasan Hasil Kegiatan</p>
            <p className="tabular-nums">
              Refleksi Pembelajaran: {reflections.length} masuk · Rata-rata skor{' '}
              {avgReflectionScore !== null ? avgReflectionScore : '-'}
            </p>
            <p className="tabular-nums">
              Tingkat Keberhasilan Evaluasi:{' '}
              {latestEval ? `${latestEval.activitySuccessRate}%` : 'Belum dievaluasi'}
            </p>
            <p className="tabular-nums">Arsip Administrasi Tersimpan: {archives.length} dokumen</p>
          </div>
        </div>

        {/* Timeline Kegiatan */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Timeline Kegiatan</h2>
            <Calendar className="w-4 h-4 text-[#A37B14]" />
          </div>
          {schedules.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              Belum ada agenda rundown tersimpan.
            </p>
          ) : (
            <div className="space-y-4">
              {schedules.slice(0, 6).map((item) => (
                <div key={item.id} className="flex gap-3 pb-3 border-b border-slate-100 last:border-b-0">
                  <span className="font-mono text-xs font-semibold text-[#0F2547] tabular-nums shrink-0 w-28">
                    {item.timeRange}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 leading-snug">
                      {item.activityTitle}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {item.location} · {item.personInCharge}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aktivitas Terbaru */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Aktivitas Terbaru</h2>
            <span className="text-xs text-slate-500">Riwayat Real-Time</span>
          </div>
          {auditLogs.length === 0 && journals.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              Belum ada aktivitas tercatat.
            </p>
          ) : (
            <div className="space-y-3">
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="pb-3 border-b border-slate-100 last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0F2547]">{log.module}</span>
                    <span className="text-[11px] font-mono text-slate-400">{log.action}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5 leading-snug">{log.summary}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Oleh {log.actorName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
