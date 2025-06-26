export class PersonalDetails {
    constructor(fname, lname, id, email, phoneNumber, dob = new Date()){
        this.id = id;
        this.dob = dob;
        this.firstName = fname;
        this.lastName = lname;
        this.email = email;
        this.phoneNumber = phoneNumber;
  }
}

export default class User {
    constructor(personalDetails, uid, type, department, data) {
      this.uid = uid;
      this.type = type;
      this.department = department;
      this.personalDetails = personalDetails;
      this.data = data;
    }
    addApointment(toAdd) { 

    }
    editApointment(toEdit) {
      
    }
    deleteApointment(toDelete){
      
    }
    get uid(){
      return this._uid_;
    }
    set uid(v){
      this._uid_ = v
    }
    get dob() {
      return this.personalDetails.dob;
    }
    get firtName() {
      return this.personalDetails.firstName;
    }
    get lastName() {
      return this.personalDetails.lastName;
    }
    get id() {
      return this.personalDetails.id;
    }
    get email() {
      return this.personalDetails.email;
    }
    get phoneNumber() {
      return this.personalDetails.phoneNumber;
    }
    notify(user, message) {

    }
}