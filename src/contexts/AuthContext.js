import React, { useContext, useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, query, getDocs, where } from 'firebase/firestore'


const AuthContext = React.createContext()
const usersCollection = collection(db, 'Users');

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(user, password) { 
    console.log(user)
    const q = query(usersCollection, where("Email", "==", user.email));
    const querySnapshot = await getDocs(q);
    if(!querySnapshot.empty) {
      throw "Email already exists"
    }
    try{
    await createUserWithEmailAndPassword(auth, user.email, password).then((userCredential) => {
      user.uid = userCredential.user.uid
    })
  }
  catch(e){
    console.log(e)
  }
    console.log(user)
    let userDocRef;
    if(user.type === "Patient"){
      const docData = {
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
                      }
      userDocRef = await addDoc(collection(db, "Patients"), docData);//create new patient document in db
    }
    else if(user.type === "Therapist"){
      console.log("enter if therapist")
      userDocRef = await setDoc(collection(db, "Therapists"), { //create new therapist document in db
        "Personal Details": { "Date of Birth":user.personalDetails.dob,
                              "Email": user.personalDetails.email, 
                              "First Name": user.personalDetails.firstName,
                              "Last Name": user.personalDetails.lastName,
                              "Id": user.personalDetails.id,
                              "Phone Number": user.personalDetails.phoneNumber},
        "Data": user.data,
        "Department": user.department,
        "Patients": user.patients,
        "Type": user.type,
        "Speciality": user.speciality
      });
    }
    else if(user.type === "Attendant"){
      userDocRef = await setDoc(collection(db, "Attendants"), { //create new attendant document in db
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
      "Pointer": userDocRef,
      "Email": user.email
    });

        //todo: update all the relevant therapists' patient array
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
