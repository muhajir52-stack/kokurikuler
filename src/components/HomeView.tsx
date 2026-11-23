import React from 'react';
import {
  ArrowRight,
  Calendar,
  Camera,
  ClipboardList,
  FileBadge,
  FileSpreadsheet,
  MapPin,
  School,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { HERO_BUNG_KARNO_URL } from '../lib/seedData';
import { canAccessModule, ROLE_LABELS, type AppModuleId } from '../types';

interface HomeViewProps {
  onNavigate: (moduleId: AppModuleId) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { userProfile, effectiveRole } = useAuth();
  const { schoolProfile, activity, students, schedules, documentation, reflections, lkpdSubmissions } = useData();

  const quickActions: { id: AppModuleId; title: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
    {
      id: 'identitas',
      title: 'Identitas Kegiatan',
      desc: 'Latar belakang, tujuan, lokasi, dan penanggung jawab.',
      icon: FileBadge,
    },
    {
      id: 'rundown',
      title: 'Agenda & Rundown',
      desc: `${schedules.length} jadwal kegiatan kunjungan edukatif.`,
      icon: Calendar,
    },
    {
      id: 'dokumentasi',
      title: 'Galeri Dokumentasi',
      desc: `${documentation.length} arsip foto & video kegiatan.`,
      icon: Camera,
    },
    {
      id: 'lkpd',
      title: 'Instrumen LKPD Siswa',
      desc: `${lkpdSubmissions.length} lembar kerja siswa lintas 6 mata pelajaran.`,
      icon: FileSpreadsheet,
    },
    {
      id: 'refleksi',
      title: 'Refleksi Pembelajaran',
      desc: `${reflections.length} catatan observasi dan nilai sejarah.`,
      icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-[#081429] text-white">
        <img
          src={HERO_BUNG_KARNO_URL}
          alt="Makam dan Museum Ir. Soekarno Blitar"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#081429]/95 via-[#0F2547]/85 to-[#081429]/70" />
        <div className="relative z-10 p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#E0BD4F] mb-2">
              SELAMAT DATANG, {userProfile?.displayName?.toUpperCase()} · {ROLE_LABELS[effectiveRole].toUpperCase()}
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white leading-tight text-balance">
              {activity?.theme ||
                'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno, Presiden Pertama Republik Indonesia'}
            </h1>
            <p className="text-sm text-slate-200 mt-3 leading-relaxed">
              {activity?.name || 'Kegiatan Kokurikuler SMA Darul Ulum Kepohbaru – Bojonegoro'} · Tahun{' '}
              {activity?.year || 2026}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#E0BD4F]" />
                {activity?.dayDate || 'Sabtu, 14 Februari 2026'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#E0BD4F]" />
                {activity?.destination || 'Makam dan Museum Bung Karno, Kota Blitar'}
              </span>
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Users className="w-4 h-4 text-[#E0BD4F]" />
                Target {activity?.participantCountTarget || 120} Peserta
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-5 min-w-[240px] shrink-0">
            <div className="mb-3">
              <p className="text-sm font-semibold text-white">
                {schoolProfile?.schoolName || 'SMA Darul Ulum Kepohbaru'}
              </p>
              <p className="text-xs text-[#E0BD4F] mt-0.5">NPSN {schoolProfile?.npsn || '20541289'}</p>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {schoolProfile?.address || 'Jl. Raya Kepohbaru No. 45'}, Kec.{' '}
              {schoolProfile?.district || 'Kepohbaru'}, Kab.{' '}
              {schoolProfile?.regency || 'Bojonegoro'}
            </p>
          </div>
        </div>
      </div>

      {/* School & Activity Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <School className="w-5 h-5 text-[#0F2547]" />
            <h2 className="text-base font-semibold text-slate-900">Identitas Satuan Pendidikan</h2>
          </div>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100">
              <dt className="text-slate-500">Nama Sekolah</dt>
              <dd className="font-medium text-slate-900 text-right">
                {schoolProfile?.schoolName || 'SMA Darul Ulum Kepohbaru'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100">
              <dt className="text-slate-500">Kepala Sekolah</dt>
              <dd className="font-medium text-slate-900 text-right">
                {schoolProfile?.principalName || 'Drs. H. Ahmad Muhajir, M.Pd.'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100">
              <dt className="text-slate-500">Tahun Pelajaran</dt>
              <dd className="font-mono font-medium text-slate-900 tabular-nums">
                {schoolProfile?.academicYear || '2025/2026'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-slate-500">Alamat</dt>
              <dd className="font-medium text-slate-900 text-right">
                {schoolProfile?.address || 'Jl. Raya Kepohbaru No. 45'}, Bojonegoro
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <FileBadge className="w-5 h-5 text-[#A37B14]" />
            <h2 className="text-base font-semibold text-slate-900">Ringkasan Pelaksanaan Kegiatan</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            {activity?.background ||
              'Kegiatan kokurikuler ini dirancang untuk memperdalam wawasan sejarah perjuangan bangsa dan keteladanan Proklamator Kemerdekaan RI Ir. Soekarno melalui pengamatan langsung di Blitar.'}
          </p>
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-500 block">Ketua Pelaksana</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">
                {activity?.chiefExecutive || 'M. Syafi’i, S.Pd., M.Pd.'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Status Kegiatan</span>
              <span className="font-semibold text-[#0F2547] mt-0.5 block">
                {activity?.status || 'Berjalan'} ({students.length} siswa tercatat)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions
          .filter((a) => canAccessModule(effectiveRole, a.id))
          .map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onNavigate(action.id)}
                className="group bg-white border border-slate-200 hover:border-[#0F2547] rounded-xl p-5 text-left transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-[#0F2547] text-[#0F2547] group-hover:text-[#E0BD4F] flex items-center justify-center mb-3 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{action.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{action.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F2547] mt-4">
                  Buka Modul <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
};
