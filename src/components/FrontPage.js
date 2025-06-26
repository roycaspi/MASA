import React, { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import Calendar from "./Calendar";
import ChatList from "./ChatList";
import ChatRoom from "./ChatRoom";
import Logo from "./Logo";
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { getDocs } from 'firebase/firestore';

const FrontPage = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedChat, setSelectedChat] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  // Listen for unread messages
  React.useEffect(() => {
    if (!currentUser) return;
    // Listen to all chats where the user is a participant
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );
    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      let foundUnread = false;
      const checkUnreadPromises = snapshot.docs.map(async (chatDoc) => {
        const chat = chatDoc.data();
        // Listen to the last message in each chat
        const messagesRef = collection(db, `chats/${chatDoc.id}/Messages`);
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
        const messagesSnap = await getDocs(messagesQuery);
        if (!messagesSnap.empty) {
          const lastMsg = messagesSnap.docs[0].data();
          // If the last message is not from the current user and is unread, set foundUnread
          if (lastMsg.senderRef !== `/Users/${currentUser.uid}` && !lastMsg.readBy?.includes(currentUser.uid)) {
            foundUnread = true;
          }
        }
      });
      Promise.all(checkUnreadPromises).then(() => setHasUnread(foundUnread));
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Debug: Log user data
  console.log('Current user:', currentUser);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setActiveTab('chat');
  };

  if (!currentUser) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="loading"></div>
          <p className="mt-3">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center w-100">
            <div className="navbar-brand">
              <Logo />
              <span>MASA</span>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="text-end">
                <div className="fw-bold">{currentUser?.displayName || currentUser?.email}</div>
                <div className="text-muted small text-capitalize">{currentUser?.role}</div>
              </div>
              <button className="btn btn-outline-primary" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mt-4">
        {/* Tab Navigation */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex gap-2">
              <button
                className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('calendar')}
              >
                <i className="fas fa-calendar-alt me-2"></i>
                Calendar
              </button>
              <button
                className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('chat')}
                style={{ position: 'relative' }}
              >
                <i className="fas fa-comments me-2"></i>
                Messages
                {hasUnread && (
                  <span style={{ position: 'absolute', top: -8, right: 8, width: 12, height: 12, background: '#dc3545', borderRadius: '50%', display: 'inline-block', border: '2px solid #fff' }}></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'calendar' && (
          <div className="card">
            <div className="card-body">
              <h3 className="mb-4">
                <i className="fas fa-calendar-alt me-2 text-primary"></i>
                Appointment Calendar
              </h3>
              <Calendar />
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{ display: 'flex', height: '80vh', background: '#f8f9fa', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {/* Sidebar for chat list */}
            <div style={{ width: 320, minWidth: 220, maxWidth: 400, borderRight: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
              {currentUser && currentUser.role ? (
                <ChatList 
                  userId={currentUser.uid}
                  onSelectChat={handleSelectChat}
                  selectedChatId={selectedChat?.id}
                />
              ) : (
                <>
                  <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="fw-bold">Chats</span>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ borderRadius: 20, fontWeight: 500 }}
                      disabled
                    >
                      <i className="fas fa-plus me-1"></i> New Chat
                    </button>
                  </div>
                  <div className="d-flex justify-content-center align-items-center h-100 text-muted">Loading user data...</div>
                </>
              )}
            </div>
            {/* Main chat room */}
            <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
              <ChatRoom selectedChat={selectedChat} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FrontPage;
