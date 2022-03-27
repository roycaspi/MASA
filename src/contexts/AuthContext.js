import React, { useContext, useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore'


const AuthContext = React.createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState()
  const [loading, setLoading] = useState(true)

  async function signup(email, password, firstName, lastName, type) { 
    if(type === null){
      throw "Type of user not chosen"
    }
    const IdCountRef = doc(db, "Users", email);
    const docSnap = await getDoc(IdCountRef);
    if(docSnap.exists()) {
      throw "Email already exists in system"
    }
    await createUserWithEmailAndPassword(auth, email, password)
    await addDoc(collection(db, "Calendars"), { //create new calendar document in db
      data: [],
      user: email
    });
    return setDoc(doc(db, "Users", email), { //create new user document in db
      "First Name": firstName,
      "Last Name": lastName,
      type: type
    });
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  function logout() {
    return auth.signOut()
  }

  function resetPassword(email) {
    return auth.sendPasswordResetEmail(email)
  }

  function updateEmail(email) {
    return currentUser.updateEmail(email)
  }

  function updatePassword(password) {
    return currentUser.updatePassword(password)
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    updateEmail,
    updatePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
