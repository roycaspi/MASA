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


const eventsCollection = collection(db, 'Calendars');
let coli = false

const TextEditor = (props) => {
  try{
  if (props.type === 'multilineTextEditor') {
    return null;
  } return <AppointmentForm.TextEditor {...props} />;
}
catch(e){
  console.log(e)
}
};

const BasicLayout = ({ onFieldChange, appointmentData, ...restProps }) => { //participant field in event form
  try{
  const onParticipantsChange = (nextValue) => {
    onFieldChange({ participants: nextValue });
  };
  return (
    <AppointmentForm.BasicLayout
      appointmentData={appointmentData}
      onFieldChange={onFieldChange}
      {...restProps}
    >
      <AppointmentForm.Label
        text="Participants"
        type="participants"
      />
      <AppointmentForm.TextEditor
        value={appointmentData.participants}
        onValueChange={onParticipantsChange}
        placeholder="Participants"
      />
    </AppointmentForm.BasicLayout>
  );
  }
  catch(e){
    console.log(e)
  }
};


function Calendar() {
    const { currentUser } = useAuth()
    const [error, setError] = useState("")
    const [appointments, setAppointments] = useState([]);
    const [isTherapist, setIsTherapist] = useState(false)
    
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

    useEffect(async () => { 
        try {
            const q = query(eventsCollection, where('user', '==', currentUser.email)); //show only the events of the current user 
            const querySnapshot = await getDocs(q);
            const calendarRef = doc(db, 'Calendars', querySnapshot.docs[0].id)
            const calenderSnapShot = await getDoc(calendarRef);
            const events = calenderSnapShot.data().data.map(e => ({
              title: e.title,
              id: e.id,
              startDate: e.startDate.toDate(),
              endDate: e.endDate.toDate(),
              participants: e.participants
            }))
            console.log(events)
            setAppointments(events)
        } catch(err) {
            console.log(err)
        }
    }, [])

    useEffect(async () => {
      const userRef = doc(db, 'Users', currentUser.email);
      const userSnap = await getDoc(userRef);
      if(userSnap.data().type === "T"){
        setIsTherapist(true)
      }
    }, [])
    

    const commitChanges = async({ added, changed, deleted }) => { //adds, deletes and changes events
            if (added) {    //add new event todo:finish the collision
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
                    setAppointments((prevState) => {
                      const uniqueState = new Set([...prevState, toAdd ])
                      const newState = [...uniqueState]
                      return newState;
                    })
                  })
                }
                else{
                  setError("Times Error")
                }
              }
              else{
                setError("Event Collision")
              }
          }
          if (changed) {
            try{
              let changedDetails = changed[Object.keys(changed)[0]]
              const userCalq = query(eventsCollection, where('user', "==", currentUser.email))
              const userCalSnap = await getDocs(userCalq);
              let participantEvents = userCalSnap.docs[0].data().data;
              let originalEventToChange = participantEvents.filter(appointment => appointment.id == Object.keys(changed)[0])
              console.log(originalEventToChange)
              let toChange = {
                title: changedDetails.title? changedDetails.title: originalEventToChange[0].title,
                id: originalEventToChange[0].id,
                participants: changedDetails.participants? Array.from(new Set(changedDetails.participants.split(','))) : originalEventToChange[0].participants,
                startDate: changedDetails.startDate? changedDetails.startDate: originalEventToChange[0].startDate.toDate(),
                endDate: changedDetails.endDate? changedDetails.endDate: originalEventToChange[0].endDate.toDate()
              }
              //check for collision
              console.log(coli)
              coli = await isCollision(toChange)
              console.log(coli)
              if(coli){ 
                setError("Event Collision")
              }
              else if(toChange.startDate > toChange.endDate) {
                setError("Times Error")
              }
              else{
                console.log(toChange)
                const eventParticipants = originalEventToChange[0].participants
                console.log(changed)
                toChange.participants.forEach(async p =>{//update event for all current participants
                  const partiCalQ = query(eventsCollection, where('user', "==", p))
                  const partiCalSnap = await getDocs(partiCalQ);
                  const partiCalendarRef = doc(db, 'Calendars', partiCalSnap.docs[0].id)
                  let participantEvents = partiCalSnap.docs[0].data().data;
                  participantEvents = participantEvents.map(appointment => (
                  changed[appointment.id] ? { ...appointment, ...changed[appointment.id] } : appointment));
                  await updateDoc(partiCalendarRef, {
                  data: participantEvents.map(appointment => (
                    (appointment.id == toChange.id)? toChange : appointment))
                  });
                })
                if(changedDetails.participants){ //the participants field changed
                  changed[Object.keys(changed)[0]].participants = Array.from(new Set(changedDetails.participants.split(',')))
                  changedDetails = changed[Object.keys(changed)[0]]
                  eventParticipants.forEach(async p => { //delete from participants that got deleted
                    console.log("first")
                    if(!changedDetails.participants.includes(p)){
                      const partiCalQ = query(eventsCollection, where('user', "==", p))
                      const partiCalSnap = await getDocs(partiCalQ);
                      const partiCalendarRef = doc(db, 'Calendars', partiCalSnap.docs[0].id)
                      updateDoc(partiCalendarRef, {
                      data: partiCalSnap.docs[0].data().data.filter(appointment => appointment.id != Object.keys(changed)[0]) });
                    }
                  })
                }
              }
              if(!coli){
                if(toChange.participants.includes(currentUser.email)){
                  setAppointments((prevState) => {
                  console.log(participantEvents)
                  const newState = prevState.map(appointment => (
                    changed[appointment.id] ? { ...appointment, ...changed[appointment.id] } : appointment));
                  return newState;
                  })
                }  
                else{
                  setAppointments((prevState) => {
                    const newState = prevState.filter(appointment => appointment.id != originalEventToChange[0].id)
                    return newState;
                  })
                }
              }
            }
            catch(e){
              console.log(e)
            }
          }
          if (deleted !== undefined) { 
              const q = query(eventsCollection, where('user', "==", currentUser.email))
              const querySnapshot = await getDocs(q);
              const currentUserPart = querySnapshot.docs[0].data().data[0]
              currentUserPart.participants.map( async p => { //delete from all paricipants
                try {
                  const q2 = query(eventsCollection, where('user', "==", p))
                  const querySnapshot2 = await getDocs(q2);
                  const partCalendar = doc(db, 'Calendars', querySnapshot2.docs[0].id)
                  updateDoc(partCalendar, {
                  data: querySnapshot2.docs[0].data().data.filter(appointment => appointment.id !== deleted)});
              }
              catch(e){
                console.log(e)
              }
              })
              setAppointments((prevState) => {
                const newState = prevState.filter(appointment => appointment.id !== deleted)
                return newState;
              })
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
            basicLayoutComponent={BasicLayout}
            textEditorComponent={TextEditor}
            readOnly={!isTherapist}
          />
          <Resources
            data={[{
              fieldName: 'roomId',
              title: 'Room',
              // instances: ['Room 12', 'Room 2'], //todo
            },
            {
              fieldName: 'participants',
              title: 'Participants',
              //instances: owners, get from DB
              allowMultiple: true,
            },
            {
              fieldName: 'type',
              title: 'Type',
              instances: [{
                name: 'Physiotherapy',
                id: 1,
               },{
                 name: 'Occupational Therapy',
                 id: 2,
                },{
                  name: 'Psychologist',
                  id: 3
                }],
            }
          ]}
            mainResourceName="type"
          />
        </Scheduler>
      </Paper>
    );
}
 
export default Calendar;