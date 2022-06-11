import React, { useContext, useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, query, getDocs, where, updateDoc, arrayUnion } from 'firebase/firestore'


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
    let userDocRef;
    if(user.type === "Patient"){
      const docData = {
                        "PersonalDetails": { "Date of Birth":user.personalDetails.dob,
                            "Email": user.personalDetails.email, 
                            "First Name": user.personalDetails.firstName,
                            "Last Name": user.personalDetails.lastName,
                            "Id": user.personalDetails.id,
                            "Phone Number": user.personalDetails.phoneNumber
                          },
                        "Data": user.data,
                        "Department": user.department,
                        "Attendants": user.attendants,
                        "Therapists": user.therapists,
                        "Type": user.type,
                        "Permission": user.permission,
                        uid: user.uid
                      }
      userDocRef = await addDoc(collection(db, "Patients"), docData);//create new patient document in db
      if(user.therapists.size != 0) { //add patient to therapist
        user.therapists.forEach(async (therapist) => {
          const therapistDocRef = doc(db, therapist.value.path)
          await updateDoc(therapistDocRef, {
            Patients: arrayUnion({label: user.personalDetails.firstName + " " + user.personalDetails.lastName
                        + " " + user.personalDetails.id,
                        value: userDocRef})
          });
        })
      }
    }
    else if(user.type === "Therapist"){
      const docData = { 
                          "PersonalDetails": { "Date of Birth":user.personalDetails.dob,
                                                "Email": user.personalDetails.email, 
                                                "First Name": user.personalDetails.firstName,
                                                "Last Name": user.personalDetails.lastName,
                                                "Id": user.personalDetails.id,
                                                "Phone Number": user.personalDetails.phoneNumber},
                          "Data": user.data,
                          "Department": user.department,
                          "Patients": user.patients,
                          "Type": user.type,
                          "Speciality": user.speciality,
                          uid: user.uid
                      }
      userDocRef = await addDoc(collection(db, "Therapists"), docData) //create new therapist document in db
    }
    else if(user.type === "Attendant"){
      const docData = { 
                        "PersonalDetails": { "Email": user.personalDetails.email, 
                                              "First Name": user.personalDetails.firstName,
                                              "Last Name": user.personalDetails.lastName,
                                              "Id": user.personalDetails.id,
                                              "Phone Number": user.personalDetails.phoneNumber},
                        "Data": user.data,
                        "Department": user.department,
                        "Patients": user.patients,
                        "Type": user.type,
                        "Permission": user.permission,
                        uid: user.uid
                      }
      userDocRef = await addDoc(collection(db, "Attendants"), docData); //create new attendant document in db
      user.patients.forEach(async (patient) => { //add attendant to patient
        const patientDocRef = doc(db, patient.value.path)
        await updateDoc(patientDocRef, {
          Attendants: arrayUnion(userDocRef)
      });
      })
    }
    return setDoc(doc(db, "Users", user.uid), { //create new user document in db
      "Pointer": userDocRef,
      "Email": user.email
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
