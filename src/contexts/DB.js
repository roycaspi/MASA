import React, { useContext, useState, useEffect } from "react"
import { auth, db } from "../firebase"
import {collection, getDocs, doc, updateDoc, arrayUnion, query, where, getDoc, increment, addDoc, deleteDoc, arrayRemove 
         } from 'firebase/firestore'
import fromAsync from 'array-from-async'
import { ScaleTypeRange } from "devextreme-react/gantt";

const therapistsCollection = collection(db, 'Therapists');
const patientsCollection = collection(db, 'Patients');
const roomsCollection = collection(db, 'Rooms');
const appointmentsCollection = collection(db, 'Appointments');
let coli

/*
    participants in Appointments document are refrences to the relevant patient/therapis/attendant documents
*/
export async function getUserDocRef(uid){
    const userDocPointerRef = doc(db, 'Users', uid)
    const userDocPointerSnapShot = await getDoc(userDocPointerRef);
    const userDocRef = doc(db, userDocPointerSnapShot.data().Pointer.path)
    return userDocRef;
}

export async function getAppointment(ref) {
    const appointmentDocRef = doc(db,  ref.path)
    const appointmentDocSnap = await getDoc(appointmentDocRef)
    return appointmentDocSnap.data()
}

export async function getDepartmentUsersList(user){
    let usersList = []
    const therapistDepQ = query(therapistsCollection, where('Department', '==', user.department));
    const therapistDepQuerySnapshot = await getDocs(therapistDepQ);
    therapistDepQuerySnapshot.forEach((therapistDoc) => {
        usersList.push({
          value: therapistDoc.ref, //refrence to the therapists' document
          label: therapistDoc.data().PersonalDetails["First Name"] + " " + therapistDoc.data().PersonalDetails["Last Name"]
          + " " + therapistDoc.data().PersonalDetails["Id"]
        })
    })
    const patientDepQ = query(patientsCollection, where('Department', '==', user.department));
    const patientDepQuerySnapshot = await getDocs(patientDepQ);
    patientDepQuerySnapshot.forEach((patientDoc) => {
        usersList.push({
        value: patientDoc.ref, //refrence to the patients' document
        label: patientDoc.data().PersonalDetails["First Name"] + " " + patientDoc.data().PersonalDetails["Last Name"]
        + " " + patientDoc.data().PersonalDetails["Id"]
        })
    })
    return usersList
}
export async function getDepTherapists(department){
    let therapistsList = []
    const therapistDepQ = query(therapistsCollection, where('Department', '==', department));
    const therapistDepQuerySnapshot = await getDocs(therapistDepQ);
    therapistDepQuerySnapshot.forEach((therapistDoc) => {
        therapistsList.push({
            text: therapistDoc.data().PersonalDetails["First Name"] + " " + therapistDoc.data().PersonalDetails["Last Name"]
            + " " + therapistDoc.data().PersonalDetails["Id"],
            id: therapistDoc.data().PersonalDetails["Id"],
            ref: therapistDoc.ref, //refrence to the therapists' document
      })
    })
    return therapistsList
  }

export async function getDepPatients(department){
let patientsList = []
const patientDepQ = query(patientsCollection, where('Department', '==', department));
const patientDepQuerySnapshot = await getDocs(patientDepQ);
patientDepQuerySnapshot.forEach((patientDoc) => {
    patientsList.push({
        text: patientDoc.data().PersonalDetails["First Name"] + " " + patientDoc.data().PersonalDetails["Last Name"]
        + " " + patientDoc.data().PersonalDetails["Id"],
        id: patientDoc.data().PersonalDetails["Id"],
        ref: patientDoc.ref, //refrence to the patients' document
    })
})
return patientsList
}

export async function getUserPatients(user){
    // if(user.type === "Therapist"){
    //     return []
    // }
    let patients = []
    user.Patients.forEach(async p => {
        const patientDocRef = doc(db, p.path)
        const patientDocSnapShot = await getDoc(patientDocRef)
        patients.push({
            label: patientDocSnapShot.data().PersonalDetails["First Name"] + " " + patientDocSnapShot.data().PersonalDetails["Last Name"]
            + " " + patientDocSnapShot.data().PersonalDetails["Id"],
            id: patientDocSnapShot.data().PersonalDetails["Id"],
            value: patientDocSnapShot.ref, //refrence to the patients' document
            data: patientDocSnapShot.Data,
        })
    })
    console.log(patients)
    return patients
}

