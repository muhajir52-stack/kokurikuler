import React, { useMemo, useRef, useState } from 'react';
import {
  Camera,
  Eye,
  Film,
  Maximize2,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { uploadFileToCloud } from '../lib/firebase';
import {
  DOC_CATEGORIES,
  type ActivityDocumentation,
  type DocCategory,
} from '../types';
import { ConfirmModal } from './ConfirmModal';

export const DocumentationView: React.FC = () => {
  const { effectiveRole } = useAuth();
  const { documentation, addDocumentation, updateDocumentation, deleteDocumentation } = useData();

  const canUpload =
    effectiveRole === 'SUPER_ADMIN' ||
    effectiveRole === 'KETUA_PELAKSANA' ||
    effectiveRole === 'GURU_PENDAMPING';

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DocCategory>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<ActivityDocumentation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActivityDocumentation | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '',
    caption: '',
    mediaType: 'photo' as 'photo' | 'video',
    category: DOC_CATEGORIES[2] as DocCategory,
    capturedDate: '2026-02-14',
    location: 'Kompleks Makam & Museum Bung Karno Blitar',
    externalUrl: '',
    isAllowedForStudent: true,
  });

  const filteredDocs = useMemo(() => {
    if (categoryFilter === 'ALL') return documentation;
    return documentation.filter((d) => d.category === categoryFilter);
  }, [documentation, categoryFilter]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!selectedFile && !form.externalUrl.trim()) {
      setUploadError('Silakan pilih file foto/video untuk diunggah atau masukkan tautan media.');
      return;
    }

    setUploading(true);
    try {
      let fileUrl = form.externalUrl.trim();
      let storagePath: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;

      if (selectedFile) {
        if (selectedFile.size > 50 * 1024 * 1024) {
          throw new Error('Ukuran file maksimal 50 MB.');
        }
        const uploaded = await uploadFileToCloud('documentation/kokurikuler-2026', selectedFile);
        fileUrl = uploaded.fileUrl;
        storagePath = uploaded.storagePath;
        fileName = uploaded.fileName;
        fileSize = uploaded.fileSize;
      }

      await addDocumentation({
        title: form.title,
        caption: form.caption,
        mediaType: form.mediaType,
        category: form.category,
        capturedDate: form.capturedDate,
        location: form.location,
        fileUrl,
        storagePath,
        fileName,
        fileSize,
        isAllowedForStudent: form.isAllowedForStudent,
      });

      setModalOpen(false);
      setSelectedFile(null);
      setForm({
        title: '',
        caption: '',
        mediaType: 'photo',
        category: DOC_CATEGORIES[2],
        capturedDate: '2026-02-14',
        location: 'Kompleks Makam & Museum Bung Karno Blitar',
        externalUrl: '',
        isAllowedForStudent: true,
      });
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? `Unggah gagal: ${err.message}. Pastikan Firebase Storage aktif atau gunakan tautan URL media.`
          : 'Gagal mengunggah media dokumentasi.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setUploading(true);
    try {
      await deleteDocumentation(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F2547]">Dokumentasi Kegiatan</h1>
          <p className="text-sm text-slate-600 mt-0.5 tabular-nums">
            Galeri foto dan video kunjungan edukatif ({documentation.length} arsip media)
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
            <span>Unggah Foto / Video</span>
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            categoryFilter === 'ALL'
              ? 'bg-[#0F2547] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua ({documentation.length})
        </button>
        {DOC_CATEGORIES.map((cat) => {
          const count = documentation.filter((d) => d.category === cat).length;
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

      {/* Modern Gallery Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Belum ada dokumentasi pada kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div
                  className="relative aspect-[4/3] bg-slate-900 overflow-hidden cursor-pointer group"
                  onClick={() => setLightboxItem(item)}
                >
                  {item.mediaType === 'video' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#081429] text-white p-4">
                      <Film className="w-10 h-10 text-[#E0BD4F] mb-2" />
                      <span className="text-xs font-medium text-slate-200">Klik untuk memutar video</span>
                    </div>
                  ) : (
                    <img
                      src={item.fileUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-xs font-medium text-[#A37B14] mb-1">
                    {item.category} · <span className="font-mono tabular-nums">{item.capturedDate}</span>
                  </p>
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 truncate">
                    {item.location} · Oleh {item.uploadedByName}
                  </p>
                </div>
              </div>

              {canUpload && (
                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateDocumentation(item.id, {
                        isAllowedForStudent: !item.isAllowedForStudent,
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#0F2547] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{item.isAllowedForStudent ? 'Tampil untuk Siswa' : 'Khusus Guru/Staff'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="p-1 text-slate-400 hover:text-red-700 cursor-pointer"
                    aria-label="Hapus dokumentasi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Unggah Dokumentasi Kegiatan</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                {uploadError}
              </div>
            )}
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Media</label>
                  <select
                    value={form.mediaType}
                    onChange={(e) => setForm({ ...form, mediaType: e.target.value as 'photo' | 'video' })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="photo">Foto</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pengambilan *</label>
                  <input
                    type="date"
                    required
                    value={form.capturedDate}
                    onChange={(e) => setForm({ ...form, capturedDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Dokumentasi *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as DocCategory })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {DOC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Dokumentasi *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Dokumentasi *</label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Foto / Video</label>
                <textarea
                  rows={2}
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unggah File ke Cloud Storage
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={form.mediaType === 'photo' ? 'image/*' : 'video/*'}
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
                    {selectedFile ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` : 'Pilih berkas foto atau video dari perangkat'}
                  </span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Atau Tautan URL Media (Opsional jika tidak unggah file)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.externalUrl}
                  onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAllowedForStudent}
                  onChange={(e) => setForm({ ...form, isAllowedForStudent: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span>Izinkan dokumentasi ini dilihat oleh Siswa</span>
              </label>

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
                  {uploading ? 'Mengunggah...' : 'Simpan Dokumentasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Zoom / Video Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0F2547] text-white">
              <div>
                <p className="text-xs text-[#E0BD4F]">{lightboxItem.category}</p>
                <h3 className="text-sm font-semibold">{lightboxItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="p-1.5 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black flex items-center justify-center max-h-[70vh]">
              {lightboxItem.mediaType === 'video' ? (
                <video src={lightboxItem.fileUrl} controls className="max-h-[70vh] w-full" />
              ) : (
                <img
                  src={lightboxItem.fileUrl}
                  alt={lightboxItem.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[70vh] w-auto object-contain"
                />
              )}
            </div>
            <div className="p-5 bg-white">
              <p className="text-sm text-slate-700 leading-relaxed">{lightboxItem.caption}</p>
              <p className="text-xs text-slate-500 mt-2">
                {lightboxItem.location} · {lightboxItem.capturedDate} · Diunggah oleh {lightboxItem.uploadedByName}
              </p>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Dokumentasi?"
        description={`Hapus "${deleteTarget?.title || ''}" dari galeri dokumentasi?`}
        loading={uploading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
