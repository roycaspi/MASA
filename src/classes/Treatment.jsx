import { Event } from "./Event";

export default class Treatment extends Event {

    constructor(details, permissions, department, patients) {
        super(details, permissions);
        this.department = department;
        this.patients = patients;
    }
}