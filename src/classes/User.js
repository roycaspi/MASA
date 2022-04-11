import React from "react"
import { getData } from "../contexts/DB";

export class PersonalDetails {
    constructor(fname, lname, id, email, phoneNumber, dob, department){
        this.id = id;
        this.dob = dob;
        this.firstName = fname;
        this.lastName = lname;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.department = department;
    }
    get dob() {
      return this.dob;
    }
    get firtName() {
      return this.firstName;
    }
    get lastName() {
      return this.lastName;
    }
    get id() {
      return this.id;
    }
    get email() {
      return this.email;
    }
    get phoneNumber() {
      return this.phoneNumber;
    }
    get department() {
      return this.department;
    }
}

async function isCollision(toAdd) {
    coli = false;
    for(let p in toAdd.participants) { // check for events collisions
      console.log(p)
      const q = query(eventsCollection, where('user', "==", toAdd.participants[p]))
      const querySnapshot = await getDocs(q);
      if(querySnapshot.size == 0) {
        throw setError("One of the users does not exist")
      }
      const participantEvents = querySnapshot.docs[0].data().data;
      if(participantEvents.length != 0){
        for(let event in participantEvents) {
          console.log(coli)
          let {startDate: existsStart, endDate: existsEnd} = participantEvents[event];
          let {startDate: newStart, endDate: newEnd} = toAdd;
          existsStart = existsStart.toDate()
          existsEnd = existsEnd.toDate()
          console.log(existsStart, existsEnd, newStart, newEnd)
          console.log(!(existsEnd <= newStart || existsStart >= newEnd))
          if(participantEvents[event].id != toAdd.id){
            console.log(coli)
            coli = (coli)? true : !(existsEnd <= newStart || existsStart >= newEnd)
          }
          console.log(coli)
          if(coli){
            return true;
          }
        }
      }
    }
    return false;
}

export default class User {
    constructor(personalDetails, uid, type, data = [], department) {
        this.type = type;
        this.attendants = [];
        this.therapists = [];
        this.department = department;
        this.personalDetails = personalDetails;
        this.uid = uid;
        this.data = data;
    }
    addApointment(toAdd) { 

    }
    editApointment(toEdit) {
      
    }
    deleteApointment(toDelete){
      
    }
    get type() {
      return this.type;
    }
    get attendants() {
      return this.attendants;
    }
    get therapists() {
      return this.therapists;
    }
    get permission() {
      return this.permission;
    }
    get department() {
      return this.department;
    }
    get uid(){
      return this.uid;
    }
    get personalDetails() {
      return this.personalDetails;
    }
    get data() {
        return getData(this);
    }
    notify(user, message) {

    }
    notify(appointment, message){

    }
}
