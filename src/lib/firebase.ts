import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with configured database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Test Firestore connection on boot (as required by Firebase skill)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline.');
    }
  }
}

// Client-side Google Sign-In using Firebase Auth
export async function signInWithGoogle(): Promise<{
  googleId: string;
  email: string;
  name: string;
  avatar: string;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;
    return {
      googleId: u.uid,
      email: u.email || '',
      name: u.displayName || 'Гражданин Пушленда',
      avatar: u.photoURL || '',
    };
  } catch (err: any) {
    console.error('Firebase Google Sign-In error:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('Окно входа Google было закрыто');
    }
    if (err.code === 'auth/cancelled-popup-request') {
      throw new Error('Предыдущий запрос входа был отменен');
    }
    throw new Error(err.message || 'Ошибка входа через Google Firebase');
  }
}

// Client-side Sign Out
export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signout error:', err);
  }
}

// Helper to observe auth state
export function onAuthUserChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
