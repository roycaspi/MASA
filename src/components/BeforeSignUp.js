import React from "react"
import { Card, Container, ButtonGroup, Button, Alert } from "react-bootstrap"
import { Link, useHistory } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Logo from "./Logo"

export default function Signup() {
  const { signInWithGoogle } = useAuth()
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const history = useHistory()

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
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--gray-50) 100%)' }}>
      <Container className="d-flex align-items-center justify-content-center">
        <div className="w-100" style={{ maxWidth: "500px" }}>
          <div className="text-center mb-4">
            <Logo size="xl" className="mb-3" />
            <h2 className="mb-2">Join MASA</h2>
            <p className="text-muted">Choose your role to get started</p>
          </div>
          
          <Card>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              
              <div className="mb-4">
                <h5 className="text-center mb-3">Select Your Role</h5>
                <div className="d-grid gap-3">
                  <Link to="/patientSignup" className="btn btn-primary text-decoration-none">
                    <i className="fas fa-user-injured me-2"></i>
                    <div>
                      <strong>Patient</strong>
                      <div className="text-white-50" style={{ fontSize: '0.875rem' }}>
                        Schedule appointments and manage your care
                      </div>
                    </div>
                  </Link>
                  
                  <Link to="/therapistSignup" className="btn btn-outline-primary text-decoration-none">
                    <i className="fas fa-user-md me-2"></i>
                    <div>
                      <strong>Therapist</strong>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                        Manage patients and appointments
                      </div>
                    </div>
                  </Link>
                  
                  <Link to="/attendantSignup" className="btn btn-outline-primary text-decoration-none">
                    <i className="fas fa-user-nurse me-2"></i>
                    <div>
                      <strong>Attendant</strong>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                        Support patient care and scheduling
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
              
              <div className="text-center">
                <div className="border-top pt-3">
                  <p className="text-muted mb-3">Or continue with</p>
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
          
          <div className="text-center mt-4">
            <p className="text-muted mb-0">
              Already have an account? <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: 'var(--primary-600)' }}>Log In</Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}
