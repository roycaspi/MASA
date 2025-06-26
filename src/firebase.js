// Add this comment at the top of the file to help with development
// For Google Authentication to work properly in development:
// 1. Make sure localhost is added to authorized domains in Firebase Console
// 2. Enable Google sign-in provider in Firebase Console
// 3. If popup issues persist, use the redirect method
import {initializeApp} from 'firebase/app'
import {getAuth} from 'firebase/auth'
import {getFirestore} from 'firebase/firestore'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)

export const auth = getAuth(app)
export const messaging = getMessaging(app)
export default app