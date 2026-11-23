import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  clampStr,
  createUserAccountByAdmin,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  isStaffRole,
  MAIN_ACTIVITY_ID,
  SCHOOL_PROFILE_ID,
  type Activity,
  type ActivityDocumentation,
  type ActivityEvaluation,
  type ActivityJournal,
  type ActivityParticipant,
  type ActivityReport,
  type ActivitySchedule,
  type Approval,
  type AuditLog,
  type DigitalArchive,
  type LkpdSubmission,
  type SchoolProfile,
  type Student,
  type StudentReflection,
  type Teacher,
  type UserAccount,
  type UserInvite,
  type UserRole,
} from '../types';

interface LocalDataPayload {
  schoolProfile: SchoolProfile | null;
  activity: Activity | null;
  students: Student[];
  teachers: Teacher[];
  participants: ActivityParticipant[];
  schedules: ActivitySchedule[];
  journals: ActivityJournal[];
  documentation: ActivityDocumentation[];
  reflections: StudentReflection[];
  lkpdSubmissions: LkpdSubmission[];
  evaluations: ActivityEvaluation[];
  reports: ActivityReport[];
  archives: DigitalArchive[];
  approvals: Approval[];
  auditLogs: AuditLog[];
  users: UserAccount[];
  invites: UserInvite[];
}

