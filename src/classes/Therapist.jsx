import User from "./User";

export default class Therapist extends User {
    constructor(personalDetails, department, speciality, data = [], patients = [], uid = null) {
        super(personalDetails, uid, "Therapist", department, data);
        this.speciality = speciality;
        this.patients = patients;
    }
    notifyPatient(patient, message){

    }
    cancelAll() {
        
    }
    addPatient(user) {
        
    }
    static createFromForm({ firstName, lastName, id, email, phoneNumber, dob, department, speciality, data, patients, uid }) {
        const personalDetails = new (require('./User').PersonalDetails)(firstName, lastName, id, email, phoneNumber, dob);
        return new Therapist(
            personalDetails,
            department,
            speciality || [],
            data || [],
            patients || [],
            uid || null
        );
    }
}