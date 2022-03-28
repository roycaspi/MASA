import React from "react"

export class PersonalDetails {
    constructor(fname, lname, type, department){
        this.firstName = fname;
        this.lastName = lname;
        this.type = type;
        this.department = department;
    }
}

export default class User { //need to decide if class or function!!!
    constructor(personalDetails, data) {
        this.personalDetails = personalDetails;
        this.data = data; //todo: connect to DB and merge/add data
    }
    addApointment(toAdd) {
        //todo: add appointment to DB/local data=>DB
    }
    editApointment(toEdit) {

    }
    deleteApointment(toDelete){

    }
    getCalendar() {
        return this.data;
    }
}
