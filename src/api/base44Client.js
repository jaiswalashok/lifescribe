import { entities } from '@/lib/entities';
import { auth } from '@/lib/firebase';
import {
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';

export const base44 = {
  entities,
  auth: {
    me: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      return {
        id: user.uid,
        email: user.email,
        full_name: user.displayName || user.email?.split('@')[0] || 'User',
        profile_picture: user.photoURL,
      };
    },
    redirectToLogin: async () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/LanguageSelect';
      }
    },
    logout: async (redirectUrl) => {
      await signOut(auth);
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl || '/LanguageSelect';
      }
    },
    loginWithEmail: async (email, password) => {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    },
    registerWithEmail: async (email, password) => {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    },
    loginWithGoogle: async () => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    },
  },
};
