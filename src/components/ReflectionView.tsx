import React, { useState } from 'react';
import { Award, CheckCircle2, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { isStaffRole, type StudentReflection } from '../types';
import { ConfirmModal } from './ConfirmModal';

export const ReflectionView: React.FC = () => {
  const { userProfile, effectiveRole } = useAuth();
  const { reflections, addReflection, gradeReflection, deleteReflection } = useData();

  const staff = isStaffRole(effectiveRole);
  const canGrade =
    effectiveRole === 'SUPER_ADMIN' ||
    effectiveRole === 'KETUA_PELAKSANA' ||
    effectiveRole === 'GURU_PENDAMPING';

  const [modalOpen, setModalOpen] = useState(false);
  const [gradeTarget, setGradeTarget] = useState<StudentReflection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentReflection | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    studentName: userProfile?.displayName || '',
    className: userProfile?.className || 'XI IPA 1',
    newKnowledge: '',
    historicalValues: '',
    soekarnoExemplar: '',
    memorableExperience: '',
    nationalismApplication: '',
    learningConclusion: '',
  });

  const [gradeForm, setGradeForm] = useState({
    score: 90,
    feedback: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addReflection(form);
      setModalOpen(false);
      setForm({
        studentName: userProfile?.displayName || '',
        className: userProfile?.className || 'XI IPA 1',
        newKnowledge: '',
        historicalValues: '',
        soekarnoExemplar: '',
        memorableExperience: '',
        nationalismApplication: '',
        learningConclusion: '',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeTarget) return;
    setSaving(true);
    try {
      await gradeReflection(gradeTarget.id, gradeForm.score, gradeForm.feedback);
      setGradeTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteReflection(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F2547]">
            Hasil Observasi dan Pembelajaran Siswa
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Formulir refleksi kunjungan edukatif dan penilaian guru pendamping.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm((prev) => ({
              ...prev,
              studentName: userProfile?.displayName || prev.studentName,
              className: userProfile?.className || prev.className,
            }));
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#E0BD4F]" />
          <span>Isi Refleksi Pembelajaran</span>
        </button>
      </div>

      {reflections.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          {staff
            ? 'Belum ada refleksi pembelajaran yang dikirimkan oleh siswa.'
            : 'Anda belum mengisi refleksi pembelajaran. Klik tombol "Isi Refleksi Pembelajaran" di atas untuk memulai.'}
        </div>
      ) : (
        <div className="space-y-4">
          {reflections.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-semibold text-[#0F2547]">
                    {r.studentName} · <span className="text-slate-600 font-normal">{r.className}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Status: <span className="font-semibold text-slate-700">{r.reviewStatus}</span>
                    {r.reviewStatus === 'Dinilai' && r.teacherScore !== undefined && (
                      <span className="font-mono text-[#0F2547] font-semibold tabular-nums">
                        {' '}
                        · Nilai: {r.teacherScore}/100
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {canGrade && (
                    <button
                      type="button"
                      onClick={() => {
                        setGradeTarget(r);
                        setGradeForm({
                          score: r.teacherScore ?? 90,
                          feedback: r.teacherFeedback || '',
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A227] hover:bg-[#B48A1E] text-[#081429] text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{r.reviewStatus === 'Dinilai' ? 'Ubah Nilai' : 'Beri Nilai'}</span>
                    </button>
                  )}
                  {(effectiveRole === 'SUPER_ADMIN' || r.reviewStatus === 'Menunggu Penilaian') && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(r)}
                      className="p-1.5 text-slate-400 hover:text-red-700 cursor-pointer"
                      aria-label="Hapus refleksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Pengetahuan Baru Diperoleh</p>
                  <p className="text-slate-700 leading-relaxed">{r.newKnowledge}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Nilai Sejarah yang Dipelajari</p>
                  <p className="text-slate-700 leading-relaxed">{r.historicalValues}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Keteladanan Ir. Soekarno</p>
                  <p className="text-slate-700 leading-relaxed">{r.soekarnoExemplar}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Pengalaman Paling Berkesan</p>
                  <p className="text-slate-700 leading-relaxed">{r.memorableExperience || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Sikap Nasionalisme yang Diterapkan</p>
                  <p className="text-slate-700 leading-relaxed">{r.nationalismApplication || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Kesimpulan Pembelajaran</p>
                  <p className="text-slate-700 leading-relaxed">{r.learningConclusion}</p>
                </div>
              </div>

              {r.reviewStatus === 'Dinilai' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Umpan Balik Guru ({r.reviewedByName || 'Guru Pendamping'}):
                    </p>
                    <p className="mt-0.5 text-slate-600">{r.teacherFeedback || 'Sangat baik.'}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Student Reflection Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Formulir Refleksi Observasi Siswa
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Siswa *</label>
                  <input
                    type="text"
                    required
                    value={form.studentName}
                    onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas *</label>
                  <input
                    type="text"
                    required
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pengetahuan Baru yang Diperoleh *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.newKnowledge}
                  onChange={(e) => setForm({ ...form, newKnowledge: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai Sejarah yang Dipelajari *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.historicalValues}
                  onChange={(e) => setForm({ ...form, historicalValues: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keteladanan Ir. Soekarno *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.soekarnoExemplar}
                  onChange={(e) => setForm({ ...form, soekarnoExemplar: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pengalaman Paling Berkesan
                </label>
                <textarea
                  rows={2}
                  value={form.memorableExperience}
                  onChange={(e) => setForm({ ...form, memorableExperience: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sikap Nasionalisme yang Dapat Diterapkan
                </label>
                <textarea
                  rows={2}
                  value={form.nationalismApplication}
                  onChange={(e) => setForm({ ...form, nationalismApplication: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kesimpulan Pembelajaran *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.learningConclusion}
                  onChange={(e) => setForm({ ...form, learningConclusion: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#0F2547] rounded-lg"
                >
                  {saving ? 'Mengirim...' : 'Kirim Refleksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Grading Modal */}
      {gradeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Penilaian Refleksi: {gradeTarget.studentName}
              </h2>
              <button type="button" onClick={() => setGradeTarget(null)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nilai (0 - 100) *</label>
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
        title="Hapus Refleksi Siswa?"
        description={`Hapus catatan refleksi milik ${deleteTarget?.studentName || ''}?`}
        loading={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
