import React from "react"
import CareGiver from "./CareGiver";

export default class Therapist extends CareGiver {
    constructor(personalDetails, department, speciality, data = [], patients = [], uid = null) {
        super(personalDetails, uid, "Therapist", department, data);
        this.speciality = speciality;
        this.patients = patients;
    }
    notifyPatient(patient, message){

    }
    cancelAll() {
        
    }
}