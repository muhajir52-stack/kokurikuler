import { deleteApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export const LOCAL_TOKEN_STORAGE_KEY = 'sipk_local_token';

export async function uploadFileToCloud(
  folder: string,
  file: File
): Promise<{ fileUrl: string; storagePath: string; fileName: string; fileSize: number }> {
  const localToken =
    typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_TOKEN_STORAGE_KEY) : null;

  if (!auth.currentUser && localToken) {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Gagal membaca file yang dipilih.'));
      reader.readAsDataURL(file);
    });
    const resp = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localToken}`,
      },
      body: JSON.stringify({ fileName: file.name, base64Data }),
    });
    if (!resp.ok) {
      const errBody = (await resp.json().catch(() => ({}))) as { error?: string };
      throw new Error(errBody.error || 'Gagal mengunggah berkas ke server.');
    }
    return (await resp.json()) as {
      fileUrl: string;
      storagePath: string;
      fileName: string;
      fileSize: number;
    };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${folder}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
  });
  const fileUrl = await getDownloadURL(snapshot.ref);
  return {
    fileUrl,
    storagePath,
    fileName: file.name,
    fileSize: file.size,
  };
}

export function clampStr(val: string | undefined, maxLen: number): string {
  const trimmed = (val ?? '').trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

export async function createUserAccountByAdmin(params: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ uid: string; emailVerified: boolean }> {
  const secondaryAppName = 'admin-user-creator';
  const existingApp = getApps().find((a) => a.name === secondaryAppName);
  const secondaryApp = existingApp || initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      params.email.trim().toLowerCase(),
      params.password
    );
    await updateProfile(cred.user, {
      displayName: clampStr(params.displayName, 120),
    });
    try {
      await sendEmailVerification(cred.user);
    } catch {
      // Verification email dispatch best-effort; user can resend on first login
    }
    const uid = cred.user.uid;
    const emailVerified = cred.user.emailVerified;
    await signOut(secondaryAuth);
    return { uid, emailVerified };
  } finally {
    if (!existingApp) {
      try {
        await deleteApp(secondaryApp);
      } catch {
        // Ignore secondary app cleanup errors
      }
    }
  }
}
