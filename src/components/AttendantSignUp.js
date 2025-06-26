import React, { useRef, useState } from "react"
import { Form, Button, Card, Alert, Container, ButtonToolbar, ButtonGroup} from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useHistory } from "react-router-dom"
import BaseSelect from 'react-select'
import makeAnimated from 'react-select/animated';
import Attendant from "../classes/Attendant";
import {collection, getDocs, query, where} from 'firebase/firestore'
import {db} from '../firebase'
import { departments } from '../data/departments'
import RequiredSelect from "./RequiredSelect";

const patientsCollection = collection(db, 'Patients');

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
  const [permissionValue, setPermissionValue] = useState("0");
  const [patientsList, setPatientsList] = useState([])
  

  async function handleDepartment(department){
    setDepartmentValue(department)
    let pList = [];
    const patientsQ = query(patientsCollection, where('Department', '==', department));
    const patientsQuerySnapshot = await getDocs(patientsQ);
    patientsQuerySnapshot.forEach((patientDoc) => {
      pList.push({
        value: patientDoc.ref, //refrence to the therapists' document
        label: patientDoc.data().PersonalDetails["First Name"] + " " + patientDoc.data().PersonalDetails["Last Name"]
        + " " + patientDoc.data().PersonalDetails["Id"]
      })
    })
    setPatientsList(pList)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if(idRef.current.value.length !== 9){
        setLoading(false)
        setError("Invalid Id")
        return window.scrollTo(0, 0)
      }
      if(phoneNumberRef.current.value.length !== 10){
        setLoading(false)
        setError("Invalid Phone number")
        return window.scrollTo(0, 0)
      }
      if (passwordRef.current.value !== passwordConfirmRef.current.value) {
        setLoading(false);
        setError("Passwords do not match")
        return window.scrollTo(0, 0)
      }

    try {
      const newUser = Attendant.createFromForm({
        firstName: firstNameRef.current.value,
        lastName: lastNameRef.current.value,
        id: idRef.current.value,
        email: emailRef.current.value,
        phoneNumber: phoneNumberRef.current.value,
        department: departmentValue,
        permission: permissionValue,
        patients: patientsList,
        data: [],
        uid: null
      });
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
            <ButtonGroup className="d-flex align-items-center justify-content-center" style={{width: "100%"}}>
              <Link to="/patientSignup" className="btn btn-primary" style={{align: "center"}}>Patient</Link>
              <Link to="/therapistSignup" className="btn btn-primary" style={{align: "center"}}>Therapist</Link>
              <Link to="/attendantSignup" className="btn btn-primary" style={{align: "center"}}>Attendant</Link>
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
            <Form.Group id="phoneNumber">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control type="text" name="phoneNumber" ref={phoneNumberRef} required />
            </Form.Group>
            <Form.Group id="department">
              <Form.Label>Department</Form.Label>
              <RequiredSelect placeholder="Select..." SelectComponent={BaseSelect} 
              onChange={(e) => handleDepartment(e.value)} options={departments} required/>
            </Form.Group>
            <Form.Group id="patients">
              <Form.Label>Patient</Form.Label>
              <RequiredSelect components={makeAnimated()} isMulti SelectComponent={BaseSelect} 
              onChange={(e) => setPatientsList(e)} options={patientsList} required/>
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
                <Button value={"0"}>0</Button><Button value={"1"}>1</Button> <Button value={"2"}>2</Button> 
                <Button value={"3"}>3</Button> <Button value={"4"}>4</Button>
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