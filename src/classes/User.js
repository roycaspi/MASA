import React from "react"
import { getDataFromUser } from "../contexts/DB";


export class PersonalDetails {
    constructor(fname, lname, id, email, phoneNumber, dob = new Date()){
        this.id = id;
        this.dob = dob;
        this.firstName = fname;
        this.lastName = lname;
        this.email = email;
        this.phoneNumber = phoneNumber;
  }
}

// async function isCollision(toAdd) {
//     coli = false;
//     for(let p in toAdd.participants) { // check for events collisions
//       console.log(p)
//       const q = query(eventsCollection, where('user', "==", toAdd.participants[p]))
//       const querySnapshot = await getDocs(q);
//       if(querySnapshot.size == 0) {
//         throw setError("One of the users does not exist")
//       }
//       const participantEvents = querySnapshot.docs[0].data().data;
//       if(participantEvents.length != 0){
//         for(let event in participantEvents) {
//           console.log(coli)
//           let {startDate: existsStart, endDate: existsEnd} = participantEvents[event];
//           let {startDate: newStart, endDate: newEnd} = toAdd;
//           existsStart = existsStart.toDate()
//           existsEnd = existsEnd.toDate()
//           console.log(existsStart, existsEnd, newStart, newEnd)
//           console.log(!(existsEnd <= newStart || existsStart >= newEnd))
//           if(participantEvents[event].id != toAdd.id){
//             console.log(coli)
//             coli = (coli)? true : !(existsEnd <= newStart || existsStart >= newEnd)
//           }
//           console.log(coli)
//           if(coli){
//             return true;
//           }
//         }
//       }
//     }
//     return false;
// }

export default class User {
    constructor(personalDetails, uid, type, department, data) {
      this.uid = uid;
      this.type = type;
      this.department = department;
      this.personalDetails = personalDetails;
      this.data = data;
    }
    addApointment(toAdd) { 

    }
    editApointment(toEdit) {
      
    }
    deleteApointment(toDelete){
      
    }
    get uid(){
      return this._uid_;
    }
    set uid(v){
      this._uid_ = v
    }
    get dob() {
      return this.personalDetails.dob;
    }
    get firtName() {
      return this.personalDetails.firstName;
    }
    get lastName() {
      return this.personalDetails.lastName;
    }
    get id() {
      return this.personalDetails.id;
    }
    get email() {
      return this.personalDetails.email;
    }
    get phoneNumber() {
      return this.personalDetails.phoneNumber;
    }
    notify(user, message) {

    }
    notify(appointment, message){

    }
}