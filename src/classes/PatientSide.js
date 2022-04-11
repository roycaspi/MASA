import React from "react"
import User from "./User";

export default class PatientSide extends User {
    constructor(personalDetails, uid, type, data = [], department, permission = 0) {
        super(personalDetails, uid, type, data, department);
        this.permission = permission;
    }
    get permission() {
        return this.permission;
    }
}