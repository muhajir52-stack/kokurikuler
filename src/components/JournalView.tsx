import React, { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { exportTableToPdf } from '../lib/exporters';
import type { ActivityJournal } from '../types';
import { ConfirmModal } from './ConfirmModal';

export const JournalView: React.FC = () => {
  const { effectiveRole } = useAuth();
  const { journals, schoolProfile, addJournal, updateJournal, deleteJournal } = useData();
  const canWrite =
    effectiveRole === 'SUPER_ADMIN' ||
    effectiveRole === 'KETUA_PELAKSANA' ||
    effectiveRole === 'GURU_PENDAMPING';

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityJournal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActivityJournal | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    date: '2026-02-14',
    time: '09.30 WIB',
    location: 'Kompleks Makam & Museum Bung Karno Blitar',
    description: '',
    attendeesCount: 120,
    condition: 'Lancar' as ActivityJournal['condition'],
    companionNotes: '',
    obstacles: '',
    solutions: '',
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return journals;
    return journals.filter(
      (j) =>
        j.location.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.authorName.toLowerCase().includes(q)
    );
  }, [journals, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      date: '2026-02-14',
      time: '',
      location: '',
      description: '',
      attendeesCount: 120,
      condition: 'Lancar',
      companionNotes: '',
      obstacles: '',
      solutions: '',
    });
    setModalOpen(true);
  };

  const openEdit = (j: ActivityJournal) => {
    setEditing(j);
    setForm({
      date: j.date,
      time: j.time,
      location: j.location,
      description: j.description,
      attendeesCount: j.attendeesCount,
      condition: j.condition,
      companionNotes: j.companionNotes || '',
      obstacles: j.obstacles || '',
      solutions: j.solutions || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateJournal(editing.id, form);
      } else {
        await addJournal(form);
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
      await deleteJournal(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F2547]">Jurnal Pelaksanaan Kegiatan</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Catatan lapangan guru pendamping mengenai aktivitas, kehadiran, kendala, dan solusi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              exportTableToPdf({
                fileName: 'Jurnal_Pelaksanaan_Kokurikuler_2026',
                title: 'Jurnal Pelaksanaan Kegiatan Kokurikuler Tahun 2026',
                headers: ['Tanggal', 'Waktu', 'Lokasi', 'Hadir', 'Kondisi', 'Deskripsi & Solusi', 'Pendamping'],
                rows: filtered.map((j) => [
                  j.date,
                  j.time,
                  j.location,
                  j.attendeesCount,
                  j.condition,
                  `${j.description}${j.obstacles ? ` | Kendala: ${j.obstacles}` : ''}${j.solutions ? ` | Solusi: ${j.solutions}` : ''}`,
                  j.authorName,
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
          {canWrite && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E0BD4F]" />
              <span>Isi Jurnal Baru</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari lokasi, aktivitas, atau nama pendamping..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-400">
          Belum ada catatan jurnal pelaksanaan.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((j) => (
            <div key={j.id} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                    <span>{j.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>{j.time}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`font-sans font-semibold ${
                        j.condition === 'Lancar'
                          ? 'text-emerald-700'
                          : j.condition === 'Terkendali'
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}
                    >
                      Kondisi: {j.condition}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#0F2547] mt-1">{j.location}</h3>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-medium text-slate-600 tabular-nums">
                    Hadir: {j.attendeesCount} peserta
                  </span>
                  {canWrite && (
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(j)}
                        className="p-1.5 text-slate-500 hover:text-[#0F2547] cursor-pointer"
                        aria-label="Edit jurnal"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(j)}
                        className="p-1.5 text-slate-500 hover:text-red-700 cursor-pointer"
                        aria-label="Hapus jurnal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed mt-4">{j.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">Catatan Pendamping</span>
                  <p className="text-slate-600 leading-relaxed">{j.companionNotes || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">Kendala Ditemukan</span>
                  <p className="text-slate-600 leading-relaxed">{j.obstacles || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">Solusi Dilakukan</span>
                  <p className="text-slate-600 leading-relaxed">{j.solutions || '-'}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4">Dicatat oleh {j.authorName}</p>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                {editing ? 'Edit Jurnal Pelaksanaan' : 'Isi Jurnal Pelaksanaan Kegiatan'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hari & Tanggal *</label>
                  <input
                    type="text"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Kegiatan *</label>
                  <input
                    type="text"
                    required
                    placeholder="09.30 - 11.15 WIB"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Peserta Hadir *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={5000}
                    value={form.attendeesCount}
                    onChange={(e) => setForm({ ...form, attendeesCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi Kegiatan</label>
                  <select
                    value={form.condition}
                    onChange={(e) =>
                      setForm({ ...form, condition: e.target.value as ActivityJournal['condition'] })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Lancar">Lancar</option>
                    <option value="Terkendali">Terkendali</option>
                    <option value="Perlu Perhatian">Perlu Perhatian</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Aktivitas *
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Pendamping</label>
                <textarea
                  rows={2}
                  value={form.companionNotes}
                  onChange={(e) => setForm({ ...form, companionNotes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kendala yang Ditemukan
                  </label>
                  <textarea
                    rows={2}
                    value={form.obstacles}
                    onChange={(e) => setForm({ ...form, obstacles: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Solusi yang Dilakukan
                  </label>
                  <textarea
                    rows={2}
                    value={form.solutions}
                    onChange={(e) => setForm({ ...form, solutions: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
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
                  {saving ? 'Menyimpan...' : 'Simpan Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Entri Jurnal?"
        description={`Hapus catatan jurnal pada lokasi ${deleteTarget?.location || ''}?`}
        loading={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
