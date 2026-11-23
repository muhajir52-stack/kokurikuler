import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileText,
  Printer,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { exportReportToDocx, exportReportToPdf } from '../lib/exporters';
import type { ActivityReport, Approval } from '../types';
import { ConfirmModal } from './ConfirmModal';

export const ReportView: React.FC = () => {
  const { effectiveRole } = useAuth();
  const {
    schoolProfile,
    activity,
    students,
    teachers,
    schedules,
    journals,
    documentation,
    reflections,
    evaluations,
    reports,
    approvals,
    addReport,
    updateReport,
    deleteReport,
    submitApprovalDecision,
  } = useData();

  const canCompose = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'KETUA_PELAKSANA';
  const canApprove = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'KEPALA_SEKOLAH';

  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActivityReport | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [approvalStatus, setApprovalStatus] = useState<Approval['status']>('Disetujui');
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    if (reports.length > 0 && !reports.some((r) => r.id === selectedReportId)) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  const activeReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId) || reports[0] || null,
    [reports, selectedReportId]
  );

  const activeApproval = useMemo(
    () => (activeReport ? approvals.find((a) => a.reportId === activeReport.id) || null : null),
    [approvals, activeReport]
  );

  const [draft, setDraft] = useState<Partial<ActivityReport>>({});

  useEffect(() => {
    if (activeReport) {
      setDraft(activeReport);
      setApprovalNotes(activeApproval?.decisionNotes || '');
    }
  }, [activeReport, activeApproval]);

  const buildAutoReportPayload = (): Omit<
    ActivityReport,
    'id' | 'activityId' | 'authorUid' | 'authorName' | 'createdAt' | 'updatedAt'
  > => {
    const presentCount = students.filter((s) => s.participationStatus === 'Hadir').length;
    const maleCount = students.filter((s) => s.gender === 'L').length;
    const femaleCount = students.filter((s) => s.gender === 'P').length;
    const avgScore =
      reflections.filter((r) => typeof r.teacherScore === 'number').length > 0
        ? (
            reflections
              .filter((r) => typeof r.teacherScore === 'number')
              .reduce((a, b) => a + (b.teacherScore || 0), 0) /
            reflections.filter((r) => typeof r.teacherScore === 'number').length
          ).toFixed(1)
        : 'Belum dinilai';
    const latestEval = evaluations[0];

    const journalNarrative =
      journals.length > 0
        ? journals
            .map(
              (j, i) =>
                `${i + 1}. [${j.date} · ${j.time}] ${j.location}: ${j.description} (Hadir: ${j.attendeesCount} siswa, Kondisi: ${j.condition}).`
            )
            .join('\n')
        : 'Pelaksanaan kunjungan edukatif berjalan tertib mulai dari pemberangkatan di halaman SMA Darul Ulum Kepohbaru hingga seluruh rangkaian observasi di kompleks Makam dan Museum Ir. Soekarno, Kota Blitar.';

    const reflectionHighlights =
      reflections.length > 0
        ? reflections
            .slice(0, 5)
            .map(
              (r) =>
                `- ${r.studentName} (${r.className}): ${r.historicalValues} | Keteladanan: ${r.soekarnoExemplar}`
            )
            .join('\n')
        : 'Peserta didik menunjukkan pemahaman mendalam mengenai nilai perjuangan, semangat persatuan, dan pengabdian Ir. Soekarno bagi kemerdekaan Republik Indonesia.';

    return {
      title: `Laporan Pertanggungjawaban ${activity?.name || 'Kegiatan Kokurikuler Tahun 2026'}`,
      reportNumber: `421.3/045/SMA-DU/${activity?.year || 2026}`,
      academicYear: schoolProfile?.academicYear || '2025/2026',
      status: 'Draft',
      bab1Background:
        activity?.background ||
        'Kegiatan kokurikuler SMA Darul Ulum Kepohbaru merupakan bagian integral penguatan karakter kebangsaan dan pembelajaran kontekstual di luar kelas.',
      bab1Basis:
        activity?.legalBasis ||
        '1. UU No. 20 Tahun 2003 tentang Sistem Pendidikan Nasional.\n2. Program Kerja SMA Darul Ulum Kepohbaru Tahun Pelajaran 2025/2026.',
      bab1Purpose:
        activity?.purpose ||
        '1. Mengenalkan sejarah perjuangan Ir. Soekarno secara langsung.\n2. Menumbuhkan sikap nasionalisme dan cinta tanah air peserta didik.',
      bab1Benefits:
        '1. Bagi Siswa: Memperoleh pengalaman belajar historis secara langsung serta memperkokoh karakter Profil Pelajar Pancasila.\n2. Bagi Sekolah: Menjadi wahana integrasi pembelajaran lintas mata pelajaran Sejarah, PPKn, dan Pendidikan Agama.',
      bab2Identity: `Nama Kegiatan: ${activity?.name || '-'}\nTema: ${activity?.theme || '-'}\nPenanggung Jawab: ${activity?.personInCharge || schoolProfile?.principalName || '-'}\nKetua Pelaksana: ${activity?.chiefExecutive || '-'}\nSumber Pembiayaan: ${activity?.fundingSource || '-'}`,
      bab2ScheduleTimePlace: `Hari/Tanggal: ${activity?.dayDate || 'Sabtu, 14 Februari 2026'}\nKeberangkatan: ${activity?.departureTime || '05.30 WIB'}\nTujuan: ${activity?.destination || 'Makam dan Museum Ir. Soekarno Blitar'}\nAlamat: ${activity?.destinationAddress || 'Jl. Kalasan No. 1, Bendogerit, Kota Blitar'}\nJumlah Agenda Tercatat: ${schedules.length} sesi kegiatan (lihat Lampiran Rundown).`,
      bab2ParticipantsSummary: `Total peserta tercatat: ${students.length} siswa (Laki-laki: ${maleCount}, Perempuan: ${femaleCount}). Peserta hadir penuh: ${presentCount} siswa. Daftar lengkap tercantum pada Lampiran Daftar Peserta dan Daftar Hadir.`,
      bab2TeachersSummary: `Jumlah guru pendamping: ${teachers.length} orang (${teachers.map((t) => t.name).join(', ') || 'terlampir'}).`,
      bab2ExecutionNarrative: journalNarrative,
      bab3VisitResults: `Seluruh rangkaian kunjungan edukatif ke Makam dan Museum Perpustakaan Nasional Bung Karno di Kota Blitar terlaksana dengan lancar. Terhimpun ${documentation.length} arsip dokumentasi foto dan video pada berbagai tahapan kegiatan.`,
      bab3StudentObservations: reflectionHighlights,
      bab3NationalismValues:
        'Nilai sejarah dan nasionalisme utama yang diserap peserta didik meliputi semangat persatuan (Bhinneka Tunggal Ika), pantang menyerah dalam memperjuangkan kemerdekaan, keteguhan berprinsip, serta kepedulian terhadap pelestarian warisan sejarah bangsa.',
      bab3ReflectionSummary: `Tercatat ${reflections.length} lembar refleksi pembelajaran siswa yang telah dianalisis dengan rata-rata nilai ${avgScore}.`,
      bab4Evaluation: latestEval
        ? `Tingkat keberhasilan kegiatan mencapai ${latestEval.activitySuccessRate}%. Kesesuaian tujuan: ${latestEval.goalAlignment} Partisipasi siswa: ${latestEval.studentParticipationLevel} Kedisiplinan: ${latestEval.participantDiscipline}`
        : 'Kegiatan berjalan tertib, aman, dan sesuai tujuan pembelajaran kokurikuler yang telah ditetapkan.',
      bab4SupportingFactors:
        latestEval?.supportingFactors ||
        'Koordinasi solid antara pimpinan sekolah, guru pendamping, komite, serta kedisiplinan seluruh peserta didik.',
      bab4ObstaclesSolutions: latestEval
        ? `Kendala: ${latestEval.obstacles || '-'}\nSolusi: ${latestEval.solutions || '-'}`
        : 'Kendala minor berupa kepadatan pengunjung umum diatasi dengan pembagian kelompok observasi bergilir.',
      bab4Recommendations:
        latestEval?.recommendations ||
        'Kegiatan serupa direkomendasikan terus dilaksanakan secara berkala dengan penambahan sesi presentasi hasil observasi di kelas.',
      bab5Conclusion: `Kegiatan Kokurikuler ${activity?.name || 'Tahun 2026'} SMA Darul Ulum Kepohbaru – Bojonegoro berjalan sukses, aman, dan memberikan dampak positif bagi pemahaman sejarah serta sikap nasionalisme siswa.`,
      bab5Suggestions:
        'Diharapkan arsip dokumentasi dan hasil refleksi siswa dapat dimanfaatkan sebagai bahan ajar kontekstual pada mata pelajaran terkait.',
    };
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setFeedback(null);
    try {
      const payload = buildAutoReportPayload();
      const id = await addReport(payload);
      setSelectedReportId(id);
      setMode('preview');
      setFeedback('Laporan pertanggungjawaban otomatis berhasil disusun dari seluruh data database.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Gagal menyusun laporan otomatis.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdits = async (submitForApproval = false) => {
    if (!activeReport) return;
    setSaving(true);
    setFeedback(null);
    try {
      await updateReport(activeReport.id, {
        ...draft,
        status: submitForApproval ? 'Menunggu Persetujuan' : draft.status || activeReport.status,
      });
      setMode('preview');
      setFeedback(
        submitForApproval
          ? 'Laporan diajukan kepada Kepala Sekolah untuk persetujuan.'
          : 'Perubahan isi laporan berhasil disimpan.'
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Gagal menyimpan perubahan laporan.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;
    setSaving(true);
    setFeedback(null);
    try {
      await submitApprovalDecision({
        reportId: activeReport.id,
        reportTitle: activeReport.title,
        status: approvalStatus,
        decisionNotes: approvalNotes,
      });
      setFeedback(`Keputusan persetujuan (${approvalStatus}) berhasil dicatat.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Gagal menyimpan keputusan persetujuan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!activeReport) return;
    exportReportToPdf({
      report: activeReport,
      school: schoolProfile,
      activity,
      students,
      teachers,
      schedules,
      journals,
      documentation,
      reflections,
      evaluations,
      approval: activeApproval,
    });
  };

  const handleDownloadDocx = async () => {
    if (!activeReport) return;
    setExportingDocx(true);
    try {
      await exportReportToDocx({
        report: activeReport,
        school: schoolProfile,
        activity,
        students,
        teachers,
        schedules,
        journals,
        documentation,
        reflections,
        evaluations,
        approval: activeApproval,
      });
    } finally {
      setExportingDocx(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteReport(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const isLocked = activeReport?.status === 'Disetujui' && effectiveRole !== 'SUPER_ADMIN';
  const schoolName = schoolProfile?.schoolName || 'SMA DARUL ULUM KEPOHBARU';

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F2547]">
            Laporan Pertanggungjawaban Otomatis
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Generator dokumen resmi BAB I–V & Lampiran lengkap dengan Kop Surat, Daftar Isi, dan Ekspor A4.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canCompose && (
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A227] hover:bg-[#B48A1E] text-[#081429] text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? 'Menyusun Laporan...' : 'Susun Laporan Otomatis'}</span>
            </button>
          )}
          {activeReport && (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak A4</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#E0BD4F]" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadDocx}
                disabled={exportingDocx}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#0F2547]" />
                <span>{exportingDocx ? 'Menyiapkan DOCX...' : 'Download DOCX'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div className="no-print p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-800">
          {feedback}
        </div>
      )}

      {/* Report Selector & Mode Toggle */}
      {reports.length > 0 && activeReport && (
        <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={activeReport.id}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.reportNumber} — {r.status}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              Status:{' '}
              <strong className="text-[#0F2547]">{activeReport.status}</strong>
              {activeApproval && ` · Keputusan Kepsek: ${activeApproval.status}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
                mode === 'preview'
                  ? 'bg-[#0F2547] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Laporan</span>
            </button>
            {canCompose && !isLocked && (
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
                  mode === 'edit'
                    ? 'bg-[#0F2547] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Laporan</span>
              </button>
            )}
            {canCompose && !isLocked && activeReport.status === 'Draft' && (
              <button
                type="button"
                onClick={() => handleSaveEdits(true)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ajukan Persetujuan</span>
              </button>
            )}
            {effectiveRole === 'SUPER_ADMIN' && (
              <button
                type="button"
                onClick={() => setDeleteTarget(activeReport)}
                className="p-1.5 text-slate-400 hover:text-red-700 cursor-pointer"
                aria-label="Hapus laporan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Principal Approval Panel */}
      {activeReport && canApprove && (
        <form
          onSubmit={handleApprovalSubmit}
          className="no-print bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-[#0F2547]">
            <ShieldCheck className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-base font-semibold">Panel Persetujuan Kepala Sekolah</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keputusan Persetujuan
              </label>
              <select
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value as Approval['status'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Disetujui">Disetujui (Sahkan Laporan)</option>
                <option value="Revisi">Perlu Revisi</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Evaluasi Kepala Sekolah
              </label>
              <input
                type="text"
                placeholder="Contoh: Laporan lengkap, disahkan sebagai arsip resmi sekolah tahun 2026."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#E0BD4F]" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Keputusan Persetujuan'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Empty State */}
      {!activeReport && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="text-base font-semibold text-slate-900">Belum Ada Dokumen Laporan</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Klik tombol <strong>Susun Laporan Otomatis</strong> untuk menyusun laporan pertanggungjawaban lengkap dari seluruh data kegiatan yang telah diinput.
          </p>
        </div>
      )}

      {/* Edit Mode */}
      {activeReport && mode === 'edit' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Laporan</label>
              <input
                type="text"
                value={draft.title || ''}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Surat / Dokumen</label>
              <input
                type="text"
                value={draft.reportNumber || ''}
                onChange={(e) => setDraft({ ...draft, reportNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Pelajaran</label>
              <input
                type="text"
                value={draft.academicYear || ''}
                onChange={(e) => setDraft({ ...draft, academicYear: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          {[
            ['bab1Background', 'BAB I — 1.1 Latar Belakang'],
            ['bab1Basis', 'BAB I — 1.2 Dasar Pelaksanaan'],
            ['bab1Purpose', 'BAB I — 1.3 Tujuan Kegiatan'],
            ['bab1Benefits', 'BAB I — 1.4 Manfaat Kegiatan'],
            ['bab2Identity', 'BAB II — 2.1 Identitas Kegiatan'],
            ['bab2ScheduleTimePlace', 'BAB II — 2.2 Waktu dan Tempat'],
            ['bab2ParticipantsSummary', 'BAB II — 2.3 Ringkasan Peserta'],
            ['bab2TeachersSummary', 'BAB II — 2.4 Ringkasan Guru Pendamping'],
            ['bab2ExecutionNarrative', 'BAB II — 2.5 Uraian Pelaksanaan'],
            ['bab3VisitResults', 'BAB III — 3.1 Hasil Kunjungan Edukatif'],
            ['bab3StudentObservations', 'BAB III — 3.2 Hasil Observasi Siswa'],
            ['bab3NationalismValues', 'BAB III — 3.3 Nilai Sejarah & Nasionalisme'],
            ['bab3ReflectionSummary', 'BAB III — 3.4 Ringkasan Refleksi Pembelajaran'],
            ['bab4Evaluation', 'BAB IV — 4.1 Evaluasi Pelaksanaan'],
            ['bab4SupportingFactors', 'BAB IV — 4.2 Faktor Pendukung'],
            ['bab4ObstaclesSolutions', 'BAB IV — 4.3 Kendala dan Solusi'],
            ['bab4Recommendations', 'BAB IV — 4.4 Rekomendasi'],
            ['bab5Conclusion', 'BAB V — 5.1 Kesimpulan'],
            ['bab5Suggestions', 'BAB V — 5.2 Saran'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-[#0F2547] mb-1">{label}</label>
              <textarea
                rows={3}
                value={(draft[key as keyof ActivityReport] as string) || ''}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setMode('preview')}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSaveEdits(false)}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#0F2547] rounded-lg"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan Laporan'}
            </button>
          </div>
        </div>
      )}

      {/* A4 Document Preview */}
      {activeReport && mode === 'preview' && (
        <div className="print-only-container mx-auto max-w-[840px] space-y-8">
          {/* Cover Page */}
          <div className="bg-white border-2 border-[#0F2547] rounded-xl p-10 sm:p-14 text-center shadow-sm">
            <div className="border border-[#C9A227] p-8 sm:p-12 space-y-6">
              <p className="text-xs font-bold tracking-widest text-[#A37B14]">
                LAPORAN PERTANGGUNGJAWABAN KEGIATAN KOKURIKULER
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0F2547] leading-snug text-balance">
                {activeReport.title}
              </h2>
              <p className="text-sm text-slate-600 italic max-w-lg mx-auto">
                Tema: {activity?.theme || 'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno, Presiden Pertama Republik Indonesia'}
              </p>
              <div className="w-24 h-0.5 bg-[#C9A227] mx-auto my-6" />
              <p className="font-mono text-xs font-semibold text-slate-700">
                Nomor: {activeReport.reportNumber} · Tahun Pelajaran {activeReport.academicYear}
              </p>
              <div className="pt-8 border-t border-slate-200">
                <p className="text-base font-bold text-[#0F2547]">{schoolName.toUpperCase()}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Kec. {schoolProfile?.district || 'Kepohbaru'}, Kab.{' '}
                  {schoolProfile?.regency || 'Bojonegoro'}, {schoolProfile?.province || 'Jawa Timur'}
                </p>
                <p className="text-sm font-bold text-[#0F2547] mt-1">TAHUN {activity?.year || 2026}</p>
              </div>
            </div>
          </div>

          {/* Main Report Pages with Kop Surat */}
          <div className="page-break-before bg-white border border-slate-200 rounded-xl p-8 sm:p-12 space-y-8 text-slate-800">
            {/* Kop Surat Sekolah */}
            <div className="border-b-4 border-double border-[#0F2547] pb-4">
              <div className="text-center">
                <p className="text-xs font-bold text-[#0F2547]">
                  YAYASAN PENDIDIKAN ISLAM DARUL ULUM
                </p>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F2547]">
                  {schoolName.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-600">
                  {schoolProfile?.address || 'Jl. Raya Kepohbaru No. 45'}, Kec.{' '}
                  {schoolProfile?.district || 'Kepohbaru'}, Kab.{' '}
                  {schoolProfile?.regency || 'Bojonegoro'} {schoolProfile?.postalCode || '62194'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Telp. {schoolProfile?.phone || '(0353) 331452'} · Email:{' '}
                  {schoolProfile?.email || 'info@smadarululum-kepohbaru.sch.id'} · NPSN:{' '}
                  {schoolProfile?.npsn || '20541289'}
                </p>
              </div>
            </div>

            {/* Daftar Isi */}
            <section className="space-y-2 pb-6 border-b border-slate-200">
              <h4 className="text-sm font-bold text-center text-[#0F2547] mb-3">DAFTAR ISI</h4>
              {[
                ['BAB I PENDAHULUAN', 'Hal. 1'],
                ['BAB II PELAKSANAAN KEGIATAN', 'Hal. 2'],
                ['BAB III HASIL KEGIATAN', 'Hal. 3'],
                ['BAB IV EVALUASI KEGIATAN', 'Hal. 4'],
                ['BAB V PENUTUP', 'Hal. 5'],
                ['LAMPIRAN-LAMPIRAN', 'Hal. 6'],
              ].map(([title, pg]) => (
                <div key={title} className="flex justify-between text-xs border-b border-dotted border-slate-300 py-1">
                  <span className="font-semibold">{title}</span>
                  <span className="font-mono tabular-nums">{pg}</span>
                </div>
              ))}
            </section>

            {/* BAB I */}
            <section className="space-y-3">
              <h4 className="text-base font-bold text-center text-[#0F2547]">BAB I PENDAHULUAN</h4>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">1.1 Latar Belakang</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab1Background}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">1.2 Dasar Pelaksanaan</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab1Basis}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">1.3 Tujuan Kegiatan</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab1Purpose}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">1.4 Manfaat Kegiatan</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab1Benefits}</p>
              </div>
            </section>

            {/* BAB II */}
            <section className="page-break-before space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-base font-bold text-center text-[#0F2547]">
                BAB II PELAKSANAAN KEGIATAN
              </h4>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">2.1 Identitas Kegiatan</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab2Identity}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">2.2 Waktu dan Tempat</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab2ScheduleTimePlace}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">2.3 Peserta Kegiatan</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab2ParticipantsSummary}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">2.4 Guru Pendamping</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab2TeachersSummary}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">2.5 Uraian Pelaksanaan</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab2ExecutionNarrative}</p>
              </div>
            </section>

            {/* BAB III */}
            <section className="page-break-before space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-base font-bold text-center text-[#0F2547]">BAB III HASIL KEGIATAN</h4>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">3.1 Hasil Kunjungan Edukatif</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab3VisitResults}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">3.2 Hasil Observasi Siswa</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab3StudentObservations}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">3.3 Nilai Sejarah dan Nasionalisme</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab3NationalismValues}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">3.4 Hasil Refleksi Pembelajaran</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab3ReflectionSummary}</p>
              </div>
            </section>

            {/* BAB IV */}
            <section className="page-break-before space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-base font-bold text-center text-[#0F2547]">BAB IV EVALUASI KEGIATAN</h4>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">4.1 Evaluasi Pelaksanaan</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab4Evaluation}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">4.2 Faktor Pendukung</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab4SupportingFactors}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">4.3 Kendala dan Solusi</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab4ObstaclesSolutions}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">4.4 Rekomendasi</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab4Recommendations}</p>
              </div>
            </section>

            {/* BAB V & Signature Block */}
            <section className="page-break-before space-y-4 pt-4 border-t border-slate-200">
              <h4 className="text-base font-bold text-center text-[#0F2547]">BAB V PENUTUP</h4>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">5.1 Kesimpulan</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab5Conclusion}</p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-[#0F2547]">5.2 Saran</h5>
                <p className="text-sm leading-relaxed whitespace-pre-line mt-1">{activeReport.bab5Suggestions}</p>
              </div>

              <div className="page-break-inside-avoid grid grid-cols-2 gap-8 pt-10 text-sm">
                <div>
                  <p>Mengetahui,</p>
                  <p>Kepala {schoolProfile?.schoolName || 'SMA Darul Ulum Kepohbaru'}</p>
                  <div className="h-20 flex items-center">
                    {activeApproval?.status === 'Disetujui' && (
                      <span className="text-xs font-mono font-semibold text-emerald-700 border border-emerald-700 px-2.5 py-1 rounded">
                        DISETUJUI SECARA DIGITAL
                      </span>
                    )}
                  </div>
                  <p className="font-bold underline">
                    {schoolProfile?.principalName || 'Drs. H. Ahmad Muhajir, M.Pd.'}
                  </p>
                  <p className="text-xs font-mono">NIP. {schoolProfile?.principalNip || '-'}</p>
                </div>
                <div>
                  <p>
                    Bojonegoro,{' '}
                    {new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p>Ketua Pelaksana Kegiatan,</p>
                  <div className="h-20" />
                  <p className="font-bold underline">
                    {activity?.chiefExecutive || activeReport.authorName}
                  </p>
                  <p className="text-xs text-slate-600">Panitia Kokurikuler Tahun {activity?.year || 2026}</p>
                </div>
              </div>
            </section>

            {/* LAMPIRAN */}
            <section className="page-break-before space-y-6 pt-6 border-t border-slate-200">
              <h4 className="text-base font-bold text-center text-[#0F2547]">LAMPIRAN-LAMPIRAN</h4>

              <div>
                <h5 className="text-xs font-bold text-[#0F2547] mb-2">
                  Lampiran 1. Daftar Guru Pendamping (Surat Tugas)
                </h5>
                <table className="w-full text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-[#0F2547] text-white">
                      <th className="p-2 border border-slate-300">No</th>
                      <th className="p-2 border border-slate-300 text-left">Nama Guru</th>
                      <th className="p-2 border border-slate-300 text-left">Jabatan</th>
                      <th className="p-2 border border-slate-300 text-left">Tugas Pendampingan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t, idx) => (
                      <tr key={t.id}>
                        <td className="p-2 border border-slate-300 text-center tabular-nums">{idx + 1}</td>
                        <td className="p-2 border border-slate-300">{t.name}</td>
                        <td className="p-2 border border-slate-300">{t.position}</td>
                        <td className="p-2 border border-slate-300">{t.mentoringTask}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h5 className="text-xs font-bold text-[#0F2547] mb-2">
                  Lampiran 2. Rundown Pelaksanaan Kegiatan
                </h5>
                <table className="w-full text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-[#0F2547] text-white">
                      <th className="p-2 border border-slate-300">No</th>
                      <th className="p-2 border border-slate-300 text-left">Waktu</th>
                      <th className="p-2 border border-slate-300 text-left">Kegiatan</th>
                      <th className="p-2 border border-slate-300 text-left">Lokasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s) => (
                      <tr key={s.id}>
                        <td className="p-2 border border-slate-300 text-center tabular-nums">{s.orderNo}</td>
                        <td className="p-2 border border-slate-300 font-mono">{s.timeRange}</td>
                        <td className="p-2 border border-slate-300">{s.activityTitle}</td>
                        <td className="p-2 border border-slate-300">{s.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h5 className="text-xs font-bold text-[#0F2547] mb-2">
                  Lampiran 3. Daftar Peserta & Daftar Hadir ({students.length} Siswa)
                </h5>
                <table className="w-full text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-[#0F2547] text-white">
                      <th className="p-2 border border-slate-300">No</th>
                      <th className="p-2 border border-slate-300 text-left">NIS</th>
                      <th className="p-2 border border-slate-300 text-left">Nama Siswa</th>
                      <th className="p-2 border border-slate-300 text-left">Kelas</th>
                      <th className="p-2 border border-slate-300 text-left">Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st, idx) => (
                      <tr key={st.id}>
                        <td className="p-2 border border-slate-300 text-center tabular-nums">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-mono">{st.nis}</td>
                        <td className="p-2 border border-slate-300">{st.name}</td>
                        <td className="p-2 border border-slate-300">{st.className}</td>
                        <td className="p-2 border border-slate-300">{st.participationStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {documentation.filter((d) => d.mediaType === 'photo').length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-[#0F2547] mb-2">
                    Lampiran 4. Dokumentasi Foto Kegiatan
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    {documentation
                      .filter((d) => d.mediaType === 'photo')
                      .slice(0, 4)
                      .map((docItem) => (
                        <div key={docItem.id} className="border border-slate-300 p-2">
                          <img
                            src={docItem.fileUrl}
                            alt={docItem.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-36 object-cover"
                          />
                          <p className="text-[11px] font-semibold mt-1.5">{docItem.title}</p>
                          <p className="text-[10px] text-slate-600">{docItem.category}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {activeReport && (
        <button
          type="button"
          onClick={() => {
            if (mode !== 'preview') {
              setMode('preview');
              setTimeout(() => window.print(), 80);
            } else {
              window.print();
            }
          }}
          aria-label="Print Report"
          className="no-print fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 px-5 py-3 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-xl border border-[#C9A227]/60 shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-[#E0BD4F]" />
          <span>Print Report</span>
        </button>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Dokumen Laporan?"
        description={`Hapus laporan "${deleteTarget?.title || ''}"?`}
        loading={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
