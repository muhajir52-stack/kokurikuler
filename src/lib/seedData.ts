import { doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { MAIN_ACTIVITY_ID, SCHOOL_PROFILE_ID } from '../types';

export const HERO_BUNG_KARNO_URL = '/src/assets/images/hero_bung_karno_museum_1795413124475.jpg';
export const DOC_MUSEUM_EDUKASI_URL = '/src/assets/images/doc_museum_edukasi_1795413124561.jpg';

export async function seedInitialSchoolData(actorUid: string, actorName: string): Promise<void> {
  try {
    // 1. Ensure School Profile exists first
    await setDoc(
      doc(db, 'school_profile', SCHOOL_PROFILE_ID),
      {
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
        logoUrl: '',
        updatedBy: actorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: false }
    );

    // 2. Ensure Main Activity exists BEFORE child documents (satisfies activityExists() in Firestore rules)
    await setDoc(
      doc(db, 'activities', MAIN_ACTIVITY_ID),
      {
        name: 'Kegiatan Kokurikuler Kunjungan Edukatif Sejarah Kebangsaan Tahun 2026',
        theme: 'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno, Presiden Pertama Republik Indonesia',
        year: 2026,
        background:
          'Pembelajaran sejarah dan pendidikan karakter kebangsaan menuntut pengalaman belajar kontekstual di luar ruang kelas. Melalui kunjungan edukatif ke Makam dan Museum Ir. Soekarno di Kota Blitar, peserta didik SMA Darul Ulum Kepohbaru – Bojonegoro diharapkan dapat memahami secara langsung perjuangan Proklamator Kemerdekaan Republik Indonesia, meneladani semangat nasionalisme, persatuan, dan pengabdian kepada bangsa.',
        purpose:
          '1. Memperkuat pemahaman sejarah perjuangan kemerdekaan Indonesia dan peran Ir. Soekarno.\n2. Menumbuhkan sikap nasionalisme, cinta tanah air, dan tanggung jawab kebangsaan peserta didik.\n3. Mengintegrasikan pembelajaran kokurikuler lintas mata pelajaran Sejarah, PPKn, dan Bahasa Indonesia melalui observasi lapangan dan refleksi ilmiah.',
        legalBasis:
          '1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional.\n2. Permendikbudristek tentang Kurikulum Merdeka dan Penguatan Profil Pelajar Pancasila.\n3. Program Kerja Kurikulum dan Kesiswaan SMA Darul Ulum Kepohbaru Tahun Pelajaran 2025/2026.\n4. Surat Keputusan Kepala SMA Darul Ulum Kepohbaru tentang Panitia Kegiatan Kokurikuler Tahun 2026.',
        dayDate: 'Sabtu, 14 Februari 2026',
        departureTime: '05.30 WIB (Halaman SMA Darul Ulum Kepohbaru)',
        destination: 'Kompleks Makam dan Museum Perpustakaan Nasional Bung Karno',
        destinationAddress: 'Jl. Kalasan No. 1, Bendogerit, Kec. Sananwetan, Kota Blitar, Jawa Timur',
        personInCharge: 'Drs. H. Ahmad Muhajir, M.Pd. (Kepala Sekolah)',
        chiefExecutive: 'M. Syafi’i, S.Pd., M.Pd.',
        companionTeachersSummary: '10 Guru Pendamping & Wali Kelas X, XI, XII',
        participantCountTarget: 120,
        fundingSource: 'Komite Sekolah, Dana BOS Pendamping, dan Kontribusi Mandiri Peserta Didik',
        status: 'Berjalan',
        createdBy: actorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: false }
    );

    const batch = writeBatch(db);

    // 3. Initial Teachers
    const initialTeachers = [
      {
        id: 'guru-1',
        name: 'M. Syafi’i, S.Pd., M.Pd.',
        nipNuptk: '198204122009031004',
        position: 'Wakil Kepala Sekolah Bidang Kurikulum',
        mentoringTask: 'Ketua Pelaksana & Koordinator Rombongan Bus 1',
        phone: '081234560101',
      },
      {
        id: 'guru-2',
        name: 'Hj. Siti Aminah, S.Pd.',
        nipNuptk: '197911032008012011',
        position: 'Guru Sejarah Indonesia',
        mentoringTask: 'Pembimbing Observasi Sejarah Museum Bung Karno',
        phone: '081234560102',
      },
      {
        id: 'guru-3',
        name: 'Ahmad Fauzi, S.Ag.',
        nipNuptk: '198506182011011008',
        position: 'Guru Pendidikan Agama Islam',
        mentoringTask: 'Koordinator Doa, Tahlil Makam & Pembina Rombongan Bus 2',
        phone: '081234560103',
      },
      {
        id: 'guru-4',
        name: 'Rina Kusumawardani, S.Pd.',
        nipNuptk: '199102252019032009',
        position: 'Guru PPKn & Pembina OSIS',
        mentoringTask: 'Koordinator Kedisiplinan, Absensi & Refleksi Siswa',
        phone: '081234560104',
      },
    ];

    for (const t of initialTeachers) {
      batch.set(doc(db, 'teachers', t.id), {
        activityId: MAIN_ACTIVITY_ID,
        name: t.name,
        nipNuptk: t.nipNuptk,
        position: t.position,
        mentoringTask: t.mentoringTask,
        phone: t.phone,
        createdBy: actorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Initial Schedule / Rundown
    const initialSchedules = [
      {
        id: 'rundown-1',
        orderNo: 1,
        timeRange: '05.00 - 05.30 WIB',
        activityTitle: 'Registrasi Peserta, Pengecekan Perlengkapan & Doa Keberangkatan',
        location: 'Halaman SMA Darul Ulum Kepohbaru',
        personInCharge: 'M. Syafi’i, S.Pd., M.Pd.',
        notes: 'Seluruh siswa mengenakan seragam batik sekolah dan membawa buku catatan observasi.',
      },
      {
        id: 'rundown-2',
        orderNo: 2,
        timeRange: '05.30 - 09.30 WIB',
        activityTitle: 'Perjalanan Rombongan Menuju Kota Blitar',
        location: 'Rute Bojonegoro – Nganjuk – Kediri – Blitar',
        personInCharge: 'Koordinator Tiap Bus',
        notes: 'Pemberian pengarahan lembar kerja observasi sejarah selama perjalanan.',
      },
      {
        id: 'rundown-3',
        orderNo: 3,
        timeRange: '09.30 - 11.15 WIB',
        activityTitle: 'Ziarah, Tahlil Bersama, dan Observasi Area Makam Bung Karno',
        location: 'Pendopo Agung Makam Bung Karno, Bendogerit, Blitar',
        personInCharge: 'Ahmad Fauzi, S.Ag.',
        notes: 'Menjaga ketertiban, kekhusyukan doa, serta mencatat arsitektur pendopo.',
      },
      {
        id: 'rundown-4',
        orderNo: 4,
        timeRange: '11.15 - 13.00 WIB',
        activityTitle: 'Kunjungan Edukatif Museum & Perpustakaan Proklamator Bung Karno',
        location: 'Gedung Museum & Galeri Koleksi Sejarah Blitar',
        personInCharge: 'Hj. Siti Aminah, S.Pd.',
        notes: 'Siswa mencatat artefak perjuangan, naskah pidato, dan dokumentasi foto sejarah.',
      },
      {
        id: 'rundown-5',
        orderNo: 5,
        timeRange: '13.00 - 14.30 WIB',
        activityTitle: 'ISHOMA & Diskusi Kelompok Hasil Observasi Lapangan',
        location: 'Area Pendopo Pusat Informasi Pariwisata Blitar',
        personInCharge: 'Rina Kusumawardani, S.Pd.',
        notes: 'Penyusunan ringkasan refleksi nilai nasionalisme dan foto bersama.',
      },
      {
        id: 'rundown-6',
        orderNo: 6,
        timeRange: '14.30 - 19.00 WIB',
        activityTitle: 'Penutupan Kegiatan Lapangan & Perjalanan Kembali ke Bojonegoro',
        location: 'Rute Blitar – Kepohbaru, Bojonegoro',
        personInCharge: 'M. Syafi’i, S.Pd., M.Pd.',
        notes: 'Presensi akhir seluruh peserta sebelum kepulangan ke rumah masing-masing.',
      },
    ];

    for (const s of initialSchedules) {
      batch.set(doc(db, 'activity_schedules', s.id), {
        activityId: MAIN_ACTIVITY_ID,
        orderNo: s.orderNo,
        timeRange: s.timeRange,
        activityTitle: s.activityTitle,
        location: s.location,
        personInCharge: s.personInCharge,
        notes: s.notes,
        createdBy: actorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 5. Initial Students + Participants
    const initialStudents = [
      { id: 'siswa-1', nis: '20261001', name: 'Ahmad Zaki Al-Farizi', className: 'XI IPA 1', gender: 'L' as const, parentPhone: '081330110001', status: 'Hadir' as const, bus: 'Bus 1' },
      { id: 'siswa-2', nis: '20261002', name: 'Nayla Putri Azzahra', className: 'XI IPA 1', gender: 'P' as const, parentPhone: '081330110002', status: 'Hadir' as const, bus: 'Bus 1' },
      { id: 'siswa-3', nis: '20261003', name: 'Muhammad Rizqi Pratama', className: 'XI IPS 1', gender: 'L' as const, parentPhone: '081330110003', status: 'Hadir' as const, bus: 'Bus 2' },
      { id: 'siswa-4', nis: '20261004', name: 'Siti Nur Halimah', className: 'XI IPS 2', gender: 'P' as const, parentPhone: '081330110004', status: 'Terdaftar' as const, bus: 'Bus 2' },
      { id: 'siswa-5', nis: '20261005', name: 'Dimas Aditya Saputra', className: 'X-A', gender: 'L' as const, parentPhone: '081330110005', status: 'Hadir' as const, bus: 'Bus 3' },
      { id: 'siswa-6', nis: '20261006', name: 'Aulia Rahmawati', className: 'X-B', gender: 'P' as const, parentPhone: '081330110006', status: 'Hadir' as const, bus: 'Bus 3' },
    ];

    for (const st of initialStudents) {
      batch.set(doc(db, 'students', st.id), {
        activityId: MAIN_ACTIVITY_ID,
        nis: st.nis,
        name: st.name,
        className: st.className,
        gender: st.gender,
        parentPhone: st.parentPhone,
        participationStatus: st.status,
        notes: `Rombongan ${st.bus}`,
        createdBy: actorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'activity_participants', `part-${st.id}`), {
        activityId: MAIN_ACTIVITY_ID,
        studentId: st.id,
        nis: st.nis,
        studentName: st.name,
        className: st.className,
        busGroup: st.bus,
        attendanceStatus: st.status === 'Hadir' ? 'Hadir' : 'Terdaftar',
        createdBy: actorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 6. Initial Documentation using verified generated assets
    batch.set(doc(db, 'activity_documentation', 'doc-initial-1'), {
      activityId: MAIN_ACTIVITY_ID,
      title: 'Kompleks Pendopo Makam Bung Karno Blitar',
      caption: 'Area pendopo utama Makam Ir. Soekarno saat rombongan SMA Darul Ulum Kepohbaru melaksanakan ziarah dan doa kebangsaan.',
      mediaType: 'photo',
      category: 'Kunjungan Makam Bung Karno',
      capturedDate: '2026-02-14',
      location: 'Makam Bung Karno, Blitar',
      fileUrl: HERO_BUNG_KARNO_URL,
      fileName: 'hero_bung_karno_museum.jpg',
      isAllowedForStudent: true,
      uploadedByUid: actorUid,
      uploadedByName: actorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'activity_documentation', 'doc-initial-2'), {
      activityId: MAIN_ACTIVITY_ID,
      title: 'Sesi Observasi Koleksi Sejarah di Museum',
      caption: 'Peserta didik mencatat materi sejarah dan mendengarkan pemaparan guru pendamping selama kunjungan galeri museum.',
      mediaType: 'photo',
      category: 'Kunjungan Museum Bung Karno',
      capturedDate: '2026-02-14',
      location: 'Museum Proklamator Bung Karno, Blitar',
      fileUrl: DOC_MUSEUM_EDUKASI_URL,
      fileName: 'doc_museum_edukasi.jpg',
      isAllowedForStudent: true,
      uploadedByUid: actorUid,
      uploadedByName: actorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 7. Initial Journal Entry
    batch.set(doc(db, 'activity_journals', 'jurnal-initial-1'), {
      activityId: MAIN_ACTIVITY_ID,
      date: '2026-02-14',
      time: '09.45 WIB',
      location: 'Pendopo Makam & Museum Bung Karno Blitar',
      description: 'Rombongan SMA Darul Ulum tiba tepat waktu di lokasi, dilanjutkan dengan apel singkat, doa bersama di pendopo makam, dan pembagian kelompok observasi menuju galeri museum.',
      attendeesCount: 118,
      condition: 'Lancar',
      companionNotes: 'Siswa mengikuti arahan pemandu dan guru pendamping dengan sangat tertib.',
      obstacles: 'Antrean pengunjung umum cukup padat pada pukul 10.30 WIB.',
      solutions: 'Kelompok dibagi menjadi dua sesi bergantian antara area perpustakaan dan galeri foto sejarah.',
      authorUid: actorUid,
      authorName: actorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 8. Audit log entry
    batch.set(doc(db, 'audit_logs', `init-${Date.now()}`), {
      action: 'CREATE',
      module: 'Sistem',
      targetId: MAIN_ACTIVITY_ID,
      summary: 'Inisialisasi data awal kegiatan kokurikuler SMA Darul Ulum Tahun 2026',
      actorUid,
      actorName,
      actorRole: 'SUPER_ADMIN',
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedInitialSchoolData');
  }
}
