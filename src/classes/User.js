import React from "react"

export class PersonalDetails {
    constructor(fname, lname, id, type, email, phoneNumber, department){
        this.id = id;
        this.firstName = fname;
        this.lastName = lname;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.type = type;
        this.department = department;
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
    get type() {
      return this.type;
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
    constructor(personalDetails, data) {
        this.personalDetails = personalDetails;
        if(data){
          this.data = data;
        }
        else{
        //create a new calendar in DB
        }
    }
    addApointment(toAdd) { 
      this.data.push(toAdd);
    }
    editApointment(toEdit) {
      
    }
    deleteApointment(toDelete){
      
    }
    get calendar() {
        return this.data;
    }
    notify(user, message) {

    }
    notify(appointment, message){

    }
}
