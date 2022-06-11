import { db } from "../firebase"
import {collection, getDocs, doc, updateDoc, arrayUnion, query, where, getDoc, increment, addDoc, 
    deleteDoc, arrayRemove } from 'firebase/firestore'

const therapistsCollection = collection(db, 'Therapists');
const patientsCollection = collection(db, 'Patients');
const attendantsCollection = collection(db, 'Attendants');
const roomsCollection = collection(db, 'Rooms');
const appointmentsCollection = collection(db, 'Appointments');
let coli

/*
    participants in Appointments document are refrences to the relevant patient/therapis/attendant documents
*/
export async function getUserDocRef(uid){ //returns the document ref using the uid
    console.log("enter getUserDoc")
    const userDocPointerRef = doc(db, 'Users', uid)
    const userDocPointerSnapShot = await getDoc(userDocPointerRef);
    const userDocRef = doc(db, userDocPointerSnapShot.data().Pointer.path)
    return userDocRef;
}

export async function getAppointment(ref) { // returns the appointment data of the current ref
    const appointmentDocRef = doc(db,  ref.path)
    const appointmentDocSnap = await getDoc(appointmentDocRef)
    return appointmentDocSnap.data()
}

export async function getDepartmentUsersList(user){ //returns all the users of the same department as the given user
    let usersList = []
    //gets therapists
    const therapistDepQ = query(therapistsCollection, where('Department', '==', user.department));
    const therapistDepQuerySnapshot = await getDocs(therapistDepQ);
    therapistDepQuerySnapshot.forEach((therapistDoc) => {
        usersList.push({
          value: therapistDoc.ref, //refrence to the therapists' document
          label: therapistDoc.data().PersonalDetails["First Name"] + " " + therapistDoc.data().PersonalDetails["Last Name"]
          + " " + therapistDoc.data().PersonalDetails["Id"]
        })
    })
    //gets patients
    const patientDepQ = query(patientsCollection, where('Department', '==', user.department));
    const patientDepQuerySnapshot = await getDocs(patientDepQ);
    patientDepQuerySnapshot.forEach((patientDoc) => {
        usersList.push({
        value: patientDoc.ref, //refrence to the patients' document
        label: patientDoc.data().PersonalDetails["First Name"] + " " + patientDoc.data().PersonalDetails["Last Name"]
        + " " + patientDoc.data().PersonalDetails["Id"]
        })
    })
    //gets attendants
    const attendantDepQ = query(attendantsCollection, where('Department', '==', user.department));
    const attendantDepQuerySnapshot = await getDocs(attendantDepQ);
    attendantDepQuerySnapshot.forEach((attendantDoc) => {
        usersList.push({
        value: attendantDoc.ref, //refrence to the patients' document
        label: attendantDoc.data().PersonalDetails["First Name"] + " " + attendantDoc.data().PersonalDetails["Last Name"]
        + " " + attendantDoc.data().PersonalDetails["Id"]
        })
    })
    return usersList
}
export async function getDepTherapists(department){ //returns the departments' therapists
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

export async function getDepPatients(department){//returns the departments' patients
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

export async function getUserPatients(user){ //returns the patients of a given user
    console.log("enter getUserPatients")
    if(user.Type === "Patient"){
        return undefined //so that we can make a difference in the calendar file of what to display
    }
    let patients = []
    if(user.Patients){
        user.Patients.forEach(async p => {
            const patientDocRef = doc(db, p.value.path)
            const patientDocSnapShot = await getDoc(patientDocRef)
            patients.push({
                label: patientDocSnapShot.data().PersonalDetails["First Name"] + " " + patientDocSnapShot.data().PersonalDetails["Last Name"]
                + " " + patientDocSnapShot.data().PersonalDetails["Id"],
                id: patientDocSnapShot.data().PersonalDetails["Id"],
                value: patientDocSnapShot.ref, //refrence to the patients' document
                data: patientDocSnapShot.Data,
            })
        })
    }
    console.log(patients)
    return patients
}

export async function getUserTherapists(user){
    
}

export async function getUserAttendants(user){
    
}
export async function getRooms() { //returns all rooms
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

export async function getDataFromUser(user) { //returns all appointments of a given user
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

export async function getDataFromRef(userRef) { //returns all appointments of a given user ref
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

async function isCollision(toAdd) { //checks if the appointment to add colides with any existing appointments
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
                temp = (temp)? true: !(existsEnd <= newStart || existsStart >= newEnd)
            }
            if(temp){
                return true;
            }
        }
    }
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
        console.log(added)
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
    return true;
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