import React from "react"
import User from "./User"

export default class CareGiver extends User {
    constructor(personalDetails, uid, type, department, data) {
        super(personalDetails, uid, type, department, data);
        this.departmentList = null //get all users from the department
    }
}