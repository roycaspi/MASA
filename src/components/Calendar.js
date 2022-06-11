import React, { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import { Container, Form } from "react-bootstrap"
import {db} from '../firebase'
import {doc, getDoc } from 'firebase/firestore'
import { useAuth } from "../contexts/AuthContext"
import { getDataFromUser, addEvent, editEvent, removeEvent, getDepPatients, 
  getDepTherapists, getRooms, getUserPatients, getDataFromRef, getUserDocRef } from "../contexts/DB"
import Therapist from "../classes/Therapist"
import Patient from "../classes/Patient"
import Attendant from "../classes/Attendant"
import { PersonalDetails } from '../classes/User';
import Scheduler, { Editing, Resource } from 'devextreme-react/scheduler';
import notify from 'devextreme/ui/notify';
import Grid from '@material-ui/core/Grid';
import Select from 'react-select'
import Popup from 'react-popup';


let showSecondScheduler = false
const types = [{id: 1,
                text: "Default"}, 
                {id: 2,
                  text: "Private",
                  color: '#008000'}]



function Calendar() {
    const { currentUser } = useAuth()
    const [appointments, setAppointments] = useState([]);
    const [isTherapist, setIsTherapist] = useState(false)
    const [user, setUser] = useState(null)
    const [departmentTherapits, setDepartmentTherapits] = useState([])
    const [departmentPatients, setDepartmentPatients] = useState([])
    const [rooms, setRooms] = useState([])
    const [patientDataToView, setPatientDataToView] = useState(false)
    const [patientToView, setPatientToView] = useState(undefined)
    const [userPatients, setUserPatients] = useState(undefined)
    const [userName, setUserName] = useState("")


  async function addApp(e){
    console.log("enter addApp")
      if(await addEvent(e, currentUser)){
        showAddedToast(e)
      }
      else{
        showCollisionToast(e)
      }
  }

  async function updateApp(e){
    console.log("enter updateApp")
    if(await editEvent(e, currentUser)) {
      showUpdatedToast(e)
    }
    else{
      showCollisionToast(e)
    }
  }

  async function deleteApp(e){
    console.log("enter deleteApp")
    if(user.permission < 2) {
      return;
    }
    removeEvent(e, currentUser)
    showDeletedToast(e)
  }
  
  function showToast(event, value, type) {
    notify(`${event} "${value}" task`, type, 10000);
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
      console.log(room.occupied)
      if(room.occupied){
        room.occupied.forEach((t) => {
          let {startDate: existsStart, endDate: existsEnd} = t;
          let {startDate: newStart, endDate: newEnd} = e.appointmentData;
          existsStart = new Date(existsStart.seconds * 1000)
          existsEnd = new Date(existsEnd.seconds * 1000)
          if(!(existsEnd <= newStart || existsStart >= newEnd)){
            room.disabled = true
          }
        })
      }
    })
    return availableRooms
  }
  
  async function getViews(e) { //gets the patients' data to view
    if(showSecondScheduler){
      const data = await getDataFromRef(e.value)
      setPatientDataToView(data)
    }
  }

  function onAppointmentFormOpeningTherapist(e){
    e.popup.option('showTitle', true);
    e.popup.option('title', e.appointmentData.text ? 
        e.appointmentData.text : 
        'Create a new appointment');
    const form = e.form;
    let privateApp = (e.appointmentData.type == "Private")
    let availableRooms = getAvailableRooms(e)
    let mainGroupItems = form.itemOption('mainGroup').items;
    console.log("rooms=", rooms)
    console.log("availableRooms=", availableRooms)
    console.log(mainGroupItems)
    const index = mainGroupItems.indexOf(mainGroupItems.find(field => field.dataField === "type" ))
    mainGroupItems.splice(index, 1) //remove old field
    if (!mainGroupItems.find(function(i) { return i.dataField === "type" })) {
      mainGroupItems.splice(index, 1, {
        colSpan: 2, 
        label: { text: "Type" },
        editorType: "dxSelectBox",
        dataField: "type",
        editorOptions: {
          items: types,
          displayExpr: 'text',
          valueExpr: 'text',
          onValueChanged(args) {
            privateApp = (args.value === "Private")
            if(!privateApp){
              mainGroupItems.find(function(i) { if(i.dataField === "exercises"){mainGroupItems.splice(
                mainGroupItems.indexOf(i), 1)} }) //removes exercises field if default type is selected
            }
            console.log(privateApp)
            if (!mainGroupItems.find(function(i) { return i.dataField === "exercises" }) && privateApp) { //create the exercises field if private type is selected
              mainGroupItems.push({
                  colSpan: 2, 
                  label: { text: "Exercises" }, 
                  editorType: "dxTagBox", 
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
    else if (mainGroupItems.find(function(i) { return i.dataField === "room" })) {  //updates the available rooms
      availableRooms = getAvailableRooms(e)
      console.log("updating rooms to", availableRooms)
      const index = mainGroupItems.indexOf(mainGroupItems.find(field => field.dataField === "room" ))
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
  }

  async function onAppointmentFormOpeningPatient(e){
    e.popup.option('showTitle', true);
    e.popup.option('title', e.appointmentData.text ? 
    e.appointmentData.text : 
    'Create a new private appointment');
    const form = e.form;
    let availableRooms = getAvailableRooms(e)
    let mainGroupItems = []
    mainGroupItems = form.itemOption('mainGroup').items;
    mainGroupItems.splice(2, 1) //remove the all day and repeat buttons
    console.log("rooms=", rooms)
    console.log("availableRooms=", availableRooms)
    if (!mainGroupItems.find(function(i) { return i.dataField === "type" })) {
      mainGroupItems.push({
        visible: false,
        dataField: "type",
        editorOptions: {
          value: "Private",
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
  else if (mainGroupItems.find(function(i) { return i.dataField === "room" })) {  //updates the available rooms
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
  if (!mainGroupItems.find(function(i) { return i.dataField === "patients" })) { //unvisible to user
    console.log(user)
    mainGroupItems.push({
        visible: false,
        dataField: "patients",
        editorOptions: {
          value: (user.type === "Patient")? 
          [{ 
            text: user.personalDetails["First Name"] + " " + user.personalDetails["Last Name"]
            + " " + user.personalDetails["Id"],
            id: user.personalDetails["Id"],
            ref: await getUserDocRef(user.uid).path, //refrence to the patients' document
          }] : [patientToView.value.path]
        }
      });
    form.itemOption('mainGroup', 'items', mainGroupItems);
  }
  if (!mainGroupItems.find(function(i) { return i.dataField === "exercises" })) { //create the exercises field if private type is selected
    mainGroupItems.push({
        colSpan: 2, 
        label: { text: "Exercises" }, 
        editorType: "dxTagBox", 
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
  if(user.permission < 2){ //if permission not high enough - editing disabled
    mainGroupItems.forEach(e => {e.editorOptions? e.editorOptions.readOnly = true :
       e.editorOptions = { readOnly: true}; e.items != undefined?  e.items.forEach(v => {
         v.editorOptions? v.editorOptions.readOnly = true: v.editorOptions = null}): e.items = null;})
    form.itemOption('mainGroup', 'items', mainGroupItems);
  }
  else {
    mainGroupItems.forEach(e => {e.editorOptions? e.editorOptions.readOnly = false :
      e.editorOptions = { readOnly: false} })
   form.itemOption('mainGroup', 'items', mainGroupItems);
  }
  console.log(mainGroupItems)
}
  

  function onAppointmentFormOpening(e) {
    if(isTherapist){
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
    if(user == undefined){
      await getUser()
    }
    if(userPatients == undefined && user.type != "Patient"){
      setUserPatients(await getUserPatients(userData))
    }
  })

  async function getUser(){
    const userPointerDocRef = doc(db, 'Users', currentUser.uid);
    const userPointerDocSnap = await getDoc(userPointerDocRef);
    const userDocRef = doc(db, userPointerDocSnap.data().Pointer.path)
    const userDocSnapShot = await getDoc(userDocRef)
    const userData = userDocSnapShot.data()
    if(userData.Type === "Therapist"){
      setIsTherapist(true)
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
  }

  useEffect(async () => { 
      try {
          const userPointerDocRef = doc(db, 'Users', currentUser.uid);
          const userPointerDocSnap = await getDoc(userPointerDocRef);
          const userDocRef = doc(db, userPointerDocSnap.data().Pointer.path)
          const userDocSnapShot = await getDoc(userDocRef)
          const userData = userDocSnapShot.data()
          if(user == undefined){
            await getUser()
          }
          setAppointments(await getDataFromUser(userData))
          setDepartmentTherapits(await getDepTherapists(userData.Department))
          setDepartmentPatients(await getDepPatients(userData.Department))
          setRooms(await getRooms())
          if(userPatients == undefined){
            setUserPatients(await getUserPatients(userData))
          }
          console.log(userPatients)
      } catch(err) {
          console.log(err)
      }
    }, [])

    async function clicked(){ //function that happens once screen is clicked
      console.log(user)
      if(user == undefined){
        await getUser()
      }
      const data = await getDataFromUser(user)
      console.log("render appointments")
      setAppointments(data)
      console.log("render", user)
    }
    
    if(isTherapist){
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Paper>
            <Form.Label className="btn btn-primary" style={{textAlign: "center", verticalAlign: "middle"}} disabled={true}>Welcome {userName}</Form.Label>
            <Popup
              className="mm-popup"
              btnClass="mm-popup__btn"
              closeBtn={true}
              closeHtml={null}
              defaultOk="Ok"
              defaultCancel="Cancel"
              wildClasses={false}
              escToClose={true} />
            <Scheduler
              dataSource={appointments}
              defaultCurrentView="day"
              defaultCurrentDate={new Date()}
              height={'100%'}
              firstDayOfWeek={0}
              startDayHour={7}
              endDayHour={19}
              showAllDayPanel={true}
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
              dataSource={types}
              allowMultiple={false}
              fieldExpr="type"
              valueExpr={"text"}
              label="Type"
              useColorAsDefault={true}
            />
            </Scheduler>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper>
            <Container>
              <Select placeholder="Choose Patient to View" 
                options={userPatients}
                menuPortalTarget={document.body} 
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                onChange={(e) => {showSecondScheduler=(e.value === "None")? false:true; getViews(e)}}/>
            </Container>
            <Container>
              <Scheduler
                visible={showSecondScheduler}
                dataSource={patientDataToView}
                defaultCurrentView="day"
                defaultCurrentDate={new Date()}
                height={'100%'}
                firstDayOfWeek={0}
                startDayHour={7}
                endDayHour={19}
                showAllDayPanel={true}
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
                  dataSource={types}
                  allowMultiple={false}
                  fieldExpr="type"
                  valueExpr={"text"}
                  label="Type"
                  useColorAsDefault={true}
                />
              </Scheduler>
            </Container>
            </Paper>
          </Grid>
        </Grid>
      );
    }
    else{
      console.log(userPatients)
      return(
        //use the clicked function only when attendant is logged in
        <div class="font-icon-wrapper" onClick={(userPatients == undefined)?null:clicked}>
        <Paper>
            <Container>
              {(userPatients != undefined)? (<Select placeholder="Choose Patient to View" // if user == attendant show select button if user == patient show name 
                  options={userPatients}
                  menuPortalTarget={document.body} 
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                  onChange={(e) => {showSecondScheduler=true; setPatientToView(e); getViews(e)}}/>) :
                (<Form.Label className="btn btn-primary" style={{textAlign: "center", verticalAlign: "middle"}} 
                disabled={true}>Welcome {userName}</Form.Label>)
                }
            </Container>
            <Scheduler
              visible={(userPatients == undefined) || showSecondScheduler}
              dataSource={(patientDataToView != false)? patientDataToView:appointments}
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
              dataSource={types}
              allowMultiple={false}
              fieldExpr="type"
              valueExpr={"text"}
              label="Type"
              useColorAsDefault={true}
            />
            </Scheduler>
          </Paper>
          </div>
      );
    }
}
 
export default Calendar;