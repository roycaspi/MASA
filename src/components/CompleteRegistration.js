import React, { useRef, useState } from "react"
import { Form, Button, Card, Alert, Container } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { useHistory, useLocation } from "react-router-dom"

export default function CompleteRegistration() {
  const firstNameRef = useRef()
  const lastNameRef = useRef()
  const idRef = useRef()
  const phoneRef = useRef()
  const dobRef = useRef()
  const { signup } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [typeValue, setTypeValue] = useState("")
  const history = useHistory()
  const location = useLocation()
  const googleUser = location.state?.googleUser

  // Pre-fill form with Google user data
  React.useEffect(() => {
    if (googleUser) {
      if (firstNameRef.current) firstNameRef.current.value = googleUser.displayName?.split(' ')[0] || ''
      if (lastNameRef.current) lastNameRef.current.value = googleUser.displayName?.split(' ').slice(1).join(' ') || ''
    }
  }, [googleUser])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!typeValue) {
      setLoading(false)
      setError("Please select a user type")
      return
    }

    try {
      // Create user object with Google data
      const userData = {
        Email: googleUser.email,
        uid: googleUser.uid,
        Type: typeValue,
        PersonalDetails: {
          "First Name": firstNameRef.current.value,
          "Last Name": lastNameRef.current.value,
          "Email": googleUser.email,
          "Id": idRef.current.value,
          "Phone Number": phoneRef.current.value,
          "Date of Birth": dobRef.current.value
        },
        Data: [],
        Department: "",
        Patients: [],
        Therapists: [],
        Attendants: [],
        Permission: [],
        Speciality: ""
      }

      await signup(userData, null) // Password is null for Google users
      history.push("/")
    } catch (e) {
      setLoading(false)
      setError(e.message || "Failed to complete registration")
    }
  }

  if (!googleUser) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
        <Alert variant="danger">No Google user data found. Please sign in with Google first.</Alert>
      </Container>
    )
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="w-100" style={{ maxWidth: "50%", maxHeight: "50%" }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Complete Registration</h2>
            <p className="text-center text-muted mb-4">
              Welcome! Please complete your registration to continue.
            </p>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">User Type</label>
                <div className="d-flex gap-2">
                  <Button 
                    type="button"
                    variant={typeValue === 'Therapist' ? 'primary' : 'outline-primary'}
                    onClick={() => setTypeValue('Therapist')}
                  >
                    Therapist
                  </Button>
                  <Button 
                    type="button"
                    variant={typeValue === 'Attendant' ? 'primary' : 'outline-primary'}
                    onClick={() => setTypeValue('Attendant')}
                  >
                    Attendant
                  </Button>
                  <Button 
                    type="button"
                    variant={typeValue === 'Patient' ? 'primary' : 'outline-primary'}
                    onClick={() => setTypeValue('Patient')}
                  >
                    Patient
                  </Button>
                </div>
              </div>
              
              <Form.Group id="firstName" className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control type="text" ref={firstNameRef} required />
              </Form.Group>
              
              <Form.Group id="lastName" className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control type="text" ref={lastNameRef} required />
              </Form.Group>
              
              <Form.Group id="id" className="mb-3">
                <Form.Label>ID Number</Form.Label>
                <Form.Control type="text" ref={idRef} required />
              </Form.Group>
              
              <Form.Group id="phone" className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control type="tel" ref={phoneRef} required />
              </Form.Group>
              
              <Form.Group id="dob" className="mb-3">
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control type="date" ref={dobRef} required />
              </Form.Group>
              
              <Button disabled={loading} className="w-100" type="submit">
                Complete Registration
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  )
} 