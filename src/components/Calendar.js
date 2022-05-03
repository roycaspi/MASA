import React, { useState, useEffect, useCallback } from 'react';
import Paper from '@mui/material/Paper';
import { Alert } from "react-bootstrap"
import { ViewState,
  EditingState,
  IntegratedEditing } from '@devexpress/dx-react-scheduler';
import {
  Scheduler,
  DayView,
  Resources,
  Appointments,
  AppointmentForm,
  AppointmentTooltip,
  ConfirmationDialog,
  WeekView,
  Toolbar,
  ViewSwitcher,
  CurrentTimeIndicator,
} from '@devexpress/dx-react-scheduler-material-ui';
import {db} from '../firebase'
import {collection, getDocs, doc, updateDoc, arrayUnion, 
  query, where, getDoc, increment } from 'firebase/firestore'
import { useAuth } from "../contexts/AuthContext"
import { participants, rooms } from './eventFields';
import { getDataFromUser, addEvent, editEvent, removeEvent } from "../contexts/DB"
import Therapist from "../classes/Therapist"
import Patient from "../classes/Patient"
import Attendant from "../classes/Attendant"
import { PersonalDetails } from '../classes/User';
import { getDepPatients, getDepTherapists } from '../data/participants';

const therapistsCollection = collection(db, 'Therapists');
const patientsCollection = collection(db, 'Patients');
const usersCollection = collection(db, 'Users');
let coli = false

// const TextEditor = (props) => {
//   try{
//   if (props.type === 'multilineTextEditor') {
//     return null;
//   } return <AppointmentForm.TextEditor {...props} />;
// }
// catch(e){
//   console.log(e)
// }
// };

// const BasicLayout = ({ onFieldChange, appointmentData, ...restProps }) => { //participant field in event form
//   try{
//   const onParticipantsChange = (nextValue) => {
//     onFieldChange({ participants: nextValue });
//   };
//   return (
//     <AppointmentForm.BasicLayout
//       appointmentData={appointmentData}
//       onFieldChange={onFieldChange}
//       {...restProps}
//     >
//       <AppointmentForm.Label
//         text="Participants"
//         type="participants"
//       />
//       <AppointmentForm.TextEditor
//         value={appointmentData.participants}
//         onValueChange={onParticipantsChange}
//         placeholder="Participants"
//       />
//     </AppointmentForm.BasicLayout>
//   );
//   }
//   catch(e){
//     console.log(e)
//   }
// };


