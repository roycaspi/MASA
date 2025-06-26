import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, doc, addDoc, updateDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';

const ChatRoom = ({ selectedChat }) => {
  const { currentUser } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!selectedChat) return;

    const messagesQuery = query(
      collection(db, `chats/${selectedChat.id}/Messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = [];
      snapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    setLoading(true);
    try {
      const messageData = {
        content: newMessage.trim(),
        senderRef: `/Users/${currentUser.uid}`,
        timestamp: serverTimestamp()
      };

      // Add message to Messages subcollection
      await addDoc(collection(db, `chats/${selectedChat.id}/Messages`), messageData);

      // Update chat's lastUpdated
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastUpdated: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (
    !selectedChat ||
    !selectedChat.participants ||
    !Array.isArray(selectedChat.participants) ||
    !selectedChat.participantNames ||
    !Array.isArray(selectedChat.participantNames) ||
    !selectedChat.participantRoles ||
    !Array.isArray(selectedChat.participantRoles)
  ) {
    return (
      <div className="chat-main">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
          <div className="text-center text-muted">
            <i className="fas fa-comments fa-3x mb-3"></i>
            <h4>Select a chat to start messaging</h4>
            <p>Choose from your conversations or start a new one</p>
          </div>
        </div>
      </div>
    );
  }

  const otherParticipant = selectedChat.participants.find(p => p !== currentUser.uid);
  const otherParticipantIndex = selectedChat.participants.indexOf(otherParticipant);
  const otherName = selectedChat.participantNames[otherParticipantIndex];
  const otherRole = selectedChat.participantRoles[otherParticipantIndex];

  return (
    <div className="chat-main">
      <div className="chat-header">
        <div className="d-flex align-items-center gap-3">
          <div className="logo" style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}>
            {selectedChat && selectedChat.participants.filter(uid => uid !== currentUser.uid).join(', ').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="fw-bold">{selectedChat && selectedChat.participants.filter(uid => uid !== currentUser.uid).join(', ')}</div>
            <div className="text-muted small">Chat</div>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="text-center text-muted py-4">
            <i className="fas fa-comment-dots fa-2x mb-2"></i>
            <p>No messages yet</p>
            <p className="small">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.senderRef === `/Users/${currentUser.uid}` ? 'sent' : 'received'}`}
            >
              <div className="message-bubble">
                {message.content}
              </div>
              <div className="message-time">
                {message.timestamp && (message.timestamp.toDate ? message.timestamp.toDate().toLocaleString() : '')}
                <span className="text-muted small ms-2">{message.senderRef}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <form onSubmit={sendMessage} className="chat-input-form">
          <input
            type="text"
            className="chat-input-field"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!newMessage.trim() || loading}
          >
            {loading ? (
              <div className="loading" style={{ width: '16px', height: '16px' }}></div>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
