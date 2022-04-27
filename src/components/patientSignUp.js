import React, { useRef, useState, useEffect } from "react"
import { Form, Button, Card, Alert, Container, DropdownButton, Dropdown, ButtonToolbar, ButtonGroup} from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useHistory } from "react-router-dom"
import DatePicker from 'react-date-picker';
import BaseSelect from 'react-select'
import makeAnimated from 'react-select/animated';
import Patient from "../classes/Patient";
import {PersonalDetails} from "../classes/User";
import {collection, getDocs, query, where} from 'firebase/firestore'
import {db} from '../firebase'
import { departments } from '../data/departments'
import RequiredSelect from "./RequiredSelect";

const therapistsCollection = collection(db, 'Therapists');

const Select = props => (
  <RequiredSelect
    {...props}
    SelectComponent={BaseSelect}
  />
);

export default function Signup() {
  const idRef = useRef()
  const phoneNumberRef = useRef()
  const firstNameRef = useRef()
  const lastNameRef = useRef()
  const emailRef = useRef()
  const passwordRef = useRef()
  const passwordConfirmRef = useRef()
  const { signup } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const history = useHistory()
  const [departmentValue, setDepartmentValue] = useState("");
  const [dobValue, setDobValue] = useState(null);
  const [permissionValue, setPermissionValue] = useState("0");
  const [physiotherapistsList, setPhysiotherapistsList] = useState([])
  const [occupationalTherapistsList, setOccupationalTherapistsList] = useState([])
  const [patientTherapistsList, setPatientTherapistsList] = useState([])
  

  //todo: check if function works
  async function handleDepartment(department){
    setDepartmentValue(department)
    let therapistsList = [];
    const physioQ = query(therapistsCollection, where('Speciality', 'array-contains-any', ['Physiotherapy']), 
    where('Department', '==', department));
    const physioQuerySnapshot = await getDocs(physioQ);
    physioQuerySnapshot.forEach((therapistDoc) => {
      therapistsList.push({
        value: therapistDoc.ref, //refrence to the therapists' document
        label: therapistDoc.data().PersonalDetails["First Name"] + " " + therapistDoc.data().PersonalDetails["Last Name"]
      })
    })
    setPhysiotherapistsList(therapistsList)
    const occTherapyQ = query(therapistsCollection, where('Speciality', 'array-contains-any', ['Occupational Therapy']),
    where('Department', '==', department));
    const occQuerySnapshot = await getDocs(occTherapyQ);
    occQuerySnapshot.forEach((therapistDoc) => {
      if(!therapistDoc.ref in therapistsList){ //makes sure a therapist apears only once in the list
        therapistsList.push({
          value: therapistDoc.ref, //refrence to the therapists' document
          label: therapistDoc.data().PersonalDetails["First Name"] + " " + therapistDoc.data().PersonalDetails["Last Name"]
        })
      }
    })
    console.log(therapistsList)
    setOccupationalTherapistsList(therapistsList)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if(idRef.current.value.length != 9){
      setLoading(false)
      return setError("Invalid Id")
    }
    if(phoneNumberRef.current.value.length != 10){
      setLoading(false)
      return setError("Invalid Phone number")
    }
    if(departmentValue === ""){
      setLoading(false)
      return setError("Department not chosen")
    }
    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      setLoading(false);
      return setError("Passwords do not match") 
    }

    try {
      const newUser = new Patient(new PersonalDetails(firstNameRef.current.value, lastNameRef.current.value,
        idRef.current.value, emailRef.current.value, phoneNumberRef.current.value, dobValue), departmentValue, 
        patientTherapistsList, permissionValue)
      await signup(newUser, passwordRef.current.value)
      history.push("/")
    } catch(e) {
      setLoading(false)
      return setError(e)
    }
  }
  return (
    <>
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="w-100" style={{ maxWidth: "50%", maxHeight: "50%" }}>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Sign Up</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <ButtonGroup style={{width: "100%"}}>
              <Link to="/patientSignup" className="btn btn-primary" style={{align: "center"}}>Patient</Link>
              <Link to="/therapistSignup" className="btn btn-primary" style={{align: "center"}}>Therapist</Link>
              <Link to="/therapistSignup" className="btn btn-primary" style={{align: "center"}}>Attendant</Link>
            </ButtonGroup>
            <Form.Group id="id">
              <Form.Label>Id</Form.Label>
              <Form.Control type="text" name="id" ref={idRef} required />
            </Form.Group>
            <Form.Group id="firstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control type="text" name="firstName" ref={firstNameRef} required />
            </Form.Group>
            <Form.Group id="lastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control style={{marginBottom : 10}} type="text" ref={lastNameRef} required />
            </Form.Group>
            <Form.Group id="dateofbirth" >
              <Form.Label style={{marginRight : 50}}>Date of birth</Form.Label>
            </Form.Group>
            <DatePicker onChange={(date) => setDobValue(date)} value={dobValue} closeCalendar={true} 
              maxDate={new Date()} required />
            <Form.Group id="phoneNumber">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control type="text" name="phoneNumber" ref={phoneNumberRef} required />
            </Form.Group>
            <Form.Group id="department">
              <Form.Label>Department</Form.Label>
              <RequiredSelect placeholder="Select..." SelectComponent={BaseSelect} 
              onChange={(e) => handleDepartment(e.value)} options={departments} required/>
            </Form.Group>
            <Form.Group id="therapists">
              <Form.Label>Physiotherapist</Form.Label>
              <RequiredSelect components={makeAnimated()} isMulti SelectComponent={BaseSelect} 
              onChange={(e) => setPatientTherapistsList(e)} options={physiotherapistsList}/>
              <Form.Label>Occupational Therapist</Form.Label>
              <Select components={makeAnimated()} isMulti options={occupationalTherapistsList}></Select>
            </Form.Group>
            <Form.Group id="email">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" ref={emailRef} required />
            </Form.Group>
            <Form.Group id="password">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" ref={passwordRef} required />
            </Form.Group>
            <Form.Group id="password-confirm">
              <Form.Label>Password Confirmation</Form.Label>
              <Form.Control type="password" ref={passwordConfirmRef} required />
            </Form.Group>
            <Form.Group id="permission">
              <Form.Label>Permission Level</Form.Label>
              <ButtonToolbar aria-label="Toolbar with button groups">
                <ButtonGroup className="me-2" aria-label="First group" onClick={(v) => setPermissionValue(v.target.value)}>
                  <Button value={1}>1</Button> <Button value={2}>2</Button> <Button value={3}>3</Button> 
                  <Button value={4}>4</Button>
                </ButtonGroup>
              </ButtonToolbar>
            </Form.Group>
            <Button disabled={loading} style={{marginTop:10}}className="w-100" type="submit">
              Sign Up
            </Button>
          </Form>
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2">
        Already have an account? <Link to="/login">Log In</Link>
      </div>
      </div>
    </Container>
    </>
  )
}
