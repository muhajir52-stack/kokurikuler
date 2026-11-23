import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Database,
  Download,
  FileCode2,
  History,
  KeyRound,
  Plus,
  Save,
  School,
  Shield,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { ROLE_LABELS, type UserRole } from '../types';
import { ConfirmModal } from './ConfirmModal';

export const SettingsView: React.FC = () => {
  const { authMode, effectiveRole, userProfile } = useAuth();
  const {
    schoolProfile,
    activity,
    students,
    teachers,
    schedules,
    journals,
    documentation,
    reflections,
    lkpdSubmissions,
    evaluations,
    reports,
    archives,
    approvals,
    auditLogs,
    users,
    invites,
    saveSchoolProfile,
    createManagedUserByAdmin,
    deleteUserInvite,
    updateUserRoleAndStatus,
    logAudit,
  } = useData();

  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN';

  const [tab, setTab] = useState<'pengguna' | 'sekolah' | 'backup'>('pengguna');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [deleteInviteEmail, setDeleteInviteEmail] = useState<string | null>(null);

  const [schoolForm, setSchoolForm] = useState({
    schoolName: 'SMA Darul Ulum Kepohbaru',
    npsn: '20541289',
    address: 'Jl. Raya Kepohbaru No. 45, Desa Kepoh',
    district: 'Kepohbaru',
    regency: 'Bojonegoro',
    province: 'Jawa Timur',
    postalCode: '62194',
    phone: '(0353) 331452',
    email: 'info@smadarululum-kepohbaru.sch.id',
    website: 'https://smadarululum-kepohbaru.sch.id',
    principalName: 'Drs. H. Ahmad Muhajir, M.Pd.',
    principalNip: '196805141994031007',
    academicYear: '2025/2026',
  });

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    displayName: '',
    password: '',
    role: 'SISWA' as UserRole,
    nipOrNisn: '',
    className: '',
  });

  useEffect(() => {
    if (schoolProfile) {
      setSchoolForm({
        schoolName: schoolProfile.schoolName || '',
        npsn: schoolProfile.npsn || '',
        address: schoolProfile.address || '',
        district: schoolProfile.district || '',
        regency: schoolProfile.regency || '',
        province: schoolProfile.province || '',
        postalCode: schoolProfile.postalCode || '',
        phone: schoolProfile.phone || '',
        email: schoolProfile.email || '',
        website: schoolProfile.website || '',
        principalName: schoolProfile.principalName || '',
        principalNip: schoolProfile.principalNip || '',
        academicYear: schoolProfile.academicYear || '2025/2026',
      });
    }
  }, [schoolProfile]);

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await saveSchoolProfile({ ...schoolForm, logoUrl: '' });
      setFeedback({ type: 'success', message: 'Pengaturan identitas sekolah berhasil disimpan.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyimpan pengaturan sekolah.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() && !userForm.email.trim()) {
      setFeedback({ type: 'error', message: 'Isi minimal Username Login atau Alamat Email.' });
      return;
    }
    if (authMode !== 'local' && userForm.password.trim() && userForm.password.trim().length < 6) {
      setFeedback({ type: 'error', message: 'Kata sandi minimal harus 6 karakter.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await createManagedUserByAdmin(userForm);
      const loginId = userForm.username.trim() || userForm.email.trim();
      if (res.warning) {
        setFeedback({ type: 'warning', message: res.warning });
      } else if (res.authCreated) {
        setFeedback({
          type: 'success',
          message:
            authMode === 'local'
              ? `Akun ${loginId} (${ROLE_LABELS[userForm.role]}) berhasil dibuat dan langsung dapat digunakan untuk login ke dasbor.`
              : `Akun ${loginId} (${ROLE_LABELS[userForm.role]}) berhasil dibuat. Email verifikasi telah dikirim agar pengguna dapat login menggunakan email & kata sandi.`,
        });
      } else {
        setFeedback({
          type: 'success',
          message: `Pra-registrasi peran ${ROLE_LABELS[userForm.role]} untuk ${loginId} berhasil disimpan (login Google).`,
        });
      }
      setUserForm({
        username: '',
        email: '',
        displayName: '',
        password: '',
        role: 'SISWA',
        nipOrNisn: '',
        className: '',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menambahkan akun pengguna.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      exportedBy: userProfile?.email,
      schoolProfile,
      activity,
      students,
      teachers,
      schedules,
      journals,
      documentation,
      reflections,
      lkpdSubmissions,
      evaluations,
      reports,
      archives,
      approvals,
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    saveAs(blob, `Backup_Kokurikuler_SMA_Darul_Ulum_${new Date().toISOString().slice(0, 10)}.json`);
    await logAudit('BACKUP', 'Backup Database', 'kokurikuler-2026', 'Mengunduh salinan backup database JSON');
    setFeedback({ type: 'success', message: 'File backup database JSON berhasil diunduh.' });
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">
          Modul Pengaturan & Manajemen Akun hanya dapat diakses oleh Admin / Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#0F2547]">Pengaturan Sistem & Manajemen Pengguna</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Tambah akun login pengguna (Admin/Guru/Siswa), kelola hak akses RBAC, identitas sekolah, dan cadangan database.
        </p>
      </div>

      {/* Sub-Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 inline-flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setTab('pengguna')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
            tab === 'pengguna' ? 'bg-[#0F2547] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Akun & Hak Akses</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('sekolah')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
            tab === 'sekolah' ? 'bg-[#0F2547] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <School className="w-3.5 h-3.5" />
          <span>Identitas Sekolah</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('backup')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
            tab === 'backup' ? 'bg-[#0F2547] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Backup & Riwayat Data</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 border rounded-xl text-sm flex items-start gap-2.5 ${
            feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : feedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{feedback.message}</span>
        </div>
      )}

      {tab === 'pengguna' && (
        <div className="space-y-6">
          {/* Admin Create User Form */}
          <form onSubmit={handleCreateUser} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#0F2547]">
                <UserPlus className="w-4 h-4 text-[#C9A227]" />
                <h2 className="text-base font-semibold">Tambah Akun Pengguna Baru (Admin / Super Admin)</h2>
              </div>
              <span className="text-xs text-slate-500">
                Isi kata sandi untuk membuat akun login Email & Password sekaligus pra-registrasi Google
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Zaki Al-Farizi"
                  value={userForm.displayName}
                  onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username Login</label>
                <input
                  type="text"
                  placeholder="Contoh: guru1 / siswa1"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email {authMode === 'local' ? '(Opsional)' : '*'}
                </label>
                <input
                  type="email"
                  required={authMode !== 'local'}
                  placeholder="nama@smadarululum.sch.id"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Akun {authMode === 'local' ? '' : '(Min. 6 karakter)'}
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    minLength={authMode === 'local' ? undefined : 6}
                    placeholder="Kosongkan jika hanya login Google"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hak Akses Peran *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="SISWA">Siswa (Pengisi LKPD & Refleksi)</option>
                  <option value="GURU_PENDAMPING">Guru Pendamping (Penilai LKPD & Jurnal)</option>
                  <option value="KETUA_PELAKSANA">Ketua Pelaksana</option>
                  <option value="KEPALA_SEKOLAH">Kepala Sekolah</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIP / NISN</label>
                <input
                  type="text"
                  placeholder="Nomor induk guru / siswa"
                  value={userForm.nipOrNisn}
                  onChange={(e) => setUserForm({ ...userForm, nipOrNisn: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas (Khusus Siswa)</label>
                <input
                  type="text"
                  placeholder="Contoh: XI IPA 1"
                  value={userForm.className}
                  onChange={(e) => setUserForm({ ...userForm, className: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-60"
              >
                <Plus className="w-4 h-4 text-[#E0BD4F]" />
                <span>{saving ? 'Memproses Akun...' : 'Tambahkan Pengguna'}</span>
              </button>
            </div>
          </form>

          {/* Active Registered Users */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-[#0F2547]">Daftar Akun Pengguna Terdaftar ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Nama</th>
                    <th className="py-3 px-4">Username / Email</th>
                    <th className="py-3 px-4">Kelas / ID</th>
                    <th className="py-3 px-4">Peran</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{u.displayName}</td>
                      <td className="py-2.5 px-4 font-mono text-xs text-slate-600">
                        {u.username ? (
                          <div>
                            <span className="font-semibold text-[#0F2547]">{u.username}</span>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        ) : (
                          u.email
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-600">
                        {[u.className, u.nipOrNisn].filter(Boolean).join(' · ') || '-'}
                      </td>
                      <td className="py-2.5 px-4">
                        <select
                          value={u.role}
                          disabled={u.uid === userProfile?.uid}
                          onChange={(e) =>
                            updateUserRoleAndStatus(u.uid, e.target.value as UserRole, u.status)
                          }
                          className="text-xs px-2.5 py-1 border border-slate-300 rounded bg-white disabled:bg-slate-100"
                        >
                          {Object.entries(ROLE_LABELS).map(([k, lbl]) => (
                            <option key={k} value={k}>
                              {lbl}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-4">
                        <select
                          value={u.status}
                          disabled={u.uid === userProfile?.uid}
                          onChange={(e) =>
                            updateUserRoleAndStatus(u.uid, u.role, e.target.value as 'active' | 'inactive')
                          }
                          className="text-xs px-2.5 py-1 border border-slate-300 rounded bg-white disabled:bg-slate-100"
                        >
                          <option value="active">Aktif</option>
                          <option value="inactive">Nonaktif</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Email Invites */}
          {invites.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-[#0F2547]">
                  Daftar Pra-Registrasi Email ({invites.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Nama</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Peran Ditetapkan</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invites.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2.5 px-4 font-mono text-xs">{inv.email}</td>
                        <td className="py-2.5 px-4">{inv.displayName}</td>
                        <td className="py-2.5 px-4 text-xs text-slate-600">{inv.className || '-'}</td>
                        <td className="py-2.5 px-4 text-xs font-semibold text-[#0F2547]">
                          {ROLE_LABELS[inv.role]}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setDeleteInviteEmail(inv.id)}
                            className="p-1 text-slate-400 hover:text-red-700 cursor-pointer"
                            aria-label="Hapus undangan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'sekolah' && (
        <form onSubmit={handleSaveSchool} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sekolah *</label>
              <input
                type="text"
                required
                value={schoolForm.schoolName}
                onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NPSN</label>
              <input
                type="text"
                value={schoolForm.npsn}
                onChange={(e) => setSchoolForm({ ...schoolForm, npsn: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Sekolah *</label>
              <input
                type="text"
                required
                value={schoolForm.address}
                onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kecamatan</label>
              <input
                type="text"
                value={schoolForm.district}
                onChange={(e) => setSchoolForm({ ...schoolForm, district: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kabupaten</label>
              <input
                type="text"
                value={schoolForm.regency}
                onChange={(e) => setSchoolForm({ ...schoolForm, regency: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kepala Sekolah *</label>
              <input
                type="text"
                required
                value={schoolForm.principalName}
                onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={schoolForm.principalNip}
                onChange={(e) => setSchoolForm({ ...schoolForm, principalNip: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Pelajaran *</label>
              <input
                type="text"
                required
                value={schoolForm.academicYear}
                onChange={(e) => setSchoolForm({ ...schoolForm, academicYear: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telepon Sekolah</label>
              <input
                type="text"
                value={schoolForm.phone}
                onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Resmi</label>
              <input
                type="email"
                value={schoolForm.email}
                onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website Sekolah</label>
              <input
                type="text"
                value={schoolForm.website}
                onChange={(e) => setSchoolForm({ ...schoolForm, website: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2547] hover:bg-[#173463] text-white text-sm font-semibold rounded-lg cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#E0BD4F]" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Sekolah'}</span>
            </button>
          </div>
        </form>
      )}

      {tab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#0F2547]">Cadangan Database (Backup JSON)</h2>
              <p className="text-sm text-slate-600 mt-1">
                Unduh seluruh tabel data kegiatan kokurikuler (peserta, guru, jadwal, jurnal, dokumentasi, refleksi, LKPD, evaluasi, laporan, dan arsip) ke file JSON lokal.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Database className="w-4 h-4 text-[#E0BD4F]" />
              <span>Unduh Backup JSON</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-[#C9A227]" />
                <h2 className="text-base font-semibold text-[#0F2547]">
                  Konversi Web Google Apps Script (Code.gs & Index.html)
                </h2>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Unduh file <span className="font-mono text-xs font-semibold">Code.gs</span> (backend Google Sheets & Google Drive) dan{' '}
                <span className="font-mono text-xs font-semibold">Index.html</span> untuk di-deploy sebagai Web App di Google Apps Script (login default: <span className="font-mono font-semibold">Admin / Admin</span>).
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <a
                href="/apps-script/Code.gs"
                download="Code.gs"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F2547] hover:bg-[#173463] text-white text-xs font-semibold rounded-lg whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-[#E0BD4F]" />
                <span>Unduh Code.gs</span>
              </a>
              <a
                href="/apps-script/Index.html"
                download="Index.html"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-[#0F2547] border border-slate-300 text-xs font-semibold rounded-lg whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-[#C9A227]" />
                <span>Unduh Index.html</span>
              </a>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-[#0F2547]" />
              <h3 className="text-sm font-semibold text-[#0F2547]">
                Riwayat Perubahan Data (Audit Log)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Aksi</th>
                    <th className="py-3 px-4">Modul</th>
                    <th className="py-3 px-4">Ringkasan Perubahan</th>
                    <th className="py-3 px-4">Pengguna</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Belum ada catatan perubahan data.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 px-4 font-mono text-xs font-semibold text-[#0F2547]">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-4 text-xs font-medium text-slate-700">{log.module}</td>
                        <td className="py-2.5 px-4 text-slate-700">{log.summary}</td>
                        <td className="py-2.5 px-4 text-xs text-slate-500">
                          {log.actorName} ({log.actorRole})
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteInviteEmail)}
        title="Hapus Pra-Registrasi Peran?"
        description={`Hapus penetapan peran untuk ${deleteInviteEmail || ''}?`}
        loading={saving}
        onConfirm={async () => {
          if (!deleteInviteEmail) return;
          setSaving(true);
          try {
            await deleteUserInvite(deleteInviteEmail);
            setDeleteInviteEmail(null);
          } finally {
            setSaving(false);
          }
        }}
        onCancel={() => setDeleteInviteEmail(null)}
      />
    </div>
  );
};
