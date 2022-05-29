import React, { useState, useEffect, useCallback } from 'react';
import Paper from '@mui/material/Paper';
import { Alert, Container, Form } from "react-bootstrap"
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
  getDepTherapists, getRooms, getUserPatients, getDataFromRef } from "../contexts/DB"
import Therapist from "../classes/Therapist"
import Patient from "../classes/Patient"
import Attendant from "../classes/Attendant"
import { PersonalDetails } from '../classes/User';
// import { getDepPatients, getDepTherapists } from '../data/participants';
import Scheduler, { Editing, Resource, View } from 'devextreme-react/scheduler';
import Query from 'devextreme/data/query';
import notify from 'devextreme/ui/notify';
import { Button } from 'bootstrap';
import Grid from '@material-ui/core/Grid';
import Select from 'react-select'
import TextField from '@mui/material/TextField';
import { Label } from 'devextreme-react/bar-gauge';
import ResourceCell from './ResourceCell.js';

const therapistsCollection = collection(db, 'Therapists');
const patientsCollection = collection(db, 'Patients');
const usersCollection = collection(db, 'Users');
let coli = false
let showSecondScheduler = false


function Calendar() {
    const { currentUser } = useAuth()
    const [error, setError] = useState("")
    const [appointments, setAppointments] = useState([]);
    const [isTherapist, setIsTherapist] = useState(false)
    const [user, setUser] = useState(null)
    const [departmentTherapits, setDepartmentTherapits] = useState([])
    const [departmentPatients, setDepartmentPatients] = useState([])
    const [rooms, setRooms] = useState([])
    const [patientToView, setPatientToView] = useState(false)
    const [therapistsPatients, setTherapistsPatients] = useState([])
    const [userName, setUserName] = useState("")
    const groups = ['type'];

  async function addApp(e){
    console.log("enter addApp")
      if(await addEvent(e, currentUser)){
        showAddedToast(e)
      }
      else{
        showCollisionToast(e)
        setError(e)
      }
  }

  async function updateApp(e){
    console.log("enter updateApp")
    if(await editEvent(e, currentUser)) {
      showUpdatedToast(e)
    }
    else{
      showCollisionToast(e)
      setError(e)
    }
  }

  async function deleteApp(e){
    console.log("enter deleteApp")
    removeEvent(e, currentUser)
    showDeletedToast(e)
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

  function showCollisionToast(e) {
    showToast('Event Collision', e.appointmentData.text, 'warning');
  }

  function showErrorToast(e) {
    showToast('Error', e.appointmentData.text, 'warning');
  }

  function getAvailableRooms(e) { //return available rooms depending on appointment times
    let availableRooms = JSON.parse(JSON.stringify(rooms)) //deep copy rooms into availableRooms
    availableRooms.forEach((room) => { //copy the original refrence because of the deep copy
      room.ref = rooms.find(r => r.id === room.id).ref
      console.log(room)
    })
    availableRooms.forEach((room) => { //checks what rooms are available
      room.occupied.forEach((t) => {
        let {startDate: existsStart, endDate: existsEnd} = t;
        let {startDate: newStart, endDate: newEnd} = e.appointmentData;
        existsStart = new Date(existsStart.seconds * 1000)
        existsEnd = new Date(existsEnd.seconds * 1000)
        if(!(existsEnd <= newStart || existsStart >= newEnd)){
          room.disabled = true
        }
      })
    })
    return availableRooms
  }
  
  async function getViews(e) { //gets the patients of the current therapist
    if(showSecondScheduler){
      const data = await getDataFromRef(e.value)
      setPatientToView(data)
    }
  }

  async function getUserName(){
    // const userPointerDocRef = doc(db, 'Users', currentUser.uid);
    // const userPointerDocSnap = await getDoc(userPointerDocRef);
    // const userDocRef = doc(db, userPointerDocSnap.data().Pointer.path)
    // const userDocSnapShot = await getDoc(userDocRef)
    // const userData = userDocSnapShot.data()
    // setUserName(userData.PersonalDetails["First Name"] + " " + userData.PersonalDetails["Last Name"]
    // + " " + userData.PersonalDetails["Id"])
  }

  function onAppointmentFormOpeningTherapist(e){
    e.popup.option('showTitle', true);
    e.popup.option('title', e.appointmentData.text ? 
        e.appointmentData.text : 
        'Create a new appointment');
    const form = e.form;
    let privateApp = false
    let availableRooms = getAvailableRooms(e)
    let mainGroupItems = form.itemOption('mainGroup').items;
    console.log("rooms=", rooms)
    console.log("availableRooms=", availableRooms)
    if (!mainGroupItems.find(function(i) { return i.dataField === "type" })) {
      mainGroupItems.push({
        colSpan: 2, 
        label: { text: "Type" },
        editorType: "dxSelectBox",
        dataField: "type",
        editorOptions: {
          items: ["Default", "Private"],
          // displayExpr: 'text',
          // valueExpr: 'ref',
          onValueChanged(args) {
            privateApp = args.value === "Private"
            if(!privateApp){
              mainGroupItems.find(function(i) { if(i.dataField === "exercises"){mainGroupItems.splice(
                mainGroupItems.indexOf(i), 1)} }) //removes exercises field if default type is selected
            }
            if (!mainGroupItems.find(function(i) { return i.dataField === "exercises" }) && privateApp) { //create the exercises field if private type is selected
              mainGroupItems.push({
                  colSpan: 2, 
                  label: { text: "Exercises" }, //todo: if patient can book private appointment patients should hold array of past exercises to choose from
                  editorType: "dxTagBox", // todo: therapists will have the entire exercises to choose from
                  dataField: "exercises",
                  editorOptions: {
                    items: [],
                    acceptCustomValue: true,
                    multiline: true,
                    showSelectionControls: true,
                  }
                });
            }
            form.itemOption('mainGroup', 'items', mainGroupItems);
          }
        }
      });
      form.itemOption('mainGroup', 'items', mainGroupItems);
    }
    if (!mainGroupItems.find(function(i) { return i.dataField === "patients" })) {
      mainGroupItems.push({
          label: { text: "Patients" },
          editorType: "dxTagBox",
          dataField: "patients",
          searchEnabled: true,
          editorOptions: {
            items: departmentPatients,
            valueExpr: "ref.path",
            displayExpr: "text",
            multiline: true,
            showSelectionControls: true,
          }
        });
      form.itemOption('mainGroup', 'items', mainGroupItems);
    }
      if (!mainGroupItems.find(function(i) { return i.dataField === "therapists" })) {
        mainGroupItems.push({
            label: { text: "Therapists" },
            editorType: "dxTagBox",
            dataField: "therapists",
            searchEnabled: true,
            editorOptions: {
              items: departmentTherapits,
              valueExpr: "ref.path",
              displayExpr: "text",
              multiline: true,
              showSelectionControls: true,
            }
          });
        form.itemOption('mainGroup', 'items', mainGroupItems);
      }
    console.log("available rooms", availableRooms)
    if (!mainGroupItems.find(function(i) { return i.dataField === "room" })) {
        mainGroupItems.push({
            colSpan: 2, 
            label: { text: "Room" },
            editorType: "dxTagBox",
            dataField: "room",
            editorOptions: {
              items: availableRooms, 
              valueExpr: "ref.path",
              displayExpr: "text",
              multiline: true,
              showSelectionControls: true,
            },
          });
        form.itemOption('mainGroup', 'items', mainGroupItems);
    }
    else if (!mainGroupItems.find(function(i) { return i.dataField === "room" })) {  //updates the available rooms
      availableRooms = getAvailableRooms(e)
      console.log("updating rooms to", availableRooms)
      const index = availableRooms.indexOf(mainGroupItems.find(field => field.dataField === "room" ))
      mainGroupItems.splice(index, 1)
      mainGroupItems.push({
        colSpan: 2, 
        label: { text: "Room" },
        editorType: "dxTagBox",
        dataField: "room",
        editorOptions: {
          items: availableRooms, 
          valueExpr: "ref.path",
          displayExpr: "text",
          multiline: true,
          showSelectionControls: true,
        },
      });
      form.itemOption('mainGroup', 'items', mainGroupItems);
    }
    if (!mainGroupItems.find(function(i) { return i.dataField === "exercises" }) && privateApp) { //create the exercises field if private type is selected
        mainGroupItems.push({
            colSpan: 2, 
            label: { text: "Exercises" }, //todo: if patient can book private appointment patients should hold array of past exercises to choose from
            editorType: "dxTagBox", // todo: therapists will have the entire exercises to choose from
            dataField: "exercises",
            editorOptions: {
              items: [],
              acceptCustomValue: true,
              multiline: true,
              showSelectionControls: true,
            }
        });
        form.itemOption('mainGroup', 'items', mainGroupItems);
    }
    setAppointments(async e => await getDataFromUser(user))
  }

  function onAppointmentFormOpeningPatient(e){

  }

  function onAppointmentFormOpening(e) {
    if(isTherapist){
      console.log(user)
      onAppointmentFormOpeningTherapist(e)
    }
    else{
      onAppointmentFormOpeningPatient(e)
    }
  }

  useEffect(async () => { 
    const userPointerDocRef = doc(db, 'Users', currentUser.uid);
    const userPointerDocSnap = await getDoc(userPointerDocRef);
    const userDocRef = doc(db, userPointerDocSnap.data().Pointer.path)
    const userDocSnapShot = await getDoc(userDocRef)
    const userData = userDocSnapShot.data()
    setUserName(userData.PersonalDetails["First Name"] + " " + userData.PersonalDetails["Last Name"]
    + " " + userData.PersonalDetails["Id"])
  })
//   useEffect(async () => { 
//     setRooms(await getRooms())
// }, [rooms])
//   useEffect(async () => { 
//     showErrorToast(error)
// }, [error])

  useEffect(async () => { 
      try {
          const userPointerDocRef = doc(db, 'Users', currentUser.uid);
          const userPointerDocSnap = await getDoc(userPointerDocRef);
          const userDocRef = doc(db, userPointerDocSnap.data().Pointer.path)
          const userDocSnapShot = await getDoc(userDocRef)
          console.log(userDocSnapShot.data())
          const userData = userDocSnapShot.data()
          if(userData.Type === "Therapist"){
            setIsTherapist(true)
            setTherapistsPatients(await getUserPatients(userData))
            setUser(new Therapist(new PersonalDetails(userData.PersonalDetails["First Name"], userData.PersonalDetails["Last Name"],
            userData.PersonalDetails["Id"], userData.PersonalDetails["Email"], userData.PersonalDetails["Phone Number"],
            userData.PersonalDetails["Date of Birth"]), userData.Department, userData.Speciality, undefined, userData.Patients,
            userData.uid))
          }
          else if(userData.Type === "Patient"){
            setUser(new Patient(new PersonalDetails(userData.PersonalDetails["First Name"], userData.PersonalDetails["Last Name"],
            userData.PersonalDetails["Id"], userData.PersonalDetails["Email"], userData.PersonalDetails["Phone Number"],
            userData.PersonalDetails["Date of Birth"]), userData.Department, userData.Therapists, userData.Permission,
            userData.Attendants, undefined, userData.uid))
          }
          else if(userData.Type === "Attendant"){
            setUser(new Attendant(new PersonalDetails(userData.PersonalDetails["First Name"], userData.PersonalDetails["Last Name"],
            undefined, userData.PersonalDetails["Email"], userData.PersonalDetails["Phone Number"],
            undefined), userData.Department, userData.Permission, userData.Patients, undefined, userData.uid))
          }
          setAppointments(await getDataFromUser(userData))
          console.log(await getDataFromUser(userData))
          setDepartmentTherapits(await getDepTherapists(userData.Department))
          setDepartmentPatients(await getDepPatients(userData.Department))
          setRooms(await getRooms())
          getUserName()
      } catch(err) {
          console.log(err)
      }
    }, [])

    async function clicked(){ //function that happens once screen is clicked

    }

    if(isTherapist){
      return (
        //div is for the clicked function
        <div class="font-icon-wrapper" onClick={clicked}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Paper>
            <Form.Label className="btn btn-primary" style={{textAlign: "center", verticalAlign: "middle"}} disabled={true}>Welcome {userName}</Form.Label>
            <Scheduler
              resourceCellComponent={ResourceCell}
              dataSource={appointments}
              groups={groups}
              defaultCurrentView="day"
              defaultCurrentDate={new Date()}
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
              onAppointmentUpdated={updateApp}
              onAppointmentDeleted={deleteApp}
            >
            <Editing allowAdding={true} />
            <Resource
            dataSource={departmentPatients}
            fieldExpr="type2"
            label="Type2"
            /> 
            <Resource
            children
            dataSource={departmentPatients}
            fieldExpr="type2"
            label="EX"
            /> 
            {/* <Resource
            dataSource={["Default", "Private"]}
            allowMultiple={true}
            fieldExpr="type"
            label="Type"
            onValueChanged={}
          /> */}
          {/* <Resource
            dataSource={[]}
            allowMultiple={true}
            fieldExpr="therapists"
            label="Test"
            onValueChanged={change}
          />
          <Resource
            dataSource={departmentPatients}
            allowMultiple={true}
            fieldExpr="patients"
            valueExpr='ref' //todo: makes the multiple function faulty - maybe put it in onAppointmentFormOpening function as field
            label="Test2"
            visible={true}
          /> */}
            </Scheduler>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper>
            <Container>
              <Select placeholder="Choose Patient to View" 
                options={[{label: "None", value: "None"}].concat(therapistsPatients)}
                menuPortalTarget={document.body} 
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                onChange={(e) => {showSecondScheduler=(e.value === "None")? false:true; getViews(e)}}/>
            </Container>
            <Container>
              <Scheduler
                visible={showSecondScheduler}
                dataSource={patientToView}
                defaultCurrentView="day"
                defaultCurrentDate={new Date()}
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
                onAppointmentUpdated={updateApp}
                onAppointmentDeleted={deleteApp}
                >
                <Editing allowAdding={true} />
              </Scheduler>
            </Container>
            {/* {setAppointments(async e => await getDataFromUser(user))} */}
            </Paper>
          </Grid>
        </Grid>
        </div>
      );
    }
    else{
      return(
        <Paper>
            <Scheduler
              dataSource={appointments}
              groups={groups}
              defaultCurrentView="day"
              defaultCurrentDate={new Date()}
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
              onAppointmentUpdated={updateApp}
              onAppointmentDeleted={deleteApp}
            >
            <Editing allowAdding={true} />
            </Scheduler>
            {/* {setAppointments(async e => await getDataFromUser(user))} */}
          </Paper>
      );
    }
}
 
export default Calendar;