import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import type { Activity } from '../types';

export const ActivityIdentityView: React.FC = () => {
  const { effectiveRole } = useAuth();
  const { activity, saveActivity } = useData();
  const canEdit = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'KETUA_PELAKSANA';

  const [form, setForm] = useState({
    name: '',
    theme: '',
    year: 2026,
    background: '',
    purpose: '',
    legalBasis: '',
    dayDate: '',
    departureTime: '',
    destination: '',
    destinationAddress: '',
    personInCharge: '',
    chiefExecutive: '',
    companionTeachersSummary: '',
    participantCountTarget: 120,
    fundingSource: '',
    status: 'Berjalan' as Activity['status'],
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (activity) {
      setForm({
        name: activity.name || '',
        theme: activity.theme || '',
        year: activity.year || 2026,
        background: activity.background || '',
        purpose: activity.purpose || '',
        legalBasis: activity.legalBasis || '',
        dayDate: activity.dayDate || '',
        departureTime: activity.departureTime || '',
        destination: activity.destination || '',
        destinationAddress: activity.destinationAddress || '',
        personInCharge: activity.personInCharge || '',
        chiefExecutive: activity.chiefExecutive || '',
        companionTeachersSummary: activity.companionTeachersSummary || '',
        participantCountTarget: activity.participantCountTarget || 120,
        fundingSource: activity.fundingSource || '',
        status: activity.status || 'Berjalan',
      });
    } else {
      setForm({
        name: 'Kegiatan Kokurikuler Kunjungan Edukatif Sejarah Kebangsaan Tahun 2026',
        theme: 'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno, Presiden Pertama Republik Indonesia',
        year: 2026,
        background: '',
        purpose: '',
        legalBasis: '',
        dayDate: 'Sabtu, 14 Februari 2026',
        departureTime: '05.30 WIB',
        destination: 'Makam dan Museum Ir. Soekarno Blitar',
        destinationAddress: 'Jl. Kalasan No. 1, Bendogerit, Kec. Sananwetan, Kota Blitar, Jawa Timur',
        personInCharge: 'Drs. H. Ahmad Muhajir, M.Pd.',
        chiefExecutive: 'M. Syafi’i, S.Pd., M.Pd.',
        companionTeachersSummary: '10 Guru Pendamping',
        participantCountTarget: 120,
        fundingSource: 'Komite Sekolah, BOS Pendamping & Kontribusi Mandiri Siswa',
        status: 'Berjalan',
      });
    }
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setFeedback(null);
    try {
      await saveActivity(form);
      setFeedback('Identitas kegiatan berhasil disimpan secara permanen ke database.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Gagal menyimpan identitas kegiatan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0F2547]">Identitas Kegiatan Kokurikuler</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Pengisian data induk kegiatan yang otomatis digunakan pada penyusunan BAB I & II Laporan.
          </p>
        </div>
        {!canEdit && (
          <span className="text-xs font-medium text-slate-500">
            Mode Baca (Diubah oleh Ketua Pelaksana / Super Admin)
          </span>
        )}
      </div>

      {feedback && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-800">
          {feedback}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Kegiatan *
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tema Kegiatan *
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tahun Pelaksanaan *
            </label>
            <input
              type="number"
              required
              min={2020}
              max={2050}
              disabled={!canEdit}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Status Kegiatan *
            </label>
            <select
              disabled={!canEdit}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Activity['status'] })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            >
              <option value="Persiapan">Persiapan</option>
              <option value="Berjalan">Berjalan</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hari dan Tanggal *
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={form.dayDate}
              onChange={(e) => setForm({ ...form, dayDate: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Waktu Keberangkatan
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={form.departureTime}
              onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lokasi Tujuan *
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alamat Lokasi Tujuan
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={form.destinationAddress}
              onChange={(e) => setForm({ ...form, destinationAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Penanggung Jawab
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={form.personInCharge}
              onChange={(e) => setForm({ ...form, personInCharge: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ketua Pelaksana
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={form.chiefExecutive}
              onChange={(e) => setForm({ ...form, chiefExecutive: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ringkasan Guru Pendamping
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={form.companionTeachersSummary}
              onChange={(e) => setForm({ ...form, companionTeachersSummary: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Jumlah Peserta
            </label>
            <input
              type="number"
              min={0}
              max={5000}
              disabled={!canEdit}
              value={form.participantCountTarget}
              onChange={(e) => setForm({ ...form, participantCountTarget: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Sumber Pembiayaan
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={form.fundingSource}
              onChange={(e) => setForm({ ...form, fundingSource: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Latar Belakang Kegiatan
            </label>
            <textarea
              rows={4}
              disabled={!canEdit}
              value={form.background}
              onChange={(e) => setForm({ ...form, background: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tujuan Kegiatan
            </label>
            <textarea
              rows={4}
              disabled={!canEdit}
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Dasar Pelaksanaan
            </label>
            <textarea
              rows={4}
              disabled={!canEdit}
              value={form.legalBasis}
              onChange={(e) => setForm({ ...form, legalBasis: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F2547] disabled:bg-slate-50"
            />
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2547] hover:bg-[#173463] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4 text-[#E0BD4F]" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Identitas Kegiatan'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