function Calendar() {
    const { currentUser } = useAuth()
    const [error, setError] = useState("")
    const [appointments, setAppointments] = useState([]);
    const [isTherapist, setIsTherapist] = useState(false)
    const [resources, setResources] = useState([]);
    const [user, setUser] = useState(null)
    
  //   async function isCollision(toAdd) {
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
    useEffect(async () => {
      console.log(user)
      setUser(user)
    }, [user])
    useEffect(async () => { 
        try {
            // const q = query(usersCollection, where('Email', '==', currentUser.email)); //show only the events of the current user 
            // const querySnapshot = await getDocs(q);
            // const userDocRef = doc(db, querySnapshot.data().Pointer)
            // const userDocSnapShot = getDoc(userDocRef)
            const userPointerDocRef = doc(db, 'Users', currentUser.uid);
            const userPointerDocSnap = await getDoc(userPointerDocRef);
            const userDocRef = doc(db, userPointerDocSnap.data().Pointer.path)
            const userDocSnapShot = await getDoc(userDocRef)
            console.log(userDocSnapShot.data())
            const userData = userDocSnapShot.data()
            if(userData.Type === "Therapist"){
              setIsTherapist(true)
              setUser(new Therapist(new PersonalDetails(userData.PersonalDetails["First Name"], userData.PersonalDetails["Last Name"],
              userData.PersonalDetails["Id"], userData.PersonalDetails["Email"], userData.PersonalDetails["Phone Number"],
              userData.PersonalDetails["Date of Birth"]), userData.Department, userData.Speciality, undefined, userData.Patients,
              userData.uid))
            }
            else if(userDocSnapShot.data().Type === "Patient"){
              setUser(new Patient(new PersonalDetails(userData.PersonalDetails["First Name"], userData.PersonalDetails["Last Name"],
              userData.PersonalDetails["Id"], userData.PersonalDetails["Email"], userData.PersonalDetails["Phone Number"],
              userData.PersonalDetails["Date of Birth"]), userData.Department, userData.Therapists, userData.Permission,
              userData.Attendants, undefined, userData.uid))
            }
            else if(userDocSnapShot.data().Type === "Attendant"){
              setUser(new Attendant(new PersonalDetails(userData.PersonalDetails["First Name"], userData.PersonalDetails["Last Name"],
              undefined, userData.PersonalDetails["Email"], userData.PersonalDetails["Phone Number"],
              undefined), userData.Department, userData.Permission, userData.Patients, undefined, userData.uid))
            }
            const events = getDataFromUser(userData)
            events.then((d) => {
              setAppointments(d)
            })
            console.log(appointments)
            const departmentTherapits = await getDepTherapists(userData.Department)
            const departmentPatients = await getDepPatients(userData.Department)
            console.log(departmentTherapits)
            const res = [
              {
                fieldName: 'type',
                title: 'Type',
                instances: [
                            {
                              text: 'Default',
                              id: 1,
                            },
                            {
                              text: 'Private',
                              id: 2,
                              color : "Chartreuse"
                            },
                          ],
              },
              {
                fieldName: 'roomId',
                title: 'Room',
                instances: rooms,
              },
              {
                fieldName: 'therapists',
                title: 'Therapists',
                instances: departmentTherapits,
                allowMultiple: true,
              },
              {
                fieldName: 'patients',
                title: 'Patients',
                instances: departmentPatients,
                allowMultiple: true,
              },
            ];
            setResources(res)
        } catch(err) {
            console.log(err)
        }
    }, [])

    const commitChanges = async({ added, changed, deleted }) => { //adds, deletes and changes events
            if (added) {    //add new event todo:finish the collision
              console.log(added)
            }
          if (changed) {
            console.log(changed)
          }
          if (deleted !== undefined) { 
              console.log(deleted)
          }
    }

    const WeekTimeTableCell = useCallback(React.memo(({ onDoubleClick, ...restProps }) => (
      <WeekView.TimeTableCell
        {...restProps}
        onDoubleClick={isTherapist ? onDoubleClick : undefined}
      />
    )), [isTherapist]);

    const DayTimeTableCell = useCallback(React.memo(({ onDoubleClick, ...restProps }) => (
      <DayView.TimeTableCell
        {...restProps}
        onDoubleClick={isTherapist ? onDoubleClick : undefined}
      />
    )), [isTherapist]);


    return (
        <Paper>
        <Scheduler
          data={appointments}
        > 
          <ViewState
            currentDate={new Date()}
          />
          {error && <Alert variant="danger">{error}</Alert>}
          <EditingState
            onCommitChanges={commitChanges}
          />
             <IntegratedEditing />

             <DayView
            startDayHour={7}
            endDayHour={19}
            timeTableCellComponent={DayTimeTableCell}
          />
            <WeekView
            startDayHour={7}
            endDayHour={19}
            timeTableCellComponent={WeekTimeTableCell}
          />
          <ConfirmationDialog />
          <Toolbar />
          <ViewSwitcher />
          <Appointments/>
          <CurrentTimeIndicator/>
          <AppointmentTooltip
            showOpenButton={isTherapist}
            showDeleteButton={isTherapist}
          />
          <AppointmentForm
            // basicLayoutComponent={BasicLayout}
            // textEditorComponent={TextEditor}
            readOnly={!isTherapist}
          />
          <Resources
            data={resources}
            mainResourceName="type"
          />
        </Scheduler>
      </Paper>
    );
}
 
export default Calendar;