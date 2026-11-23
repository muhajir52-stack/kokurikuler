import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { exportTableToExcel, exportTableToPdf } from '../lib/exporters';
import type { Teacher } from '../types';
import { ConfirmModal } from './ConfirmModal';

export const TeachersView: React.FC = () => {
  const { effectiveRole } = useAuth();
  const { teachers, schoolProfile, addTeacher, updateTeacher, deleteTeacher } = useData();
  const canManage = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'KETUA_PELAKSANA';

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    nipNuptk: '',
    position: '',
    mentoringTask: '',
    phone: '',
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q) ||
        t.mentoringTask.toLowerCase().includes(q)
    );
  }, [teachers, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', nipNuptk: '', position: '', mentoringTask: '', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({
      name: t.name,
      nipNuptk: t.nipNuptk || '',
      position: t.position,
      mentoringTask: t.mentoringTask,
      phone: t.phone || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateTeacher(editing.id, form);
      } else {
        await addTeacher(form);
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
      await deleteTeacher(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F2547]">Data Guru Pendamping</h1>
          <p className="text-sm text-slate-600 mt-0.5 tabular-nums">
            Total {teachers.length} guru pendamping terdaftar
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              exportTableToExcel(
                'Daftar_Guru_Pendamping_2026',
                'Guru Pendamping',
                ['No', 'Nama Guru', 'NIP/NUPTK', 'Jabatan', 'Tugas Pendampingan', 'Nomor Telepon'],
                filtered.map((t, i) => [
                  i + 1,
                  t.name,
                  t.nipNuptk || '-',
                  t.position,
                  t.mentoringTask,
                  t.phone || '-',
                ])
              )
            }
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>
          <button
            type="button"
            onClick={() =>
              exportTableToPdf({
                fileName: 'Daftar_Guru_Pendamping_2026',
                title: 'Daftar Guru Pendamping Kegiatan Kokurikuler 2026',
                headers: ['No', 'Nama Guru', 'NIP/NUPTK', 'Jabatan', 'Tugas Pendampingan', 'Telepon'],
                rows: filtered.map((t, i) => [
                  i + 1,
                  t.name,
                  t.nipNuptk || '-',
                  t.position,
                  t.mentoringTask,
                  t.phone || '-',
                ]),
                school: schoolProfile,
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
              <span>Tambah Guru</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama guru, jabatan, atau tugas pendampingan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547]"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-12">No</th>
                <th className="py-3 px-4">Nama Guru</th>
                <th className="py-3 px-4">NIP / NUPTK</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Tugas Pendampingan</th>
                <th className="py-3 px-4">No. Telepon</th>
                {canManage && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada data guru pendamping.
                  </td>
                </tr>
              ) : (
                filtered.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{t.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums">
                      {t.nipNuptk || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{t.position}</td>
                    <td className="py-3 px-4 text-slate-700">{t.mentoringTask}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums">
                      {t.phone || '-'}
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="p-1.5 text-slate-500 hover:text-[#0F2547] cursor-pointer"
                          aria-label={`Edit ${t.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(t)}
                          className="p-1.5 text-slate-500 hover:text-red-700 cursor-pointer"
                          aria-label={`Hapus ${t.name}`}
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
                {editing ? 'Edit Data Guru Pendamping' : 'Tambah Guru Pendamping'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Guru *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP / NUPTK (Opsional)
                  </label>
                  <input
                    type="text"
                    value={form.nipNuptk}
                    onChange={(e) => setForm({ ...form, nipNuptk: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan *</label>
                <input
                  type="text"
                  required
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tugas Pendampingan *
                </label>
                <input
                  type="text"
                  required
                  value={form.mentoringTask}
                  onChange={(e) => setForm({ ...form, mentoringTask: e.target.value })}
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
        title="Hapus Data Guru Pendamping?"
        description={`Hapus ${deleteTarget?.name || ''} dari daftar guru pendamping kegiatan?`}
        loading={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
