import PatientSide from "./PatientSide";


export default class Patient extends PatientSide {
    constructor(personalDetails, data, attendants, therapists, permissions) {
        super(personalDetails, data);
        this.attendants = attendants;
        this.therapists = therapists;
        this.permissions = permissions;
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
    get attendants() {
        return this.attendants;
    }
    get therapists() {
        return this.therapists
    }
}