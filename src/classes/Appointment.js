

export class AppointmentDetails {
    constructor(patients, therapists, startTime, endTime, repeat, room){
        this.patients = patients;
        this.therapists = therapists;
        this.startTime = startTime;
        this.endTime = endTime;
        this.repeat = repeat;
        this.room = room;
        this.notifyList//=get all relevant users(patients, therapists, attendants, secratery)
    }
}

export default class Appointment {
    constructor(details) {
        this.details = details;
    }
    delete() {

    }
    change() {

    }
}