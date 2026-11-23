import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  Camera,
  FileBadge,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Monitor,
  Settings,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  canAccessModule,
  ROLE_LABELS,
  type AppModuleId,
  type UserRole,
} from '../types';

interface NavItem {
  id: AppModuleId;
  matchIds: AppModuleId[];
  label: string;
  icon: React.FC<{ className?: string }>;
  roles?: 'staff' | 'siswa';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', matchIds: ['dashboard', 'beranda'], label: 'Dasbor', icon: BarChart3, roles: 'staff' },
  { id: 'beranda', matchIds: ['beranda', 'dashboard'], label: 'Beranda', icon: Home, roles: 'siswa' },
  { id: 'identitas', matchIds: ['identitas', 'rundown'], label: 'Identitas & Rundown', icon: FileBadge, roles: 'staff' },
  { id: 'rundown', matchIds: ['rundown'], label: 'Agenda & Rundown', icon: CalendarClock, roles: 'siswa' },
  { id: 'peserta', matchIds: ['peserta', 'guru'], label: 'Peserta & Guru', icon: Users, roles: 'staff' },
  { id: 'jurnal', matchIds: ['jurnal', 'evaluasi'], label: 'Jurnal & Evaluasi', icon: BookOpen, roles: 'staff' },
  { id: 'dokumentasi', matchIds: ['dokumentasi'], label: 'Dokumentasi', icon: Camera },
  { id: 'lkpd', matchIds: ['lkpd', 'refleksi'], label: 'LKPD & Refleksi', icon: FileSpreadsheet },
  { id: 'laporan', matchIds: ['laporan', 'arsip'], label: 'Laporan & Arsip', icon: FileText, roles: 'staff' },
  { id: 'pengaturan', matchIds: ['pengaturan'], label: 'Pengaturan', icon: Settings, roles: 'staff' },
];

interface LayoutProps {
  activeModule: AppModuleId;
  onSelectModule: (id: AppModuleId) => void;
  viewportMode: 'desktop' | 'mobile';
  onChangeViewportMode: (mode: 'desktop' | 'mobile') => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeModule,
  onSelectModule,
  viewportMode,
  onChangeViewportMode,
  children,
}) => {
  const { userProfile, effectiveRole, previewRole, setPreviewRole, logout } = useAuth();
  const { schoolProfile } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSiswaView = effectiveRole === 'SISWA';
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.roles === 'staff' && isSiswaView) return false;
    if (item.roles === 'siswa' && !isSiswaView) return false;
    return canAccessModule(effectiveRole, item.id);
  });

  const schoolName = schoolProfile?.schoolName || 'SMA Darul Ulum Kepohbaru';
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';

  const handleNavClick = (id: AppModuleId) => {
    onSelectModule(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Institutional Header */}
      <header className="no-print sticky top-0 z-30 h-16 bg-[#0F2547] text-white border-b border-[#1E4480] px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-200 hover:bg-[#173463] transition-colors"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-lg bg-[#173463] border border-[#2B569C] shrink-0 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[#E0BD4F]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              SISTEM PELAPORAN KOKURIKULER SMA DARUL ULUM
            </p>
            <p className="text-xs text-[#E0BD4F] truncate hidden sm:block">
              {schoolName} · Bojonegoro · 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Desktop / Mobile View Mode Switch */}
          <div
            className="hidden md:flex items-center bg-[#081429] border border-[#1E4480] rounded-lg p-0.5"
            role="group"
            aria-label="Mode tampilan layar"
          >
            <button
              type="button"
              onClick={() => onChangeViewportMode('desktop')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewportMode === 'desktop'
                  ? 'bg-[#C9A227] text-[#081429]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewportMode('mobile')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewportMode === 'mobile'
                  ? 'bg-[#C9A227] text-[#081429]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          {/* Super Admin Role Preview Switcher */}
          {isSuperAdmin && (
            <div className="hidden xl:flex items-center bg-[#081429] border border-[#1E4480] rounded-lg px-2.5 py-1">
              <select
                aria-label="Pratinjau hak akses peran"
                value={previewRole || 'SUPER_ADMIN'}
                onChange={(e) => {
                  const val = e.target.value as UserRole;
                  setPreviewRole(val === 'SUPER_ADMIN' ? null : val);
                  if (!canAccessModule(val, activeModule)) {
                    onSelectModule(val === 'SISWA' ? 'beranda' : 'dashboard');
                  }
                }}
                className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
              >
                <option value="SUPER_ADMIN" className="text-slate-900">Super Admin</option>
                <option value="KEPALA_SEKOLAH" className="text-slate-900">Pratinjau: Kepala Sekolah</option>
                <option value="KETUA_PELAKSANA" className="text-slate-900">Pratinjau: Ketua Pelaksana</option>
                <option value="GURU_PENDAMPING" className="text-slate-900">Pratinjau: Guru Pendamping</option>
                <option value="SISWA" className="text-slate-900">Pratinjau: Siswa</option>
              </select>
            </div>
          )}

          {/* User Identity & Logout */}
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-xs font-semibold text-white max-w-[150px] truncate">
              {userProfile?.displayName}
            </span>
            <span className="text-[11px] text-[#E0BD4F] whitespace-nowrap">
              {ROLE_LABELS[effectiveRole]}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#173463] hover:bg-[#1E4480] text-white text-xs font-medium rounded-lg border border-[#2B569C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#E0BD4F]" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Desktop Sidebar */}
        <aside className="no-print hidden lg:flex lg:flex-col lg:w-60 bg-white border-r border-slate-200 shrink-0">
          <div className="p-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500">Navigasi</p>
            <p className="text-xs text-slate-400 mt-0.5">Tahun Pelajaran {schoolProfile?.academicYear || '2025/2026'}</p>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.matchIds.includes(activeModule);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#0F2547] text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#0F2547]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#E0BD4F]' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-100 bg-slate-50/70">
            <p className="text-xs font-semibold text-[#0F2547]">Kunjungan Edukatif 2026</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Makam & Museum Ir. Soekarno · Blitar
            </p>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="no-print fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-xl z-10">
              <div className="h-16 px-4 bg-[#0F2547] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#173463] border border-[#2B569C] flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-[#E0BD4F]" />
                  </div>
                  <span className="text-sm font-semibold truncate">{schoolName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white"
                  aria-label="Tutup menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {isSuperAdmin && (
                <div className="p-3 bg-slate-50 border-b border-slate-200">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Pratinjau Peran
                  </label>
                  <select
                    value={previewRole || 'SUPER_ADMIN'}
                    onChange={(e) => {
                      const val = e.target.value as UserRole;
                      setPreviewRole(val === 'SUPER_ADMIN' ? null : val);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="KEPALA_SEKOLAH">Kepala Sekolah</option>
                    <option value="KETUA_PELAKSANA">Ketua Pelaksana</option>
                    <option value="GURU_PENDAMPING">Guru Pendamping</option>
                    <option value="SISWA">Siswa</option>
                  </select>
                </div>
              )}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.matchIds.includes(activeModule);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-[#0F2547] text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E0BD4F]' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div
            className={
              viewportMode === 'mobile'
                ? 'mx-auto w-full max-w-[420px] border border-slate-300 rounded-2xl bg-slate-50 p-4 shadow-sm transition-all'
                : 'mx-auto w-full max-w-7xl transition-all'
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
