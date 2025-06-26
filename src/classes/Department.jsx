export default class Department {
    constructor(id, name, description = "", location = "", capacity = 0) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.location = location;
        this.capacity = capacity;
        this.members = {
            patients: [],
            therapists: [],
            attendants: [],
            administrative: []
        };
    }

    static createFromFirestore(doc) {
        const data = doc.data();
        return new Department(
            doc.id,
            data.name,
            data.description || "",
            data.location || "",
            data.capacity || 0
        );
    }

    addMember(user, role) {
        if (this.members[role] && !this.members[role].includes(user)) {
            this.members[role].push(user);
        }
    }

    removeMember(user, role) {
        if (this.members[role]) {
            this.members[role] = this.members[role].filter(member => member !== user);
        }
    }

    getMembers(role = null) {
        if (role) {
            return this.members[role] || [];
        }
        return this.members;
    }

    getMemberCount(role = null) {
        if (role) {
            return this.members[role]?.length || 0;
        }
        return Object.values(this.members).reduce((total, members) => total + members.length, 0);
    }

    hasMember(user, role = null) {
        if (role) {
            return this.members[role]?.includes(user) || false;
        }
        return Object.values(this.members).some(members => members.includes(user));
    }

    getAvailableCapacity() {
        return this.capacity - this.getMemberCount();
    }

    isAtCapacity() {
        return this.getMemberCount() >= this.capacity;
    }

    getMemberRoles(user) {
        const roles = [];
        Object.entries(this.members).forEach(([role, members]) => {
            if (members.includes(user)) {
                roles.push(role);
            }
        });
        return roles;
    }

    toFirestore() {
        return {
            name: this.name,
            description: this.description,
            location: this.location,
            capacity: this.capacity,
            members: this.members
        };
    }
} 