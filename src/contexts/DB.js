import { db } from "../firebase"
import {collection, getDocs, doc, updateDoc, arrayUnion, query, where, getDoc, increment, addDoc, 
    deleteDoc, arrayRemove, writeBatch } from 'firebase/firestore'

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
    const therapistDepQ = query(therapistsCollection, where('Department', '==', user.Department));
    const therapistDepQuerySnapshot = await getDocs(therapistDepQ);
    therapistDepQuerySnapshot.forEach((therapistDoc) => {
        usersList.push({
          value: therapistDoc.ref, //refrence to the therapists' document
          label: therapistDoc.data().PersonalDetails["First Name"] + " " + therapistDoc.data().PersonalDetails["Last Name"]
          + " " + therapistDoc.data().PersonalDetails["Id"]
        })
    })
    //gets patients
    const patientDepQ = query(patientsCollection, where('Department', '==', user.Department));
    const patientDepQuerySnapshot = await getDocs(patientDepQ);
    patientDepQuerySnapshot.forEach((patientDoc) => {
        usersList.push({
        value: patientDoc.ref, //refrence to the patients' document
        label: patientDoc.data().PersonalDetails["First Name"] + " " + patientDoc.data().PersonalDetails["Last Name"]
        + " " + patientDoc.data().PersonalDetails["Id"]
        })
    })
    //gets attendants
    const attendantDepQ = query(attendantsCollection, where('Department', '==', user.Department));
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
    let patients = [{ value: "None", label: "None" }]
    if(user.Patients){
        const patientPromises = user.Patients.map(async p => {
            const patientDocRef = doc(db, p.value.path)
            const patientDocSnapShot = await getDoc(patientDocRef)
            return {
                label: patientDocSnapShot.data().PersonalDetails["First Name"] + " " + patientDocSnapShot.data().PersonalDetails["Last Name"]
                + " " + patientDocSnapShot.data().PersonalDetails["Id"],
                id: patientDocSnapShot.data().PersonalDetails["Id"],
                value: patientDocSnapShot.ref, //refrence to the patients' document
                data: patientDocSnapShot.data(),
            }
        });
        const resolvedPatients = await Promise.all(patientPromises);
        patients = patients.concat(resolvedPatients);
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
    
    // Use Promise.all to handle async operations properly
    if (userDocSnapShot.data().Data) {
        const appointmentPromises = userDocSnapShot.data().Data.map(async ref => {
            const appointmentDocRef = doc(db,  ref.path)
            const appointmentDocSnap = await getDoc(appointmentDocRef)
            let appointment = appointmentDocSnap.data()
            appointment.startDate = appointment.startDate.toDate() //convert unix timestamp into date
            appointment.endDate = appointment.endDate.toDate()
            return appointment
        });
        data = await Promise.all(appointmentPromises);
    }
    
    console.log(data)
    return data;
}

export async function getDataFromRef(userRef) { //returns all appointments of a given user ref
    const userDocRef = doc(db, userRef.path)
    const userDocSnapShot = await getDoc(userDocRef)
    let data = []
    
    // Use Promise.all to handle async operations properly
    if (userDocSnapShot.data().Data) {
        const appointmentPromises = userDocSnapShot.data().Data.map(async ref => {
            const appointmentDocRef = doc(db,  ref.path)
            const appointmentDocSnap = await getDoc(appointmentDocRef)
            let appointment = appointmentDocSnap.data()
            appointment.startDate = appointment.startDate.toDate() //convert unix timestamp into date
            appointment.endDate = appointment.endDate.toDate()
            return appointment
        });
        data = await Promise.all(appointmentPromises);
    }
    
    return data;
}

