import React, { useRef, useState } from "react"
import { Form, Button, Card, Alert, Container} from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useHistory } from "react-router-dom"

export default function Signup() {
  const firstNameRef = useRef()
  const lastNameRef = useRef()
  const emailRef = useRef()
  const passwordRef = useRef()
  const passwordConfirmRef = useRef()
  const { signup, signInWithGoogle } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const history = useHistory()
  const [typeValue, setTypeValue] = useState("");

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

  async function handleGoogleSignIn() {
    setError("")
    setLoading(true)
    
    try {
      const result = await signInWithGoogle()
      if (result.needsRegistration) {
        // Redirect to complete registration with Google user data
        history.push("/complete-registration", { googleUser: result.user })
      } else {
        // User exists, redirect to home
        history.push("/")
      }
    } catch (error) {
      setLoading(false)
      setError("Failed to sign in with Google")
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
            <Button onClick={() => setTypeValue('Attendant')}>Attendant</Button>
            <Button onClick={() => setTypeValue('Patient')}>Patient</Button>
            <Form.Group id="firstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control type="text" name="firstName" ref={firstNameRef} required />
            </Form.Group>
            <Form.Group id="lastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control type="text" ref={lastNameRef} required />
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
              <Form.Control className="mb-4" type="password" ref={passwordConfirmRef} required />
            </Form.Group>
            <Button disabled={loading} className="w-100" type="submit">
              Sign Up
            </Button>
          </Form>
          
          <div className="text-center mt-3">
            <div className="border-top pt-3">
              <p className="text-muted">Or</p>
              <Button 
                variant="outline-primary" 
                className="w-100" 
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <i className="fab fa-google me-2"></i>
                Continue with Google
              </Button>
            </div>
          </div>
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
