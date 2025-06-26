import { PersonalDetails } from "./User";

export class Message {
    constructor(senderId, content, timestamp = new Date()) {
        this.senderId = senderId;
        this.content = content;
        this.timestamp = timestamp;
    }

    static createFromFirestore(data) {
        return new Message(
            data.senderId,
            data.content,
            data.timestamp?.toDate() || new Date()
        );
    }

    toFirestore() {
        return {
            senderId: this.senderId,
            content: this.content,
            timestamp: this.timestamp
        };
    }
}

export default class Chat {
    constructor(id, participants = [], messages = [], lastMessage = null) {
        this.id = id;
        this.participants = participants;
        this.messages = messages;
        this.lastMessage = lastMessage;
    }

    static createFromFirestore(doc) {
        const data = doc.data();
        return new Chat(
            doc.id,
            data.participants || [],
            (data.messages || []).map(msg => Message.createFromFirestore(msg)),
            data.lastMessage || null
        );
    }

    addMessage(senderId, content) {
        const message = new Message(senderId, content);
        this.messages.push(message);
        this.lastMessage = content;
        return message;
    }

    addParticipant(participantId) {
        if (!this.participants.includes(participantId)) {
            this.participants.push(participantId);
        }
    }

    removeParticipant(participantId) {
        this.participants = this.participants.filter(p => p !== participantId);
    }

    hasParticipant(participantId) {
        return this.participants.includes(participantId);
    }

    getMessagesForUser(userId) {
        // Return messages that the user should see
        return this.messages.filter(msg => 
            msg.senderId === userId || this.hasParticipant(userId)
        );
    }

    getRecentMessages(limit = 50) {
        return this.messages.slice(-limit);
    }

    getUnreadCount(userId) {
        // Implementation for unread message count
        // This would typically track last read timestamp
        return 0;
    }

    markAsRead(userId) {
        // Implementation for marking messages as read
        // This would typically update last read timestamp
    }

    toFirestore() {
        return {
            participants: this.participants,
            messages: this.messages.map(msg => msg.toFirestore()),
            lastMessage: this.lastMessage
        };
    }
} 