import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

export const requestAndSaveFcmToken = async (userId) => {
  try {
    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      await setDoc(doc(db, 'Users', userId), { fcmToken: token }, { merge: true });
      console.log('FCM token saved:', token);
    }
  } catch (err) {
    console.error('Unable to get permission to notify.', err);
  }
};

export const listenForMessages = (onNotification) => {
  const messaging = getMessaging(getApp());
  onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    if (onNotification) onNotification(payload);
  });
}; 