async function isCollision(toAdd) { //checks if the appointment to add collides with any existing appointments
    let temp = false;
    const participants = (toAdd.therapists) ? toAdd.patients.concat(toAdd.therapists) : toAdd.patients;
    if (!participants) {
        return temp;
    }

    // Fetch all user docs in parallel
    const userDocSnapshots = await Promise.all(
        participants.map(p => getDoc(doc(db, p)))
    );

    // Collect all appointment refs
    const allAppointmentRefs = userDocSnapshots
        .map(snap => (snap.data().Data || []))
        .flat();

    // Fetch all appointment docs in parallel
    const appointmentDocs = await Promise.all(
        allAppointmentRefs.map(ref => getDoc(doc(db, ref.path)))
    );

    for (const appointmentDocSnap of appointmentDocs) {
        const appointment = appointmentDocSnap.data();
        // Skip if missing required fields
        if (!appointment || !appointment.startDate || !appointment.endDate) continue;
        let { startDate: existsStart, endDate: existsEnd, id: existsId } = appointment;
        let { startDate: newStart, endDate: newEnd, id: newId } = toAdd;
        existsStart = existsStart.toDate();
        existsEnd = existsEnd.toDate();
        // If editing, skip comparing with itself
        if (newId !== undefined && existsId === newId) continue;
        // Check for overlap
        if (!(existsEnd <= newStart || existsStart >= newEnd)) {
            return true;
        }
    }
    return false;
}

export async function addEvent(event, currentUser) {
    console.log("enter addEvent");
    const startTime = performance.now();
    console.log("event = ", event);

    const { appointmentData } = event;
    const hasPatients = !!appointmentData.patientId;
    const hasTherapists = appointmentData.type === "Private" ? true : !!appointmentData.therapistId;

    if (!hasPatients || !hasTherapists) {
        console.error("Missing required fields:", { hasPatients, hasTherapists, appointmentData });
        return;
    }

    coli = await isCollision(appointmentData)
    console.log("collision check result:", coli)
    
    if(!coli){ 
        try {
            // Reset seconds to avoid collision issues
            appointmentData.startDate.setSeconds(0)
            appointmentData.endDate.setSeconds(0)

            // Remove undefined fields from appointmentData
            Object.keys(appointmentData).forEach(
                key => appointmentData[key] === undefined && delete appointmentData[key]
            );

            // Get and increment the appointment ID
            const IdCountRef = doc(db, "Appointments", "IdCount");
            const docSnap = await getDoc(IdCountRef);
            const id = docSnap.data().count;
            appointmentData.id = id;

            // Set the admin (creator) of the appointment
            appointmentData.admin = [await getUserDocRef(currentUser.uid)];

            // Update the ID counter
            await updateDoc(IdCountRef, {
                count: increment(1)
            });

            // Create the appointment document
            const appointmentDocRef = await addDoc(collection(db, "Appointments"), appointmentData);
            console.log("Created appointment document:", appointmentDocRef.id);

            // --- Optimization: Use Firestore batch for all updates ---
            const batch = writeBatch(db);

            // Update patients' references
            if (appointmentData.patients && appointmentData.patients.length > 0) {
                appointmentData.patients.forEach(p => {
                    if (!p) {
                        console.error("Skipping undefined patient path in appointmentData.patients");
                        return;
                    }
                    const userDocRef = doc(db, p);
                    batch.update(userDocRef, {
                        "Data": arrayUnion(appointmentDocRef)
                    });
                });
            }

            // Update therapists' references
            if (appointmentData.therapists && appointmentData.therapists.length > 0) {
                appointmentData.therapists.forEach(p => {
                    if (!p) {
                        console.error("Skipping undefined therapist path in appointmentData.therapists");
                        return;
                    }
                    const userDocRef = doc(db, p);
                    batch.update(userDocRef, {
                        "Data": arrayUnion(appointmentDocRef)
                    });
                });
            }

            // Update room occupancy
            if (appointmentData.room && appointmentData.room.length > 0) {
                appointmentData.room.forEach(room => {
                    const roomDocRef = doc(db, room.path);
                    batch.update(roomDocRef, {
                        occupied: arrayUnion({
                            startDate: appointmentData.startDate,
                            endDate: appointmentData.endDate,
                            appointmentRef: appointmentDocRef
                        })
                    });
                });
            }

            // Commit all updates in a single batch
            const batchStart = performance.now();
            await batch.commit();
            const batchEnd = performance.now();
            console.log(`Batch commit took ${batchEnd - batchStart} ms`);
            // --- End optimization ---

            const endTime = performance.now();
            console.log(`addEvent total time: ${endTime - startTime} ms`);
            console.log("Successfully added appointment and updated all references");
            return true;
        } catch (error) {
            console.error("Error adding appointment:", error);
            return false;
        }
    } else {
        console.log("Appointment collision detected");
        return false;
    }
}