export async function getUserTherapists(user){
    
}

export async function getUserAttendants(user){
    
}
export async function getRooms() { //returns relavant rooms
    let rooms = []
    const roomsQuerySnapshot = await getDocs(roomsCollection);
    roomsQuerySnapshot.forEach((doc) => {
        rooms.push({
            text: doc.data().Name,
            id: doc.data().Id,
            ref: doc.ref,
            occupied: doc.data().occupied,
            capacity: doc.data().capacity,
            disabled: false,
        })

    })
    return rooms
} 

export async function getDataFromUser(user) {
    const userDocPointerRef = doc(db, 'Users',  user.uid)
    const userDocPointerSnapShot = await getDoc(userDocPointerRef);
    const userDocRef = doc(db, userDocPointerSnapShot.data().Pointer.path)
    const userDocSnapShot = await getDoc(userDocRef)
    let data = []
    userDocSnapShot.data().Data.forEach(async ref => { //get appointments from appointments refrences
        const appointmentDocRef = doc(db,  ref.path)
        const appointmentDocSnap = await getDoc(appointmentDocRef)
        let appointment = appointmentDocSnap.data()
        appointment.startDate = appointment.startDate.toDate() //convert unix timestamp into date
        appointment.endDate = appointment.endDate.toDate()
        data.push(appointment)
    })
    return data;
}

export async function getDataFromRef(userRef) {
    // const q = query(usersCollection, where('user', '==', user.uid)); 
    // const querySnapshot = await getDocs(q);
    const userDocRef = doc(db, userRef.path)
    const userDocSnapShot = await getDoc(userDocRef)
    let data = []
    userDocSnapShot.data().Data.forEach(async ref => { //get appointments from appointments refrences
        const appointmentDocRef = doc(db,  ref.path)
        const appointmentDocSnap = await getDoc(appointmentDocRef)
        let appointment = appointmentDocSnap.data()
        appointment.startDate = appointment.startDate.toDate() //convert unix timestamp into date
        appointment.endDate = appointment.endDate.toDate()
        console.log(appointment)
        data.push(appointment)
    })
    return data;
}

async function isCollision(toAdd) { //todo: check if fixed correctly
    let temp = false;
    const participants = (toAdd.therapists)? toAdd.patients.concat(toAdd.therapists) : toAdd.patients
    for(const p of participants) { // check for events collisions for all paricipants
        const userDocRef = doc(db, p)
        const userDocSnapShot = await getDoc(userDocRef)
        for(const ref of userDocSnapShot.data().Data) { //get appointments from appointments refrences
            const appointmentDocRef = doc(db,  ref.path)
            const appointmentDocSnap = await getDoc(appointmentDocRef)
            let appointment = appointmentDocSnap.data()
            let {startDate: existsStart, endDate: existsEnd} = appointment;
            let {startDate: newStart, endDate: newEnd} = toAdd;
            existsStart = existsStart.toDate()
            existsEnd = existsEnd.toDate()
            console.log(existsStart, existsEnd, newStart, newEnd)
            if(appointment.id != toAdd.id){
                // console.log("checks if collision=", !(existsEnd <= newStart || existsStart >= newEnd))
                temp = (temp)? true: !(existsEnd <= newStart || existsStart >= newEnd)
            }
            if(temp){
                // console.log("returns true")
                return true;
            }
        }
    }
    // console.log("not returned properably")
    console.log(temp)
    return temp;
}

