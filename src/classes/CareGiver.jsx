import PatientSide from "./PatientSide";

export default class CareGiver extends PatientSide {
    constructor(personalDetails, uid, type, department, data) {
        super(personalDetails, uid, type, department, data);
        this.departmentList = null //get all users from the department
    }
}