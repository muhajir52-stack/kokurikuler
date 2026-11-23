import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  auth,
  clampStr,
  db,
  googleProvider,
  handleFirestoreError,
  LOCAL_TOKEN_STORAGE_KEY,
  OperationType,
} from '../lib/firebase';
import { BOOTSTRAP_ADMIN_EMAIL, type UserAccount, type UserRole } from '../types';

export type AuthMode = 'local' | 'firebase' | null;

interface AuthContextValue {
  authMode: AuthMode;
  localToken: string | null;
  firebaseUser: FirebaseUser | null;
  userProfile: UserAccount | null;
  effectiveRole: UserRole;
  previewRole: UserRole | null;
  setPreviewRole: (role: UserRole | null) => void;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  needsEmailVerification: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (identifier: string, password: string) => Promise<void>;
  resendVerificationEmail: () => Promise<boolean>;
  reloadAuthUser: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserAccount | null>(null);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [verificationTick, setVerificationTick] = useState(0);

  const authModeRef = useRef<AuthMode>(null);
  authModeRef.current = authMode;

  useEffect(() => {
    let active = true;
    let unsubAuth: (() => void) | null = null;

    const init = async () => {
      const savedToken =
        typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_TOKEN_STORAGE_KEY) : null;

      let localVerified = false;
      if (savedToken) {
        try {
          const resp = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (resp.ok) {
            const data = (await resp.json()) as { user: UserAccount };
            if (active && data.user) {
              localVerified = true;
              setLocalToken(savedToken);
              setAuthMode('local');
              setUserProfile(data.user);
              setNeedsEmailVerification(false);
              setAuthReady(true);
            }
          } else {
            window.localStorage.removeItem(LOCAL_TOKEN_STORAGE_KEY);
          }
        } catch {
          window.localStorage.removeItem(LOCAL_TOKEN_STORAGE_KEY);
        }
      }

      if (!active) return;

      unsubAuth = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        setPreviewRole(null);

        if (user) {
          window.localStorage.removeItem(LOCAL_TOKEN_STORAGE_KEY);
          setLocalToken(null);
          setAuthMode('firebase');
          setVerificationTick((n) => n + 1);
        } else if (!localVerified && authModeRef.current !== 'local') {
          setAuthMode(null);
          setUserProfile(null);
          setNeedsEmailVerification(false);
          setAuthReady(true);
        }
      });
    };

    void init();

    return () => {
      active = false;
      if (unsubAuth) unsubAuth();
    };
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || authMode === 'local') {
      return;
    }

    let unsubProfile: (() => void) | null = null;
    let cancelled = false;

    const syncProfile = async () => {
      if (!user.emailVerified) {
        setUserProfile(null);
        setNeedsEmailVerification(true);
        setAuthReady(true);
        return;
      }

      setNeedsEmailVerification(false);

      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (cancelled) return;

        if (!snap.exists()) {
          const emailLower = (user.email || '').toLowerCase();
          let assignedRole: UserRole =
            emailLower === BOOTSTRAP_ADMIN_EMAIL ? 'SUPER_ADMIN' : 'SISWA';
          let inviteDisplayName = user.displayName || emailLower.split('@')[0] || 'Pengguna';
          let inviteNipOrNisn = '';
          let inviteClassName = '';

          if (emailLower && emailLower !== BOOTSTRAP_ADMIN_EMAIL) {
            try {
              const inviteSnap = await getDoc(doc(db, 'user_invites', emailLower));
              if (inviteSnap.exists()) {
                const inv = inviteSnap.data();
                assignedRole = (inv.role as UserRole) || 'SISWA';
                if (inv.displayName) inviteDisplayName = String(inv.displayName);
                if (inv.nipOrNisn) inviteNipOrNisn = String(inv.nipOrNisn);
                if (inv.className) inviteClassName = String(inv.className);
              }
            } catch {
              // No invite found or not readable; fallback to SISWA
            }
          }

          await setDoc(userRef, {
            uid: user.uid,
            displayName: clampStr(inviteDisplayName, 120),
            email: clampStr(emailLower, 160),
            role: assignedRole,
            nipOrNisn: clampStr(inviteNipOrNisn, 40),
            className: clampStr(inviteClassName, 40),
            phone: '',
            status: 'active',
            photoUrl: clampStr(user.photoURL || '', 500),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        if (cancelled) return;

        unsubProfile = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile({ id: docSnap.id, ...(docSnap.data() as Omit<UserAccount, 'id'>) });
            }
            setAuthReady(true);
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }
        );
      } catch (err) {
        if (!cancelled) {
          setAuthError(err instanceof Error ? err.message : 'Gagal memuat profil pengguna.');
          setAuthReady(true);
        }
      }
    };

    void syncProfile();

    return () => {
      cancelled = true;
      if (unsubProfile) unsubProfile();
    };
  }, [firebaseUser?.uid, verificationTick, authMode]);

  const signInWithGoogle = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked') {
        setAuthError('Pop-up login diblokir oleh browser. Harap izinkan pop-up untuk melanjutkan.');
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('Jendela login ditutup sebelum proses selesai.');
      } else {
        setAuthError(err instanceof Error ? err.message : 'Gagal masuk dengan Google.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithEmail = async (identifier: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    const trimmedId = identifier.trim();

    try {
      // 1. Try local application backend first (supports username like "Admin" & email)
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmedId, password }),
      });

      if (resp.ok) {
        const data = (await resp.json()) as { token: string; user: UserAccount };
        if (auth.currentUser) {
          try {
            await signOut(auth);
          } catch {
            // Ignore secondary signout errors
          }
        }
        window.localStorage.setItem(LOCAL_TOKEN_STORAGE_KEY, data.token);
        setLocalToken(data.token);
        setAuthMode('local');
        setUserProfile(data.user);
        setPreviewRole(null);
        setNeedsEmailVerification(false);
        setAuthReady(true);
        return;
      }

      const errData = (await resp.json().catch(() => ({}))) as { error?: string };

      if (resp.status === 403) {
        setAuthError(errData.error || 'Akun Anda sedang dinonaktifkan oleh Admin.');
        return;
      }

      // 2. Fallback to Firebase Auth Email/Password if identifier looks like an email
      if (trimmedId.includes('@')) {
        try {
          await signInWithEmailAndPassword(auth, trimmedId.toLowerCase(), password);
          return;
        } catch (err: unknown) {
          const code = (err as { code?: string })?.code || '';
          if (code === 'auth/too-many-requests') {
            setAuthError('Terlalu banyak percobaan login. Silakan tunggu beberapa saat.');
            return;
          }
        }
      }

      setAuthError(errData.error || 'Username/email atau kata sandi tidak sesuai.');
    } catch {
      // If server route is unreachable and input is email, fallback to Firebase Auth
      if (trimmedId.includes('@')) {
        try {
          await signInWithEmailAndPassword(auth, trimmedId.toLowerCase(), password);
          return;
        } catch {
          // Fall through to error message
        }
      }
      setAuthError('Username/email atau kata sandi tidak sesuai.');
    } finally {
      setAuthLoading(false);
    }
  };

  const resendVerificationEmail = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      await sendEmailVerification(auth.currentUser);
      return true;
    } catch {
      return false;
    }
  };

  const reloadAuthUser = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    setFirebaseUser(auth.currentUser);
    setVerificationTick((n) => n + 1);
    return auth.currentUser.emailVerified;
  };

  const logout = async () => {
    window.localStorage.removeItem(LOCAL_TOKEN_STORAGE_KEY);
    setLocalToken(null);
    setAuthMode(null);
    setUserProfile(null);
    setPreviewRole(null);
    setNeedsEmailVerification(false);
    setAuthError(null);
    if (auth.currentUser) {
      await signOut(auth);
    }
  };

  const baseRole: UserRole = userProfile?.role || 'SISWA';
  const effectiveRole: UserRole =
    baseRole === 'SUPER_ADMIN' && previewRole ? previewRole : baseRole;

  return (
    <AuthContext.Provider
      value={{
        authMode,
        localToken,
        firebaseUser,
        userProfile,
        effectiveRole,
        previewRole,
        setPreviewRole,
        authReady,
        authLoading,
        authError,
        needsEmailVerification,
        signInWithGoogle,
        signInWithEmail,
        resendVerificationEmail,
        reloadAuthUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
