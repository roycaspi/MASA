import PatientSide from "./PatientSide";
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from "../firebase"

export default class Patient extends PatientSide {
    constructor(personalDetails, department, therapists = [], permission = "0",
     attendants = [], data = [], uid = null,) {
        super(personalDetails, uid, "Patient", department, permission, data);
        this.attendants = attendants
        this.therapists = therapists
    }
    addAttendant(attendant) {
        this.attendants.push(attendant);
    }
    removeAttendant(attendant){
        for(var i = 0; i < this.attendants.length; i++){
            if(this.attendants[i] == attendant){
                this.attendants.splice(i, 1);
                return;
            }
        }
    }
    addSelfToTherapists(userDocRef){
        if(this.therapists.size != 0) { //add patient to therapist
            this.therapists.forEach(async (therapist) => {
              const therapistDocRef = doc(db, therapist.value.path)
              await updateDoc(therapistDocRef, {
                Patients: arrayUnion(userDocRef)
              });
            })
          }
    }
    // get attendants() {
    //     return this.attendants;
    // }
    // get therapists() {
    //     return this.therapists
    // }
}