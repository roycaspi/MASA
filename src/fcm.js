import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

export const requestAndSaveFcmToken = async (userId) => {
  try {
    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      // First, get the current document to preserve existing fields
      const userDocRef = doc(db, 'Users', userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const currentData = userDocSnap.data();
        // Update only the fcmToken while preserving all other fields
        await setDoc(userDocRef, { 
          ...currentData,
          fcmToken: token 
        });
      } else {
        // If document doesn't exist, create it with just the fcmToken
        await setDoc(userDocRef, { fcmToken: token });
      }
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