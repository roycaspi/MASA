import React, { useContext, useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { doc, setDoc, addDoc, collection, query, getDocs, where, updateDoc, arrayUnion, getDoc } from 'firebase/firestore'


const AuthContext = React.createContext()
const usersCollection = collection(db, 'Users');

export function useAuth() {
  return useContext(AuthContext)
}

export { AuthContext }

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentUserData, setCurrentUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(user, password) { 
    console.log(user)
    
    // Check if this is a Google user (no password provided)
    const isGoogleUser = !password && user.uid;
    
    if (!isGoogleUser) {
      // Regular email/password signup
      const q = query(usersCollection, where("Email", "==", user.email));
      const querySnapshot = await getDocs(q);
      if(!querySnapshot.empty) {
        throw new Error("Email already exists")
      }
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, password);
        user.uid = userCredential.user.uid;
      } catch(e) {
        console.log(e)
        throw e.message || "Failed to create account";
      }
    }
    
    // For Google users, the user object should already have the uid
    // For regular users, we just set it above
    
    let userDocRef;
    if(user.Type === "Patient"){
      const docData = {
                        "PersonalDetails": { "Date of Birth":user.personalDetails.dob,
                            "Email": user.personalDetails.email, 
                            "First Name": user.personalDetails.firstName,
                            "Last Name": user.personalDetails.lastName,
                            "Id": user.personalDetails.id,
                            "Phone Number": user.personalDetails.phoneNumber
                          },
                        "Data": user.data,
                        "Department": user.Department,
                        "Attendants": user.Attendants,
                        "Therapists": user.Therapists,
                        "Type": user.Type,
                        "Permission": user.Permission,
                        uid: user.uid
                      }
      userDocRef = await addDoc(collection(db, "Patients"), docData);//create new patient document in db
      if(user.Therapists && user.Therapists.size !== 0) { //add patient to therapist
        const therapistPromises = user.Therapists.map(async (therapist) => {
          const therapistDocRef = doc(db, therapist.value.path)
          await updateDoc(therapistDocRef, {
            Patients: arrayUnion({label: user.personalDetails.firstName + " " + user.personalDetails.lastName
                        + " " + user.personalDetails.id,
                        value: userDocRef})
          });
        });
        await Promise.all(therapistPromises);
      }
    }
    else if(user.Type === "Therapist"){
      const docData = { 
                          "PersonalDetails": { "Date of Birth":user.personalDetails.dob,
                                                "Email": user.personalDetails.email, 
                                                "First Name": user.personalDetails.firstName,
                                                "Last Name": user.personalDetails.lastName,
                                                "Id": user.personalDetails.id,
                                                "Phone Number": user.personalDetails.phoneNumber},
                          "Data": user.data,
                          "Department": user.Department,
                          "Patients": user.Patients,
                          "Type": user.Type,
                          "Speciality": user.Speciality,
                          uid: user.uid
                      }
      userDocRef = await addDoc(collection(db, "Therapists"), docData) //create new therapist document in db
    }
    else if(user.Type === "Attendant"){
      const docData = { 
                        "PersonalDetails": { "Email": user.personalDetails.email, 
                                              "First Name": user.personalDetails.firstName,
                                              "Last Name": user.personalDetails.lastName,
                                              "Id": user.personalDetails.id,
                                              "Phone Number": user.personalDetails.phoneNumber},
                        "Data": user.data,
                        "Department": user.Department,
                        "Patients": user.Patients,
                        "Type": user.Type,
                        "Permission": user.Permission,
                        uid: user.uid
                      }
      userDocRef = await addDoc(collection(db, "Attendants"), docData); //create new attendant document in db
      if(user.Patients) {
        const patientPromises = user.Patients.map(async (patient) => { //add attendant to patient
          const patientDocRef = doc(db, patient.value.path)
          await updateDoc(patientDocRef, {
            Attendants: arrayUnion(userDocRef)
        });
        });
        await Promise.all(patientPromises);
      }
    }
    return setDoc(doc(db, "Users", user.uid), { //create new user document in db
      "Pointer": userDocRef,
      "Email": user.email
    });
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    
    // Configure the provider
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      // Try popup first
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user already exists in our database
      const userDocRef = doc(db, "Users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        // User doesn't exist in our database, redirect to complete registration
        return { needsRegistration: true, user };
      }
      
      return { needsRegistration: false, user };
    } catch (error) {
      console.error("Google sign-in error:", error);
      
      // Handle specific error types
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error("Sign-in was cancelled. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error("Popup was blocked. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error("Sign-in was cancelled. Please try again.");
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error("Network error. Please check your connection and try again.");
      } else {
        throw new Error("Failed to sign in with Google. Please try again.");
      }
    }
  }

  async function signInWithGoogleRedirect() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Google redirect sign-in error:", error);
      throw new Error("Failed to initiate Google sign-in. Please try again.");
    }
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
    const unsubscribe = auth.onAuthStateChanged(async user => {
      setLoading(true);
      if (user) {
        try {
          // Fetch user data from Firestore
          const userDocRef = doc(db, "Users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.Pointer) {
              const actualUserDocSnap = await getDoc(userData.Pointer);
              if (actualUserDocSnap.exists()) {
                const actualUserData = actualUserDocSnap.data();
                setCurrentUserData(actualUserData);
                // Combine Firebase user with Firestore data
                const completeUser = {
                  ...user,
                  role: actualUserData.Type?.toLowerCase() || 'user',
                  displayName: actualUserData.PersonalDetails?.["First Name"] + " " + actualUserData.PersonalDetails?.["Last Name"] || user.displayName,
                  email: actualUserData.PersonalDetails?.Email || user.email,
                  department: actualUserData.Department,
                  permission: actualUserData.Permission,
                  therapistId: actualUserData.Therapists?.[0]?.value?.id,
                  attendantId: actualUserData.Attendants?.[0]?.value?.id,
                  patients: actualUserData.Patients,
                  speciality: actualUserData.Speciality
                };
                setCurrentUser(completeUser);
              } else {
                setCurrentUserData(null);
                setCurrentUser(user);
              }
            } else {
              setCurrentUserData(null);
              setCurrentUser(user);
            }
          } else {
            setCurrentUserData(null);
            setCurrentUser(user);
          }
        } catch (error) {
          setCurrentUserData(null);
          setCurrentUser(user);
        }
      } else {
        setCurrentUserData(null);
        setCurrentUser(null);
      }
      setLoading(false);
    })

    // Handle Google redirect result
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          
          // Check if user already exists in our database
          const userDocRef = doc(db, "Users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (!userDocSnap.exists()) {
            // User doesn't exist, redirect to complete registration
            window.location.href = '/complete-registration';
          }
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
      }
    };

    handleRedirectResult();

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    currentUserData,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updateEmail,
    updatePassword,
    signInWithGoogle,
    signInWithGoogleRedirect
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
