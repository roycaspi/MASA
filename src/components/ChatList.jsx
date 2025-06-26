import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, getDocs, limit, doc, getDoc } from 'firebase/firestore';

const ChatList = ({ onSelectChat, selectedChatId }) => {
  const { currentUser, currentUserData, loading } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser || !currentUserData) return;
    setError(null);

    // Get user's chats
    const chatsQuery = query(
      collection(db, 'Chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribeChats = onSnapshot(chatsQuery, async (snapshot) => {
      try {
        const chatsData = [];
        const fetchLastMessage = async (chat) => {
          const messagesRef = collection(db, `chats/${chat.id}/Messages`);
          const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
          const messagesSnap = await getDocs(messagesQuery);
          let lastMessage = '';
          let lastMessageTime = null;
          messagesSnap.forEach(msgDoc => {
            lastMessage = msgDoc.data().content;
            lastMessageTime = msgDoc.data().timestamp;
          });
          return { ...chat, lastMessage, lastMessageTime };
        };
        const chatDocs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        const chatsWithMessages = await Promise.all(chatDocs.map(fetchLastMessage));
        setChats(chatsWithMessages);
      } catch (err) {
        setError('Failed to load chats. Please try again.');
        setChats([]);
        console.error('ChatList error:', err);
      }
    }, (err) => {
      setError('Failed to load chats. Please try again.');
      setChats([]);
      console.error('ChatList Firestore error:', err);
    });

    // Get available users based on permissions
    const getAvailableUsers = async () => {
      // Query all user types
      const patientsQuery = query(collection(db, 'Patients'));
      const therapistsQuery = query(collection(db, 'Therapists'));
      const attendantsQuery = query(collection(db, 'Attendants'));

      const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() };
          if (userData.uid !== currentUser.uid && canChatWithUser(userData)) {
            users.push({
              id: userData.uid,
              displayName: userData.PersonalDetails?.["First Name"] + " " + userData.PersonalDetails?.["Last Name"],
              email: userData.PersonalDetails?.Email,
              role: userData.Type?.toLowerCase(),
              userData: userData
            });
          }
        });
        setAvailableUsers(prev => [...prev.filter(u => u.role !== 'patient'), ...users]);
      });

      const unsubscribeTherapists = onSnapshot(therapistsQuery, (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() };
          if (userData.uid !== currentUser.uid && canChatWithUser(userData)) {
            users.push({
              id: userData.uid,
              displayName: userData.PersonalDetails?.["First Name"] + " " + userData.PersonalDetails?.["Last Name"],
              email: userData.PersonalDetails?.Email,
              role: userData.Type?.toLowerCase(),
              userData: userData
            });
          }
        });
        setAvailableUsers(prev => [...prev.filter(u => u.role !== 'therapist'), ...users]);
      });

      const unsubscribeAttendants = onSnapshot(attendantsQuery, (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() };
          if (userData.uid !== currentUser.uid && canChatWithUser(userData)) {
            users.push({
              id: userData.uid,
              displayName: userData.PersonalDetails?.["First Name"] + " " + userData.PersonalDetails?.["Last Name"],
              email: userData.PersonalDetails?.Email,
              role: userData.Type?.toLowerCase(),
              userData: userData
            });
          }
        });
        setAvailableUsers(prev => [...prev.filter(u => u.role !== 'attendant'), ...users]);
      });

      return () => {
        unsubscribePatients();
        unsubscribeTherapists();
        unsubscribeAttendants();
      };
    };

    getAvailableUsers();

    return () => {
      unsubscribeChats();
    };
  }, [currentUser, currentUserData]);

  // Helper to extract Firestore document ID from various formats
  const extractIdFromRef = (ref) => {
    if (!ref) return undefined;
    // If ref is a string path
    if (typeof ref === 'string') {
      const parts = ref.split('/');
      return parts.length > 1 ? parts[1] : undefined;
    }
    // If ref is a Firestore DocumentReference (has .path)
    if (typeof ref === 'object' && ref.path) {
      const parts = ref.path.split('/');
      return parts.length > 1 ? parts[1] : undefined;
    }
    // If ref is an object with a .Value or .value property
    if (ref.Value && typeof ref.Value === 'string') {
      const parts = ref.Value.split('/');
      return parts.length > 1 ? parts[1] : undefined;
    }
    if (ref.value && typeof ref.value === 'string') {
      const parts = ref.value.split('/');
      return parts.length > 1 ? parts[1] : undefined;
    }
    // If ref.Value or ref.value is a DocumentReference
    if (ref.Value && typeof ref.Value === 'object' && ref.Value.path) {
      const parts = ref.Value.path.split('/');
      return parts.length > 1 ? parts[1] : undefined;
    }
    if (ref.value && typeof ref.value === 'object' && ref.value.path) {
      const parts = ref.value.path.split('/');
      return parts.length > 1 ? parts[1] : undefined;
    }
    return undefined;
  };

  const canChatWithUser = (targetUser) => {
    if (!currentUserData || !targetUser) {
      console.log('[canChatWithUser] Missing currentUserData or targetUser:', { currentUserData, targetUser });
      return false;
    }
    const currentUserType = currentUserData.Type;
    const targetUserType = targetUser.Type;
    console.log(`[canChatWithUser] currentUserType: ${currentUserType}, targetUserType: ${targetUserType}`);

    // Patient
    if (currentUserType === 'Patient') {
      if (targetUserType === 'Therapist') {
        // Assigned therapists
        const result = currentUserData.Therapists?.some(t => {
          const therapistId = extractIdFromRef(t) || extractIdFromRef(t.Value) || extractIdFromRef(t.value);
          return therapistId === targetUser.id;
        });
        console.log(`[canChatWithUser] Patient->Therapist:`, { result, Therapists: currentUserData.Therapists, targetUserId: targetUser.id });
        return result;
      }
      if (targetUserType === 'Attendant') {
        // Assigned attendants
        const result = currentUserData.Attendants?.some(a => {
          const attendantId = extractIdFromRef(a) || extractIdFromRef(a.Value) || extractIdFromRef(a.value);
          return attendantId === targetUser.id;
        });
        console.log(`[canChatWithUser] Patient->Attendant:`, { result, Attendants: currentUserData.Attendants, targetUserId: targetUser.id });
        return result;
      }
      console.log('[canChatWithUser] Patient->Other: false');
      return false;
    }

    // Therapist
    if (currentUserType === 'Therapist') {
      if (targetUserType === 'Patient') {
        const result = currentUserData.Patients?.some(p => {
          const patientId = extractIdFromRef(p) || extractIdFromRef(p.Value) || extractIdFromRef(p.value);
          return patientId === targetUser.id;
        });
        console.log(`[canChatWithUser] Therapist->Patient:`, { result, Patients: currentUserData.Patients, targetUserId: targetUser.id });
        return result;
      }
      if (targetUserType === 'Therapist') {
        const result = currentUserData.department === targetUser.department && currentUserData.uid !== targetUser.uid;
        console.log(`[canChatWithUser] Therapist->Therapist:`, { result, department: currentUserData.department, targetDepartment: targetUser.department, uid: currentUserData.uid, targetUid: targetUser.uid });
        return result;
      }
      if (targetUserType === 'Attendant') {
        const result = currentUserData.Patients?.some(p => {
          const patientData = p.data;
          return patientData?.Attendants?.some(a => {
            const attendantId = extractIdFromRef(a) || extractIdFromRef(a.Value) || extractIdFromRef(a.value);
            return attendantId === targetUser.id;
          });
        });
        console.log(`[canChatWithUser] Therapist->Attendant:`, { result, Patients: currentUserData.Patients, targetUserId: targetUser.id });
        return result;
      }
      console.log('[canChatWithUser] Therapist->Other: false');
      return false;
    }

    // Attendant
    if (currentUserType === 'Attendant') {
      if (targetUserType === 'Patient') {
        const result = currentUserData.Patients?.some(p => {
          const patientId = extractIdFromRef(p) || extractIdFromRef(p.Value) || extractIdFromRef(p.value);
          return patientId === targetUser.id;
        });
        console.log(`[canChatWithUser] Attendant->Patient:`, { result, Patients: currentUserData.Patients, targetUserId: targetUser.id });
        return result;
      }
      if (targetUserType === 'Therapist') {
        const result = currentUserData.Patients?.some(p => {
          const patientData = p.data;
          return patientData?.Therapists?.some(t => {
            const therapistId = extractIdFromRef(t) || extractIdFromRef(t.Value) || extractIdFromRef(t.value);
            return therapistId === targetUser.id;
          });
        });
        console.log(`[canChatWithUser] Attendant->Therapist:`, { result, Patients: currentUserData.Patients, targetUserId: targetUser.id });
        return result;
      }
      console.log('[canChatWithUser] Attendant->Other: false');
      return false;
    }

    console.log('[canChatWithUser] Unknown user type or relationship: false');
    return false;
  };

  const startNewChat = async (targetUserId) => {
    try {
      const targetUser = availableUsers.find(u => u.id === targetUserId);
      if (!targetUser) return;

      // Check if chat already exists
      const existingChat = chats.find(chat => 
        chat.participants.includes(currentUser.uid) && chat.participants.includes(targetUserId)
      );

      if (existingChat) {
        onSelectChat(existingChat);
        setShowNewChatModal(false);
        return;
      }

      // Create new chat
      const currentUserName = currentUserData?.PersonalDetails?.["First Name"] + " " + currentUserData?.PersonalDetails?.["Last Name"];
      const targetUserName = targetUser.displayName;
      
      const chatData = {
        participants: [currentUser.uid, targetUserId],
        participantNames: [currentUserName || currentUser.email, targetUserName || targetUser.email],
        participantRoles: [currentUserData?.Type?.toLowerCase(), targetUser.role],
        lastMessage: '',
        lastMessageTime: new Date(),
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      const docRef = await addDoc(collection(db, 'Chats'), chatData);
      const newChat = { id: docRef.id, ...chatData };
      onSelectChat(newChat);
      setShowNewChatModal(false);
    } catch (error) {
      console.error('Error starting new chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading || !currentUser || !currentUserData) {
    return (
      <div className="chat-sidebar">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
          <div className="loading"></div>
          <span className="ms-2">Loading user data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="fw-bold">Chats</span>
        <button
          className="btn btn-sm btn-primary"
          style={{ borderRadius: 20, fontWeight: 500 }}
          onClick={() => setShowNewChatModal(true)}
        >
          <i className="fas fa-plus me-1"></i> New Chat
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: '#f8f9fa' }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100 text-muted">Loading chats...</div>
        ) : error ? (
          <div className="p-3 text-center text-danger">{error}</div>
        ) : chats.length === 0 ? (
          <div className="p-3 text-center text-muted">No chats yet</div>
        ) : (
          chats.map((chat) => {
            const otherUIDs = chat.participants.filter(uid => uid !== currentUser.uid);
            // Try to get the other user's name from participantNames if available
            let otherName = null;
            if (chat.participantNames && Array.isArray(chat.participantNames)) {
              // Find the name that does not belong to the current user
              const idx = chat.participants.findIndex(uid => uid !== currentUser.uid);
              if (idx !== -1) {
                otherName = chat.participantNames[idx];
              }
            }
            // Fallback: try to get from availableUsers
            if (!otherName && availableUsers.length > 0) {
              const otherUser = availableUsers.find(u => u.id === otherUIDs[0]);
              if (otherUser) {
                otherName = otherUser.displayName || otherUser.email;
              }
            }
            // Fallback: show UID
            if (!otherName) {
              otherName = otherUIDs.join(', ');
            }
            return (
              <div
                key={chat.id}
                className={`chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
                onClick={() => onSelectChat(chat)}
                style={{ cursor: 'pointer', padding: '12px 16px', borderBottom: '1px solid #e0e0e0', background: selectedChatId === chat.id ? '#e3f2fd' : 'transparent' }}
              >
                <div className="chat-item-header">
                  <div className="chat-item-name fw-bold">{otherName}</div>
                </div>
                <div className="chat-item-preview text-muted small">
                  {chat.lastMessage || 'No messages yet'}
                </div>
                {chat.lastMessageTime && (
                  <div className="text-muted small mt-1">
                    {chat.lastMessageTime.toDate ? chat.lastMessageTime.toDate().toLocaleString() : ''}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* New Chat Modal (choose from relevant users) */}
      {showNewChatModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%', maxHeight: '80vh' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Start New Chat</h5>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowNewChatModal(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                {availableUsers.length === 0 ? (
                  <div className="text-muted text-center">No users available to chat with</div>
                ) : (
                  availableUsers.map(user => (
                    <div key={user.id} className="d-flex align-items-center justify-content-between py-2 px-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <div>
                        <div className="fw-bold">{user.displayName || user.email}</div>
                        <div className="text-muted small">{user.role}</div>
                      </div>
                      <button className="btn btn-sm btn-primary" onClick={() => startNewChat(user.id)}>
                        Start Chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
