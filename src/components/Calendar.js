import React, { useState, useEffect, useCallback } from 'react';
import Paper from '@mui/material/Paper';
import { Alert } from "react-bootstrap"
import { ViewState,
  EditingState,
  IntegratedEditing } from '@devexpress/dx-react-scheduler';
import {
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
// import { participants, rooms } from './eventFields';
import { getDataFromUser, addEvent, editEvent, removeEvent, getDepPatients, 
  getDepTherapists, getRooms } from "../contexts/DB"
import Therapist from "../classes/Therapist"
import Patient from "../classes/Patient"
import Attendant from "../classes/Attendant"
import { PersonalDetails } from '../classes/User';
// import { getDepPatients, getDepTherapists } from '../data/participants';
import Scheduler, { Editing, Resource } from 'devextreme-react/scheduler';
import Query from 'devextreme/data/query';
import notify from 'devextreme/ui/notify';

const therapistsCollection = collection(db, 'Therapists');
const patientsCollection = collection(db, 'Patients');
const usersCollection = collection(db, 'Users');
let coli = false

function Calendar() {
    const { currentUser } = useAuth()
    const [error, setError] = useState("")
    const [appointments, setAppointments] = useState([]);
    const [isTherapist, setIsTherapist] = useState(false)
    const [resources, setResources] = useState([]);
    const [user, setUser] = useState(null)
    const [departmentTherapits, setDepartmentTherapits] = useState([])
    const [departmentPatients, setDepartmentPatients] = useState([])
    const [rooms, setRooms] = useState([])
    
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

  function addApp(e){
    console.log("enter addApp")
    addEvent(e)
    showAddedToast(e)
  }
  
  function showToast(event, value, type) {
    notify(`${event} "${value}" task`, type, 800);
  }

  function showAddedToast(e) {
    showToast('Added', e.appointmentData.text, 'success');
  }

  function showUpdatedToast(e) {
    showToast('Updated', e.appointmentData.text, 'info');
  }

  function showDeletedToast(e) {
    showToast('Deleted', e.appointmentData.text, 'warning');
  }

  function onAppointmentFormOpeningTherapist(e){
    e.popup.option('showTitle', true);
    e.popup.option('title', e.appointmentData.text ? 
        e.appointmentData.text : 
        'Create a new appointment');
    const form = e.form;
    let mainGroupItems = form.itemOption('mainGroup').items;
    rooms.forEach((room) => { //checks what rooms are available
      let {"Start Date": existsStart, "End Date": existsEnd} = room.occupied;
      let {startDate: newStart, endDate: newEnd} = e.appointmentData;
      existsStart = existsStart.toDate()
      existsEnd = existsEnd.toDate()
      if(!(existsEnd <= newStart || existsStart >= newEnd)){
        const index = rooms.indexOf(room)
        rooms.splice(index, 1)
      }
    })
    console.log("available rooms", rooms)
    if (!mainGroupItems.find(function(i) { return i.dataField === "room" })) {
        mainGroupItems.push({
            colSpan: 2, 
            label: { text: "Room" },
            editorType: "dxSelectBox",
            dataField: "room",
            editorOptions: {
              items: rooms,
              displayExpr: 'text',
              valueExpr: 'ref',
              onValueChanged(args) {
                console.log(args)
              }
            }
          });
        form.itemOption('mainGroup', 'items', mainGroupItems);
    }

    // let formItems = form.option("items"); 
    // if (!formItems.find(function(i) { return i.dataField === "location" })) {
    //     formItems.push({
    //         colSpan: 2,
    //         label: { text: "Location" },
    //         editorType: "dxTextBox",
    //         dataField: "location"
    //     });
    //     form.option("items", formItems);
    // }
  }

  function onAppointmentFormOpeningPatient(e){

  }

  function onAppointmentFormOpening(e) {
    if(isTherapist){
      onAppointmentFormOpeningTherapist(e)
    }
    else{
      onAppointmentFormOpeningPatient(e)
    }
  }
  useEffect(async () => { //todo: check if needed
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
          setDepartmentTherapits(await getDepTherapists(userData.Department))
          setDepartmentPatients(await getDepPatients(userData.Department))
          setRooms(await getRooms())
          console.log(rooms)
          // const res = [
          //   {
          //     fieldName: 'type',
          //     title: 'Type',
          //     instances: [
          //                 {
          //                   text: 'Default',
          //                   id: 1,
          //                 },
          //                 {
          //                   text: 'Private',
          //                   id: 2,
          //                   color : "Chartreuse"
          //                 },
          //               ],
          //   },
          //   {
          //     fieldName: 'roomId',
          //     title: 'Room',
          //     instances: rooms,
          //   },
          //   {
          //     fieldName: 'therapists',
          //     title: 'Therapists',
          //     instances: departmentTherapits,
          //     allowMultiple: true,
          //   },
          //   {
          //     fieldName: 'patients',
          //     title: 'Patients',
          //     instances: departmentPatients,
          //     allowMultiple: true,
          //   },
          // ];
          // setResources(res)
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
            dataSource={appointments}
            views={['day', 'week']}
            defaultCurrentView="day"
            defaultCurrentDate={new Date()}
            groups={[]}
            height={'100%'}
            firstDayOfWeek={0}
            startDayHour={7}
            endDayHour={19}
            showAllDayPanel={false}
            crossScrollingEnabled={true}
            adaptivityEnabled={true}
            showCurrentTimeIndicator={true}
            cellDuration={30}
            onAppointmentFormOpening={onAppointmentFormOpening}
            onAppointmentAdded={addApp}
          >
        <Editing allowAdding={true} />
        <Resource
          dataSource={departmentTherapits}
          allowMultiple={true}
          fieldExpr="therapists"
          label="Therapists"
          valueExpr='ref' 
        />
        <Resource
          dataSource={departmentPatients}
          allowMultiple={true}
          fieldExpr="patients"
          label="Patients"
          valueExpr='ref' //todo: makes the multiple function faulty - maybe put it in onAppointmentFormOpening function as field
        />
      </Scheduler>
        {/* <Scheduler
          dataSource={appointments}
          onAppointmentFormOpening={onAppointmentFormOpening}
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
        </Scheduler> */}
      </Paper>
    );
}
 
export default Calendar;

// import React from 'react';
// import Scheduler, { Editing, Resource } from 'devextreme-react/scheduler';
// import Query from 'devextreme/data/query';



// const currentDate = new Date(2021, 3, 27);
// const views = ['day', 'week', 'timelineDay'];
// const groups = ['theatreId'];

// function App()  {
//     return (
//       <Scheduler
//         timeZone="America/Los_Angeles"
//         dataSource={[]}
//         views={views}
//         defaultCurrentView="day"
//         defaultCurrentDate={currentDate}
//         groups={groups}
//         height={600}
//         firstDayOfWeek={0}
//         startDayHour={9}
//         endDayHour={23}
//         showAllDayPanel={false}
//         crossScrollingEnabled={true}
//         cellDuration={20}
//         onAppointmentFormOpening={onAppointmentFormOpening}
//       >
//         <Editing allowAdding={true} />
//         <Resource
//           dataSource={[]}
//           fieldExpr="movieId"
//           useColorAsDefault={true}
//         />
//         <Resource
//           dataSource={[]}
//           fieldExpr="theatreId"
//         />
//       </Scheduler>
//     );
// }


//   function onAppointmentFormOpening(e) {
//         e.popup.option('showTitle', true);
//         e.popup.option('title', e.appointmentData.text ? 
//             e.appointmentData.text : 
//             'Create a new appointment');
    
//         const form = e.form;
//         let mainGroupItems = form.itemOption('mainGroup').items;
//         if (!mainGroupItems.find(function(i) { return i.dataField === "phone" })) {
//             mainGroupItems.push({
//                 colSpan: 2, 
//                 label: { text: "Phone Number" },
//                 editorType: "dxTextBox",
//                 dataField: "phone"
//             });
//             form.itemOption('mainGroup', 'items', mainGroupItems);
//         }
//       }
// export default App;
