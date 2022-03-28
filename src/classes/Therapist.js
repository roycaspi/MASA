import React from "react"
import CareGiver from "./CareGiver";

export default class Therapist extends CareGiver {
    constructor(personalDetails, data, speciality) {
        super(personalDetails, data);
        this.speciality = speciality;
    }
    notifyPatient(patient, message){

    }
    cancelAll() {
        
    }
}