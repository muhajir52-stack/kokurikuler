import React, { useMemo, useRef, useState } from 'react';
import {
  Download,
  FileText,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { uploadFileToCloud } from '../lib/firebase';
import { ARCHIVE_CATEGORIES, type ArchiveCategory, type DigitalArchive } from '../types';
import { ConfirmModal } from './ConfirmModal';

export const ArchiveView: React.FC = () => {
  const { effectiveRole } = useAuth();
  const { archives, addArchive, deleteArchive } = useData();

  const canUpload =
    effectiveRole === 'SUPER_ADMIN' ||
    effectiveRole === 'KETUA_PELAKSANA' ||
    effectiveRole === 'GURU_PENDAMPING';
  const canDelete = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'KETUA_PELAKSANA';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ArchiveCategory>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DigitalArchive | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    category: ARCHIVE_CATEGORIES[0] as ArchiveCategory,
    title: '',
    documentNumber: '',
    documentDate: '2026-02-01',
    description: '',
    externalUrl: '',
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return archives.filter((a) => {
      if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        (a.documentNumber || '').toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    });
  }, [archives, search, categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!selectedFile && !form.externalUrl.trim()) {
      setUploadError('Pilih file dokumen atau masukkan tautan dokumen terlebih dahulu.');
      return;
    }

    setUploading(true);
    try {
      let fileUrl = form.externalUrl.trim();
      let storagePath: string | undefined;
      let fileName: string | undefined;
      let fileType: string | undefined;
      let fileSize: number | undefined;

      if (selectedFile) {
        if (selectedFile.size > 25 * 1024 * 1024) {
          throw new Error('Ukuran file maksimal 25 MB.');
        }
        const uploaded = await uploadFileToCloud('archives/kokurikuler-2026', selectedFile);
        fileUrl = uploaded.fileUrl;
        storagePath = uploaded.storagePath;
        fileName = uploaded.fileName;
        fileType = selectedFile.type || 'application/octet-stream';
        fileSize = uploaded.fileSize;
      }

      await addArchive({
        category: form.category,
        title: form.title,
        documentNumber: form.documentNumber,
        documentDate: form.documentDate,
        description: form.description,
        fileUrl,
        storagePath,
        fileName,
        fileType,
        fileSize,
      });

      setModalOpen(false);
      setSelectedFile(null);
      setForm({
        category: ARCHIVE_CATEGORIES[0],
        title: '',
        documentNumber: '',
        documentDate: '2026-02-01',
        description: '',
        externalUrl: '',
      });
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? `Gagal mengunggah dokumen: ${err.message}`
          : 'Gagal mengunggah arsip.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setUploading(true);
    try {
      await deleteArchive(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F2547]">
            Administrasi dan Arsip Digital
          </h1>
          <p className="text-sm text-slate-600 mt-0.5 tabular-nums">
            Repositori dokumen resmi sekolah ({archives.length} berkas tersimpan)
          </p>
        </div>
        {canUpload && (
          <button
            type="button"
            onClick={() => {
              setUploadError(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E0BD4F]" />
            <span>Unggah Dokumen Arsip</span>
          </button>
        )}
      </div>

      {/* Filter & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul dokumen, nomor surat, atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-[#0F2547] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({archives.length})
          </button>
          {ARCHIVE_CATEGORIES.map((cat) => {
            const count = archives.filter((a) => a.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#0F2547] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Archives Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Dokumen</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Nomor Dokumen</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Pengunggah</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Belum ada dokumen arsip pada kategori ini.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-[#0F2547] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#A37B14]">{item.category}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {item.documentNumber || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums">
                      {item.documentDate}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{item.uploadedByName}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0F2547] hover:bg-slate-100 rounded-lg"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh</span>
                      </a>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-slate-400 hover:text-red-700 ml-1 cursor-pointer"
                          aria-label="Hapus arsip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Unggah Arsip Administrasi</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                {uploadError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Dokumen *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ArchiveCategory })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {ARCHIVE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Dokumen *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Surat / Dokumen</label>
                  <input
                    type="text"
                    value={form.documentNumber}
                    onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Dokumen *</label>
                  <input
                    type="date"
                    required
                    value={form.documentDate}
                    onChange={(e) => setForm({ ...form, documentDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unggah Berkas (PDF / DOCX / XLSX / Gambar)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-slate-300 hover:border-[#0F2547] rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 text-xs text-slate-600 cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5 text-[#0F2547]" />
                  <span>
                    {selectedFile ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` : 'Pilih berkas dokumen dari perangkat'}
                  </span>
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Atau Tautan URL Dokumen
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.externalUrl}
                  onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
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
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#0F2547] rounded-lg disabled:opacity-60"
                >
                  {uploading ? 'Mengunggah...' : 'Simpan Arsip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Dokumen Arsip?"
        description={`Hapus dokumen "${deleteTarget?.title || ''}" dari repositori arsip digital?`}
        loading={uploading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
