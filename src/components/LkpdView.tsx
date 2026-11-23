import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { isStaffRole, type LkpdSubmission } from '../types';
import { ConfirmModal } from './ConfirmModal';

const LKPD_PDF_URL = '/assets/aistudio/LKPD_Kokurikuler_99698cce.pdf';

interface LkpdFormState {
  studentName: string;
  className: string;
  groupName: string;
  members: string;
  sejarah1: string;
  sejarah2: string;
  pkn1: string;
  pkn2: string;
  bahasa1: string;
  bahasa2: string;
  ekonomi1: string;
  ekonomi2: string;
  pai1: string;
  pai2: string;
  geografi1: string;
  geografi2: string;
}

const emptyForm = (studentName = '', className = 'XI IPA 1'): LkpdFormState => ({
  studentName,
  className,
  groupName: '',
  members: '',
  sejarah1: '',
  sejarah2: '',
  pkn1: '',
  pkn2: '',
  bahasa1: '',
  bahasa2: '',
  ekonomi1: '',
  ekonomi2: '',
  pai1: '',
  pai2: '',
  geografi1: '',
  geografi2: '',
});

const SUBJECT_SECTIONS: {
  id: string;
  title: string;
  q1Key: keyof LkpdFormState;
  q1Label: string;
  q1Placeholder: string;
  q2Key: keyof LkpdFormState;
  q2Label: string;
  q2Placeholder: string;
}[] = [
  {
    id: 'sejarah',
    title: 'Sejarah',
    q1Key: 'sejarah1',
    q1Label: 'Tuliskan lima peristiwa penting dalam kehidupan Ir. Soekarno yang kamu temukan di museum beserta tahunnya.',
    q1Placeholder: '1. ...\n2. ...\n3. ...\n4. ...\n5. ...',
    q2Key: 'sejarah2',
    q2Label: 'Pilih satu koleksi yang paling menarik dan jelaskan maknanya bagi perjuangan bangsa.',
    q2Placeholder: 'Nama koleksi museum dan penjelasan maknanya bagi perjuangan kemerdekaan...',
  },
  {
    id: 'pkn',
    title: 'PKn',
    q1Key: 'pkn1',
    q1Label: 'Pilih satu sila Pancasila dan jelaskan keterkaitannya dengan gagasan Ir. Soekarno.',
    q1Placeholder: 'Sila Pancasila yang dipilih dan keterkaitannya dengan pemikiran Ir. Soekarno...',
    q2Key: 'pkn2',
    q2Label: 'Sebutkan dua contoh penerapan nilai tersebut dalam kehidupan remaja masa kini.',
    q2Placeholder: 'Contoh 1:\nContoh 2:',
  },
  {
    id: 'bahasa',
    title: 'Bahasa Indonesia',
    q1Key: 'bahasa1',
    q1Label: 'Catat satu kutipan atau pesan Ir. Soekarno yang paling berkesan, lalu jelaskan dengan kata-katamu sendiri.',
    q1Placeholder: 'Kutipan Ir. Soekarno: "..."\nPenjelasan makna:',
    q2Key: 'bahasa2',
    q2Label: 'Tulis kerangka teks eksposisi tentang Pentingnya Meneladani Pahlawan Bangsa (tesis, argumen, penegasan ulang).',
    q2Placeholder: 'Tesis:\nArgumen:\nPenegasan Ulang:',
  },
  {
    id: 'ekonomi',
    title: 'Ekonomi',
    q1Key: 'ekonomi1',
    q1Label: 'Wawancarai minimal dua pedagang: jenis dagangan, asal barang, omzet kasar per hari, dan dampak kunjungan wisatawan.',
    q1Placeholder: 'Pedagang 1 (Jenis, Asal Barang, Omzet/hari, Dampak Wisata):\nPedagang 2 (Jenis, Asal Barang, Omzet/hari, Dampak Wisata):',
    q2Key: 'ekonomi2',
    q2Label: 'Identifikasi satu peluang usaha baru di kawasan tersebut dan alasannya.',
    q2Placeholder: 'Peluang usaha baru yang potensial beserta analisis alasannya...',
  },
  {
    id: 'pai',
    title: 'PAI',
    q1Key: 'pai1',
    q1Label: 'Tuliskan adab ziarah kubur yang kamu praktikkan dan doa yang dipanjatkan.',
    q1Placeholder: 'Adab ziarah kubur dan ringkasan doa yang dipanjatkan...',
    q2Key: 'pai2',
    q2Label: 'Nilai akhlak apa yang kamu pelajari dari perjuangan Ir. Soekarno dan para pahlawan?',
    q2Placeholder: 'Nilai akhlak mulia yang dapat diteladani dari perjuangan para pahlawan...',
  },
  {
    id: 'geografi',
    title: 'Geografi',
    q1Key: 'geografi1',
    q1Label: 'Catat tiga jenis bentang alam atau tata guna lahan yang kamu amati di sepanjang perjalanan.',
    q1Placeholder: '1. ...\n2. ...\n3. ...',
    q2Key: 'geografi2',
    q2Label: 'Jelaskan bagaimana kondisi geografis kawasan Blitar mendukung atau memengaruhi aktivitas wisata.',
    q2Placeholder: 'Penjelasan keterkaitan kondisi geografis Blitar dengan aktivitas wisata sejarah...',
  },
];