export async function addEvent(added, currentUser) {
    console.log("enter addEvent")
    console.log("event = ", added)
    coli = await isCollision(added.appointmentData)
    console.log(coli)
    if(!coli){ 
        added.appointmentData.startDate.setSeconds(0) //collisions accured because of seconds -> reset seconds to 0
        added.appointmentData.endDate.setSeconds(0)
        const IdCountRef = doc(db, "Appointments", "IdCount");
        const docSnap = await getDoc(IdCountRef);
        const id = docSnap.data().count
        added.appointmentData.id = id;
        added.appointmentData.admin = [await getUserDocRef(currentUser.uid)]
        added.appointmentData.color = "#ff00aa"
        console.log(added)
        // const toAdd = {
        //     "Data": {   "Title": added.title,
        //                 "Id": id,
        //                 "Admin": adminDocRef,
        //                 "Participants": added.participants? Array.from(added.participants, uid => getUserDocRef(uid))
        //                  : [],
        //                 "Room": added.roomId,
        //                 "Start Date": added.startDate,
        //                 "End Date": added.endDate }
        // }
        await updateDoc(IdCountRef, { //update id counter
            count: increment(1)
        });
        const appointmentDocRef = await addDoc(collection(db, "Appointments"), added.appointmentData); //craete document for appointment
        if(added.appointmentData.patients){
            added.appointmentData.patients.forEach(async p => {//add event to patients
                const userDocRef = doc(db, p);
                await updateDoc(userDocRef, {
                    "Data": arrayUnion(appointmentDocRef)
                });
            })
        }
        if(added.appointmentData.therapists){
            added.appointmentData.therapists.forEach(async p => {//add event to therapists
                const userDocRef = doc(db, p);
                await updateDoc(userDocRef, {
                    "Data": arrayUnion(appointmentDocRef)
                });
            })
        }
        //occupy room
        if(added.appointmentData.room){
            added.appointmentData.room.forEach(async room => {
                const roomDocRef = doc(db, room)
                await updateDoc(roomDocRef, {
                    occupied: arrayUnion({startDate: added.appointmentData.startDate,
                                            endDate: added.appointmentData.endDate,
                                            appointmentRef: appointmentDocRef})
                });
            })
        }
        return true
    }
    else{
        return false
    }
}

