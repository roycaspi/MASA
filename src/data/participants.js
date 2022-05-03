import {collection, getDocs, doc, updateDoc, arrayUnion, 
    query, where, getDoc, increment } from 'firebase/firestore'
    import {db} from '../firebase'

const therapistsCollection = collection(db, 'Therapists');
const patientsCollection = collection(db, 'Patients');

export async function getDepTherapists(department){
    let therapistsList = []
    const therapistDepQ = query(therapistsCollection, where('Department', '==', department));
    const therapistDepQuerySnapshot = await getDocs(therapistDepQ);
    therapistDepQuerySnapshot.forEach((therapistDoc) => {
        therapistsList.push({
            text: therapistDoc.data().PersonalDetails["First Name"] + " " + therapistDoc.data().PersonalDetails["Last Name"]
            + " " + therapistDoc.data().PersonalDetails["Id"],
            id: therapistDoc.ref, //refrence to the therapists' document
      })
    })
    return therapistsList
  }

export async function getDepPatients(department){
let patientsList = []
const patientDepQ = query(patientsCollection, where('Department', '==', department));
const patientDepQuerySnapshot = await getDocs(patientDepQ);
patientDepQuerySnapshot.forEach((patientDoc) => {
    patientsList.push({
        text: patientDoc.data().PersonalDetails["First Name"] + " " + patientDoc.data().PersonalDetails["Last Name"]
        + " " + patientDoc.data().PersonalDetails["Id"],
        id: patientDoc.ref, //refrence to the patients' document
    })
})
return patientsList
}