export const LkpdView: React.FC = () => {
  const { userProfile, effectiveRole } = useAuth();
  const {
    lkpdSubmissions,
    addLkpdSubmission,
    updateLkpdStudent,
    gradeLkpdSubmission,
    deleteLkpdSubmission,
  } = useData();

  const staff = isStaffRole(effectiveRole);
  const canGrade =
    effectiveRole === 'SUPER_ADMIN' ||
    effectiveRole === 'KETUA_PELAKSANA' ||
    effectiveRole === 'GURU_PENDAMPING';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSubjectIdx, setActiveSubjectIdx] = useState(0);
  const [editingItem, setEditingItem] = useState<LkpdSubmission | null>(null);
  const [previewItem, setPreviewItem] = useState<LkpdSubmission | null>(null);
  const [gradeTarget, setGradeTarget] = useState<LkpdSubmission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LkpdSubmission | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<LkpdFormState>(() =>
    emptyForm(userProfile?.displayName || '', userProfile?.className || 'XI IPA 1')
  );

  const [gradeForm, setGradeForm] = useState({
    score: 90,
    feedback: '',
  });

  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lkpdSubmissions.filter((item) => {
      if (statusFilter !== 'ALL' && item.reviewStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        item.studentName.toLowerCase().includes(q) ||
        item.groupName.toLowerCase().includes(q) ||
        item.className.toLowerCase().includes(q) ||
        item.members.toLowerCase().includes(q)
      );
    });
  }, [lkpdSubmissions, searchQuery, statusFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setActiveSubjectIdx(0);
    setForm(emptyForm(userProfile?.displayName || '', userProfile?.className || 'XI IPA 1'));
    setModalOpen(true);
  };

  const openEditModal = (item: LkpdSubmission) => {
    setEditingItem(item);
    setActiveSubjectIdx(0);
    setForm({
      studentName: item.studentName,
      className: item.className,
      groupName: item.groupName,
      members: item.members,
      sejarah1: item.sejarah1 || '',
      sejarah2: item.sejarah2 || '',
      pkn1: item.pkn1 || '',
      pkn2: item.pkn2 || '',
      bahasa1: item.bahasa1 || '',
      bahasa2: item.bahasa2 || '',
      ekonomi1: item.ekonomi1 || '',
      ekonomi2: item.ekonomi2 || '',
      pai1: item.pai1 || '',
      pai2: item.pai2 || '',
      geografi1: item.geografi1 || '',
      geografi2: item.geografi2 || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await updateLkpdStudent(editingItem.id, form);
      } else {
        await addLkpdSubmission(form);
      }
      setModalOpen(false);
      setEditingItem(null);
    } finally {
      setSaving(false);
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeTarget) return;
    setSaving(true);
    try {
      await gradeLkpdSubmission(gradeTarget.id, gradeForm.score, gradeForm.feedback);
      setGradeTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteLkpdSubmission(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const activeSubject = SUBJECT_SECTIONS[activeSubjectIdx];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F2547]">
            Instrumen LKPD Siswa
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Lembar Kerja Peserta Didik lintas mata pelajaran Sejarah, PKn, Bahasa Indonesia, Ekonomi, PAI, dan Geografi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href={LKPD_PDF_URL}
            download="LKPD_Kokurikuler_SMA_Darul_Ulum.pdf"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-[#0F2547] border border-slate-300 text-xs font-semibold rounded-lg whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-[#C9A227]" />
            <span>Unduh LKPD (PDF)</span>
          </a>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E0BD4F]" />
            <span>Isi LKPD</span>
          </button>
        </div>
      </div>

      {/* Reference Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0F2547] text-[#E0BD4F] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Panduan Pengisian Lembar Kerja Peserta Didik
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Lengkapi hasil pengamatan kunjungan Makam dan Museum Ir. Soekarno per mata pelajaran. Jawaban dapat diubah sebelum dinilai guru pendamping.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-xs border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
          <div>
            <span className="text-slate-500 block">LKPD Masuk</span>
            <span className="text-lg font-semibold text-[#0F2547] tabular-nums">{lkpdSubmissions.length}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Dinilai</span>
            <span className="text-lg font-semibold text-emerald-700 tabular-nums">
              {lkpdSubmissions.filter((x) => x.reviewStatus === 'Dinilai').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa, kelompok, anggota, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
        >
          <option value="ALL">Semua Status</option>
          <option value="Menunggu Penilaian">Menunggu Penilaian</option>
          <option value="Dinilai">Sudah Dinilai</option>
        </select>
      </div>

      {/* Submission Cards */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          {staff
            ? 'Belum ada lembar kerja LKPD yang dikumpulkan oleh siswa.'
            : 'Anda belum mengisi LKPD. Klik tombol "Isi LKPD" di atas untuk memulai.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((item) => {
            const isOwnerPending =
              item.studentUid === userProfile?.uid && item.reviewStatus === 'Menunggu Penilaian';
            const canEdit = effectiveRole === 'SUPER_ADMIN' || isOwnerPending;
            const canDelete = effectiveRole === 'SUPER_ADMIN' || isOwnerPending;

            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-[#0F2547]">
                        {item.groupName} · {item.studentName}
                      </h3>
                      <span className="text-xs font-medium text-slate-600">({item.className})</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-semibold">Anggota:</span> {item.members}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Status: <span className="font-semibold text-slate-700">{item.reviewStatus}</span>
                      {item.reviewStatus === 'Dinilai' && item.teacherScore !== undefined && (
                        <span className="font-mono text-[#0F2547] font-semibold tabular-nums">
                          {' '}
                          · Nilai: {item.teacherScore}/100
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Lengkap</span>
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                    {canGrade && (
                      <button
                        type="button"
                        onClick={() => {
                          setGradeTarget(item);
                          setGradeForm({
                            score: item.teacherScore ?? 90,
                            feedback: item.teacherFeedback || '',
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A227] hover:bg-[#B48A1E] text-[#081429] text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{item.reviewStatus === 'Dinilai' ? 'Ubah Nilai' : 'Beri Nilai'}</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-slate-400 hover:text-red-700 cursor-pointer"
                        aria-label="Hapus LKPD"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Compact 6-subject progress strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 text-xs">
                  {SUBJECT_SECTIONS.map((sec) => {
                    const ans1 = String(item[sec.q1Key] || '').trim();
                    const ans2 = String(item[sec.q2Key] || '').trim();
                    const filledCount = (ans1 ? 1 : 0) + (ans2 ? 1 : 0);
                    return (
                      <div key={sec.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-semibold text-[#0F2547] block truncate">{sec.title}</span>
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {filledCount}/2 terjawab
                        </span>
                      </div>
                    );
                  })}
                </div>

                {item.reviewStatus === 'Dinilai' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Umpan Balik Guru ({item.reviewedByName || 'Guru Pendamping'}):
                      </p>
                      <p className="mt-0.5 text-slate-600">{item.teacherFeedback || 'Baik dan lengkap.'}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Simplified Tabbed Fill / Edit LKPD Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-[#0F2547]">
                  {editingItem ? 'Perbarui Lembar Kerja (LKPD)' : 'Pengisian LKPD Kokurikuler'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih tab mata pelajaran untuk mengisi jawaban secara bertahap.
                </p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Group & Student Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pengisi / Ketua *</label>
                  <input
                    type="text"
                    required
                    value={form.studentName}
                    onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas *</label>
                  <input
                    type="text"
                    required
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kelompok *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kelompok 1"
                    value={form.groupName}
                    onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Anggota Kelompok *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama seluruh anggota"
                    value={form.members}
                    onChange={(e) => setForm({ ...form, members: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Clean Subject Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3">
                {SUBJECT_SECTIONS.map((sec, idx) => {
                  const hasContent = Boolean(form[sec.q1Key].trim() || form[sec.q2Key].trim());
                  const isCurrent = idx === activeSubjectIdx;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveSubjectIdx(idx)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#0F2547] text-white'
                          : hasContent
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{sec.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Subject Questions */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[#0F2547]">
                  Bidang Studi: {activeSubject.title}
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {activeSubject.q1Label}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={activeSubject.q1Placeholder}
                    value={form[activeSubject.q1Key]}
                    onChange={(e) => setForm({ ...form, [activeSubject.q1Key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {activeSubject.q2Label}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={activeSubject.q2Placeholder}
                    value={form[activeSubject.q2Key]}
                    onChange={(e) => setForm({ ...form, [activeSubject.q2Key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div>
                  {activeSubjectIdx < SUBJECT_SECTIONS.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveSubjectIdx((i) => i + 1)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F2547] bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      <span>Mapel Berikutnya ({SUBJECT_SECTIONS[activeSubjectIdx + 1].title})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-sm font-semibold text-white bg-[#0F2547] rounded-lg cursor-pointer"
                  >
                    {saving ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Kumpulkan LKPD'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Detail / Print Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[92vh] overflow-y-auto space-y-5">
            <div className="no-print flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-semibold text-[#0F2547]">
                Detail Lembar Kerja Peserta Didik
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2547] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#E0BD4F]" />
                  <span>Cetak</span>
                </button>
                <button type="button" onClick={() => setPreviewItem(null)} className="p-1 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="print-only-container space-y-4">
              <div className="text-center border-b border-slate-300 pb-3">
                <p className="text-xs font-semibold text-slate-500">SMA DARUL ULUM KEPOHBARU</p>
                <h3 className="text-base font-bold text-[#0F2547] mt-1">LEMBAR KERJA PESERTA DIDIK</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p><span className="font-semibold">Nama Kelompok:</span> {previewItem.groupName}</p>
                <p><span className="font-semibold">Kelas:</span> {previewItem.className}</p>
                <p><span className="font-semibold">Pengisi / Ketua:</span> {previewItem.studentName}</p>
                <p><span className="font-semibold">Anggota:</span> {previewItem.members}</p>
              </div>

              {SUBJECT_SECTIONS.map((sec) => (
                <div key={sec.id} className="border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-[#0F2547] text-sm">{sec.title}</h4>
                  <div>
                    <p className="font-semibold text-slate-700">{sec.q1Label}</p>
                    <p className="text-slate-800 whitespace-pre-line mt-1 pl-3 border-l-2 border-slate-200">
                      {String(previewItem[sec.q1Key] || '-')}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">{sec.q2Label}</p>
                    <p className="text-slate-800 whitespace-pre-line mt-1 pl-3 border-l-2 border-slate-200">
                      {String(previewItem[sec.q2Key] || '-')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Grading Modal */}
      {gradeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Penilaian LKPD: {gradeTarget.groupName}
              </h2>
              <button type="button" onClick={() => setGradeTarget(null)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nilai LKPD (0 - 100) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm({ ...gradeForm, score: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Umpan Balik Guru
                </label>
                <textarea
                  rows={3}
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradeTarget(null)}
                  className="px-4 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#0F2547] rounded-lg"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Nilai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Lembar Kerja LKPD?"
        description={`Hapus pengisian LKPD milik ${deleteTarget?.groupName || ''} (${deleteTarget?.studentName || ''})?`}
        loading={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
