import PatientSide from "./PatientSide";



export default class Attendant extends PatientSide {
    constructor(personalDetails, data, patients, permissions) {
        super(personalDetails, data);
        this.patients = patients;
        this.permissions = permissions;
    }
}