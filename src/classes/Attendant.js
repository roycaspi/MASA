import PatientSide from "./PatientSide";



export default class Attendant extends PatientSide {
    constructor(personalDetails, data, patients, permission) {
        super(personalDetails, data);
        this.patients = patients;
        this.permission = permission;
    }
}