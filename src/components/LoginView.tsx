import React, { useState } from 'react';
import {
  BookOpenCheck,
  FileCheck2,
  GraduationCap,
  KeyRound,
  LogIn,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { HERO_BUNG_KARNO_URL } from '../lib/seedData';

export const LoginView: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, authLoading, authError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    await signInWithEmail(identifier, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Institutional Showcase Panel */}
      <div className="lg:w-7/12 relative bg-[#081429] text-white flex flex-col justify-between overflow-hidden min-h-[320px] lg:min-h-screen">
        <img
          src={HERO_BUNG_KARNO_URL}
          alt="Kompleks Makam dan Museum Ir. Soekarno di Blitar"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081429] via-[#0F2547]/80 to-[#081429]/70" />

        <div className="relative z-10 p-8 lg:p-12 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#C9A227]/20 border border-[#E0BD4F]/40 shrink-0 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-[#E0BD4F]" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-[#E0BD4F]">
              SMA DARUL ULUM KEPOHBARU · BOJONEGORO
            </p>
            <h1 className="text-lg font-semibold text-white">
              Sistem Informasi Pelaporan Kegiatan Kokurikuler
            </h1>
          </div>
        </div>

        <div className="relative z-10 p-8 lg:p-12 max-w-2xl">
          <p className="text-xs font-medium text-[#E0BD4F] mb-3">
            Tahun Pelaksanaan 2026 · Kunjungan Edukatif Sejarah Kebangsaan
          </p>
          <h2 className="text-2xl lg:text-4xl font-semibold text-white leading-tight mb-4 text-balance">
            Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno, Presiden Pertama Republik Indonesia
          </h2>
          <p className="text-sm lg:text-base text-slate-200 leading-relaxed mb-8">
            Platform terpadu administrasi peserta, jurnal pendampingan, galeri dokumentasi,
            LKPD siswa, serta penyusunan laporan kegiatan otomatis.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/15 pt-6">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#E0BD4F] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Administrasi Terpadu</p>
                <p className="text-xs text-slate-300 mt-0.5">Peserta, guru, dan jadwal</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpenCheck className="w-5 h-5 text-[#E0BD4F] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">LKPD & Refleksi</p>
                <p className="text-xs text-slate-300 mt-0.5">Instrumen siswa & penilaian guru</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileCheck2 className="w-5 h-5 text-[#E0BD4F] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Laporan Otomatis</p>
                <p className="text-xs text-slate-300 mt-0.5">Ekspor resmi PDF & Word</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication Panel */}
      <div className="lg:w-5/12 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F2547] mb-2">
              <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
              <span>Portal Masuk Pengguna</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-1.5">
              Masuk ke Dasbor
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Masukkan username / email dan kata sandi akun Anda, atau masuk menggunakan akun Google.
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 leading-relaxed">
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username atau Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Admin atau nama@smadarululum.sch.id"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F2547]/20 focus:border-[#0F2547]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F2547]/20 focus:border-[#0F2547]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-[#0F2547] hover:bg-[#173463] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-4 h-4 text-[#E0BD4F]" />
              <span>{authLoading ? 'Memverifikasi...' : 'Masuk ke Dasbor'}</span>
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">atau</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-white hover:bg-slate-50 text-[#0F2547] border border-slate-300 text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
          >
            <LogIn className="w-4 h-4 text-[#C9A227]" />
            <span>{authLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
          </button>

          <p className="mt-8 text-xs text-slate-500 text-center leading-relaxed">
            Hak akses disesuaikan otomatis untuk Admin, Kepala Sekolah, Ketua Pelaksana, Guru Pendamping, dan Siswa.
          </p>
        </div>
      </div>
    </div>
  );
};
