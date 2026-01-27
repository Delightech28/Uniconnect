import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import useVerified from '../hooks/useVerified';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import GenderBadge from './GenderBadge';
import { getDefaultAvatar } from '../services/avatarService';
import { notifyNewMessage } from '../services/notificationService';

const MY_AVATAR_URL = null;

// --- Conversation Item Component ---
const ConversationItem = ({ convo, isActive, onSelect, onAvatarClick }) => (
    <div
        onClick={onSelect}
        className={`flex cursor-pointer items-center gap-3 px-3 py-3 transition-all duration-200 relative group ${
            isActive 
                ? 'bg-primary/15 border-l-4 border-primary' 
                : 'hover:bg-background-light dark:hover:bg-background-dark/50'
        }`}
    >
        <div className="flex items-center gap-3 w-full min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
                <div 
                    onClick={(e) => { e.stopPropagation(); onAvatarClick?.(); }} 
                    style={{ backgroundImage: `url(${convo.avatarUrl})` }} 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-11 shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all"
                />
                {convo.isOnline && <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-background-dark" />}
            </div>
            
            {/* Content */}
            <div className="flex flex-col justify-center min-w-0 flex-1">
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <p className={`text-sm truncate ${isActive || convo.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>
                            {convo.name}
                        </p>
                        {convo.gender && <GenderBadge gender={convo.gender} size="xs" className="shrink-0" />}
                    </div>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark shrink-0 whitespace-nowrap">
                        {convo.timestamp}
                    </p>
                </div>
                <p className={`text-xs truncate ${isActive ? 'text-text-primary-light dark:text-text-primary-dark font-medium' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                    {convo.lastMessage}
                </p>
            </div>
            
            {/* Unread Badge */}
            {convo.unreadCount > 0 && (
                <div className="shrink-0 flex size-5 items-center justify-center rounded-full bg-accent text-white text-xs font-bold animate-pulse">
                    {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                </div>
            )}
        </div>
    </div>
);

// --- Message Bubble Component ---
const MessageBubble = ({ message, senderAvatar, isMe, onAvatarClick, senderName }) => {
    return (
        <div className={`flex items-end gap-2 group ${isMe ? 'flex-row-reverse' : ''}`}>
            <div 
                onClick={(e) => { e.stopPropagation(); onAvatarClick?.(); }} 
                style={{ backgroundImage: `url(${isMe ? MY_AVATAR_URL : senderAvatar})` }} 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            />
            <div className={`max-w-xs md:max-w-md ${isMe ? 'flex flex-col items-end' : ''}`}>
                {!isMe && senderName && (
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1 ml-2 font-medium">
                        {senderName}
                    </p>
                )}
                <div className={`p-3 rounded-2xl break-words ${
                    isMe 
                        ? 'rounded-br-none bg-primary text-white' 
                        : 'rounded-bl-none bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark'
                }`}>
                    {message.text && <p className="text-sm">{message.text}</p>}
                    {message.fileUrl && (
                        <div className="mt-2">
                            {message.fileType?.startsWith('image/') ? (
                                <img src={message.fileUrl} alt="attachment" className="max-w-xs rounded-lg max-h-64" />
                            ) : (
                                <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline hover:opacity-75">
                                    <span className="material-symbols-outlined text-base">download</span>
                                    {message.fileName || 'File'}
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <p className={`text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 ${isMe ? 'mr-2' : 'ml-2'}`}>
                    {message.createdAt ? new Date(message.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
            </div>
        </div>
    );
}; 
 
// --- Main Page Component ---
function InboxPage() {
    const navigate = useNavigate();
    const { darkMode, toggleTheme } = useTheme();
    const [user, setUser] = useState(null);
    const [userAvatar, setUserAvatar] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConvoId, setActiveConvoId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'unread', 'archived'
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [showConvoInfo, setShowConvoInfo] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const messagesRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', u.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserAvatar(userData.avatarUrl || getDefaultAvatar(userData.gender || 'male'));
                    }
                } catch (err) {
                    console.error('Error fetching user avatar:', err);
                }
            }
        });
        return () => unsubAuth();
    }, []);

    // Redirect unverified users away from Inbox
    const { isLoading: verifyingLoading, verified, status } = useVerified();
    useEffect(() => {
        if (!verifyingLoading && !verified) {
            if (status === 'failed') {
                // send to failed page
                window.location.href = '/verification-failed';
            } else {
                window.location.href = '/verification-pending';
            }
        }
    }, [verifyingLoading, verified, status]);

    // Subscribe to conversations for this user
    const location = useLocation();
    const convoParam = useMemo(() => new URLSearchParams(location.search).get('convo'), [location.search]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid), orderBy('lastTimestamp', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
                const promises = snap.docs.map(async (d) => {
                const data = d.data();
                let name = data.name || 'Unknown';
                let avatarUrl = data.avatarUrl || null;
                let gender = data.gender || null;
                let otherParticipantId = null;

                // If name is still "Unknown", try to fetch from the other participant's user doc
                if (name === 'Unknown' && data.participants && user.uid) {
                    otherParticipantId = data.participants.find((p) => p !== user.uid);
                    if (otherParticipantId) {
                        try {
                            const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
                                const displayName = userData.displayName?.trim();
                                const emailPrefix = userData.email?.split('@')[0];
                                name = displayName || emailPrefix || userData.email || 'Unknown';
                                if (userData.avatarUrl) {
                                    avatarUrl = userData.avatarUrl;
                                }
                                gender = userData.gender || null;
                                console.log('Fetched missing seller info for conversation:', name); // Debug
                            }
                        } catch (err) {
                            console.warn('Failed to fetch other participant info:', err);
                        }
                    }
                }

                // Use gender-based default if no avatar URL
                if (!avatarUrl) {
                    avatarUrl = getDefaultAvatar(gender || 'male');
                }

                return {
                    id: d.id,
                    ...data,
                    name,
                    avatarUrl,
                    gender,
                    otherParticipantId,
                    timestamp: data.lastTimestamp ? new Date(data.lastTimestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    unreadCount: data.unreadCount || 0,
                };
            });

            Promise.all(promises).then((items) => {
                setConversations(items);
                // prefer convo param if present, otherwise auto-select first convo
                if (convoParam) {
                    setActiveConvoId(convoParam);
                } else if (!activeConvoId && items.length) {
                    setActiveConvoId(items[0].id);
                }
            });
        }, (err) => console.error('Conversations subscription error', err));
        return () => unsub();
    }, [user, convoParam, activeConvoId, location.search]);

    // Subscribe to messages for active conversation
    useEffect(() => {
        if (!activeConvoId || !user) return;
        const msgsQuery = query(collection(db, `conversations/${activeConvoId}/messages`), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(msgsQuery, (snap) => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMessages(msgs);
            // scroll to bottom if messagesRef set
            setTimeout(() => { if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight; }, 50);

            // If a new message arrived from the other participant, increment unreadCount
            if (msgs.length > 0) {
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg.senderId !== user.uid) {
                    // Message is from other participant; we should have already marked as read when we opened convo
                    // But for safety, increment unread for any participant who isn't the sender if convo is not active in focus
                }
            }
        }, (err) => console.error('Messages subscription error', err));
        return () => unsub();
    }, [activeConvoId, user]);

    const filteredConversations = useMemo(() => conversations.filter(c => {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch = !q || (c.title || c.name || '').toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q);
        
        if (filterType === 'unread') {
            return matchesSearch && c.unreadCount > 0;
        } else if (filterType === 'archived') {
            return matchesSearch && c.isArchived;
        }
        return matchesSearch;
    }), [conversations, searchTerm, filterType]);

    const handleSelectConvo = (id) => {
        setActiveConvoId(id);
        setIsChatVisible(true);
        // Mark conversation as read (reset unreadCount to 0)
        try {
            updateDoc(doc(db, 'conversations', id), {
                unreadCount: 0,
            });
        } catch (err) {
            console.warn('Failed to mark conversation as read:', err);
        }
    };

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedFile) || !user || !activeConvoId) return;
        
        try {
            setIsUploading(true);
            let fileUrl = null;
            let fileType = null;
            let fileName = null;

            // Convert file to base64 if selected
            if (selectedFile) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = async () => {
                        try {
                            fileUrl = reader.result; // base64 data URL
                            fileType = selectedFile.type;
                            fileName = selectedFile.name;

                            // Create message object
                            const msg = {
                                text: newMessage.trim(),
                                senderId: user.uid,
                                createdAt: serverTimestamp(),
                                ...(fileUrl && { fileUrl, fileType, fileName })
                            };

                            await addDoc(collection(db, `conversations/${activeConvoId}/messages`), msg);
                            
                            // Get other participant to send notification
                            const convoDoc = await getDoc(doc(db, 'conversations', activeConvoId));
                            if (convoDoc.exists()) {
                                const participants = convoDoc.data().participants || [];
                                const recipientId = participants.find(p => p !== user.uid);
                                
                                // Update conversation metadata
                                await updateDoc(doc(db, 'conversations', activeConvoId), {
                                    lastMessage: newMessage.trim() || '📎 File sent',
                                    lastTimestamp: serverTimestamp(),
                                    lastSenderId: user.uid,
                                });

                                // Send notification to other participant
                                if (recipientId) {
                                    try {
                                        await notifyNewMessage(recipientId, {
                                            conversationId: activeConvoId,
                                            senderId: user.uid,
                                            senderName: user.displayName || user.email.split('@')[0] || 'User',
                                            senderAvatar: null,
                                            messagePreview: newMessage.trim().substring(0, 50) || '📎 File sent',
                                        });
                                    } catch (notifErr) {
                                        console.warn('Failed to send notification:', notifErr);
                                    }
                                }
                            }

                            // Clear inputs
                            setNewMessage('');
                            setSelectedFile(null);
                            setIsUploading(false);
                            resolve();
                        } catch (err) {
                            console.error('Failed to send message', err);
                            setIsUploading(false);
                            reject(err);
                        }
                    };
                    reader.onerror = (err) => {
                        console.error('Error reading file:', err);
                        setIsUploading(false);
                        reject(err);
                    };
                    reader.readAsDataURL(selectedFile);
                });
            }

            // If no file, just send text message
            const msg = {
                text: newMessage.trim(),
                senderId: user.uid,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, `conversations/${activeConvoId}/messages`), msg);
            
            // Update conversation metadata
            try {
                const convoDoc = await getDoc(doc(db, 'conversations', activeConvoId));
                if (convoDoc.exists()) {
                    await updateDoc(doc(db, 'conversations', activeConvoId), {
                        lastMessage: newMessage.trim(),
                        lastTimestamp: serverTimestamp(),
                        lastSenderId: user.uid,
                    });
                }
            } catch (metaErr) {
                console.warn('Failed to update conversation metadata:', metaErr);
            }

            // Clear inputs
            setNewMessage('');
            setSelectedFile(null);
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setIsUploading(false);
        }
    };

    // derive activeConversation object
    const activeConversation = useMemo(() => conversations.find(c => c.id === activeConvoId) || null, [conversations, activeConvoId]);

    // Calculate total unread count across all conversations
    const totalUnreadCount = useMemo(() => {
        return conversations.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0);
    }, [conversations]);

    // Export unread count to parent (App.jsx) via window or callback if needed
    useEffect(() => {
        window.inboxUnreadCount = totalUnreadCount;
    }, [totalUnreadCount]);

    return (
        <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark text-white font-display">
            {/* Header */}
            <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
            
            {/* Main Content */}
            <main className="flex flex-1 overflow-hidden">
                {/* Sidebar - Conversation List */}
                <aside className={`w-full md:w-96 flex-col border-r border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark transition-all duration-300 ${
                    isChatVisible ? 'hidden md:flex' : 'flex'
                }`}>
                    {/* Header */}
                    <div className="p-4 border-b border-border-light dark:border-border-dark">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold">Messages</h2>
                            {/* <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                                <span className="material-symbols-outlined text-xl">compose</span>
                            </button> */}
                        </div>

                        {/* Search */}
                        <div className="relative mb-3 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark transition-all duration-300 focus-within:border-green-500 focus-within:border-2 focus-within:shadow-lg focus-within:shadow-green-500/20">
                            <span className="material-symbols-outlined text-base absolute left-3 top-1/2 -translate-y-1/2 text-white transition-colors duration-300 pointer-events-none">search</span>
                            <input
                                className="w-full rounded-full bg-transparent border-none px-10 py-2 text-sm focus:ring-0 focus:outline-0 transition-all text-white placeholder:text-white/60"
                                placeholder="Search conversations"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-2">
                            {['all', 'unread'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setFilterType(filter)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                        filterType === filter
                                            ? 'bg-primary text-white'
                                            : 'bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10'
                                    }`}
                                >
                                    {filter === 'all' ? 'All' : 'Unread'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                                    {filteredConversations.length > 0 ? (
                                        filteredConversations.map(convo => (
                                            <ConversationItem
                                                key={convo.id}
                                                convo={convo}
                                                isActive={convo.id === activeConvoId}
                                                onSelect={() => handleSelectConvo(convo.id)}
                                                onAvatarClick={() => convo.otherParticipantId && navigate(`/profile/${convo.otherParticipantId}`)}
                                            />
                                        ))
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-white">
                                            <p className="text-sm">No conversations yet</p>
                                        </div>
                                    )}
                                </div>
                </aside>

                {/* Main Chat Area */}
                <section className={`flex-1 flex flex-col bg-background-light dark:bg-background-dark transition-all duration-300 ${
                    isChatVisible ? 'flex' : 'hidden md:flex'
                }`}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between gap-4 border-b border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark p-4 shrink-0">
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Back Button (Mobile) */}
                                    <button
                                        onClick={() => setIsChatVisible(false)}
                                        className="md:hidden flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>

                                    {/* User Avatar & Info */}
                                    <div className="relative">
                                        <div
                                            style={{ backgroundImage: `url(${activeConversation.avatarUrl})` }}
                                            className="bg-center bg-cover rounded-full size-12"
                                        />
                                        {activeConversation.isOnline && (
                                            <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-panel-dark" />
                                        )}
                                    </div>

                                    {/* Name & Status */}
                                    <div>
                                        <h3 className="font-bold text-base">{activeConversation.name}</h3>
                                        <p className={`text-xs ${
                                            activeConversation.isOnline
                                                ? 'text-green-500 font-medium'
                                                : 'text-text-secondary-light dark:text-text-secondary-dark'
                                        }`}>
                                            {activeConversation.isOnline ? 'Active now' : 'Offline'}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors text-text-secondary-light dark:text-text-secondary-dark">
                                        <span className="material-symbols-outlined">call</span>
                                    </button>
                                    <button
                                        onClick={() => setShowConvoInfo(!showConvoInfo)}
                                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors text-text-secondary-light dark:text-text-secondary-dark"
                                    >
                                        <span className="material-symbols-outlined">info</span>
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div
                                ref={messagesRef}
                                className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col"
                            >
                                {messages.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-text-secondary-light dark:text-text-secondary-dark">
                                        <div className="text-center">
                                            <span className="material-symbols-outlined text-5xl opacity-20 block mb-2">mail</span>
                                            <p className="text-sm">No messages yet. Start the conversation!</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <MessageBubble
                                            key={msg.id}
                                            message={msg}
                                            senderAvatar={activeConversation?.avatarUrl}
                                            isMe={user && msg.senderId === user.uid}
                                            onAvatarClick={() => navigate(`/profile/${msg.senderId}`)}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Message Input Area */}
                            <div className="border-t border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark p-4 shrink-0 space-y-3">
                                {selectedFile && (
                                    <div className="flex items-center gap-2 p-2 bg-background-light dark:bg-background-dark rounded-lg">
                                        <span className="material-symbols-outlined text-sm">attachment</span>
                                        <span className="text-sm flex-1 truncate font-medium">{selectedFile.name}</span>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors text-text-secondary-light dark:text-text-secondary-dark disabled:opacity-50"
                                        disabled={isUploading}
                                    >
                                        <span className="material-symbols-outlined">attach_file</span>
                                    </button>

                                    <input
                                        className="flex-1 rounded-full bg-background-light dark:bg-background-dark border-none px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-0 disabled:opacity-50 transition-all text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark"
                                        placeholder="Type a message..."
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !isUploading && handleSendMessage()}
                                        disabled={isUploading}
                                    />

                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isUploading || (!newMessage.trim() && !selectedFile)}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 font-bold"
                                    >
                                        <span className="material-symbols-outlined">{isUploading ? 'schedule' : 'send'}</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-white text-6xl opacity-20 block mb-4">mail</span>
                                <h3 className="text-xl text-white font-bold mb-2">Select a conversation</h3>
                                <p className="text-white text-sm">
                                    Choose a conversation from the list to start messaging
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Conversation Info Panel (Right Sidebar) */}
                {showConvoInfo && activeConversation && (
                    <div className="w-72 border-l border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark p-4 overflow-y-auto hidden md:block">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold">Details</h3>
                            <button
                                onClick={() => setShowConvoInfo(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>

                        {/* User Card */}
                        <div className="text-center mb-6 pb-6 border-b border-border-light dark:border-border-dark">
                            <div
                                style={{ backgroundImage: `url(${activeConversation.avatarUrl})` }}
                                className="bg-center bg-cover rounded-full size-20 mx-auto mb-3"
                            />
                            <h4 className="font-bold text-base">{activeConversation.name}</h4>
                            {activeConversation.gender && <GenderBadge gender={activeConversation.gender} />}
                            <p className={`text-xs mt-2 ${activeConversation.isOnline ? 'text-green-500' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                                {activeConversation.isOnline ? 'Online' : 'Offline'}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark">
                                <span className="material-symbols-outlined">person</span>
                                <span className="text-sm font-medium">View Profile</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="text-sm font-medium">Mute</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-red-500">
                                <span className="material-symbols-outlined">block</span>
                                <span className="text-sm font-medium">Block</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    ); 
} 
 
export default InboxPage; 


