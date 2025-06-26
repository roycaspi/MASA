import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';
import React from "react"
import Signup from "./components/BeforeSignUp"
import Login from "./components/Login"
import FrontPage from "./components/FrontPage"
import PrivateRoute from "./components/PrivateRoute"
import PatientSignUp from "./components/PatientSignUp"
import TherapistSignUp from "./components/TherapistSignUp"
import AttendantSignUp from "./components/AttendantSignUp"
import CompleteRegistration from "./components/CompleteRegistration"
import { AuthProvider } from "./contexts/AuthContext"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import FCMHandler from "./FCMHandler";

function App() {
  return (
    <Router>
      <AuthProvider>
        <FCMHandler />
        <Switch>
          <PrivateRoute exact path="/" component={FrontPage} />
          <Route exact path="/signup" component={Signup} />
          <Route path="/login" component={Login} />
          <Route path="/patientSignup" component={PatientSignUp} />
          <Route path="/therapistSignup" component={TherapistSignUp} />
          <Route path="/attendantSignup" component={AttendantSignUp} />
          <Route path="/complete-registration" component={CompleteRegistration} />
        </Switch>
      </AuthProvider>
    </Router>
  )
}

export default App