export async function editEvent(changed, user) {
    console.log(changed)
    let participantEvents = await getDataFromUser(user)
    let originalEventToChange = participantEvents.filter(appointment => appointment.id == Object.keys(changed)[0])
    let changedDetails = changed.appointmentData
    // check for collision
    coli = await isCollision(changedDetails)
    if(coli){
        return false
    }
    //find the appointment doc in DB
    const q = query(appointmentsCollection, where('id', "==", changedDetails.id))
    const querySnapshot = await getDocs(q);
    const appointmentDocRef = querySnapshot.docs[0].ref
    const appointmentDocSnap = await getDoc(appointmentDocRef)
    const previousParticipants = (appointmentDocSnap.data().therapists)? 
    appointmentDocSnap.data().patients.concat(appointmentDocSnap.data().therapists) : appointmentDocSnap.data().patients
    const previousRoom = appointmentDocSnap.data().room
    console.log(previousRoom)
    updateDoc(appointmentDocRef, changedDetails); //update the appointment in DB
    //remove appointment from previous participants
    previousParticipants.forEach(async (p) => {
        let partiDocRef = doc(db, p)
        let partiDocSnapShot = await getDoc(partiDocRef)
        participantEvents = partiDocSnapShot.data().Data
        await updateDoc(partiDocRef, {
            "Data": arrayRemove(appointmentDocRef)
        });
    })
    const participants = (changedDetails.therapists)? 
                        changedDetails.patients.concat(changedDetails.therapists) : changedDetails.patients
    //add appointment to new paricipantes
    participants.forEach(async (p) => {
        let partiDocRef = doc(db, p)
        let partiDocSnapShot = await getDoc(partiDocRef)
        participantEvents = partiDocSnapShot.data().Data
        if(!(appointmentDocRef.id in participantEvents)){//if the participant is new
            await updateDoc(partiDocRef, {
                "Data": arrayUnion(appointmentDocRef)
            });
        }
    })
    //change room
    if(previousRoom != changedDetails.room) {//check if the room changed
        for(const room of previousRoom) { //free old room
            if(!(room in changedDetails.room)) {
                const roomDocRef = doc(db, room)
                const roomDocSnapShot = await getDoc(roomDocRef)
                const occupiedList = roomDocSnapShot.data().occupied
                await updateDoc(roomDocRef, {
                    occupied: occupiedList.filter(appointment => appointment.appointmentRef.id !== appointmentDocRef.id)
                });
            }
        }
        changedDetails.room.forEach(async room => {//occupy new room
            if(!(room in previousRoom)) {
                const roomDocRef = doc(db, room)
                await updateDoc(roomDocRef, {
                    occupied: arrayUnion({startDate: changed.appointmentData.startDate,
                                            endDate: changed.appointmentData.endDate,
                                            appointmentRef: appointmentDocRef})
                });
            }
        })
    }
    // try{
    //     let changedDetails = changed.appointmentData
    //     // let participantEvents = await getDataFromUser(user)
    //     // let originalEventToChange = participantEvents.filter(appointment => appointment.id == Object.keys(changed)[0])
    //     // let toChange = { //todo: fix
    //     //   "Title": changedDetails.title? changedDetails.title: originalEventToChange[0].title,
    //     //   "Id": originalEventToChange[0].id,
    //     //   "Participants": changedDetails.participants? Array.from(new Set(changedDetails.participants.split(','))) : originalEventToChange[0].participants,
    //     //   "Start Date": changedDetails.startDate? changedDetails.startDate: originalEventToChange[0].startDate.toDate(),
    //     //   "End Date": changedDetails.endDate? changedDetails.endDate: originalEventToChange[0].endDate.toDate()
    //     // }
    //     //check for collision
    //     coli = await isCollision(changedDetails)
    //     if(coli){ 
    //       throw("Event Collision")
    //     }
    //     else{
    //         changed[appointment.id] ? { ...appointment, ...changed[appointment.id] } : appointment));
    //         await updateDoc(partiDocRef, {
    //             data: participantEvents.map(appointment => (
    //             (appointment.id == toChange.id)? toChange : appointment))
    //         });
    //       })
    //       if(changedDetails.participants){ //the participants field changed
    //         changed[Object.keys(changed)[0]].participants = Array.from(new Set(changedDetails.participants.split(',')))
    //         changedDetails = changed[Object.keys(changed)[0]]
    //         eventParticipants.forEach(async p => { //delete from participants that got deleted
    //           if(!changedDetails.participants.includes(p)){
    //             // const q = query(eventsCollection, where('user', "==", p))
    //             // const querySnapshot = await getDocs(q);
    //             const partiDocRef = doc(db, p)
    //             let participantEvents = getDataFromRef(p);
    //             updateDoc(partiDocRef, {
    //               data: participantEvents.filter(appointment => appointment.id != Object.keys(changed)[0]) });
    //           }
    //         })
    //       }
    //     }
    //   }
    //   catch(e){
    //     throw(e)
    //   }
}
export async function removeEvent(deleted, user) {
    const userDocPointerRef = doc(db, 'Users',  user.uid)
    const userDocPointerSnapShot = await getDoc(userDocPointerRef);
    const userDocRef = doc(db, userDocPointerSnapShot.data().Pointer.path)
    const q = query(appointmentsCollection, where('id', "==", deleted.appointmentData.id))
    const querySnapshot = await getDocs(q);
    const appointmentDocRef = querySnapshot.docs[0].ref
    let canDelete = false
    deleted.appointmentData.admin.forEach((a) => { //checks if the currentuser is an admin
        if(userDocRef.id === a.id){
            console.log("enter can delete")
            canDelete = true
        }
    })
    if(canDelete){
        const participants = (deleted.appointmentData.therapists)? 
        deleted.appointmentData.patients.concat(deleted.appointmentData.therapists) : deleted.appointmentData.patients
        participants.forEach(async (p) => { //delete appointment ref in data of participants
            let participantEvents = await getDataFromRef(p);
            const partiDocRef = doc(db, p)
            const partiDocSnapShot = await getDoc(partiDocRef)
            participantEvents = partiDocSnapShot.data().Data
            console.log(participantEvents)
            updateDoc(partiDocRef, {
                "Data": participantEvents.filter(appointment => appointment.id !== appointmentDocRef.id)
            });
        })
        if(deleted.appointmentData.room){ // make room available
            deleted.appointmentData.room.forEach(async room => {
                const roomDocRef = doc(db, room)
                const roomDocSnapShot = await getDoc(roomDocRef)
                const occupiedList = roomDocSnapShot.data().occupied
                await updateDoc(roomDocRef, {
                    occupied: occupiedList.filter(appointment => appointment.appointmentRef.id !== appointmentDocRef.id)
                });
            })
        }
        await deleteDoc(doc(db, appointmentDocRef.path))//deletes the appointment doc
    }
}