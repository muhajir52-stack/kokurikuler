import React, { useMemo, useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  exportTableToExcel,
  exportTableToPdf,
  parseStudentsExcel,
} from '../lib/exporters';
import type { Student } from '../types';
import { ConfirmModal } from './ConfirmModal';

export const ParticipantsView: React.FC = () => {
  const { effectiveRole } = useAuth();
  const { students, participants, schoolProfile, addStudent, updateStudent, deleteStudent } =
    useData();

  const canManage = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'KETUA_PELAKSANA';
  const canUpdateAttendance = canManage || effectiveRole === 'GURU_PENDAMPING';

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nis: '',
    name: '',
    className: 'XI IPA 1',
    gender: 'L' as 'L' | 'P',
    parentPhone: '',
    participationStatus: 'Terdaftar' as Student['participationStatus'],
    busGroup: 'Bus 1',
    notes: '',
  });

  const busMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of participants) {
      map.set(p.studentId, p.busGroup || 'Bus 1');
    }
    return map;
  }, [participants]);

  const classOptions = useMemo(() => {
    const set = new Set(students.map((s) => s.className));
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter !== 'ALL' && s.className !== classFilter) return false;
      if (statusFilter !== 'ALL' && s.participationStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    });
  }, [students, search, classFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      nis: '',
      name: '',
      className: 'XI IPA 1',
      gender: 'L',
      parentPhone: '',
      participationStatus: 'Terdaftar',
      busGroup: 'Bus 1',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (st: Student) => {
    setEditing(st);
    setForm({
      nis: st.nis,
      name: st.name,
      className: st.className,
      gender: st.gender,
      parentPhone: st.parentPhone || '',
      participationStatus: st.participationStatus,
      busGroup: busMap.get(st.id) || 'Bus 1',
      notes: st.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (editing) {
        await updateStudent(
          editing.id,
          {
            nis: form.nis,
            name: form.name,
            className: form.className,
            gender: form.gender,
            parentPhone: form.parentPhone,
            participationStatus: form.participationStatus,
            notes: form.notes,
          },
          form.busGroup
        );
        setFeedback(`Data peserta ${form.name} berhasil diperbarui.`);
      } else {
        await addStudent(
          {
            nis: form.nis,
            name: form.name,
            className: form.className,
            gender: form.gender,
            parentPhone: form.parentPhone,
            participationStatus: form.participationStatus,
            notes: form.notes,
          },
          form.busGroup
        );
        setFeedback(`Peserta ${form.name} berhasil ditambahkan.`);
      }
      setModalOpen(false);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Gagal menyimpan data peserta.');
    } finally {
      setSaving(false);
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setFeedback(null);
    try {
      const rows = await parseStudentsExcel(file);
      if (rows.length === 0) {
        setFeedback('Tidak ditemukan baris valid. Pastikan terdapat kolom NIS dan Nama.');
      } else {
        let count = 0;
        for (const r of rows) {
          await addStudent({
            nis: r.nis,
            name: r.name,
            className: r.className,
            gender: r.gender,
            parentPhone: r.parentPhone,
            participationStatus: r.participationStatus,
            notes: r.notes,
          });
          count += 1;
        }
        setFeedback(`${count} data peserta berhasil diimpor dari file Excel.`);
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Gagal mengimpor file Excel.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportExcel = () => {
    exportTableToExcel(
      'Daftar_Peserta_Kokurikuler_2026',
      'Data Peserta',
      ['No', 'NIS', 'Nama Siswa', 'Kelas', 'L/P', 'Kontak Orang Tua', 'Rombongan', 'Status'],
      filteredStudents.map((s, idx) => [
        idx + 1,
        s.nis,
        s.name,
        s.className,
        s.gender,
        s.parentPhone || '-',
        busMap.get(s.id) || '-',
        s.participationStatus,
      ])
    );
  };

  const handleExportPdf = () => {
    exportTableToPdf({
      fileName: 'Daftar_Peserta_Kokurikuler_2026',
      title: 'Daftar Peserta Didik Kegiatan Kokurikuler Tahun 2026',
      subtitle: 'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno, Blitar',
      headers: ['No', 'NIS', 'Nama Siswa', 'Kelas', 'L/P', 'Kontak Orang Tua', 'Status'],
      rows: filteredStudents.map((s, idx) => [
        idx + 1,
        s.nis,
        s.name,
        s.className,
        s.gender,
        s.parentPhone || '-',
        s.participationStatus,
      ]),
      school: schoolProfile,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteStudent(deleteTarget.id);
      setFeedback(`Data peserta ${deleteTarget.name} telah dihapus.`);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F2547]">Data Peserta Kegiatan</h1>
          <p className="text-sm text-slate-600 mt-0.5 tabular-nums">
            Total {students.length} peserta terdaftar · {students.filter((s) => s.participationStatus === 'Hadir').length} hadir
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {canManage && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{importing ? 'Mengimpor...' : 'Impor Excel'}</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0F2547]" />
            <span>Ekspor PDF</span>
          </button>
          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E0BD4F]" />
              <span>Tambah Peserta</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800">
          {feedback}
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari NIS, nama siswa, atau kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547]"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0F2547]"
        >
          <option value="ALL">Semua Kelas</option>
          {classOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#0F2547]"
        >
          <option value="ALL">Semua Status</option>
          <option value="Terdaftar">Terdaftar</option>
          <option value="Hadir">Hadir</option>
          <option value="Izin">Izin</option>
          <option value="Tidak Hadir">Tidak Hadir</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-12">No</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">JK</th>
                <th className="py-3 px-4">Kontak Orang Tua</th>
                <th className="py-3 px-4">Rombongan</th>
                <th className="py-3 px-4">Status</th>
                {canUpdateAttendance && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Tidak ada data peserta yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-500 tabular-nums">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-700 tabular-nums">{st.nis}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{st.name}</td>
                    <td className="py-2.5 px-4 text-slate-700">{st.className}</td>
                    <td className="py-2.5 px-4 text-slate-700">{st.gender}</td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-600 tabular-nums">
                      {st.parentPhone || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{busMap.get(st.id) || 'Bus 1'}</td>
                    <td className="py-2.5 px-4">
                      {canUpdateAttendance ? (
                        <select
                          value={st.participationStatus}
                          onChange={(e) =>
                            updateStudent(st.id, {
                              participationStatus: e.target.value as Student['participationStatus'],
                            })
                          }
                          className={`text-xs font-medium px-2 py-1 rounded border border-slate-200 bg-white ${
                            st.participationStatus === 'Hadir'
                              ? 'text-emerald-700'
                              : st.participationStatus === 'Tidak Hadir'
                              ? 'text-red-700'
                              : 'text-slate-700'
                          }`}
                        >
                          <option value="Terdaftar">Terdaftar</option>
                          <option value="Hadir">Hadir</option>
                          <option value="Izin">Izin</option>
                          <option value="Tidak Hadir">Tidak Hadir</option>
                        </select>
                      ) : (
                        <span className="text-xs font-medium text-slate-700">
                          {st.participationStatus}
                        </span>
                      )}
                    </td>
                    {canUpdateAttendance && (
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        {canManage && (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(st)}
                              className="p-1.5 text-slate-500 hover:text-[#0F2547] rounded transition-colors cursor-pointer"
                              aria-label={`Edit ${st.name}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(st)}
                              className="p-1.5 text-slate-500 hover:text-red-700 rounded transition-colors cursor-pointer"
                              aria-label={`Hapus ${st.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                {editing ? 'Edit Data Peserta' : 'Tambah Peserta Didik'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIS *</label>
                  <input
                    type="text"
                    required
                    value={form.nis}
                    onChange={(e) => setForm({ ...form, nis: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
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
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kontak Orang Tua</label>
                  <input
                    type="text"
                    value={form.parentPhone}
                    onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rombongan Bus</label>
                  <input
                    type="text"
                    value={form.busGroup}
                    onChange={(e) => setForm({ ...form, busGroup: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Keikutsertaan</label>
                  <select
                    value={form.participationStatus}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        participationStatus: e.target.value as Student['participationStatus'],
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Terdaftar">Terdaftar</option>
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Tidak Hadir">Tidak Hadir</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#0F2547] hover:bg-[#173463] rounded-lg"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Data Peserta?"
        description={`Apakah Anda yakin ingin menghapus data peserta ${deleteTarget?.name || ''} (${deleteTarget?.nis || ''})? Tindakan ini tidak dapat dibatalkan.`}
        loading={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
