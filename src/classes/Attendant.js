import PatientSide from "./PatientSide";
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from "../firebase"


export default class Attendant extends PatientSide {
    constructor(personalDetails, department, permission = "0",
     patients = [], data = [], uid = null) {
        super(personalDetails, uid, "Attendant", department, permission, data);
        this.patients = patients;
        this.permission = permission;
    }
    addSelfToPatients(userDocRef){
        this.patients.forEach(async (patient) => { //add attendant to patient
            const patientDocRef = doc(db, patient.value.path)
            await updateDoc(patientDocRef, {
              Patients: arrayUnion(userDocRef)
          });
        })
    }
}