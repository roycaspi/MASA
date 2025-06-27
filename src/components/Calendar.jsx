import React, { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import { Container, Form } from "react-bootstrap";
import { db } from '../firebase';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { useAuth } from "../contexts/AuthContext";
import { getDataFromUser, addEvent, editEvent, removeEvent, getUserPatients, getDataFromRef } from "../contexts/DB";
import Therapist from "../classes/Therapist";
import Patient from "../classes/Patient";
import Attendant from "../classes/Attendant";
import { PersonalDetails } from '../classes/User';
import Scheduler, { Editing, Resource } from 'devextreme-react/scheduler';
import notify from 'devextreme/ui/notify';
import Grid from '@mui/material/Grid';
import Select from 'react-select';

function Calendar() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isTherapist, setIsTherapist] = useState(false);
  const [user, setUser] = useState(null);
  const [patientDataToView, setPatientDataToView] = useState([]);
  const [userPatients, setUserPatients] = useState(undefined);
  const [userName, setUserName] = useState("");
  const [showSecondScheduler, setShowSecondScheduler] = useState(false);
  const [schedulerKey, setSchedulerKey] = useState(0);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Permission threshold for adding private appointments
  const PRIVATE_APPOINTMENT_PERMISSION_THRESHOLD = 2;

  // Define all types
  const allTypes = [
    { id: 1, text: "Default" },
    { id: 2, text: "Private", color: '#008000' }
  ];

  // Determine which types to show in the UI
  let filteredTypes = allTypes;
  const isPatientOrAttendant = user?.Type === "Patient" || user?.Type === "Attendant";
  const userPermission = parseInt(user?.permission || user?.Permission || "0", 10);
  if (isPatientOrAttendant) {
    if (userPermission >= PRIVATE_APPOINTMENT_PERMISSION_THRESHOLD) {
      filteredTypes = allTypes.filter(t => t.text === "Private");
    } else {
      filteredTypes = []; // No types available if not permitted
    }
  }

  const addApp = async (e) => {
    console.log(user)
    if (!user) {
      notify("User data is still loading. Please wait.", 'error', 2000);
      return;
    }
    console.log("🚀 ADD APP FUNCTION CALLED 🚀");
    
    try {
      console.log("Adding appointment:", e);
      console.log("Current user state:", user);
      console.log("Selected patient:", selectedPatient);
      console.log("User patients:", userPatients);
      
      // Check permission for patients and attendants
      const isPatientOrAttendant = user?.Type === "Patient" || user?.Type === "Attendant";
      const userPermission = parseInt(user?.permission || user?.Permission || "0", 10);
      
      if (isPatientOrAttendant) {
        if (userPermission < PRIVATE_APPOINTMENT_PERMISSION_THRESHOLD) {
          notify("You do not have permission to add appointments.", 'error', 2000);
          return;
        }
        // Force appointment Type to "Private" for patients and attendants
        e.appointmentData.type = "Private";
        e.appointmentData.typeId = 2; // Set the typeId for Private
      }
      
      // Get user document reference
      const userPointerDocRef = doc(db, 'Users', currentUser.uid);
      const userPointerDocSnap = await getDoc(userPointerDocRef);
      const userPointerData = userPointerDocSnap.data();
      console.log("userPointerData:", userPointerData);

      if (!userPointerData || !userPointerData.Pointer) {
        console.error("User pointer document is missing the 'Pointer' field!", userPointerData);
        notify("Your account is not set up correctly. Please contact support.", 'error', 4000);
        setIsLoadingAppointments(false);
        return;
      }

      const userDocRef = doc(db, userPointerData.Pointer.path);

      // Initialize the appointment data with required fields
      e.appointmentData = {
        ...e.appointmentData,
        type: e.appointmentData.type || 'Default',
        typeId: e.appointmentData.typeId || 1,
        allDay: e.appointmentData.allDay || false,
        recurrenceRule: e.appointmentData.recurrenceRule || '',
        room: e.appointmentData.room || [],
        patients: [],  // Initialize empty array
        therapists: [] // Initialize empty array
      };

      // Handle patients and therapists based on user Type
      if (user?.Type === 'Therapist') {
        console.log("User is a therapist, adding as therapist");
        // Add current user as therapist (store as path string)
        e.appointmentData.therapists = [userDocRef.path];
        // If a patient is selected, add them (store as path string)
        if (selectedPatient) {
          console.log("Adding selected patient:", selectedPatient);
          e.appointmentData.patients = [selectedPatient.path];
        } else {
          console.log("No patient selected, checking for default patient");
          if (userPatients && userPatients.length > 1) {
            const firstPatient = userPatients[1];
            console.log("Using first patient as default:", firstPatient);
            const patientRef = doc(db, firstPatient.value.path);
            e.appointmentData.patients = [patientRef.path];
          } else {
            console.log("No patients available for therapist");
            notify("Please select a patient for this appointment.", 'warning', 2000);
            return;
          }
        }
      } else if (user?.Type === 'Patient') {
        console.log("User is a patient, adding as patient");
        e.appointmentData.patients = [userDocRef.path];
        console.log(e.appointmentData)
        if (e.appointmentData.type === "Private") {
          // For private appointments, do not require or assign a therapist
          e.appointmentData.therapists = [];
        } else {
          // For non-private appointments, require a therapist
          if (user.Therapists && user.Therapists.length > 0) {
            const therapistRef = doc(db, user.Therapists[0].value.path);
            e.appointmentData.therapists = [therapistRef.path];
          } else {
            console.log("No therapist assigned to patient");
            notify("No therapist assigned. Please contact administrator.", 'warning', 2000);
            return;
          }
        }
      } else if (user?.Type === 'Attendant') {
        console.log("User is an attendant, adding as attendant");
        // Attendants typically don't create appointments for themselves
        // They create appointments for their patients
        if (user.Patients && user.Patients.length > 0) {
          const patientRef = doc(db, user.Patients[0].value.path);
          e.appointmentData.patients = [patientRef.path];
          if (e.appointmentData.type === "Private") {
            // For private appointments, do not require or assign a therapist
            e.appointmentData.therapists = [];
          } else {
            // For non-private appointments, require a therapist
            if (user.Patients[0].value.data && user.Patients[0].value.data.Therapists && user.Patients[0].value.data.Therapists.length > 0) {
              const therapistRef = doc(db, user.Patients[0].value.data.Therapists[0].value.path);
              e.appointmentData.therapists = [therapistRef.path];
            } else {
              notify("No therapist available for this patient.", 'warning', 2000);
              return;
            }
          }
        } else {
          console.log("No patients assigned to attendant");
          notify("No patients assigned. Please contact administrator.", 'warning', 2000);
          return;
        }
      } else {
        console.log("Unknown user Type:", user?.Type);
        notify("Unknown user Type. Cannot create appointment.", 'error', 2000);
        return;
      }

      // Set the required fields for addEvent function
      e.appointmentData.patientId = e.appointmentData.patients[0];
      e.appointmentData.therapistId = e.appointmentData.therapists[0];

      console.log("Modified appointment data:", e.appointmentData);
      
      const hasPatients = !!e.appointmentData.patientId;
      const hasTherapists = e.appointmentData.type === "Private" ? true : !!e.appointmentData.therapistId;

      if (!hasPatients || !hasTherapists) {
        notify("Appointment must have a patient and therapist", 'error', 2000);
        return;
      }

      if (await addEvent(e, currentUser)) {
        notify(`Added "${e.appointmentData.text}"`, 'success', 2000);
      } else {
        notify(`Event Collision: "${e.appointmentData.text}"`, 'warning', 2000);
        // Remove the event from the UI immediately
        setAppointments(prev =>
          prev.filter(
            appt =>
              !(
                appt.text === e.appointmentData.text &&
                appt.startDate.getTime() === e.appointmentData.startDate.getTime() &&
                appt.endDate.getTime() === e.appointmentData.endDate.getTime()
              )
          )
        );
      }
    } catch (error) {
      console.error("Error adding appointment:", error);
      notify("Failed to add appointment", 'error', 2000);
    }
  };

  const editApp = async (e) => {
    if (await editEvent(e, currentUser)) {
      notify(`Updated "${e.appointmentData.text}"`, 'info', 2000);
    } else {
      notify(`Event Collision: "${e.appointmentData.text}"`, 'warning', 2000);
    }
  };

  const removeApp = async (e) => {
    await removeEvent(e, currentUser);
    notify(`Deleted "${e.appointmentData.text}"`, 'warning', 2000);
  };

  const onAppointmentFormOpening = (e) => {
    e.popup.option('showTitle', true);
    e.popup.option('title', e.appointmentData.text || 'Create Appointment');

    // Check if user is patient or attendant with low permission
    const isPatientOrAttendant = user?.Type === "Patient" || user?.Type === "Attendant";
    const userPermission = parseInt(user?.permission || user?.Permission || "0", 10);
    
    if (isPatientOrAttendant) {
      if (userPermission < PRIVATE_APPOINTMENT_PERMISSION_THRESHOLD) {
        // Close the form immediately if no permission
        setTimeout(() => {
          e.popup.hide();
          notify("You do not have permission to add appointments.", 'error', 2000);
        }, 100);
        return;
      }
      
      // Force appointment Type to "Private" and disable the field
      const form = e.form;
      if (form) {
        // Set the Type to Private
        form.updateData("type", "Private");
        form.updateData("typeId", 2);
        
        // Disable the Type field
        const typeItem = form.getEditor("type");
        if (typeItem) {
          typeItem.option("disabled", true);
        }
      }
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};
    
    const setupRealTimeListener = async () => {
      try {
        setIsLoadingAppointments(true);
        
        // Get user document reference
        const userPointerDocRef = doc(db, 'Users', currentUser.uid);
        const userPointerDocSnap = await getDoc(userPointerDocRef);
        const userPointerData = userPointerDocSnap.data();
        console.log("userPointerData:", userPointerData);

        if (!userPointerData || !userPointerData.Pointer) {
          console.error("User pointer document is missing the 'Pointer' field!", userPointerData);
          notify("Your account is not set up correctly. Please contact support.", 'error', 4000);
          setIsLoadingAppointments(false);
          return;
        }

        const userDocRef = doc(db, userPointerData.Pointer.path);
        
        // Set up real-time listener on the user document
        unsubscribe = onSnapshot(userDocRef, async (userDocSnapShot) => {
          const userData = userDocSnapShot.data();
          console.log("onSnapshot userData:", userData);
          if (userData) {
            // Initialize user if not already done
            if (!user) {
              await initializeUser(userData);
            }
            
            // Update appointments
            const updatedAppointments = await getDataFromUser(userData);
            setAppointments(updatedAppointments);
            
            // Update user name
            setUserName(`${userData.PersonalDetails["First Name"]} ${userData.PersonalDetails["Last Name"]} ${userData.PersonalDetails["Id"]}`);
            
            // Update patients list for therapists
            if (!userPatients && userData.Type !== "Patient") {
              const patients = await getUserPatients(userData);
              setUserPatients(patients);
            }
          } else {
            console.log("No userData found in snapshot!");
          }
          setIsLoadingAppointments(false);
        });
      } catch (error) {
        console.error("Error setting up real-time listener:", error);
        setIsLoadingAppointments(false);
      }
    };

    if (currentUser?.uid) {
      setupRealTimeListener();
    }

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  const initializeUser = async (userData) => {
    let newUser;
    const pd = userData.PersonalDetails;
    switch (userData.Type) {
      case "Therapist":
        setIsTherapist(true);
        newUser = new Therapist(
          new PersonalDetails(pd["First Name"], pd["Last Name"], pd["Id"], pd["Email"], pd["Phone Number"], pd["Date of Birth"]),
          userData.Department,
          userData.Speciality,
          undefined,
          userData.Patients,
          userData.uid
        );
        break;
      case "Patient":
        newUser = new Patient(
          new PersonalDetails(pd["First Name"], pd["Last Name"], pd["Id"], pd["Email"], pd["Phone Number"], pd["Date of Birth"]),
          userData.Department,
          userData.Therapists,
          userData.Permission,
          userData.Attendants,
          undefined,
          userData.uid
        );
        break;
      case "Attendant":
        newUser = new Attendant(
          new PersonalDetails(pd["First Name"], pd["Last Name"], undefined, pd["Email"], pd["Phone Number"], undefined),
          userData.Department,
          userData.Permission,
          userData.Patients,
          undefined,
          userData.uid
        );
        break;
      default:
        break;
    }
    // Set the Type property on the user object for consistency
    if (newUser) newUser.Type = userData.Type;
    setUser(newUser);
  };

  const handlePatientChange = async (e) => {
    setShowSecondScheduler(e.value !== "None" && isTherapist);
    if (e.value !== "None") {
      try {
        console.log("Selected patient value:", e.value);
        const patientRef = doc(db, e.value.path);
        console.log("Created patient reference:", patientRef.path);
        setSelectedPatient(patientRef);
        const data = await getDataFromRef(e.value);
        setPatientDataToView(data);
      } catch (error) {
        console.error("Error handling patient change:", error);
        notify("Failed to load patient data", 'error', 2000);
      }
    } else {
      setSelectedPatient(null);
      setPatientDataToView([]);
    }
    setSchedulerKey((prevKey) => prevKey + 1);
  };

  if (isLoadingAppointments || !user) {
    return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:'1.2em',color:'#888'}}>Loading Calendar...</div>;
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 32px)' }}>
      {/* Main calendar area only, no chat sidebar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px 0 12px', background: '#fff', borderBottom: '1px solid #e0e0e0', minHeight: 40 }}>
          <h1 style={{ margin: 0, fontSize: '1.5em', lineHeight: 1.1 }}>{userName}</h1>
          {isTherapist && (
            <Form.Group id="therapistView" style={{ marginTop: 8, maxWidth: 280 }}>
              <Form.Label style={{ fontSize: '0.95em', marginBottom: 2 }}>View Patient's Calendar</Form.Label>
              <Select
                onChange={handlePatientChange}
                options={userPatients}
                placeholder="Select Patient"
                styles={{ control: base => ({ ...base, minHeight: 28, fontSize: '0.95em' }) }}
              />
            </Form.Group>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0, background: '#f4f8fb', padding: 8 }}>
          <Scheduler
            dataSource={appointments}
            defaultCurrentView="day"
            currentDate={new Date()}
            height="100%"
            startDayHour={7}
            endDayHour={20}
            onAppointmentAdded={addApp}
            onAppointmentUpdated={editApp}
            onAppointmentDeleted={removeApp}
            onAppointmentFormOpening={onAppointmentFormOpening}
          >
            <Editing allowAdding={true} allowDeleting={true} allowUpdating={true} />
            <Resource
              dataSource={filteredTypes}
              fieldExpr="typeId"
              label="type"
              useColorAsDefault={true}
            />
          </Scheduler>
          {showSecondScheduler && (
            <Scheduler
              key={schedulerKey}
              dataSource={patientDataToView}
              defaultCurrentView="day"
              currentDate={new Date()}
              height="100%"
              startDayHour={7}
              endDayHour={20}
              editing={false}
            >
              <Editing allowAdding={false} allowDeleting={false} allowUpdating={false} />
            </Scheduler>
          )}
        </div>
      </div>
    </div>
  );
}

export default Calendar;
