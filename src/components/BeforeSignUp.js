import React, { useRef, useState } from "react"
import { Form, Button, Card, Alert, Container, ButtonGroup} from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useHistory } from "react-router-dom"

export default function Signup() {
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
          <Form>
          <ButtonGroup style={{width: "100%"}}>
            <Link to="/patientSignup" className="btn btn-primary" style={{align: "center"}}>Patient</Link>
            <Link to="/therapistSignup" className="btn btn-primary" style={{align: "center"}}>Therapist</Link>
            <Button onClick={() => setTypeValue('Patient')}>Attendant</Button>
          </ButtonGroup>
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
