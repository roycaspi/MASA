import React from "react"
import User from "./User"

export default class CareGiver extends User {
    constructor(personalDetails, uid, type, data = [], department, speciality) {
        super(personalDetails, uid, type, data, department);
        this.speciality = speciality
        this.departmentList//= get all users from the department
    }

    get speciality(){
        return this.speciality;
    }
    get departmentList() {
        return this.departmentList;
    }
}