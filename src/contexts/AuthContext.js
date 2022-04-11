import React, { useContext, useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore'
import User from "../classes/User";


const AuthContext = React.createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState()
  const [loading, setLoading] = useState(true)

  async function signup(user, password) { 
    if(user.personalDetails.type === null){
      throw "Type of user not chosen"
    }
    const IdCountRef = doc(db, "Users", user.uid);
    const docSnap = await getDoc(IdCountRef);
    if(docSnap.exists()) {
      throw "Email already exists in system"
    }
    await createUserWithEmailAndPassword(auth, user.personalDetails.email, password)
    let userDocRef;
    if(user.personalDetails.type == "Patient"){
      userDocRef = await setDoc(collection(db, "Patients"), { //create new calendar document in db
        "Personal Details": { "Date of Birth":user.personalDetails.dob,
                              "Email": user.personalDetails.email, 
                              "First Name": user.personalDetails.firstName,
                              "Last Name": user.personalDetails.lastName,
                              "Id": user.personalDetails.id,
                              "Phone Number": user.personalDetails.phoneNumber},
        "Data": user.data,
        "Department": user.department,
        "Attendants": user.attendants,
        "Therapists": user.therapists,
        "Type": user.type,
        "Permission": user.permission
      });
    }
    else if(user.personalDetails.type == "Therapist"){
      userDocRef = await setDoc(collection(db, "Therapists"), { //create new calendar document in db
        "Personal Details": { "Date of Birth":user.personalDetails.dob,
                              "Email": user.personalDetails.email, 
                              "First Name": user.personalDetails.firstName,
                              "Last Name": user.personalDetails.lastName,
                              "Id": user.personalDetails.id,
                              "Phone Number": user.personalDetails.phoneNumber},
        "Data": user.data,
        "Department": user.department,
        "Attendants": user.attendants,
        "Therapists": user.therapists,
        "Type": user.type,
        "Speciality": user.speciality
      });
    }
    else if(user.personalDetails.type == "Attendant"){
      userDocRef = await setDoc(collection(db, "Attendants"), { //create new calendar document in db
        "Personal Details": { "Email": user.personalDetails.email, 
                              "First Name": user.personalDetails.firstName,
                              "Last Name": user.personalDetails.lastName,
                              "Phone Number": user.personalDetails.phoneNumber},
        "Data": user.data,
        "Department": user.department,
        "Patients": user.patients,
        "Type": user.type,
        "Permission": user.permission
      });
    }
    return setDoc(doc(db, "Users", user.uid), { //create new user document in db
      Pointer: userDocRef
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