interface DataContextValue {
  loading: boolean;
  schoolProfile: SchoolProfile | null;
  activity: Activity | null;
  students: Student[];
  teachers: Teacher[];
  participants: ActivityParticipant[];
  schedules: ActivitySchedule[];
  journals: ActivityJournal[];
  documentation: ActivityDocumentation[];
  reflections: StudentReflection[];
  lkpdSubmissions: LkpdSubmission[];
  evaluations: ActivityEvaluation[];
  reports: ActivityReport[];
  archives: DigitalArchive[];
  approvals: Approval[];
  auditLogs: AuditLog[];
  users: UserAccount[];
  invites: UserInvite[];
  logAudit: (action: AuditLog['action'], module: string, targetId: string, summary: string) => Promise<void>;
  saveSchoolProfile: (data: Partial<SchoolProfile>) => Promise<void>;
  saveActivity: (data: Partial<Activity>) => Promise<void>;
  addStudent: (data: Omit<Student, 'id' | 'activityId' | 'createdBy' | 'createdAt' | 'updatedAt'>, busGroup?: string) => Promise<string>;
  updateStudent: (id: string, data: Partial<Student>, busGroup?: string) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addTeacher: (data: Omit<Teacher, 'id' | 'activityId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTeacher: (id: string, data: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  addSchedule: (data: Omit<ActivitySchedule, 'id' | 'activityId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSchedule: (id: string, data: Partial<ActivitySchedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  addJournal: (data: Omit<ActivityJournal, 'id' | 'activityId' | 'authorUid' | 'authorName' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJournal: (id: string, data: Partial<ActivityJournal>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  addDocumentation: (data: Omit<ActivityDocumentation, 'id' | 'activityId' | 'uploadedByUid' | 'uploadedByName' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDocumentation: (id: string, data: Partial<ActivityDocumentation>) => Promise<void>;
  deleteDocumentation: (id: string) => Promise<void>;
  addReflection: (data: Omit<StudentReflection, 'id' | 'activityId' | 'studentUid' | 'reviewStatus' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReflectionStudent: (id: string, data: Partial<StudentReflection>) => Promise<void>;
  gradeReflection: (id: string, score: number, feedback: string) => Promise<void>;
  deleteReflection: (id: string) => Promise<void>;
  addLkpdSubmission: (data: Omit<LkpdSubmission, 'id' | 'activityId' | 'studentUid' | 'reviewStatus' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLkpdStudent: (id: string, data: Partial<LkpdSubmission>) => Promise<void>;
  gradeLkpdSubmission: (id: string, score: number, feedback: string) => Promise<void>;
  deleteLkpdSubmission: (id: string) => Promise<void>;
  addEvaluation: (data: Omit<ActivityEvaluation, 'id' | 'activityId' | 'evaluatorUid' | 'evaluatorName' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvaluation: (id: string, data: Partial<ActivityEvaluation>) => Promise<void>;
  deleteEvaluation: (id: string) => Promise<void>;
  addReport: (data: Omit<ActivityReport, 'id' | 'activityId' | 'authorUid' | 'authorName' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateReport: (id: string, data: Partial<ActivityReport>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  submitApprovalDecision: (params: {
    reportId: string;
    reportTitle: string;
    status: Approval['status'];
    decisionNotes: string;
  }) => Promise<void>;
  addArchive: (data: Omit<DigitalArchive, 'id' | 'activityId' | 'uploadedByUid' | 'uploadedByName' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteArchive: (id: string) => Promise<void>;
  upsertUserInvite: (data: { email: string; displayName: string; role: UserRole; nipOrNisn?: string; className?: string }) => Promise<void>;
  createManagedUserByAdmin: (data: {
    username?: string;
    email?: string;
    displayName: string;
    password?: string;
    role: UserRole;
    nipOrNisn?: string;
    className?: string;
  }) => Promise<{ authCreated: boolean; emailVerified: boolean; warning?: string }>;
  deleteUserInvite: (email: string) => Promise<void>;
  updateUserRoleAndStatus: (uid: string, role: UserRole, status: 'active' | 'inactive') => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authMode, localToken, firebaseUser, userProfile, authReady } = useAuth();
  const [loading, setLoading] = useState(true);

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [schedules, setSchedules] = useState<ActivitySchedule[]>([]);
  const [journals, setJournals] = useState<ActivityJournal[]>([]);
  const [documentation, setDocumentation] = useState<ActivityDocumentation[]>([]);
  const [reflections, setReflections] = useState<StudentReflection[]>([]);
  const [lkpdSubmissions, setLkpdSubmissions] = useState<LkpdSubmission[]>([]);
  const [evaluations, setEvaluations] = useState<ActivityEvaluation[]>([]);
  const [reports, setReports] = useState<ActivityReport[]>([]);
  const [archives, setArchives] = useState<DigitalArchive[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [invites, setInvites] = useState<UserInvite[]>([]);

  const baseRole = userProfile?.role || 'SISWA';
  const staff = isStaffRole(baseRole);
  const isSuperAdmin = baseRole === 'SUPER_ADMIN';
  const isLocal = authMode === 'local';

  const apiFetch = useCallback(
    async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
      const resp = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(localToken ? { Authorization: `Bearer ${localToken}` } : {}),
          ...(options.headers || {}),
        },
      });
      if (!resp.ok) {
        const errBody = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `Gagal memproses permintaan (${resp.status}).`);
      }
      return (await resp.json()) as T;
    },
    [localToken]
  );

  const refreshLocalData = useCallback(async () => {
    if (!localToken) return;
    const data = await apiFetch<LocalDataPayload>('/api/data');
    setSchoolProfile(data.schoolProfile || null);
    setActivity(data.activity || null);
    setStudents(data.students || []);
    setTeachers(data.teachers || []);
    setParticipants(data.participants || []);
    setSchedules(data.schedules || []);
    setJournals(data.journals || []);
    setDocumentation(data.documentation || []);
    setReflections(data.reflections || []);
    setLkpdSubmissions(data.lkpdSubmissions || []);
    setEvaluations(data.evaluations || []);
    setReports(data.reports || []);
    setArchives(data.archives || []);
    setApprovals(data.approvals || []);
    setAuditLogs(data.auditLogs || []);
    setUsers(data.users || []);
    setInvites(data.invites || []);
  }, [apiFetch, localToken]);

  useEffect(() => {
    if (!authReady || !userProfile || (authMode !== 'local' && !firebaseUser)) {
      setLoading(!authReady);
      return;
    }

    if (authMode === 'local') {
      setLoading(true);
      void refreshLocalData()
        .catch((err) => console.error('Local data load error:', err))
        .finally(() => setLoading(false));
      return;
    }

    if (!firebaseUser) return;

    setLoading(true);
    const unsubs: (() => void)[] = [];

    // 1. Public-to-authenticated collections
    unsubs.push(
      onSnapshot(
        doc(db, 'school_profile', SCHOOL_PROFILE_ID),
        (snap) => {
          setSchoolProfile(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<SchoolProfile, 'id'>) } : null);
          setLoading(false);
        },
        (err) => handleFirestoreError(err, OperationType.GET, `school_profile/${SCHOOL_PROFILE_ID}`)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'activities', MAIN_ACTIVITY_ID),
        (snap) => {
          setActivity(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Activity, 'id'>) } : null);
        },
        (err) => handleFirestoreError(err, OperationType.GET, `activities/${MAIN_ACTIVITY_ID}`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'activity_schedules'), where('activityId', '==', MAIN_ACTIVITY_ID)),
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivitySchedule, 'id'>) }));
          items.sort((a, b) => a.orderNo - b.orderNo);
          setSchedules(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'activity_schedules')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'activity_participants'), where('activityId', '==', MAIN_ACTIVITY_ID)),
        (snap) => {
          setParticipants(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityParticipant, 'id'>) })));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'activity_participants')
      )
    );

    // 2. Documentation (filtered for SISWA, full for Staff)
    const docQuery = staff
      ? query(collection(db, 'activity_documentation'), where('activityId', '==', MAIN_ACTIVITY_ID))
      : query(
          collection(db, 'activity_documentation'),
          where('activityId', '==', MAIN_ACTIVITY_ID),
          where('isAllowedForStudent', '==', true)
        );
    unsubs.push(
      onSnapshot(
        docQuery,
        (snap) => {
          setDocumentation(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityDocumentation, 'id'>) })));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'activity_documentation')
      )
    );

    // 3. Reflections (own for SISWA, all for Staff)
    const refQuery = staff
      ? query(collection(db, 'student_reflections'), where('activityId', '==', MAIN_ACTIVITY_ID))
      : query(
          collection(db, 'student_reflections'),
          where('activityId', '==', MAIN_ACTIVITY_ID),
          where('studentUid', '==', firebaseUser.uid)
        );
    unsubs.push(
      onSnapshot(
        refQuery,
        (snap) => {
          setReflections(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StudentReflection, 'id'>) })));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'student_reflections')
      )
    );

    // 3b. LKPD Submissions (own for SISWA, all for Staff)
    const lkpdQuery = staff
      ? query(collection(db, 'lkpd_submissions'), where('activityId', '==', MAIN_ACTIVITY_ID))
      : query(
          collection(db, 'lkpd_submissions'),
          where('activityId', '==', MAIN_ACTIVITY_ID),
          where('studentUid', '==', firebaseUser.uid)
        );
    unsubs.push(
      onSnapshot(
        lkpdQuery,
        (snap) => {
          setLkpdSubmissions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LkpdSubmission, 'id'>) })));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'lkpd_submissions')
      )
    );

    // 4. Staff-only collections
    if (staff) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'students'), where('activityId', '==', MAIN_ACTIVITY_ID)),
          (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'students')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'teachers'), where('activityId', '==', MAIN_ACTIVITY_ID)),
          (snap) => setTeachers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Teacher, 'id'>) }))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'teachers')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'activity_journals'), where('activityId', '==', MAIN_ACTIVITY_ID)),
          (snap) => setJournals(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityJournal, 'id'>) }))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'activity_journals')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'activity_evaluations'), where('activityId', '==', MAIN_ACTIVITY_ID)),
          (snap) => setEvaluations(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityEvaluation, 'id'>) }))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'activity_evaluations')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'activity_reports'), where('activityId', '==', MAIN_ACTIVITY_ID)),
          (snap) => setReports(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityReport, 'id'>) }))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'activity_reports')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'digital_archives'), where('activityId', '==', MAIN_ACTIVITY_ID)),
          (snap) => setArchives(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DigitalArchive, 'id'>) }))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'digital_archives')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'approvals'), where('activityId', '==', MAIN_ACTIVITY_ID)),
          (snap) => setApprovals(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Approval, 'id'>) }))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'approvals')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc')),
          (snap) => setAuditLogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLog, 'id'>) })).slice(0, 100)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
        )
      );
    } else {
      setStudents([]);
      setTeachers([]);
      setJournals([]);
      setEvaluations([]);
      setReports([]);
      setArchives([]);
      setApprovals([]);
      setAuditLogs([]);
    }

    // 5. Super Admin-only collections
    if (isSuperAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snap) => setUsers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserAccount, 'id'>) }))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'users')
        )
      );
      unsubs.push(
        onSnapshot(
          collection(db, 'user_invites'),
          (snap) => setInvites(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserInvite, 'id'>) }))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'user_invites')
        )
      );
    } else {
      setUsers([]);
      setInvites([]);
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, authMode, firebaseUser, userProfile, staff, isSuperAdmin, refreshLocalData]);

  const uid = userProfile?.uid || firebaseUser?.uid || '';
  const actorName = userProfile?.displayName || firebaseUser?.displayName || 'Pengguna';
  const actorRole = userProfile?.role || 'SISWA';

  const logAudit = useCallback(
    async (action: AuditLog['action'], module: string, targetId: string, summary: string) => {
      if (!uid || !staff) return;
      if (isLocal) {
        try {
          await apiFetch('/api/audit', {
            method: 'POST',
            body: JSON.stringify({ action, module, targetId, summary }),
          });
          await refreshLocalData();
        } catch {
          // Non-blocking audit log failure
        }
        return;
      }
      try {
        await addDoc(collection(db, 'audit_logs'), {
          action,
          module: clampStr(module, 80),
          targetId: clampStr(targetId.replace(/[^a-zA-Z0-9_-]/g, '_'), 128) || 'system',
          summary: clampStr(summary, 500),
          actorUid: uid,
          actorName: clampStr(actorName, 120),
          actorRole: clampStr(actorRole, 40),
          createdAt: serverTimestamp(),
        });
      } catch {
        // Non-blocking audit log failure
      }
    },
    [uid, staff, isLocal, apiFetch, refreshLocalData, actorName, actorRole]
  );

  const saveSchoolProfile = async (data: Partial<SchoolProfile>) => {
    const payload = {
      schoolName: clampStr(data.schoolName || schoolProfile?.schoolName || 'SMA Darul Ulum Kepohbaru', 150),
      npsn: clampStr(data.npsn ?? schoolProfile?.npsn ?? '', 30),
      address: clampStr(data.address || schoolProfile?.address || 'Jl. Raya Kepohbaru No. 45', 300),
      district: clampStr(data.district ?? schoolProfile?.district ?? 'Kepohbaru', 80),
      regency: clampStr(data.regency ?? schoolProfile?.regency ?? 'Bojonegoro', 80),
      province: clampStr(data.province ?? schoolProfile?.province ?? 'Jawa Timur', 80),
      postalCode: clampStr(data.postalCode ?? schoolProfile?.postalCode ?? '62194', 15),
      phone: clampStr(data.phone ?? schoolProfile?.phone ?? '', 40),
      email: clampStr(data.email ?? schoolProfile?.email ?? '', 120),
      website: clampStr(data.website ?? schoolProfile?.website ?? '', 150),
      principalName: clampStr(data.principalName || schoolProfile?.principalName || 'Kepala Sekolah', 120),
      principalNip: clampStr(data.principalNip ?? schoolProfile?.principalNip ?? '', 40),
      academicYear: clampStr(data.academicYear || schoolProfile?.academicYear || '2025/2026', 30),
      logoUrl: '',
    };
    if (isLocal) {
      await apiFetch('/api/school-profile', { method: 'PUT', body: JSON.stringify(payload) });
      await refreshLocalData();
      return;
    }
    const ref = doc(db, 'school_profile', SCHOOL_PROFILE_ID);
    const fsPayload = { ...payload, updatedBy: uid, updatedAt: serverTimestamp() };
    try {
      if (schoolProfile) {
        await updateDoc(ref, fsPayload);
      } else {
        await setDoc(ref, { ...fsPayload, createdAt: serverTimestamp() });
      }
      await logAudit('UPDATE', 'Pengaturan Sekolah', SCHOOL_PROFILE_ID, 'Memperbarui identitas sekolah');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `school_profile/${SCHOOL_PROFILE_ID}`);
    }
  };

  const saveActivity = async (data: Partial<Activity>) => {
    const basePayload = {
      name: clampStr(data.name || activity?.name || 'Kegiatan Kokurikuler SMA Darul Ulum', 200),
      theme: clampStr(data.theme || activity?.theme || 'Kunjungan Edukatif ke Makam dan Museum Ir. Soekarno', 300),
      year: Number(data.year ?? activity?.year ?? 2026),
      background: clampStr(data.background ?? activity?.background ?? '', 5000),
      purpose: clampStr(data.purpose ?? activity?.purpose ?? '', 3000),
      legalBasis: clampStr(data.legalBasis ?? activity?.legalBasis ?? '', 3000),
      dayDate: clampStr(data.dayDate || activity?.dayDate || 'Sabtu, 14 Februari 2026', 100),
      departureTime: clampStr(data.departureTime ?? activity?.departureTime ?? '05.30 WIB', 60),
      destination: clampStr(data.destination || activity?.destination || 'Makam dan Museum Bung Karno Blitar', 200),
      destinationAddress: clampStr(data.destinationAddress ?? activity?.destinationAddress ?? '', 300),
      personInCharge: clampStr(data.personInCharge ?? activity?.personInCharge ?? '', 120),
      chiefExecutive: clampStr(data.chiefExecutive ?? activity?.chiefExecutive ?? '', 120),
      companionTeachersSummary: clampStr(data.companionTeachersSummary ?? activity?.companionTeachersSummary ?? '', 500),
      participantCountTarget: Number(data.participantCountTarget ?? activity?.participantCountTarget ?? 0),
      fundingSource: clampStr(data.fundingSource ?? activity?.fundingSource ?? '', 300),
      status: (data.status || activity?.status || 'Berjalan') as Activity['status'],
    };
    if (isLocal) {
      await apiFetch('/api/activity', { method: 'PUT', body: JSON.stringify(basePayload) });
      await refreshLocalData();
      return;
    }
    const ref = doc(db, 'activities', MAIN_ACTIVITY_ID);
    const fsPayload = { ...basePayload, updatedAt: serverTimestamp() };
    try {
      if (activity) {
        await updateDoc(ref, fsPayload);
      } else {
        await setDoc(ref, { ...fsPayload, createdBy: uid, createdAt: serverTimestamp() });
      }
      await logAudit('UPDATE', 'Identitas Kegiatan', MAIN_ACTIVITY_ID, 'Menyimpan identitas kegiatan kokurikuler');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `activities/${MAIN_ACTIVITY_ID}`);
    }
  };

  const ensureActivityExists = async () => {
    if (!activity) {
      await saveActivity({});
    }
  };

  const addStudent = async (
    data: Omit<Student, 'id' | 'activityId' | 'createdBy' | 'createdAt' | 'updatedAt'>,
    busGroup = 'Bus 1'
  ): Promise<string> => {
    if (isLocal) {
      const created = await apiFetch<Student>('/api/students', {
        method: 'POST',
        body: JSON.stringify({ ...data, busGroup }),
      });
      await refreshLocalData();
      return created.id;
    }
    await ensureActivityExists();
    try {
      const docRef = await addDoc(collection(db, 'students'), {
        activityId: MAIN_ACTIVITY_ID,
        nis: clampStr(data.nis, 30),
        name: clampStr(data.name, 120),
        className: clampStr(data.className, 40),
        gender: data.gender,
        parentPhone: clampStr(data.parentPhone, 30),
        participationStatus: data.participationStatus,
        notes: clampStr(data.notes, 500),
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'activity_participants', `part-${docRef.id}`), {
        activityId: MAIN_ACTIVITY_ID,
        studentId: docRef.id,
        nis: clampStr(data.nis, 30),
        studentName: clampStr(data.name, 120),
        className: clampStr(data.className, 40),
        busGroup: clampStr(busGroup, 60),
        attendanceStatus: data.participationStatus === 'Hadir' ? 'Hadir' : data.participationStatus === 'Izin' ? 'Izin' : 'Terdaftar',
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit('CREATE', 'Data Peserta', docRef.id, `Menambahkan siswa ${data.name} (${data.nis})`);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'students');
    }
  };

  const updateStudent = async (id: string, data: Partial<Student>, busGroup?: string) => {
    if (isLocal) {
      await apiFetch(`/api/students/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...data, ...(busGroup !== undefined ? { busGroup } : {}) }),
      });
      await refreshLocalData();
      return;
    }
    try {
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (data.nis !== undefined) payload.nis = clampStr(data.nis, 30);
      if (data.name !== undefined) payload.name = clampStr(data.name, 120);
      if (data.className !== undefined) payload.className = clampStr(data.className, 40);
      if (data.gender !== undefined) payload.gender = data.gender;
      if (data.parentPhone !== undefined) payload.parentPhone = clampStr(data.parentPhone, 30);
      if (data.participationStatus !== undefined) payload.participationStatus = data.participationStatus;
      if (data.notes !== undefined) payload.notes = clampStr(data.notes, 500);
      await updateDoc(doc(db, 'students', id), payload);

      const partRef = doc(db, 'activity_participants', `part-${id}`);
      const partExists = participants.some((p) => p.id === `part-${id}`);
      if (partExists) {
        const partPayload: Record<string, unknown> = { updatedAt: serverTimestamp() };
        if (data.nis !== undefined) partPayload.nis = clampStr(data.nis, 30);
        if (data.name !== undefined) partPayload.studentName = clampStr(data.name, 120);
        if (data.className !== undefined) partPayload.className = clampStr(data.className, 40);
        if (busGroup !== undefined) partPayload.busGroup = clampStr(busGroup, 60);
        if (data.participationStatus !== undefined) {
          partPayload.attendanceStatus =
            data.participationStatus === 'Hadir' ? 'Hadir' : data.participationStatus === 'Izin' ? 'Izin' : 'Terdaftar';
        }
        await updateDoc(partRef, partPayload);
      }
      await logAudit('UPDATE', 'Data Peserta', id, `Memperbarui data peserta ${data.name || id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${id}`);
    }
  };

  const deleteStudent = async (id: string) => {
    if (isLocal) {
      await apiFetch(`/api/students/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshLocalData();
      return;
    }
    try {
      await deleteDoc(doc(db, 'students', id));
      if (participants.some((p) => p.id === `part-${id}`)) {
        await deleteDoc(doc(db, 'activity_participants', `part-${id}`));
      }
      await logAudit('DELETE', 'Data Peserta', id, `Menghapus data peserta ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    }
  };

  const addTeacher = async (data: Omit<Teacher, 'id' | 'activityId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    if (isLocal) {
      await apiFetch('/api/teachers', { method: 'POST', body: JSON.stringify(data) });
      await refreshLocalData();
      return;
    }
    await ensureActivityExists();
    try {
      const ref = await addDoc(collection(db, 'teachers'), {
        activityId: MAIN_ACTIVITY_ID,
        name: clampStr(data.name, 120),
        nipNuptk: clampStr(data.nipNuptk, 40),
        position: clampStr(data.position, 100),
        mentoringTask: clampStr(data.mentoringTask, 200),
        phone: clampStr(data.phone, 30),
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit('CREATE', 'Guru Pendamping', ref.id, `Menambahkan guru pendamping ${data.name}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'teachers');
    }
  };

  const updateTeacher = async (id: string, data: Partial<Teacher>) => {
    if (isLocal) {
      await apiFetch(`/api/teachers/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await refreshLocalData();
      return;
    }
    try {
      await updateDoc(doc(db, 'teachers', id), {
        ...(data.name !== undefined && { name: clampStr(data.name, 120) }),
        ...(data.nipNuptk !== undefined && { nipNuptk: clampStr(data.nipNuptk, 40) }),
        ...(data.position !== undefined && { position: clampStr(data.position, 100) }),
        ...(data.mentoringTask !== undefined && { mentoringTask: clampStr(data.mentoringTask, 200) }),
        ...(data.phone !== undefined && { phone: clampStr(data.phone, 30) }),
        updatedAt: serverTimestamp(),
      });
      await logAudit('UPDATE', 'Guru Pendamping', id, `Memperbarui guru pendamping ${data.name || id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teachers/${id}`);
    }
  };

  const deleteTeacher = async (id: string) => {
    if (isLocal) {
      await apiFetch(`/api/teachers/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshLocalData();
      return;
    }
    try {
      await deleteDoc(doc(db, 'teachers', id));
      await logAudit('DELETE', 'Guru Pendamping', id, `Menghapus guru pendamping ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `teachers/${id}`);
    }
  };

  const addSchedule = async (data: Omit<ActivitySchedule, 'id' | 'activityId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    if (isLocal) {
      await apiFetch('/api/schedules', { method: 'POST', body: JSON.stringify(data) });
      await refreshLocalData();
      return;
    }
    await ensureActivityExists();
    try {
      const ref = await addDoc(collection(db, 'activity_schedules'), {
        activityId: MAIN_ACTIVITY_ID,
        orderNo: Number(data.orderNo),
        timeRange: clampStr(data.timeRange, 60),
        activityTitle: clampStr(data.activityTitle, 200),
        location: clampStr(data.location, 160),
        personInCharge: clampStr(data.personInCharge, 120),
        notes: clampStr(data.notes, 400),
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit('CREATE', 'Agenda Rundown', ref.id, `Menambahkan agenda: ${data.activityTitle}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'activity_schedules');
    }
  };

  const updateSchedule = async (id: string, data: Partial<ActivitySchedule>) => {
    if (isLocal) {
      await apiFetch(`/api/schedules/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await refreshLocalData();
      return;
    }
    try {
      await updateDoc(doc(db, 'activity_schedules', id), {
        ...(data.orderNo !== undefined && { orderNo: Number(data.orderNo) }),
        ...(data.timeRange !== undefined && { timeRange: clampStr(data.timeRange, 60) }),
        ...(data.activityTitle !== undefined && { activityTitle: clampStr(data.activityTitle, 200) }),
        ...(data.location !== undefined && { location: clampStr(data.location, 160) }),
        ...(data.personInCharge !== undefined && { personInCharge: clampStr(data.personInCharge, 120) }),
        ...(data.notes !== undefined && { notes: clampStr(data.notes, 400) }),
        updatedAt: serverTimestamp(),
      });
      await logAudit('UPDATE', 'Agenda Rundown', id, `Memperbarui agenda rundown ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `activity_schedules/${id}`);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (isLocal) {
      await apiFetch(`/api/schedules/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshLocalData();
      return;
    }
    try {
      await deleteDoc(doc(db, 'activity_schedules', id));
      await logAudit('DELETE', 'Agenda Rundown', id, `Menghapus agenda rundown ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `activity_schedules/${id}`);
    }
  };

  const addJournal = async (data: Omit<ActivityJournal, 'id' | 'activityId' | 'authorUid' | 'authorName' | 'createdAt' | 'updatedAt'>) => {
    if (isLocal) {
      await apiFetch('/api/journals', { method: 'POST', body: JSON.stringify(data) });
      await refreshLocalData();
      return;
    }
    await ensureActivityExists();
    try {
      const ref = await addDoc(collection(db, 'activity_journals'), {
        activityId: MAIN_ACTIVITY_ID,
        date: clampStr(data.date, 40),
        time: clampStr(data.time, 40),
        location: clampStr(data.location, 160),
        description: clampStr(data.description, 3000),
        attendeesCount: Number(data.attendeesCount),
        condition: data.condition,
        companionNotes: clampStr(data.companionNotes, 1500),
        obstacles: clampStr(data.obstacles, 1500),
        solutions: clampStr(data.solutions, 1500),
        authorUid: uid,
        authorName: clampStr(actorName, 120),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit('CREATE', 'Jurnal Pelaksanaan', ref.id, `Mengisi jurnal pelaksanaan di ${data.location}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'activity_journals');
    }
  };

  const updateJournal = async (id: string, data: Partial<ActivityJournal>) => {
    if (isLocal) {
      await apiFetch(`/api/journals/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await refreshLocalData();
      return;
    }
    try {
      await updateDoc(doc(db, 'activity_journals', id), {
        ...(data.date !== undefined && { date: clampStr(data.date, 40) }),
        ...(data.time !== undefined && { time: clampStr(data.time, 40) }),
        ...(data.location !== undefined && { location: clampStr(data.location, 160) }),
        ...(data.description !== undefined && { description: clampStr(data.description, 3000) }),
        ...(data.attendeesCount !== undefined && { attendeesCount: Number(data.attendeesCount) }),
        ...(data.condition !== undefined && { condition: data.condition }),
        ...(data.companionNotes !== undefined && { companionNotes: clampStr(data.companionNotes, 1500) }),
        ...(data.obstacles !== undefined && { obstacles: clampStr(data.obstacles, 1500) }),
        ...(data.solutions !== undefined && { solutions: clampStr(data.solutions, 1500) }),
        updatedAt: serverTimestamp(),
      });
      await logAudit('UPDATE', 'Jurnal Pelaksanaan', id, `Memperbarui jurnal pelaksanaan ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `activity_journals/${id}`);
    }
  };

  const deleteJournal = async (id: string) => {
    if (isLocal) {
      await apiFetch(`/api/journals/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshLocalData();
      return;
    }
    try {
      await deleteDoc(doc(db, 'activity_journals', id));
      await logAudit('DELETE', 'Jurnal Pelaksanaan', id, `Menghapus jurnal ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `activity_journals/${id}`);
    }
  };

  const addDocumentation = async (
    data: Omit<ActivityDocumentation, 'id' | 'activityId' | 'uploadedByUid' | 'uploadedByName' | 'createdAt' | 'updatedAt'>
  ) => {
    if (isLocal) {
      await apiFetch('/api/documentation', { method: 'POST', body: JSON.stringify(data) });
      await refreshLocalData();
      return;
    }
    await ensureActivityExists();
    try {
      const ref = await addDoc(collection(db, 'activity_documentation'), {
        activityId: MAIN_ACTIVITY_ID,
        title: clampStr(data.title, 200),
        caption: clampStr(data.caption, 1000),
        mediaType: data.mediaType,
        category: data.category,
        capturedDate: clampStr(data.capturedDate, 40),
        location: clampStr(data.location, 160),
        fileUrl: clampStr(data.fileUrl, 2000),
        ...(data.storagePath ? { storagePath: clampStr(data.storagePath, 500) } : {}),
        ...(data.fileName ? { fileName: clampStr(data.fileName, 200) } : {}),
        ...(data.fileSize !== undefined ? { fileSize: Number(data.fileSize) } : {}),
        isAllowedForStudent: Boolean(data.isAllowedForStudent),
        uploadedByUid: uid,
        uploadedByName: clampStr(actorName, 120),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit('CREATE', 'Dokumentasi', ref.id, `Mengunggah dokumentasi: ${data.title}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'activity_documentation');
    }
  };

  const updateDocumentation = async (id: string, data: Partial<ActivityDocumentation>) => {
    if (isLocal) {
      await apiFetch(`/api/documentation/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await refreshLocalData();
      return;
    }
    try {
      await updateDoc(doc(db, 'activity_documentation', id), {
        ...(data.title !== undefined && { title: clampStr(data.title, 200) }),
        ...(data.caption !== undefined && { caption: clampStr(data.caption, 1000) }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.capturedDate !== undefined && { capturedDate: clampStr(data.capturedDate, 40) }),
        ...(data.location !== undefined && { location: clampStr(data.location, 160) }),
        ...(data.isAllowedForStudent !== undefined && { isAllowedForStudent: Boolean(data.isAllowedForStudent) }),
        updatedAt: serverTimestamp(),
      });
      await logAudit('UPDATE', 'Dokumentasi', id, `Memperbarui metadata dokumentasi ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `activity_documentation/${id}`);
    }
  };

  const deleteDocumentation = async (id: string) => {
    if (isLocal) {
      await apiFetch(`/api/documentation/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshLocalData();
      return;
    }
    try {
      await deleteDoc(doc(db, 'activity_documentation', id));
      await logAudit('DELETE', 'Dokumentasi', id, `Menghapus dokumentasi ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `activity_documentation/${id}`);
    }
  };

  const addReflection = async (
    data: Omit<StudentReflection, 'id' | 'activityId' | 'studentUid' | 'reviewStatus' | 'createdAt' | 'updatedAt'>
  ) => {
    if (isLocal) {
      await apiFetch('/api/reflections', { method: 'POST', body: JSON.stringify(data) });
      await refreshLocalData();
      return;
    }
    await ensureActivityExists();
    try {
      const ref = await addDoc(collection(db, 'student_reflections'), {
        activityId: MAIN_ACTIVITY_ID,
        studentUid: uid,
        studentName: clampStr(data.studentName, 120),
        className: clampStr(data.className, 40),
        newKnowledge: clampStr(data.newKnowledge, 2500),
        historicalValues: clampStr(data.historicalValues, 2500),
        soekarnoExemplar: clampStr(data.soekarnoExemplar, 2500),
        memorableExperience: clampStr(data.memorableExperience, 2500),
        nationalismApplication: clampStr(data.nationalismApplication, 2500),
        learningConclusion: clampStr(data.learningConclusion, 2500),
        reviewStatus: 'Menunggu Penilaian',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (staff) {
        await logAudit('CREATE', 'Refleksi Siswa', ref.id, `Menambahkan refleksi atas nama ${data.studentName}`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'student_reflections');
    }
  };

  const updateReflectionStudent = async (id: string, data: Partial<StudentReflection>) => {
    if (isLocal) {
      await apiFetch(`/api/reflections/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await refreshLocalData();
      return;
    }
    try {
      await updateDoc(doc(db, 'student_reflections', id), {
        ...(data.studentName !== undefined && { studentName: clampStr(data.studentName, 120) }),
        ...(data.className !== undefined && { className: clampStr(data.className, 40) }),
        ...(data.newKnowledge !== undefined && { newKnowledge: clampStr(data.newKnowledge, 2500) }),
        ...(data.historicalValues !== undefined && { historicalValues: clampStr(data.historicalValues, 2500) }),
        ...(data.soekarnoExemplar !== undefined && { soekarnoExemplar: clampStr(data.soekarnoExemplar, 2500) }),
        ...(data.memorableExperience !== undefined && { memorableExperience: clampStr(data.memorableExperience, 2500) }),
        ...(data.nationalismApplication !== undefined && { nationalismApplication: clampStr(data.nationalismApplication, 2500) }),
        ...(data.learningConclusion !== undefined && { learningConclusion: clampStr(data.learningConclusion, 2500) }),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_reflections/${id}`);
    }
  };

  const gradeReflection = async (id: string, score: number, feedback: string) => {
    if (isLocal) {
      await apiFetch(`/api/reflections/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          teacherScore: Math.max(0, Math.min(100, Number(score))),
          teacherFeedback: clampStr(feedback, 1000),
          reviewStatus: 'Dinilai',
        }),
      });
      await refreshLocalData();
      return;
    }
    try {
      await updateDoc(doc(db, 'student_reflections', id), {
        teacherScore: Math.max(0, Math.min(100, Number(score))),
        teacherFeedback: clampStr(feedback, 1000),
        reviewStatus: 'Dinilai',
        reviewedByUid: uid,
        reviewedByName: clampStr(actorName, 120),
        updatedAt: serverTimestamp(),
      });
      await logAudit('UPDATE', 'Refleksi Siswa', id, `Menilai refleksi siswa ${id} dengan skor ${score}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_reflections/${id}`);
    }
  };

  const deleteReflection = async (id: string) => {
    if (isLocal) {
      await apiFetch(`/api/reflections/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshLocalData();
      return;
    }
    try {
      await deleteDoc(doc(db, 'student_reflections', id));
      await logAudit('DELETE', 'Refleksi Siswa', id, `Menghapus refleksi ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `student_reflections/${id}`);
    }
  };

  const addLkpdSubmission = async (
    data: Omit<LkpdSubmission, 'id' | 'activityId' | 'studentUid' | 'reviewStatus' | 'createdAt' | 'updatedAt'>
  ) => {
    if (isLocal) {
      await apiFetch('/api/lkpd', { method: 'POST', body: JSON.stringify(data) });
      await refreshLocalData();
      return;
    }
    await ensureActivityExists();
    try {
      const ref = await addDoc(collection(db, 'lkpd_submissions'), {
        activityId: MAIN_ACTIVITY_ID,
        studentUid: uid,
        studentName: clampStr(data.studentName, 120),
        className: clampStr(data.className, 40),
        groupName: clampStr(data.groupName, 120),
        members: clampStr(data.members, 500),
        sejarah1: clampStr(data.sejarah1, 3000),
        sejarah2: clampStr(data.sejarah2, 2500),
        pkn1: clampStr(data.pkn1, 2500),
        pkn2: clampStr(data.pkn2, 2500),
        bahasa1: clampStr(data.bahasa1, 2500),
        bahasa2: clampStr(data.bahasa2, 3000),
        ekonomi1: clampStr(data.ekonomi1, 3000),
        ekonomi2: clampStr(data.ekonomi2, 2500),
        pai1: clampStr(data.pai1, 2500),
        pai2: clampStr(data.pai2, 2500),
        geografi1: clampStr(data.geografi1, 2500),
        geografi2: clampStr(data.geografi2, 2500),
        reviewStatus: 'Menunggu Penilaian',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (staff) {
        await logAudit('CREATE', 'Instrumen LKPD', ref.id, `Mengisi LKPD kelompok ${data.groupName} (${data.studentName})`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'lkpd_submissions');
    }
  };

  const updateLkpdStudent = async (id: string, data: Partial<LkpdSubmission>) => {
    if (isLocal) {
      await apiFetch(`/api/lkpd/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await refreshLocalData();
      return;
    }
    try {
      await updateDoc(doc(db, 'lkpd_submissions', id), {
        ...(data.studentName !== undefined && { studentName: clampStr(data.studentName, 120) }),
        ...(data.className !== undefined && { className: clampStr(data.className, 40) }),
        ...(data.groupName !== undefined && { groupName: clampStr(data.groupName, 120) }),
        ...(data.members !== undefined && { members: clampStr(data.members, 500) }),
        ...(data.sejarah1 !== undefined && { sejarah1: clampStr(data.sejarah1, 3000) }),
        ...(data.sejarah2 !== undefined && { sejarah2: clampStr(data.sejarah2, 2500) }),
        ...(data.pkn1 !== undefined && { pkn1: clampStr(data.pkn1, 2500) }),
        ...(data.pkn2 !== undefined && { pkn2: clampStr(data.pkn2, 2500) }),
        ...(data.bahasa1 !== undefined && { bahasa1: clampStr(data.bahasa1, 2500) }),
        ...(data.bahasa2 !== undefined && { bahasa2: clampStr(data.bahasa2, 3000) }),
        ...(data.ekonomi1 !== undefined && { ekonomi1: clampStr(data.ekonomi1, 3000) }),
        ...(data.ekonomi2 !== undefined && { ekonomi2: clampStr(data.ekonomi2, 2500) }),
        ...(data.pai1 !== undefined && { pai1: clampStr(data.pai1, 2500) }),
        ...(data.pai2 !== undefined && { pai2: clampStr(data.pai2, 2500) }),
        ...(data.geografi1 !== undefined && { geografi1: clampStr(data.geografi1, 2500) }),
        ...(data.geografi2 !== undefined && { geografi2: clampStr(data.geografi2, 2500) }),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lkpd_submissions/${id}`);
    }
  };

  const gradeLkpdSubmission = async (id: string, score: number, feedback: string) => {
    if (isLocal) {
      await apiFetch(`/api/lkpd/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          teacherScore: Math.max(0, Math.min(100, Number(score))),
          teacherFeedback: clampStr(feedback, 1000),
          reviewStatus: 'Dinilai',
        }),
      });
      await refreshLocalData();
      return;
    }
    try {
      await updateDoc(doc(db, 'lkpd_submissions', id), {
        teacherScore: Math.max(0, Math.min(100, Number(score))),
        teacherFeedback: clampStr(feedback, 1000),
        reviewStatus: 'Dinilai',
        reviewedByUid: uid,
        reviewedByName: clampStr(actorName, 120),
        updatedAt: serverTimestamp(),
      });
      await logAudit('UPDATE', 'Instrumen LKPD', id, `Menilai LKPD siswa ${id} dengan skor ${score}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lkpd_submissions/${id}`);
    }
  };

  const deleteLkpdSubmission = async (id: string) => {
    if (isLocal) {
      await apiFetch(`/api/lkpd/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshLocalData();
      return;
    }
    try {
      await deleteDoc(doc(db, 'lkpd_submissions', id));
      await logAudit('DELETE', 'Instrumen LKPD', id, `Menghapus lembar LKPD ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `lkpd_submissions/${id}`);
    }
  };

  const addEvaluation = async (
    data: Omit<ActivityEvaluation, 'id' | 'activityId' | 'evaluatorUid' | 'evaluatorName' | 'createdAt' | 'updatedAt'>
  ) => {
    if (isLocal) {
      await apiFetch('/api/evaluations', { method: 'POST', body: JSON.stringify(data) });
      await refreshLocalData();
      return;
    }
    await ensureActivityExists();
    try {
      const ref = await addDoc(collection(db, 'activity_evaluations'), {
        activityId: MAIN_ACTIVITY_ID,
        goalAlignment: clampStr(data.goalAlignment, 1500),
        studentParticipationLevel: clampStr(data.studentParticipationLevel, 1500),
        participantDiscipline: clampStr(data.participantDiscipline, 1500),
        activitySuccessRate: Math.max(0, Math.min(100, Number(data.activitySuccessRate))),
        supportingFactors: clampStr(data.supportingFactors, 2000),
        obstacles: clampStr(data.obstacles, 2000),
        solutions: clampStr(data.solutions, 2000),
        recommendations: clampStr(data.recommendations, 2000),
        evaluatorUid: uid,
        evaluatorName: clampStr(actorName, 120),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit('CREATE', 'Evaluasi Kegiatan', ref.id, `Menambahkan evaluasi kegiatan (${data.activitySuccessRate}%)`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'activity_evaluations');
    }
  };

  const updateEvaluation = async (id: string, data: Partial<ActivityEvaluation>) => {
    if (isLocal) {
      await apiFetch(`/api/evaluations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await refreshLocalData();
      return;
    }
    try {
      await updateDoc(doc(db, 'activity_evaluations', id), {
        ...(data.goalAlignment !== undefined && { goalAlignment: clampStr(data.goalAlignment, 1500) }),
        ...(data.studentParticipationLevel !== undefined && { studentParticipationLevel: clampStr(data.studentParticipationLevel, 1500) }),
        ...(data.participantDiscipline !== undefined && { participantDiscipline: clampStr(data.participantDiscipline, 1500) }),
        ...(data.activitySuccessRate !== undefined && { activitySuccessRate: Math.max(0, Math.min(100, Number(data.activitySuccessRate))) }),
        ...(data.supportingFactors !== undefined && { supportingFactors: clampStr(data.supportingFactors, 2000) }),
        ...(data.obstacles !== undefined && { obstacles: clampStr(data.obstacles, 2000) }),
        ...(data.solutions !== undefined && { solutions: clampStr(data.solutions, 2000) }),
        ...(data.recommendations !== undefined && { recommendations: clampStr(data.recommendations, 2000) }),
        updatedAt: serverTimestamp(),
      });
      await logAudit('UPDATE', 'Evaluasi Kegiatan', id, `Memperbarui evaluasi kegiatan ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `activity_evaluations/${id}`);
    }
  };

  const deleteEvaluation = async (id: string) => {
    if (isLocal) {
      await apiFetch(`/api/evaluations/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshLocalData();
      return;
    }
    try {
      await deleteDoc(doc(db, 'activity_evaluations', id));
      await logAudit('DELETE', 'Evaluasi Kegiatan', id, `Menghapus evaluasi ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `activity_evaluations/${id}`);
    }
  };

  const addReport = async (
    data: Omit<ActivityReport, 'id' | 'activityId' | 'authorUid' | 'authorName' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (isLocal) {
      const created = await apiFetch<ActivityReport>('/api/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refreshLocalData();
      return created.id;
    }
    await ensureActivityExists();
    try {
      const ref = await addDoc(collection(db, 'activity_reports'), {
        activityId: MAIN_ACTIVITY_ID,
        title: clampStr(data.title, 250),
        reportNumber: clampStr(data.reportNumber, 100),
        academicYear: clampStr(data.academicYear, 30),
        status: data.status,
        bab1Background: clampStr(data.bab1Background, 6000),
        bab1Basis: clampStr(data.bab1Basis, 4000),
        bab1Purpose: clampStr(data.bab1Purpose, 4000),
        bab1Benefits: clampStr(data.bab1Benefits, 4000),
        bab2Identity: clampStr(data.bab2Identity, 4000),
        bab2ScheduleTimePlace: clampStr(data.bab2ScheduleTimePlace, 4000),
        bab2ParticipantsSummary: clampStr(data.bab2ParticipantsSummary, 4000),
        bab2TeachersSummary: clampStr(data.bab2TeachersSummary, 4000),
        bab2ExecutionNarrative: clampStr(data.bab2ExecutionNarrative, 6000),
        bab3VisitResults: clampStr(data.bab3VisitResults, 6000),
        bab3StudentObservations: clampStr(data.bab3StudentObservations, 6000),
        bab3NationalismValues: clampStr(data.bab3NationalismValues, 4000),
        bab3ReflectionSummary: clampStr(data.bab3ReflectionSummary, 4000),
        bab4Evaluation: clampStr(data.bab4Evaluation, 4000),
        bab4SupportingFactors: clampStr(data.bab4SupportingFactors, 4000),
        bab4ObstaclesSolutions: clampStr(data.bab4ObstaclesSolutions, 4000),
        bab4Recommendations: clampStr(data.bab4Recommendations, 4000),
        bab5Conclusion: clampStr(data.bab5Conclusion, 4000),
        bab5Suggestions: clampStr(data.bab5Suggestions, 4000),
        authorUid: uid,
        authorName: clampStr(actorName, 120),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit('CREATE', 'Laporan Otomatis', ref.id, `Menyusun laporan: ${data.title}`);
      return ref.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'activity_reports');
    }
  };

  const updateReport = async (id: string, data: Partial<ActivityReport>) => {
    if (isLocal) {
      await apiFetch(`/api/reports/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await refreshLocalData();
      return;
    }
    try {
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
      const fields: [keyof ActivityReport, number][] = [
        ['title', 250],
        ['reportNumber', 100],
        ['academicYear', 30],
        ['bab1Background', 6000],
        ['bab1Basis', 4000],
        ['bab1Purpose', 4000],
        ['bab1Benefits', 4000],
        ['bab2Identity', 4000],
        ['bab2ScheduleTimePlace', 4000],
        ['bab2ParticipantsSummary', 4000],
        ['bab2TeachersSummary', 4000],
        ['bab2ExecutionNarrative', 6000],
        ['bab3VisitResults', 6000],
        ['bab3StudentObservations', 6000],
        ['bab3NationalismValues', 4000],
        ['bab3ReflectionSummary', 4000],
        ['bab4Evaluation', 4000],
        ['bab4SupportingFactors', 4000],
        ['bab4ObstaclesSolutions', 4000],
        ['bab4Recommendations', 4000],
        ['bab5Conclusion', 4000],
        ['bab5Suggestions', 4000],
      ];
      for (const [k, maxLen] of fields) {
        if (data[k] !== undefined) payload[k] = clampStr(String(data[k]), maxLen);
      }
      if (data.status !== undefined) payload.status = data.status;

      await updateDoc(doc(db, 'activity_reports', id), payload);
      await logAudit('UPDATE', 'Laporan Otomatis', id, `Memperbarui laporan ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `activity_reports/${id}`);
    }
  };

  const deleteReport = async (id: string) => {
    if (isLocal) {
      await apiFetch(`/api/reports/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshLocalData();
      return;
    }
    try {
      await deleteDoc(doc(db, 'activity_reports', id));
      await logAudit('DELETE', 'Laporan Otomatis', id, `Menghapus laporan ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `activity_reports/${id}`);
    }
  };

  const submitApprovalDecision = async (params: {
    reportId: string;
    reportTitle: string;
    status: Approval['status'];
    decisionNotes: string;
  }) => {
    if (isLocal) {
      await apiFetch('/api/approvals', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      await refreshLocalData();
      return;
    }
    try {
      const approvalDocId = `approval-${params.reportId}`;
      const existingApproval = approvals.find((a) => a.id === approvalDocId);
      const approvalPayload = {
        activityId: MAIN_ACTIVITY_ID,
        reportId: params.reportId,
        reportTitle: clampStr(params.reportTitle, 250),
        status: params.status,
        decisionNotes: clampStr(params.decisionNotes, 2000),
        approverUid: uid,
        approverName: clampStr(actorName, 120),
        approverNip: clampStr(schoolProfile?.principalNip || userProfile?.nipOrNisn || '-', 40),
        updatedAt: serverTimestamp(),
      };

      if (existingApproval) {
        await updateDoc(doc(db, 'approvals', approvalDocId), approvalPayload);
      } else {
        await setDoc(doc(db, 'approvals', approvalDocId), {
          ...approvalPayload,
          createdAt: serverTimestamp(),
        });
      }

      const nextReportStatus: ActivityReport['status'] =
        params.status === 'Disetujui'
          ? 'Disetujui'
          : params.status === 'Revisi' || params.status === 'Ditolak'
          ? 'Revisi'
          : 'Menunggu Persetujuan';

      await updateDoc(doc(db, 'activity_reports', params.reportId), {
        status: nextReportStatus,
        updatedAt: serverTimestamp(),
      });

      await logAudit('APPROVE', 'Persetujuan Laporan', params.reportId, `Status persetujuan: ${params.status}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `approvals/approval-${params.reportId}`);
    }
  };

  const addArchive = async (
    data: Omit<DigitalArchive, 'id' | 'activityId' | 'uploadedByUid' | 'uploadedByName' | 'createdAt' | 'updatedAt'>
  ) => {
    if (isLocal) {
      await apiFetch('/api/archives', { method: 'POST', body: JSON.stringify(data) });
      await refreshLocalData();
      return;
    }
    await ensureActivityExists();
    try {
      const ref = await addDoc(collection(db, 'digital_archives'), {
        activityId: MAIN_ACTIVITY_ID,
        category: data.category,
        title: clampStr(data.title, 200),
        documentNumber: clampStr(data.documentNumber, 100),
        documentDate: clampStr(data.documentDate, 40),
        description: clampStr(data.description, 1000),
        fileUrl: clampStr(data.fileUrl, 2000),
        ...(data.storagePath ? { storagePath: clampStr(data.storagePath, 500) } : {}),
        ...(data.fileName ? { fileName: clampStr(data.fileName, 200) } : {}),
        ...(data.fileType ? { fileType: clampStr(data.fileType, 100) } : {}),
        ...(data.fileSize !== undefined ? { fileSize: Number(data.fileSize) } : {}),
        uploadedByUid: uid,
        uploadedByName: clampStr(actorName, 120),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await logAudit('CREATE', 'Arsip Digital', ref.id, `Mengunggah arsip: ${data.title}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'digital_archives');
    }
  };

  const deleteArchive = async (id: string) => {
    if (isLocal) {
      await apiFetch(`/api/archives/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshLocalData();
      return;
    }
    try {
      await deleteDoc(doc(db, 'digital_archives', id));
      await logAudit('DELETE', 'Arsip Digital', id, `Menghapus arsip ${id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `digital_archives/${id}`);
    }
  };

  const upsertUserInvite = async (data: {
    email: string;
    displayName: string;
    role: UserRole;
    nipOrNisn?: string;
    className?: string;
  }) => {
    if (isLocal) {
      await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(data) });
      await refreshLocalData();
      return;
    }
    const cleanEmail = clampStr(data.email.toLowerCase(), 160);
    try {
      const existing = invites.find((i) => i.id === cleanEmail);
      if (existing) {
        await updateDoc(doc(db, 'user_invites', cleanEmail), {
          displayName: clampStr(data.displayName, 120),
          role: data.role,
          nipOrNisn: clampStr(data.nipOrNisn, 40),
          className: clampStr(data.className, 40),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'user_invites', cleanEmail), {
          email: cleanEmail,
          displayName: clampStr(data.displayName, 120),
          role: data.role,
          nipOrNisn: clampStr(data.nipOrNisn, 40),
          className: clampStr(data.className, 40),
          createdBy: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await logAudit('CREATE', 'Hak Akses Pengguna', cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_'), `Menetapkan undangan peran ${data.role} untuk ${cleanEmail}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `user_invites/${cleanEmail}`);
    }
  };

  const deleteUserInvite = async (email: string) => {
    if (isLocal) {
      await apiFetch(`/api/invites/${encodeURIComponent(email)}`, { method: 'DELETE' });
      await refreshLocalData();
      return;
    }
    try {
      await deleteDoc(doc(db, 'user_invites', email));
      await logAudit('DELETE', 'Hak Akses Pengguna', email.replace(/[^a-zA-Z0-9_-]/g, '_'), `Menghapus undangan ${email}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `user_invites/${email}`);
    }
  };

  const updateUserRoleAndStatus = async (targetUid: string, role: UserRole, status: 'active' | 'inactive') => {
    if (isLocal) {
      await apiFetch(`/api/users/${encodeURIComponent(targetUid)}`, {
        method: 'PATCH',
        body: JSON.stringify({ role, status }),
      });
      await refreshLocalData();
      return;
    }
    try {
      await updateDoc(doc(db, 'users', targetUid), {
        role,
        status,
        updatedAt: serverTimestamp(),
      });
      await logAudit('UPDATE', 'Hak Akses Pengguna', targetUid, `Mengubah peran pengguna menjadi ${role} (${status})`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
    }
  };

  const createManagedUserByAdmin = async (data: {
    username?: string;
    email?: string;
    displayName: string;
    password?: string;
    role: UserRole;
    nipOrNisn?: string;
    className?: string;
  }): Promise<{ authCreated: boolean; emailVerified: boolean; warning?: string }> => {
    if (isLocal) {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refreshLocalData();
      return {
        authCreated: Boolean((data.password || '').trim()),
        emailVerified: true,
      };
    }

    const cleanEmail = clampStr((data.email || '').toLowerCase(), 160);
    await upsertUserInvite({
      email: cleanEmail,
      displayName: data.displayName,
      role: data.role,
      nipOrNisn: data.nipOrNisn,
      className: data.className,
    });

    const trimmedPassword = (data.password || '').trim();
    if (!trimmedPassword) {
      return { authCreated: false, emailVerified: false };
    }

    try {
      const created = await createUserAccountByAdmin({
        email: cleanEmail,
        password: trimmedPassword,
        displayName: data.displayName,
      });

      await setDoc(doc(db, 'users', created.uid), {
        uid: created.uid,
        displayName: clampStr(data.displayName, 120),
        email: cleanEmail,
        role: data.role,
        nipOrNisn: clampStr(data.nipOrNisn, 40),
        className: clampStr(data.className, 40),
        phone: '',
        status: 'active',
        photoUrl: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await logAudit(
        'CREATE',
        'Akun Pengguna',
        created.uid,
        `Membuat akun login ${cleanEmail} (${data.role})`
      );

      return { authCreated: true, emailVerified: created.emailVerified };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        return {
          authCreated: false,
          emailVerified: false,
          warning:
            'Provider Email/Password belum diaktifkan di Firebase Console (Authentication > Sign-in method > Email/Password). Pengguna tetap tersimpan di daftar Pra-Registrasi sehingga dapat login dengan Google.',
        };
      }
      if (code === 'auth/email-already-in-use') {
        return {
          authCreated: false,
          emailVerified: true,
          warning:
            'Email tersebut sudah terdaftar di Firebase Authentication. Peran pengguna sudah disimpan di daftar Pra-Registrasi.',
        };
      }
      if (code === 'auth/weak-password') {
        throw new Error('Kata sandi minimal harus terdiri dari 6 karakter.');
      }
      throw err;
    }
  };

  return (
    <DataContext.Provider
      value={{
        loading,
        schoolProfile,
        activity,
        students,
        teachers,
        participants,
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
        logAudit,
        saveSchoolProfile,
        saveActivity,
        addStudent,
        updateStudent,
        deleteStudent,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        addJournal,
        updateJournal,
        deleteJournal,
        addDocumentation,
        updateDocumentation,
        deleteDocumentation,
        addReflection,
        updateReflectionStudent,
        gradeReflection,
        deleteReflection,
        addLkpdSubmission,
        updateLkpdStudent,
        gradeLkpdSubmission,
        deleteLkpdSubmission,
        addEvaluation,
        updateEvaluation,
        deleteEvaluation,
        addReport,
        updateReport,
        deleteReport,
        submitApprovalDecision,
        addArchive,
        deleteArchive,
        upsertUserInvite,
        createManagedUserByAdmin,
        deleteUserInvite,
        updateUserRoleAndStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
