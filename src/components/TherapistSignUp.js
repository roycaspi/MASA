import React, { useRef, useState, useEffect } from "react"
import { Form, Button, Card, Alert, Container, DropdownButton, Dropdown, ButtonToolbar, ButtonGroup} from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useHistory } from "react-router-dom"
import DatePicker from 'react-date-picker';
import BaseSelect from 'react-select'
import RequiredSelect from "./RequiredSelect";
import makeAnimated from 'react-select/animated';
import { PersonalDetails } from "../classes/User";
import Therapist from "../classes/Therapist";
import {collection, getDocs, query, where} from 'firebase/firestore'
import {db} from '../firebase'
import { departments } from '../data/departments'
import { specialities } from "../data/speciality";

const therapistsCollection = collection(db, 'Therapists');

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
  const [specialityList, setSpecialityList] = useState([])

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
        const newUser = new Therapist(new PersonalDetails(firstNameRef.current.value, lastNameRef.current.value,
            idRef.current.value, emailRef.current.value, phoneNumberRef.current.value, dobValue), departmentValue, 
            specialityList)
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
              {/* <DropdownButton
                options={departments} variant="outline-secondary" title={departmentValue} id="input-group-dropdown-1" 
                value={departments} onSelect={handleSelect} required>
               <Dropdown.Item eventKey={"Tel-Hai"}>Tel-Hai</Dropdown.Item> 
              </DropdownButton> */}
              <RequiredSelect placeholder="Select..." SelectComponent={BaseSelect} 
              onChange={(e) => setDepartmentValue(e.value)} options={departments} required/>
            </Form.Group>
            <Form.Group id="therapists">
              <Form.Label>Speciality</Form.Label>
              <RequiredSelect placeholder="Select..." components={makeAnimated()} isMulti 
              SelectComponent={BaseSelect} onChange={(e) => {       
                  let tempList = e.map((s) => s.value); setSpecialityList(tempList)} } 
              options={specialities} required/>
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
