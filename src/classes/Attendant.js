import PatientSide from "./PatientSide";



export default class Attendant extends PatientSide {
    constructor(personalDetails, department, permission = "0",
     patients = [], data = [], uid = null) {
        super(personalDetails, uid, "Attendant", department, permission, data);
        this.patients = patients;
        this.permission = permission;
    }
}