import React, { useState } from 'react';
import { Download, Pencil, Plus, Printer, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { exportTableToPdf } from '../lib/exporters';
import type { ActivitySchedule } from '../types';
import { ConfirmModal } from './ConfirmModal';

export const ScheduleView: React.FC = () => {
  const { effectiveRole } = useAuth();
  const { schedules, schoolProfile, activity, addSchedule, updateSchedule, deleteSchedule } =
    useData();
  const canManage = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'KETUA_PELAKSANA';

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ActivitySchedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActivitySchedule | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    orderNo: schedules.length + 1,
    timeRange: '',
    activityTitle: '',
    location: '',
    personInCharge: '',
    notes: '',
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      orderNo: schedules.length + 1,
      timeRange: '',
      activityTitle: '',
      location: '',
      personInCharge: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (item: ActivitySchedule) => {
    setEditing(item);
    setForm({
      orderNo: item.orderNo,
      timeRange: item.timeRange,
      activityTitle: item.activityTitle,
      location: item.location,
      personInCharge: item.personInCharge,
      notes: item.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateSchedule(editing.id, form);
      } else {
        await addSchedule(form);
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
      await deleteSchedule(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F2547]">Agenda dan Rundown Kegiatan</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Susunan jadwal pelaksanaan kunjungan edukatif {activity?.dayDate || 'Tahun 2026'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rundown</span>
          </button>
          <button
            type="button"
            onClick={() =>
              exportTableToPdf({
                fileName: 'Rundown_Kegiatan_Kokurikuler_2026',
                title: 'Rundown Kegiatan Kokurikuler Tahun 2026',
                subtitle: activity?.theme || 'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno',
                headers: ['No', 'Waktu', 'Kegiatan', 'Lokasi', 'Penanggung Jawab', 'Keterangan'],
                rows: schedules.map((s) => [
                  s.orderNo,
                  s.timeRange,
                  s.activityTitle,
                  s.location,
                  s.personInCharge,
                  s.notes || '-',
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
          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E0BD4F]" />
              <span>Tambah Agenda</span>
            </button>
          )}
        </div>
      </div>

      {/* Print Header for Direct Print */}
      <div className="hidden print:block text-center border-b-2 border-[#0F2547] pb-4 mb-4">
        <p className="text-sm font-bold text-[#0F2547]">
          {schoolProfile?.schoolName || 'SMA DARUL ULUM KEPOHBARU'} — BOJONEGORO
        </p>
        <h2 className="text-lg font-bold mt-1">RUNDOWN KEGIATAN KOKURIKULER TAHUN {activity?.year || 2026}</h2>
        <p className="text-xs text-slate-600">{activity?.dayDate}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden print-only-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-14">Nomor</th>
                <th className="py-3 px-4 w-40">Waktu</th>
                <th className="py-3 px-4">Kegiatan</th>
                <th className="py-3 px-4">Lokasi</th>
                <th className="py-3 px-4">Penanggung Jawab</th>
                <th className="py-3 px-4">Keterangan</th>
                {canManage && <th className="no-print py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada agenda rundown kegiatan.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-[#0F2547] tabular-nums">
                      {s.orderNo}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {s.timeRange}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{s.activityTitle}</td>
                    <td className="py-3 px-4 text-slate-700">{s.location}</td>
                    <td className="py-3 px-4 text-slate-700">{s.personInCharge}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{s.notes || '-'}</td>
                    {canManage && (
                      <td className="no-print py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="p-1.5 text-slate-500 hover:text-[#0F2547] cursor-pointer"
                          aria-label="Edit agenda"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(s)}
                          className="p-1.5 text-slate-500 hover:text-red-700 cursor-pointer"
                          aria-label="Hapus agenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                {editing ? 'Edit Agenda Rundown' : 'Tambah Agenda Rundown'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Urut *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={500}
                    value={form.orderNo}
                    onChange={(e) => setForm({ ...form, orderNo: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 09.30 - 11.15 WIB"
                    value={form.timeRange}
                    onChange={(e) => setForm({ ...form, timeRange: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={form.activityTitle}
                  onChange={(e) => setForm({ ...form, activityTitle: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi *</label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Penanggung Jawab *
                </label>
                <input
                  type="text"
                  required
                  value={form.personInCharge}
                  onChange={(e) => setForm({ ...form, personInCharge: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Agenda Rundown?"
        description={`Hapus agenda "${deleteTarget?.activityTitle || ''}" dari rundown kegiatan?`}
        loading={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
