
export class Permissions {

    constructor(r, w, x) {
        /*
        param r:    read permitted users (List<User>)
        param w:    write permitted users (List<User>)
        param x:    X permitted users (List<User>)
        */
        this.read = r;
        this.write = w;
        this.x = x;
    }

    isPermitted(user, permission) {
        switch(permission){
            case 'r':
                return this.isRPermitted(user);
            case 'w':
                return this.isRPermitted(user);
            case 'x':
                return this.isXPermitted(user);
            default:
                return false;
        }
    }

    isXPermitted(user) {
        // todo
    }

    isWPermitted(user) {
        // todo
    }

    isRPermitted(user) {
        // todo
    }

    permit(permiting, permited, permission) {
        if (this.isXPermitted(permiting)) {
            switch(permission) {
                case 'r':
                    this.read.push(permited);
                    return true;
                case 'w':
                    this.write.push(permited);
                    return true;
                case 'x':
                    this.x.push(permited);
                    return true;
                default:
                    // todo - raise exception - wrong premission char
                    return false;
            }
        }
        // todo - raise exception - user not premitted
        return false;
    }
}