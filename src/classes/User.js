import React from "react"

export class PersonalDetails {
    constructor(fname, lname, type, department){
        this.firstName = fname;
        this.lastName = lname;
        this.type = type;
        this.department = department;
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
        this.data = data; //todo: connect to DB and merge/add data
    }
    addApointment(added) { 
            added.startDate.setSeconds(0) //collisions accured because of seconds -> reset seconds to 0
            added.endDate.setSeconds(0)
            const IdCountRef = doc(db, "Calendars", "IDCount");
            const docSnap = await getDoc(IdCountRef);
            const id = docSnap.data().count
            await updateDoc(IdCountRef, { //update global id counter
              count: increment(1)
            });
            const toAdd = {
              title: added.title,
              id: id,
              participants: added.participants? Array.from(new Set(added.participants.split(',').concat(currentUser.email))) : [currentUser.email],
              startDate: added.startDate,
              endDate: added.endDate
            }
            coli = await isCollision(toAdd)
            console.log(coli)
            if(!coli){ 
              if(toAdd.startDate <= toAdd.endDate){
                toAdd.participants.forEach(async p => {//add event to participants
                  const q = query(eventsCollection, where('user', "==", p))
                  const querySnapshot = await getDocs(q);
                  const calendarRef = doc(db, 'Calendars', querySnapshot.docs[0].id);
                  await updateDoc(calendarRef, {
                      data: arrayUnion(toAdd)
                  });
                })
              }
              else{
                throw("Times Error")
              }
            }
            else{
              throw("Event Collision")
            }
        }
    };
    editApointment(toEdit) {
        
    }
    deleteApointment(toDelete){

    };
    getCalendar() {
        return this.data;
    }
    notify(user, message) {

    }
    notify(appointment, message){

    }
}
