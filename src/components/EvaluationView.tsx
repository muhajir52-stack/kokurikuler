import React, { useState } from 'react';
import { Download, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { exportTableToPdf } from '../lib/exporters';
import type { ActivityEvaluation } from '../types';
import { ConfirmModal } from './ConfirmModal';

export const EvaluationView: React.FC = () => {
  const { effectiveRole } = useAuth();
  const { evaluations, schoolProfile, addEvaluation, updateEvaluation, deleteEvaluation } =
    useData();

  const canWrite =
    effectiveRole === 'SUPER_ADMIN' ||
    effectiveRole === 'KETUA_PELAKSANA' ||
    effectiveRole === 'GURU_PENDAMPING';

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityEvaluation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActivityEvaluation | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    goalAlignment: 'Sangat sesuai dengan tujuan pembelajaran kokurikuler sejarah dan kebangsaan.',
    studentParticipationLevel: 'Partisipasi siswa mencapai lebih dari 95% dengan antusiasme tinggi.',
    participantDiscipline: 'Peserta tertib mengikuti jadwal keberangkatan, ziarah, dan observasi museum.',
    activitySuccessRate: 92,
    supportingFactors: 'Dukungan penuh kepala sekolah, kesiapan guru pendamping, dan fasilitas transportasi yang baik.',
    obstacles: 'Kepadatan pengunjung umum di area museum pada jam siang.',
    solutions: 'Pembagian rombongan ke dalam kelompok kecil secara bergantian.',
    recommendations: 'Alokasi waktu diskusi refleksi di lokasi dapat diperpanjang 30 menit pada kegiatan mendatang.',
  });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (ev: ActivityEvaluation) => {
    setEditing(ev);
    setForm({
      goalAlignment: ev.goalAlignment,
      studentParticipationLevel: ev.studentParticipationLevel,
      participantDiscipline: ev.participantDiscipline,
      activitySuccessRate: ev.activitySuccessRate,
      supportingFactors: ev.supportingFactors || '',
      obstacles: ev.obstacles || '',
      solutions: ev.solutions || '',
      recommendations: ev.recommendations || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateEvaluation(editing.id, form);
      } else {
        await addEvaluation(form);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteEvaluation(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F2547]">Evaluasi Kegiatan</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Penilaian kesesuaian tujuan, partisipasi, kedisiplinan, kendala, dan rekomendasi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {evaluations.length > 0 && (
            <button
              type="button"
              onClick={() =>
                exportTableToPdf({
                  fileName: 'Evaluasi_Kegiatan_Kokurikuler_2026',
                  title: 'Hasil Evaluasi Kegiatan Kokurikuler Tahun 2026',
                  headers: [
                    'Evaluator',
                    'Keberhasilan',
                    'Kesesuaian Tujuan',
                    'Kendala & Solusi',
                    'Rekomendasi',
                  ],
                  rows: evaluations.map((ev) => [
                    ev.evaluatorName,
                    `${ev.activitySuccessRate}%`,
                    ev.goalAlignment,
                    `${ev.obstacles || '-'} / ${ev.solutions || '-'}`,
                    ev.recommendations || '-',
                  ]),
                  school: schoolProfile,
                  orientation: 'landscape',
                })
              }
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#0F2547]" />
              <span>Ekspor PDF</span>
            </button>
          )}
          {canWrite && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E0BD4F]" />
              <span>Tambah Evaluasi</span>
            </button>
          )}
        </div>
      </div>

      {evaluations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-400">
          Belum ada data evaluasi kegiatan yang diinput.
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map((ev) => (
            <div key={ev.id} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-semibold text-[#0F2547]">
                    Evaluasi oleh {ev.evaluatorName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    Tingkat Keberhasilan Kegiatan:{' '}
                    <span className="font-mono font-semibold text-[#0F2547]">
                      {ev.activitySuccessRate}%
                    </span>
                  </p>
                </div>
                {canWrite && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(ev)}
                      className="p-1.5 text-slate-500 hover:text-[#0F2547] cursor-pointer"
                      aria-label="Edit evaluasi"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(ev)}
                      className="p-1.5 text-slate-500 hover:text-red-700 cursor-pointer"
                      aria-label="Hapus evaluasi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Kesesuaian dengan Tujuan</p>
                  <p className="text-slate-700 leading-relaxed">{ev.goalAlignment}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Tingkat Partisipasi Siswa</p>
                  <p className="text-slate-700 leading-relaxed">{ev.studentParticipationLevel}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Kedisiplinan Peserta</p>
                  <p className="text-slate-700 leading-relaxed">{ev.participantDiscipline}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Faktor Pendukung</p>
                  <p className="text-slate-700 leading-relaxed">{ev.supportingFactors || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Kendala</p>
                  <p className="text-slate-700 leading-relaxed">{ev.obstacles || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Solusi</p>
                  <p className="text-slate-700 leading-relaxed">{ev.solutions || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Rekomendasi Kegiatan Selanjutnya
                  </p>
                  <p className="text-slate-700 leading-relaxed">{ev.recommendations || '-'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                {editing ? 'Edit Evaluasi Kegiatan' : 'Tambah Evaluasi Kegiatan'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keberhasilan Kegiatan (%) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={form.activitySuccessRate}
                  onChange={(e) => setForm({ ...form, activitySuccessRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kesesuaian Kegiatan dengan Tujuan *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.goalAlignment}
                  onChange={(e) => setForm({ ...form, goalAlignment: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Partisipasi Siswa *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={form.studentParticipationLevel}
                    onChange={(e) => setForm({ ...form, studentParticipationLevel: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kedisiplinan Peserta *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={form.participantDiscipline}
                    onChange={(e) => setForm({ ...form, participantDiscipline: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faktor Pendukung</label>
                <textarea
                  rows={2}
                  value={form.supportingFactors}
                  onChange={(e) => setForm({ ...form, supportingFactors: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kendala</label>
                  <textarea
                    rows={2}
                    value={form.obstacles}
                    onChange={(e) => setForm({ ...form, obstacles: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Solusi</label>
                  <textarea
                    rows={2}
                    value={form.solutions}
                    onChange={(e) => setForm({ ...form, solutions: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rekomendasi Kegiatan Selanjutnya
                </label>
                <textarea
                  rows={2}
                  value={form.recommendations}
                  onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
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
                  {saving ? 'Menyimpan...' : 'Simpan Evaluasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Evaluasi Kegiatan?"
        description="Apakah Anda yakin ingin menghapus catatan evaluasi kegiatan ini?"
        loading={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