export async function editEvent(changed, user) {
    console.log(changed)
    let participantEvents = await getDataFromUser(user)
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
    
    const updatePromises = [];
    
    updatePromises.push(updateDoc(appointmentDocRef, changedDetails)); //update the appointment in DB
    
    //remove appointment from previous participants
    previousParticipants.forEach((p) => {
        let partiDocRef = doc(db, p)
        updatePromises.push(updateDoc(partiDocRef, {
            "Data": arrayRemove(appointmentDocRef)
        }));
    })
    
    const participants = (changedDetails.therapists)? 
                        changedDetails.patients.concat(changedDetails.therapists) : changedDetails.patients
    //add appointment to new paricipantes
    participants.forEach((p) => {
        let partiDocRef = doc(db, p)
        if(!(appointmentDocRef.id in participantEvents)){//if the participant is new
            updatePromises.push(updateDoc(partiDocRef, {
                "Data": arrayUnion(appointmentDocRef)
            }));
        }
    })
    
    //change room
    if(previousRoom !== changedDetails.room) {//check if the room changed
        for(const room of previousRoom) { //free old room
            if(!(room in changedDetails.room)) {
                const roomDocRef = doc(db, room)
                const roomDocSnapShot = await getDoc(roomDocRef)
                const occupiedList = roomDocSnapShot.data().occupied
                updatePromises.push(updateDoc(roomDocRef, {
                    occupied: occupiedList.filter(appointment => appointment.appointmentRef.id !== appointmentDocRef.id)
                }));
            }
        }
        for(const room of changedDetails.room) {//occupy new room
            if(!(room in previousRoom)) {
                const roomDocRef = doc(db, room)
                updatePromises.push(updateDoc(roomDocRef, {
                    occupied: arrayUnion({startDate: changed.appointmentData.startDate,
                                            endDate: changed.appointmentData.endDate,
                                            appointmentRef: appointmentDocRef})
                }));
            }
        }
    }
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
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
        
        const updatePromises = [];
        
        // Handle participant updates
        for (const p of participants) { //delete appointment ref in data of participants
            const partiDocRef = doc(db, p)
            const partiDocSnapShot = await getDoc(partiDocRef)
            const participantEvents = partiDocSnapShot.data().Data
            console.log(participantEvents)
            updatePromises.push(updateDoc(partiDocRef, {
                "Data": participantEvents.filter(appointment => appointment.id !== appointmentDocRef.id)
            }));
        }
        
        // Handle room updates
        if(deleted.appointmentData.room){ // make room available
            for (const room of deleted.appointmentData.room) {
                const roomDocRef = doc(db, room)
                const roomDocSnapShot = await getDoc(roomDocRef)
                const occupiedList = roomDocSnapShot.data().occupied
                updatePromises.push(updateDoc(roomDocRef, {
                    occupied: occupiedList.filter(appointment => appointment.appointmentRef.id !== appointmentDocRef.id)
                }));
            }
        }
        
        // Wait for all updates to complete
        await Promise.all(updatePromises);
        
        await deleteDoc(doc(db, appointmentDocRef.path))//deletes the appointment doc
    }
}