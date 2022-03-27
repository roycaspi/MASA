import {initializeApp} from 'firebase/app'
import {getAuth} from 'firebase/auth'
import {getFirestore} from 'firebase/firestore'


const firebaseApp = initializeApp({
  apiKey: "AIzaSyATsBHzexgK5nc9hK3RHp_Y9YQj93AsF9M",
  authDomain: "masa-828f9.firebaseapp.com",
  projectId: "masa-828f9",
  storageBucket: "masa-828f9.appspot.com",
  messagingSenderId: "233217016333",
  appId: "1:233217016333:web:b42feab0b4dc8c8cf7cb44",
  measurementId: "G-6WHPMMDBRK"
});
export const db = getFirestore(firebaseApp)

export const auth = getAuth(firebaseApp)
export default firebaseApp