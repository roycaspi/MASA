import { Permissions } from "./Permissions";

export class AppointmentDetails {
    constructor(type, patients, therapists, startTime, endTime, repeat, room, exercises = []){
        this.type = type;
        this.patients = patients;
        this.therapists = therapists;
        this.startTime = startTime;
        this.endTime = endTime;
        this.repeat = repeat;
        this.room = room;
        this.exercises = exercises;
        this.notifyList = this.getNotifyList(); //get all relevant users(patients, therapists, attendants, secretary)
    }

    getNotifyList() {
        // Combine all participants for notifications
        const participants = [];
        if (this.patients) participants.push(...this.patients);
        if (this.therapists) participants.push(...this.therapists);
        return participants;
    }
}

export default class Appointment {
    constructor(details, permissions = null) {
        this.details = details;
        this.permissions = permissions || new Permissions([], [], []);
    }

    static createFromForm(formData) {
        const details = new AppointmentDetails(
            formData.type,
            formData.patients || [],
            formData.therapists || [],
            formData.startTime,
            formData.endTime,
            formData.repeat || null,
            formData.room || null,
            formData.exercises || []
        );
        return new Appointment(details);
    }

    static createFromSchedulerEvent(schedulerEvent) {
        const details = new AppointmentDetails(
            schedulerEvent.type || "Default",
            schedulerEvent.patients || [],
            schedulerEvent.therapists || [],
            schedulerEvent.startDate,
            schedulerEvent.endDate,
            schedulerEvent.repeat || null,
            schedulerEvent.room || null,
            schedulerEvent.exercises || []
        );
        return new Appointment(details);
    }

    delete() {
        // Implementation for deleting appointment
        // This would typically involve database operations
    }

    change(newDetails) {
        // Implementation for changing appointment details
        this.details = { ...this.details, ...newDetails };
    }

    hasPermission(user, permission) {
        return this.permissions.isPermitted(user, permission);
    }

    addParticipant(participant, role) {
        if (role === 'patient') {
            this.details.patients.push(participant);
        } else if (role === 'therapist') {
            this.details.therapists.push(participant);
        }
        this.details.notifyList = this.details.getNotifyList();
    }

    removeParticipant(participant, role) {
        if (role === 'patient') {
            this.details.patients = this.details.patients.filter(p => p !== participant);
        } else if (role === 'therapist') {
            this.details.therapists = this.details.therapists.filter(t => t !== participant);
        }
        this.details.notifyList = this.details.getNotifyList();
    }

    isTimeConflict(otherAppointment) {
        const thisStart = new Date(this.details.startTime);
        const thisEnd = new Date(this.details.endTime);
        const otherStart = new Date(otherAppointment.details.startTime);
        const otherEnd = new Date(otherAppointment.details.endTime);

        return !(thisEnd <= otherStart || thisStart >= otherEnd);
    }

    getDuration() {
        const start = new Date(this.details.startTime);
        const end = new Date(this.details.endTime);
        return end - start;
    }

    isInTimeRange(startTime, endTime) {
        const appointmentStart = new Date(this.details.startTime);
        const appointmentEnd = new Date(this.details.endTime);
        const rangeStart = new Date(startTime);
        const rangeEnd = new Date(endTime);

        return appointmentStart >= rangeStart && appointmentEnd <= rangeEnd;
    }
}