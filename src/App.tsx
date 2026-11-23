import React, { useEffect, useState } from 'react';
import { MailCheck, RefreshCw, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginView } from './components/LoginView';
import { Layout } from './components/Layout';
import { ModuleTabs } from './components/ModuleTabs';
import { DashboardView } from './components/DashboardView';
import { HomeView } from './components/HomeView';
import { ActivityIdentityView } from './components/ActivityIdentityView';
import { ParticipantsView } from './components/ParticipantsView';
import { TeachersView } from './components/TeachersView';
import { ScheduleView } from './components/ScheduleView';
import { JournalView } from './components/JournalView';
import { DocumentationView } from './components/DocumentationView';
import { ReflectionView } from './components/ReflectionView';
import { LkpdView } from './components/LkpdView';
import { EvaluationView } from './components/EvaluationView';
import { ReportView } from './components/ReportView';
import { ArchiveView } from './components/ArchiveView';
import { SettingsView } from './components/SettingsView';
import { canAccessModule, type AppModuleId } from './types';

const AppContent: React.FC = () => {
  const {
    authMode,
    firebaseUser,
    userProfile,
    effectiveRole,
    authReady,
    needsEmailVerification,
    resendVerificationEmail,
    reloadAuthUser,
    logout,
  } = useAuth();
  const [activeModule, setActiveModule] = useState<AppModuleId>('dashboard');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [checkingVerify, setCheckingVerify] = useState(false);

  useEffect(() => {
    if (userProfile && !canAccessModule(effectiveRole, activeModule)) {
      setActiveModule(effectiveRole === 'SISWA' ? 'beranda' : 'dashboard');
    }
  }, [userProfile, effectiveRole, activeModule]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#0F2547] border-t-[#C9A227] rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Memuat Sistem Pelaporan Kokurikuler...</p>
        </div>
      </div>
    );
  }

  if (authMode === 'firebase' && firebaseUser && needsEmailVerification) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 space-y-4">
          <div className="w-11 h-11 rounded-xl bg-[#0F2547] text-[#E0BD4F] flex items-center justify-center">
            <MailCheck className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Verifikasi Email Diperlukan</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Untuk menjaga keamanan data sekolah, akun <span className="font-mono font-semibold text-slate-800">{firebaseUser.email}</span> harus memverifikasi alamat email terlebih dahulu melalui tautan yang dikirim ke kotak masuk email Anda.
          </p>
          {verifyMsg && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              {verifyMsg}
            </div>
          )}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              disabled={checkingVerify}
              onClick={async () => {
                setCheckingVerify(true);
                setVerifyMsg(null);
                try {
                  const ok = await reloadAuthUser();
                  if (!ok) {
                    setVerifyMsg('Status email masih belum terverifikasi. Klik tautan verifikasi di email Anda lalu coba lagi.');
                  }
                } finally {
                  setCheckingVerify(false);
                }
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#E0BD4F]" />
              <span>{checkingVerify ? 'Memeriksa Status...' : 'Saya Sudah Verifikasi — Lanjutkan'}</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                const sent = await resendVerificationEmail();
                setVerifyMsg(
                  sent
                    ? 'Email verifikasi telah dikirim ulang. Periksa folder Inbox atau Spam.'
                    : 'Gagal mengirim ulang email verifikasi. Coba beberapa saat lagi.'
                );
              }}
              className="w-full px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Kirim Ulang Email Verifikasi
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar / Ganti Akun</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if ((authMode !== 'local' && !firebaseUser) || !userProfile) {
    return <LoginView />;
  }

  if (userProfile.status === 'inactive') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <h1 className="text-lg font-semibold text-slate-900">Akun Dinonaktifkan</h1>
          <p className="text-sm text-slate-600">
            Akun Anda sedang berstatus nonaktif. Silakan hubungi Super Admin SMA Darul Ulum Kepohbaru.
          </p>
        </div>
      </div>
    );
  }

  const isSiswaView = effectiveRole === 'SISWA';

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
      case 'beranda':
        return isSiswaView ? (
          <HomeView onNavigate={setActiveModule} />
        ) : (
          <DashboardView onNavigate={setActiveModule} />
        );

      case 'identitas':
      case 'rundown':
        if (isSiswaView) {
          return <ScheduleView />;
        }
        return (
          <div>
            <ModuleTabs
              tabs={[
                { id: 'identitas', label: 'Identitas Kegiatan' },
                { id: 'rundown', label: 'Agenda & Rundown' },
              ]}
              activeId={activeModule}
              onChange={setActiveModule}
            />
            {activeModule === 'identitas' ? <ActivityIdentityView /> : <ScheduleView />}
          </div>
        );

      case 'peserta':
      case 'guru':
        return (
          <div>
            <ModuleTabs
              tabs={[
                { id: 'peserta', label: 'Data Peserta' },
                { id: 'guru', label: 'Guru Pendamping' },
              ]}
              activeId={activeModule}
              onChange={setActiveModule}
            />
            {activeModule === 'peserta' ? <ParticipantsView /> : <TeachersView />}
          </div>
        );

      case 'jurnal':
      case 'evaluasi':
        return (
          <div>
            <ModuleTabs
              tabs={[
                { id: 'jurnal', label: 'Jurnal Pelaksanaan' },
                { id: 'evaluasi', label: 'Evaluasi Kegiatan' },
              ]}
              activeId={activeModule}
              onChange={setActiveModule}
            />
            {activeModule === 'jurnal' ? <JournalView /> : <EvaluationView />}
          </div>
        );

      case 'dokumentasi':
        return <DocumentationView />;

      case 'lkpd':
      case 'refleksi':
        return (
          <div>
            <ModuleTabs
              tabs={[
                { id: 'lkpd', label: 'Instrumen LKPD' },
                { id: 'refleksi', label: 'Refleksi Siswa' },
              ]}
              activeId={activeModule}
              onChange={setActiveModule}
            />
            {activeModule === 'lkpd' ? <LkpdView /> : <ReflectionView />}
          </div>
        );

      case 'laporan':
      case 'arsip':
        return (
          <div>
            <ModuleTabs
              tabs={[
                { id: 'laporan', label: 'Laporan Otomatis' },
                { id: 'arsip', label: 'Arsip Digital' },
              ]}
              activeId={activeModule}
              onChange={setActiveModule}
            />
            {activeModule === 'laporan' ? <ReportView /> : <ArchiveView />}
          </div>
        );

      case 'pengaturan':
        return <SettingsView />;

      default:
        return isSiswaView ? (
          <HomeView onNavigate={setActiveModule} />
        ) : (
          <DashboardView onNavigate={setActiveModule} />
        );
    }
  };

  return (
    <Layout
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      viewportMode={viewportMode}
      onChangeViewportMode={setViewportMode}
    >
      {renderModule()}
    </Layout>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
