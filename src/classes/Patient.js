import PatientSide from "./PatientSide";


export default class Patient extends PatientSide {
    constructor(personalDetails, data, attendants, therapists, permissions) {
        super(personalDetails, data);
        this.attendants = attendants;
        this.therapists = therapists;
        this.permissions = permissions;
    }
    addAttendant(attendant) {

    }
    removeAttendant(attendant){

    }
    get attendants() {
        return this.attendants;
    }
    get therapists() {
        return this.therapists
    }
}