import React from "react"
import User from "./User";

export default class PatientSide extends User {
    constructor(personalDetails, uid, type, department, permission, data) {
        super(personalDetails, uid, type, department, data);
        this.permission = permission;
    }
    // get permission() {
    //     return this.permission;
    // }
}