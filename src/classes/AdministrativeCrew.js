import CareGiver from "./CareGiver";


export default class AdministrativeCrew extends CareGiver {
    constructor(personalDetails, uid, type, department, data) {
        super(personalDetails, uid, type, department, data);
    }
}