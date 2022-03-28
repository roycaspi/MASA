import React from "react"
import Signup from "./components/Signup"
import Login from "./components/Login"
import FrontPage from "./components/FrontPage"
import PrivateRoute from "./components/PrivateRoute"
import { Container } from "react-bootstrap"
import { AuthProvider } from "./contexts/AuthContext"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"

// roy was here - thank god!!
// udi was here

function App() {
  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", maxHeight: "100%"}}
    >
      <div className="w-100" style={{ maxWidth: "100%" }}>
        <Router>
          <AuthProvider>
            <Switch>
              <PrivateRoute exact path="/" component={FrontPage} />
              <Route exact path="/signup" component={Signup} />
              <Route path="/login" component={Login} />
            </Switch>
          </AuthProvider>
        </Router>
      </div>
    </Container>
  )
}

export default App
