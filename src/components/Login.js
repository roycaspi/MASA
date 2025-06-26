import React, { useRef, useState } from "react"
import { Form, Button, Card, Alert, Container } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { Link, useHistory } from "react-router-dom"
import Logo from "./Logo"

export default function Login() {
  const emailRef = useRef()
  const passwordRef = useRef()
  const { login, signInWithGoogle, signInWithGoogleRedirect } = useAuth()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showRedirectOption, setShowRedirectOption] = useState(false)
  const history = useHistory()

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(emailRef.current.value, passwordRef.current.value)
      history.push("/")
    } catch {
      setLoading(false)
      setError("Failed to log in")
    }
  }

  async function handleGoogleSignIn() {
    setError("")
    setLoading(true)
    setShowRedirectOption(false)
    
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
      if (error.message.includes("popup") || error.message.includes("blocked")) {
        setShowRedirectOption(true)
        setError("Popup blocked. Try the redirect option below.")
      } else {
        setError(error.message)
      }
    }
  }

  async function handleGoogleRedirect() {
    setError("")
    setLoading(true)
    
    try {
      await signInWithGoogleRedirect()
      // The redirect will happen automatically
    } catch (error) {
      setLoading(false)
      setError(error.message)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--gray-50) 100%)' }}>
      <Container className="d-flex align-items-center justify-content-center">
        <div className="w-100" style={{ maxWidth: "400px" }}>
          <div className="text-center mb-4">
            <Logo size="xl" className="mb-3" />
            <h2 className="mb-2">Welcome Back</h2>
            <p className="text-muted">Sign in to your MASA account</p>
          </div>
          
          <Card>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control 
                    type="email" 
                    ref={emailRef} 
                    required 
                    placeholder="Enter your email"
                    className="form-control"
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    ref={passwordRef} 
                    required 
                    placeholder="Enter your password"
                    className="form-control"
                  />
                </Form.Group>
                
                <Button 
                  disabled={loading} 
                  className="w-100 btn-primary mb-3" 
                  type="submit"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Sign In
                    </>
                  )}
                </Button>
              </Form>
              
              <div className="text-center">
                <div className="border-top pt-3">
                  <p className="text-muted mb-3">Or continue with</p>
                  <Button 
                    variant="outline-primary" 
                    className="w-100 mb-2" 
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <i className="fab fa-google me-2"></i>
                    Continue with Google
                  </Button>
                  
                  {showRedirectOption && (
                    <Button 
                      variant="outline-secondary" 
                      className="w-100" 
                      onClick={handleGoogleRedirect}
                      disabled={loading}
                    >
                      <i className="fab fa-google me-2"></i>
                      Continue with Google (Redirect)
                    </Button>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
          
          <div className="text-center mt-4">
            <p className="text-muted mb-0">
              Don't have an account? <Link to="/signup" className="text-decoration-none fw-semibold" style={{ color: 'var(--primary-600)' }}>Sign Up</Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}