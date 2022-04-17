import React, { useContext, useState, useEffect } from "react"
import { auth, db } from "../firebase"
import {collection, getDocs, doc, updateDoc, arrayUnion, query, where, getDoc, increment, addDoc } from 'firebase/firestore'


const usersCollectionRef = collection(db, 'Users');
let coli = false

/*
    participants in Appointments document are refrences to the relevant patient/therapis/attendant documents
*/

export async function getDataFromUser(user) {
    // const q = query(usersCollection, where('user', '==', user.uid)); 
    // const querySnapshot = await getDocs(q);
    const userDocPointerRef = doc(db, 'Users',  user.uid)
    const userDocPointerSnapShot = getDoc(userDocPointerRef);
    const userDocRef = doc(db, userDocPointerSnapShot.data().Pointer)
    const userDocSnapShot = getDoc(userDocRef)
    let data = []
    userDocSnapShot.data().Data.forEach(async ref => { //get appointments from appointments refrences
        const appointmentDocRef = doc(db,  ref)
        const appointmentDocSnap = getDoc(appointmentDocRef)
        data.append(appointmentDocSnap.data().Data)
    })
    return data;
}

export async function getDataFromRef(userRef) {
    // const q = query(usersCollection, where('user', '==', user.uid)); 
    // const querySnapshot = await getDocs(q);
    const userDocRef = doc(db, userRef)
    const userDocSnapShot = getDoc(userDocRef)
    let data = []
    userDocSnapShot.data().Data.forEach(async ref => { //get appointments from appointments refrences
        const appointmentDocRef = doc(db,  ref)
        const appointmentDocSnap = getDoc(appointmentDocRef)
        data.append(appointmentDocSnap.data().Data)
    })
    return data;
}

async function isCollision(toAdd) {
    coli = false;
    for(let p in toAdd.participants) { // check for events collisions for all paricipants
        console.log(p)
    //   const q = query(usersCollectionRef, where('Email', "==", toAdd.participants[p]))
    //   const querySnapshot = await getDocs(q);
        const userPointerDocRef = doc(db, p);
        const userPointerDocSnap = await getDoc(userPointerDocRef)
        if(!userPointerDocSnap.exists()) {
            throw("One of the participants does not exist")
        }
        const participantEvents = getDataFromRef(p);
        if(participantEvents.length != 0){
            for(let event in participantEvents) {
                let {"Start Date": existsStart, "End Date": existsEnd} = participantEvents[event];
                let {"Start Date": newStart, "End Date": newEnd} = toAdd.Data;
                existsStart = existsStart.toDate()
                existsEnd = existsEnd.toDate()
                if(participantEvents[event].id != toAdd.id){
                    coli = (coli)? true : !(existsEnd <= newStart || existsStart >= newEnd)
                }
                if(coli){
                    return true;
                }
            }
        }
    }
    return false;
}

export async function addEvent(added, user) {
    added.startDate.setSeconds(0) //collisions accured because of seconds -> reset seconds to 0
    added.endDate.setSeconds(0)
    const IdCountRef = doc(db, "Appointments", "IDCount");
    const docSnap = await getDoc(IdCountRef);
    const id = docSnap.data().count
    const toAdd = {
        "Data": {   "Title": added.title,
                    "Id": id,
                    //todo: see in what type participants arrive in added 
                    "Participants": added.participants? Array.from(new Set(added.participants.split(',').concat(user.email))) : [user.email],
                    "Start Date": added.startDate,
                    "End Date": added.endDate }
        
    }
    await updateDoc(IdCountRef, { //update id counter
        count: increment(1)
    });
    coli = await isCollision(toAdd)
    if(!coli){ 
        const appointmentDocRef = await addDoc(collection(db, "Appointments"), toAdd); //craete document for appointment
        if(toAdd.startDate <= toAdd.endDate){
            toAdd.participants.forEach(async p => {//add event to participants
                // const q = query(eventsCollection, where('user', "==", p))
                // const querySnapshot = await getDocs(q);
                const userDocRef = doc(db, p);
                await updateDoc(userDocRef, {
                    "Data": arrayUnion(appointmentDocRef)
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

export async function editEvent(changed, user) {
    try{
        let changedDetails = changed[Object.keys(changed)[0]]
        let participantEvents = getDataFromUser(user)
        let originalEventToChange = participantEvents.filter(appointment => appointment.id == Object.keys(changed)[0])
        let toChange = { //todo: fix
          "Title": changedDetails.title? changedDetails.title: originalEventToChange[0].title,
          "Id": originalEventToChange[0].id,
          "Participants": changedDetails.participants? Array.from(new Set(changedDetails.participants.split(','))) : originalEventToChange[0].participants,
          "Start Date": changedDetails.startDate? changedDetails.startDate: originalEventToChange[0].startDate.toDate(),
          "End Date": changedDetails.endDate? changedDetails.endDate: originalEventToChange[0].endDate.toDate()
        }
        //check for collision
        coli = await isCollision(toChange)
        if(coli){ 
          throw("Event Collision")
        }
        else if(toChange.startDate > toChange.endDate) {
          throw("Times Error")
        }
        else{
          const eventParticipants = originalEventToChange[0].participants
          toChange.participants.forEach(async p =>{//update event for all current participants
            // const q = query(eventsCollection, where('user', "==", p))
            // const querySnapshot = await getDocs(q);
            const partiDocRef = doc(db, p) //p is a refrence
            let participantEvents = getDataFromRef(p);
            participantEvents = participantEvents.map(appointment => (
            changed[appointment.id] ? { ...appointment, ...changed[appointment.id] } : appointment));
            await updateDoc(partiDocRef, {
                data: participantEvents.map(appointment => (
                (appointment.id == toChange.id)? toChange : appointment))
            });
          })
          if(changedDetails.participants){ //the participants field changed
            changed[Object.keys(changed)[0]].participants = Array.from(new Set(changedDetails.participants.split(',')))
            changedDetails = changed[Object.keys(changed)[0]]
            eventParticipants.forEach(async p => { //delete from participants that got deleted
              if(!changedDetails.participants.includes(p)){
                // const q = query(eventsCollection, where('user', "==", p))
                // const querySnapshot = await getDocs(q);
                const partiDocRef = doc(db, p)
                let participantEvents = getDataFromRef(p);
                updateDoc(partiDocRef, {
                  data: participantEvents.filter(appointment => appointment.id != Object.keys(changed)[0]) });
              }
            })
          }
        }
      }
      catch(e){
        throw(e)
      }
}

export async function removeEvent(deleted, user) {
    // const q = query(eventsCollection, where('user', "==", currentUser.Id))
    // const querySnapshot = await getDocs(q);
    // const currentUserPart = querySnapshot.docs[0].data().data[0]
    const userDocPointerRef = doc(db, 'Users',  user.uid)
    const userDocPointerSnapShot = getDoc(userDocPointerRef);
    const userDocRef = doc(db, userDocPointerSnapShot.data().Pointer)
    // const userDocSnapShot = getDoc(userDocRef)
    // const partiDocRef = doc(db, user)
    let participantEvents = getDataFromRef(userDocRef);
    participantEvents.participants.map( async p => { //delete from all paricipants
    try {
        // const q2 = query(eventsCollection, where('user', "==", p))
        // const querySnapshot2 = await getDocs(q2);
        // const partiDocRef = doc(db, querySnapshot.docs[0].Pointer)
        const partiDocRef = doc(db, p)
        let participantEvents = getDataFromRef(p);
        updateDoc(partiDocRef, {
        data: participantEvents.filter(appointment => appointment.id !== deleted)});
    }
    catch(e){
      throw(e)
    }
    })
}