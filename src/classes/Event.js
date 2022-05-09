import User from "./User";

export class EventDetails {
    constructor(type, participants, startTime, endTime, repeat, room){
        this.type = type;
        this.participants = participants;
        this.startTime = startTime;
        this.endTime = endTime;
        this.repeat = repeat;
        this.room = room;
        this.notifyList//=get all relevant users(patients, therapists, attendants, secratery)
    }

    
}

export class Event {
    constructor(details, permissions) {
        this.details = details;
        this.permissions = permissions;
    }

    set(details) {
        this.details = details;
    }

    cancel() {
        // todo
    }

    notify(notification) {
        // todo
    }

    notify(notification, user) {
        // todo
    }

    permit(user, permission) {
        permited = 'p'; // todo - get current user uid
        return this.permissions.permit(me, user, permission);
    }


}