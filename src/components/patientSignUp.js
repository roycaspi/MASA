import React, { useRef, useState } from "react"
import { Form, Button, Card, Alert, Container, DropdownButton, Dropdown} from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useHistory } from "react-router-dom"
import DatePicker from 'react-date-picker';

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
  const [typeValue, setTypeValue] = useState("");
  const [departmentValue, setDepartmentValue] = useState("Choose");
  const [dateValue, setDateValue] = useState(new Date());
  
  async function handleSelect(e){
    console.log(e)
    setDepartmentValue(e)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      setLoading(false);
      setError("Passwords do not match")
      return 
    }

    try {
      await signup(emailRef.current.value, passwordRef.current.value, firstNameRef.current.value, 
        lastNameRef.current.value, typeValue)
      history.push("/")
    } catch(e) {
      setLoading(false)
      setError(e)
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
            <Button onClick={() => setTypeValue('Therapist')}>Therapist</Button>
            <Button onClick={() => setTypeValue('Attendant')}>Therapist</Button>
            <Button onClick={() => setTypeValue('Patient')}>Patient</Button>
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
              <DatePicker onChange={setDateValue} value={dateValue} closeCalendar={true} 
              maxDate={new Date()} />
            </Form.Group>
            <Form.Group id="phoneNumber">
              <Form.Label>Id</Form.Label>
              <Form.Control type="text" name="phoneNumber" ref={phoneNumberRef} required />
            </Form.Group>
            <Form.Group id="department">
              <Form.Label>Department</Form.Label>
              <DropdownButton
                variant="outline-secondary" title={departmentValue} id="input-group-dropdown-1" 
                onClick={setDepartmentValue} onSelect={handleSelect}>
              <Dropdown.Item href="#">Tel-Hai</Dropdown.Item>
              </DropdownButton>
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
            <Button disabled={loading} className="w-100" type="submit">
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
