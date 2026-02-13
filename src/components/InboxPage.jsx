import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import useVerified from '../hooks/useVerified';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc, serverTimestamp, deleteDoc, setDoc, increment, getDocs } from 'firebase/firestore';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import GenderBadge from './GenderBadge';
import { getDefaultAvatar } from '../services/avatarService';
import { notifyNewMessage, trackConversationView, untrackConversationView } from '../services/notificationService';
import { getConnections } from '../services/profileService';
import { searchGifs } from '../services/giphyService';

const MY_AVATAR_URL = null;

// --- Conversation Item Component ---
const ConversationItem = ({ convo, isActive, onSelect, onAvatarClick }) => (
    <div
        onClick={onSelect}
        className={`flex cursor-pointer items-center gap-3 px-3 py-3 transition-all duration-300 relative group animate-fade-in border-l-4 ${
            isActive 
                ? 'bg-primary/15 border-primary' 
                : 'border-transparent hover:bg-background-light dark:hover:bg-background-dark/50 hover:border-primary/30'
        }`}
    >
        <div className="flex items-center gap-3 w-full min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
                <div 
                    onClick={(e) => { e.stopPropagation(); onAvatarClick?.(); }} 
                    style={{ backgroundImage: `url(${convo.avatarUrl})` }} 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-11 shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all duration-200"
                />
                {convo.isOnline && <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-background-dark animate-pulse-soft" />}
            </div>
            
            {/* Content */}
            <div className="flex flex-col justify-center min-w-0 flex-1">
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <p className={`text-sm truncate transition-all duration-200 ${isActive || convo.unreadCount > 0 ? 'font-bold text-text-primary-light dark:text-text-primary-dark' : 'font-medium text-text-primary-light dark:text-text-primary-dark'}`}>
                            {convo.name}
                        </p>
                        {convo.gender && <GenderBadge gender={convo.gender} size="xs" className="shrink-0" />}
                    </div>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark shrink-0 whitespace-nowrap">
                        {convo.timestamp}
                    </p>
                </div>
                <p className={`text-xs truncate transition-all duration-200 ${isActive ? 'text-text-primary-light dark:text-text-primary-dark font-medium' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                    {convo.lastMessage}
                </p>
            </div>
            
            {/* Unread Badge */}
            {convo.unreadCount > 0 && (
                <div className="shrink-0 flex size-5 items-center justify-center rounded-full bg-accent text-white text-xs font-bold animate-pulse-soft">
                    {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                </div>
            )}
        </div>
    </div>
);

// --- Message Bubble Component ---
const MessageBubble = ({ message, senderAvatar, isMe, onAvatarClick, senderName }) => {
    const [showReactions, setShowReactions] = useState(false);
    const reactions = message.reactions || {};
    const reactionCounts = Object.values(reactions).reduce((acc, uids) => acc + (uids?.length || 0), 0);

    return (
        <div className={`flex items-end gap-2 group ${isMe ? 'flex-row-reverse' : ''} animate-slide-up`}>
            <div 
                onClick={(e) => { e.stopPropagation(); onAvatarClick?.(); }} 
                style={{ backgroundImage: `url(${isMe ? MY_AVATAR_URL : senderAvatar})` }} 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            />
            <div className={`max-w-xs sm:max-w-sm md:max-w-md ${isMe ? 'flex flex-col items-end' : ''}`}>
                {!isMe && senderName && (
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1 ml-2 font-medium">
                        {senderName}
                    </p>
                )}
                <div className={`p-2 sm:p-3 rounded-2xl break-words transition-all duration-200 hover:shadow-md ${
                    isMe 
                        ? 'rounded-br-none bg-primary text-white' 
                        : 'rounded-bl-none bg-gray-200 dark:bg-gray-700 text-text-primary-light dark:text-text-primary-dark'
                }`}>
                    {message.text && <p className="text-xs sm:text-sm">{message.text}</p>}
                    {message.gifUrl && (
                        <div className="mt-2">
                            <img src={message.gifUrl} alt="GIF" className="max-w-xs rounded-lg max-h-64 animate-fade-in" />
                        </div>
                    )}
                    {message.fileUrl && (
                        <div className="mt-2">
                            {message.fileType?.startsWith('image/') ? (
                                <img src={message.fileUrl} alt="attachment" className="max-w-xs rounded-lg max-h-64 animate-fade-in" />
                            ) : (
                                <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs sm:text-sm underline hover:opacity-75 transition-opacity">
                                    <span className="material-symbols-outlined text-base">download</span>
                                    {message.fileName || 'File'}
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Reactions Display */}
                {reactionCounts > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                        {Object.entries(reactions).map(([emoji, userIds]) => 
                            userIds?.length > 0 && (
                                <button
                                    key={emoji}
                                    onClick={() => setShowReactions(!showReactions)}
                                    className="bg-gray-300 dark:bg-gray-600 px-1.5 py-0.5 rounded-full text-xs hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                    title={`${userIds.length} person(s) reacted`}
                                >
                                    {emoji} {userIds.length > 1 && userIds.length}
                                </button>
                            )
                        )}
                    </div>
                )}

                {/* Timestamp & Read Receipt */}
                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'flex-row-reverse mr-2' : 'ml-2'}`}>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {message.createdAt ? new Date(message.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                    {isMe && (
                        <span className={`text-xs ${message.readAt ? 'text-blue-500' : 'text-gray-400'}`} title={message.readAt ? 'Read' : 'Delivered'}>
                            {message.readAt ? '✓✓' : '✓'}
                        </span>
                    )}
                </div>

                {/* Reaction Picker Button */}
                <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-sm mt-1 hover:text-primary"
                    title="Add reaction"
                >
                    😊
                </button>
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
    const [perUserConversations, setPerUserConversations] = useState([]);
    const [connectionsList, setConnectionsList] = useState([]);
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
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [gifOpen, setGifOpen] = useState(false);
    const [gifQuery, setGifQuery] = useState('');
    const [gifResults, setGifResults] = useState([]);
    const [gifLoading, setGifLoading] = useState(false);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (u) => {
            setUser(u);
        });
        return () => unsubAuth();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        let mounted = true;

        (async () => {
            try {
                const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid), orderBy('lastTimestamp', 'desc'));
                const unsub = onSnapshot(q, async (snap) => {
                    const promises = snap.docs.map(async (d) => {
                        const data = d.data();
                        const otherParticipantId = data.participants?.find(p => p !== user.uid);
                        let name = 'Unknown';
                        let avatarUrl = null;
                        let gender = null;

                        if (otherParticipantId) {
                            try {
                                const otherUserDoc = await getDoc(doc(db, 'users', otherParticipantId));
                                if (otherUserDoc.exists()) {
                                    const userData = otherUserDoc.data();
                                    name = userData.displayName || (userData.email || '').split('@')[0] || 'User';
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
                        if (!mounted) return;
                        setConversations(items);
                    });
                }, (err) => console.error('Conversations subscription error', err));
                return () => unsub();
            } catch (err) {
                console.error('Error setting up conversations listener:', err);
            }
        })();

        return () => { mounted = false; };
    }, [user]);

    // Listen to per-user mirrored conversations (users/{uid}/conversations)
    useEffect(() => {
        if (!user) return;
        const col = collection(db, 'users', user.uid, 'conversations');
        const unsub = onSnapshot(col, (snap) => {
            console.log('Per-user conversations snapshot received, count:', snap.size);
            const items = snap.docs.map(d => {
                const data = d.data();
                console.log('Per-user convo doc:', d.id, data);
                return {
                    id: d.id,
                    ...data,
                    // ensure consistent shape with top-level conversations
                    otherParticipantId: (data.participants || []).find(p => p !== user.uid) || null,
                    name: data.name || '',
                    avatarUrl: data.avatarUrl || null,
                    gender: data.gender || null,
                    timestamp: data.lastTimestamp ? (data.lastTimestamp.toDate ? new Date(data.lastTimestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '') : '',
                    unreadCount: data.unreadCount || 0,
                };
            });
            setPerUserConversations(items);
        }, (err) => console.error('Per-user conversations subscription error', err));

        return () => unsub();
    }, [user]);

    // Fetch accepted connections and merge into the left list as "quick start" items
    useEffect(() => {
        let mounted = true;
        if (!user) return;
        (async () => {
            try {
                const conns = await getConnections(user.uid);
                if (!mounted) return;
                // normalize connection entries
                const normalized = conns.map(c => ({
                    id: `conn:${c.id}`,
                    userId: c.id,
                    name: c.displayName || (c.email || '').split('@')[0] || 'User',
                    avatarUrl: c.avatarUrl || getDefaultAvatar(c.gender || 'male'),
                    gender: c.gender || null,
                    lastMessage: '',
                    lastTimestamp: null,
                    unreadCount: 0,
                    isConnectionOnly: true,
                    isOnline: c.isOnline || false,
                }));
                setConnectionsList(normalized);
            } catch (err) {
                console.warn('Failed to load connections for inbox:', err);
            }
        })();
        return () => { mounted = false; };
    }, [user]);

    // Handle recipientId or convo query parameter (when clicking Message from profile or product)
    const location = useLocation();
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const recipientId = params.get('recipientId');
        const convoParam = params.get('convo');

        if (!user) return;

        // If convo id supplied, open it directly
        if (convoParam) {
            (async () => {
                try {
                    const convoDoc = await getDoc(doc(db, 'conversations', convoParam));
                    if (convoDoc.exists()) {
                        setActiveConvoId(convoParam);
                        setIsChatVisible(true);
                        try { await updateDoc(doc(db, 'conversations', convoParam), { unreadCount: 0 }); } catch (e) { }
                        return;
                    }
                } catch (err) {
                    console.error('Failed to open conversation from convo param:', err);
                }
            })();
            return;
        }

        if (!recipientId) return;

        (async () => {
            try {
                // Query conversations where current user is a participant and look for a convo that includes recipientId
                const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid));
                const snap = await getDocs(q);
                let existing = null;
                snap.forEach(d => {
                    const data = d.data();
                    const parts = data.participants || [];
                    if (parts.includes(recipientId)) {
                        existing = { id: d.id, ...data };
                    }
                });

                if (existing) {
                    setActiveConvoId(existing.id);
                    setIsChatVisible(true);
                    try {
                        await updateDoc(doc(db, 'conversations', existing.id), { unreadCount: 0 });
                    } catch (err) {
                        console.warn('Failed to mark conversation as read:', err);
                    }
                    return;
                }

                // No existing conversation found — create one on-demand
                // Write to both top-level conversations and per-user mirrors
                const convoRef = await addDoc(collection(db, 'conversations'), {
                    participants: [user.uid, recipientId],
                    lastMessage: '',
                    lastTimestamp: serverTimestamp(),
                    unreadCount: 0,
                });

                const convoId = convoRef.id;
                const convoPayload = {
                    convoId,
                    participants: [user.uid, recipientId],
                    lastMessage: '',
                    lastTimestamp: serverTimestamp(),
                    unreadCount: 0,
                };

                // Mirror to both participants' users/{uid}/conversations
                try {
                    await setDoc(doc(db, 'users', user.uid, 'conversations', convoId), convoPayload, { merge: true });
                    await setDoc(doc(db, 'users', recipientId, 'conversations', convoId), convoPayload, { merge: true });
                } catch (err) {
                    console.warn('Failed to create per-user conversation mirrors:', err);
                }

                setActiveConvoId(convoId);
                setIsChatVisible(true);
            } catch (err) {
                console.error('Failed to open/create conversation from profile recipientId:', err);
            }
        })();
    }, [location.search, user]);

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

    // Track when user is viewing this conversation (for notification logic)
    useEffect(() => {
        if (!activeConvoId || !user) return;
        
        // Mark user as viewing this conversation
        trackConversationView(activeConvoId, user.uid);
        
        // Cleanup: unmark when conversation changes or component unmounts
        return () => {
            untrackConversationView(activeConvoId, user.uid);
        };
    }, [activeConvoId, user]);

    const mergedConversations = useMemo(() => {
        // Merge top-level conversations and per-user mirrored conversations only (no connection quick-start items)
        const top = conversations || [];
        const mirrors = perUserConversations || [];

        // Index top-level by id for quick lookup
        const byId = new Map();
        top.forEach(c => {
            console.log('Adding top-level conversation:', c.id, { name: c.name, lastMessage: c.lastMessage });
            byId.set(c.id, { ...c, source: 'top' });
        });

        // Add mirrors if not present; if present, merge missing fields
        mirrors.forEach(m => {
            console.log('Adding mirrored conversation:', m.id, { name: m.name, lastMessage: m.lastMessage });
            const existing = byId.get(m.id);
            if (existing) {
                byId.set(m.id, { ...m, ...existing });
            } else {
                byId.set(m.id, { ...m, source: 'mirror' });
            }
        });

        // Convert map to array
        let combined = Array.from(byId.values());
        console.log('Merged conversations count:', combined.length, combined.map(c => ({ id: c.id, name: c.name })));

        // Sort by timestamp if available (fallback to unchanged order)
        combined.sort((a, b) => {
            const ta = a.lastTimestamp && a.lastTimestamp.toDate ? a.lastTimestamp.toDate().getTime() : (a.lastTimestamp ? a.lastTimestamp : 0);
            const tb = b.lastTimestamp && b.lastTimestamp.toDate ? b.lastTimestamp.toDate().getTime() : (b.lastTimestamp ? b.lastTimestamp : 0);
            return (tb || 0) - (ta || 0);
        });

        return combined;
    }, [conversations, perUserConversations]);

    const filteredConversations = useMemo(() => mergedConversations.filter(c => {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch = !q || (c.title || c.name || '').toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q);
        
        if (filterType === 'unread') {
            return matchesSearch && c.unreadCount > 0;
        } else if (filterType === 'archived') {
            return matchesSearch && c.isArchived;
        }
        return matchesSearch;
    }), [mergedConversations, searchTerm, filterType]);

    const handleSelectConvo = (id) => {
        // If this is a connection-only entry (no conversation yet), create a conversation document first
        if (id && id.startsWith && id.startsWith('conn:')) {
            const otherId = id.split(':')[1];
            (async () => {
                try {
                    // create conversation doc in both places
                    const convoRef = await addDoc(collection(db, 'conversations'), {
                        participants: [user.uid, otherId],
                        lastMessage: '',
                        lastTimestamp: serverTimestamp(),
                        unreadCount: 0,
                    });

                    const convoId = convoRef.id;
                    const convoPayload = {
                        convoId,
                        participants: [user.uid, otherId],
                        lastMessage: '',
                        lastTimestamp: serverTimestamp(),
                        unreadCount: 0,
                    };

                    // Mirror to both participants' users/{uid}/conversations
                    try {
                        await setDoc(doc(db, 'users', user.uid, 'conversations', convoId), convoPayload, { merge: true });
                        await setDoc(doc(db, 'users', otherId, 'conversations', convoId), convoPayload, { merge: true });
                    } catch (err) {
                        console.warn('Failed to create per-user conversation mirrors:', err);
                    }

                    setActiveConvoId(convoId);
                    setIsChatVisible(true);
                } catch (err) {
                    console.error('Failed to create conversation for connection:', err);
                }
            })();
            return;
        }
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
                            if (user && activeConvoId) { deleteDoc(doc(db, 'conversations', activeConvoId, 'typing', user.uid)).catch(()=>{}); }
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
            if (user && activeConvoId) { deleteDoc(doc(db, 'conversations', activeConvoId, 'typing', user.uid)).catch(()=>{}); }
            setSelectedFile(null);
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setIsUploading(false);
        }
    };

    // --- Typing presence: write ephemeral doc and listen to others ---
    const typingTimeoutRef = useRef(null);
    const lastTypingAtRef = useRef(0);

    const writeTyping = async () => {
        if (!user || !activeConvoId) return;
        const now = Date.now();
        lastTypingAtRef.current = now;
        try {
            await setDoc(doc(db, 'conversations', activeConvoId, 'typing', user.uid), {
                lastActive: serverTimestamp(),
            });
        } catch (err) {
            console.warn('Failed to write typing presence', err);
        }

        // schedule clearing after 4s of inactivity
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(async () => {
            const elapsed = Date.now() - lastTypingAtRef.current;
            if (elapsed >= 3500) {
                try { await deleteDoc(doc(db, 'conversations', activeConvoId, 'typing', user.uid)); } catch (e) { }
            }
        }, 4000);
    };

    useEffect(() => {
        if (!activeConvoId) return;
        const typingCol = collection(db, 'conversations', activeConvoId, 'typing');
        const unsubTyping = onSnapshot(typingCol, (snap) => {
            const map = {};
            const now = Date.now();
            snap.docs.forEach(d => {
                const id = d.id;
                const data = d.data();
                const lastActive = data?.lastActive?.toMillis ? data.lastActive.toMillis() : (data?.lastActive ? data.lastActive : 0);
                // consider typing if lastActive within 5s
                if (lastActive && (now - lastActive) < 5000 && id !== user?.uid) {
                    map[id] = true;
                }
            });
            setTypingUsers(map);
        }, (err) => console.warn('Typing presence listen error', err));

        return () => {
            unsubTyping();
            // clear our typing doc when switching convo
            if (user && activeConvoId) {
                deleteDoc(doc(db, 'conversations', activeConvoId, 'typing', user.uid)).catch(() => {});
            }
        };
    }, [activeConvoId, user]);

    // Send a GIF message (selected from GIPHY results)
    const handleSendGif = async (url) => {
        if (!user || !activeConvoId) return;
        setGifOpen(false);
        setGifQuery('');
        setGifResults([]);
        setNewMessage('');
        if (user && activeConvoId) { deleteDoc(doc(db, 'conversations', activeConvoId, 'typing', user.uid)).catch(()=>{}); }
        setSelectedFile(null);
        setIsUploading(true);
        try {
            await addDoc(collection(db, `conversations/${activeConvoId}/messages`), {
                text: '',
                gifUrl: url,
                senderId: user.uid,
                createdAt: serverTimestamp()
            });

            // Update conversation metadata and increment unread
            try {
                const convoDoc = await getDoc(doc(db, 'conversations', activeConvoId));
                if (convoDoc.exists()) {
                    const participants = convoDoc.data().participants || [];
                    const recipientId = participants.find(p => p !== user.uid);
                    await updateDoc(doc(db, 'conversations', activeConvoId), {
                        lastMessage: '📷 GIF',
                        lastTimestamp: serverTimestamp(),
                        lastSenderId: user.uid,
                        unreadCount: increment(1),
                    });

                    if (recipientId) {
                        try {
                            await notifyNewMessage(recipientId, {
                                conversationId: activeConvoId,
                                senderId: user.uid,
                                senderName: user.displayName || user.email?.split('@')?.[0] || 'User',
                                senderAvatar: null,
                                messagePreview: '📷 GIF',
                            });
                        } catch (notifErr) {
                            console.warn('Failed to send notification for GIF', notifErr);
                        }
                    }
                }
            } catch (metaErr) {
                console.warn('Failed to update conversation metadata for GIF', metaErr);
            }
        } catch (err) {
            console.error('Failed to send GIF', err);
        } finally {
            setIsUploading(false);
        }
    };

    // derive activeConversation object
    const activeConversation = useMemo(() => conversations.find(c => c.id === activeConvoId) || null, [conversations, activeConvoId]);

    // Calculate total unread count across all conversations (including mirrors and connections)
    const totalUnreadCount = useMemo(() => {
        return mergedConversations.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0);
    }, [mergedConversations]);

    // Export unread count to parent (App.jsx) via window or callback if needed
    useEffect(() => {
        window.inboxUnreadCount = totalUnreadCount;
    }, [totalUnreadCount]);

    return (
        <div className={`flex h-screen w-full flex-col bg-background-light dark:bg-background-dark ${darkMode ? 'text-white' : 'text-text-primary-light'} font-display`}>
            {/* Header */}
            <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
            
            {/* Main Content */}
            <main className="flex flex-1 overflow-auto">
                {/* Sidebar - Conversation List */}
                <aside className={`w-full sm:w-80 md:w-96 flex-col border-r border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark transition-all duration-300 transform ${
                    isChatVisible ? 'hidden md:flex' : 'flex'
                }`}>
                    {/* Header */}
                    <div className="p-3 sm:p-4 border-b border-border-light dark:border-border-dark">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold\">Messages</h2>
                            {/* <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                                <span className="material-symbols-outlined text-xl">compose</span>
                            </button> */}
                        </div>

                        {/* Search */}
                        <div className="relative mb-3 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark transition-all duration-300 focus-within:border-green-500 focus-within:border-2 focus-within:shadow-lg focus-within:shadow-green-500/20">
                            <span className="material-symbols-outlined text-base absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-white transition-colors duration-300 pointer-events-none">search</span>
                            <input
                                className="w-full rounded-full bg-transparent border-none px-10 py-2 text-sm focus:ring-0 focus:outline-0 transition-all text-text-primary-light dark:text-white placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark"
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
                    <div className="flex-1 overflow-y-auto animate-fade-in">
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
                                        <div className="flex h-full items-center justify-center text-text-primary-light dark:text-white">
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
                                            {Object.keys(typingUsers || {}).length > 0 ? 'Typing...' : (activeConversation.isOnline ? 'Active now' : 'Offline')}
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
                                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col"
                            >
                                {messages.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-text-secondary-light dark:text-text-secondary-dark animate-fade-in">
                                        <div className="text-center">
                                            <span className="material-symbols-outlined text-5xl opacity-20 block mb-2">mail</span>
                                            <p className="text-sm">No messages yet. Start the conversation!</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {messages.map(msg => (
                                            <MessageBubble
                                                key={msg.id}
                                                message={msg}
                                                senderAvatar={activeConversation?.avatarUrl}
                                                isMe={user && msg.senderId === user.uid}
                                                onAvatarClick={() => navigate(`/profile/${msg.senderId}`)}
                                            />
                                        ))}
                                        {Object.keys(typingUsers || {}).length > 0 && (
                                            <div className="flex items-end gap-2 animate-fade-in">
                                                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0" />
                                                <div className="max-w-xs md:max-w-md">
                                                    <div className="p-3 rounded-2xl rounded-bl-none bg-gray-200 dark:bg-gray-700 flex items-center gap-1.5">
                                                        <span className="size-2 rounded-full bg-text-secondary-light dark:bg-text-secondary-dark animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                        <span className="size-2 rounded-full bg-text-secondary-light dark:bg-text-secondary-dark animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                        <span className="size-2 rounded-full bg-text-secondary-light dark:bg-text-secondary-dark animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Message Input Area */}
                            <div className="relative border-t border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark p-3 sm:p-4 shrink-0 space-y-2 sm:space-y-3">
                                {selectedFile && (
                                    <div className="flex items-center gap-2 p-2 bg-background-light dark:bg-background-dark rounded-lg animate-fade-in">
                                        <span className="material-symbols-outlined text-sm">attachment</span>
                                        <span className="text-xs sm:text-sm flex-1 truncate font-medium">{selectedFile.name}</span>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-end gap-1 sm:gap-1.5 md:gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setEmojiOpen(!emojiOpen)}
                                        className="flex h-8 sm:h-9 md:h-10 lg:h-11 w-8 sm:w-9 md:w-10 lg:w-11 items-center justify-center rounded-full hover:bg-primary/10 transition-colors text-text-secondary-light dark:text-text-secondary-dark shrink-0 text-lg sm:text-xl"
                                    >
                                        😊
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setGifOpen(!gifOpen)}
                                        className="flex h-8 sm:h-9 md:h-10 lg:h-11 w-8 sm:w-9 md:w-10 lg:w-11 items-center justify-center rounded-full hover:bg-primary/10 transition-colors text-text-secondary-light dark:text-text-secondary-dark shrink-0 text-xs sm:text-sm font-bold"
                                    >
                                        GIF
                                    </button>

                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex h-8 sm:h-9 md:h-10 lg:h-11 w-8 sm:w-9 md:w-10 lg:w-11 items-center justify-center rounded-full hover:bg-primary/10 transition-colors text-text-secondary-light dark:text-text-secondary-dark disabled:opacity-50 shrink-0"
                                        disabled={isUploading}
                                    >
                                        <span className="material-symbols-outlined text-base sm:text-lg md:text-xl">attach_file</span>
                                    </button>

                                    <textarea
                                        className="flex-1 resize-none rounded-xl bg-white dark:bg-background-dark border border-border-light dark:border-border-dark px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-0 disabled:opacity-50 transition-all text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => { setNewMessage(e.target.value); writeTyping(); }}
                                        onBlur={() => { if (user && activeConvoId) { deleteDoc(doc(db, 'conversations', activeConvoId, 'typing', user.uid)).catch(()=>{}); } }}
                                        rows={1}
                                        disabled={isUploading}
                                    />

                                    { (newMessage.trim() || selectedFile) ? (
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={isUploading || (!newMessage.trim() && !selectedFile)}
                                            className="flex h-8 sm:h-9 md:h-10 lg:h-11 w-8 sm:w-9 md:w-10 lg:w-11 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 font-bold"
                                        >
                                            <span className="material-symbols-outlined text-base sm:text-lg md:text-xl">{isUploading ? 'schedule' : 'send'}</span>
                                        </button>
                                    ) : (
                                        <button className="flex h-8 sm:h-9 md:h-10 lg:h-11 w-8 sm:w-9 md:w-10 lg:w-11 items-center justify-center rounded-full hover:bg-primary/10 transition-colors text-text-secondary-light dark:text-text-secondary-dark shrink-0">
                                            <span className="material-symbols-outlined text-base sm:text-lg md:text-xl">keyboard_voice</span>
                                        </button>
                                    )}
                                </div>

                                {/* Emoji Picker */}
                                {emojiOpen && (
                                    <div className="absolute bottom-20 left-6 bg-panel-light dark:bg-panel-dark p-2 rounded-lg shadow-lg">
                                        {['😀','😂','😍','😅','😭','👍','🔥','🎉','🙌','🤝'].map(em => (
                                            <button key={em} onClick={() => { setNewMessage(prev => prev + em); setEmojiOpen(false); }} className="p-2 text-lg">{em}</button>
                                        ))}
                                    </div>
                                )}

                                {/* GIF Picker (GIPHY search) */}
                                {gifOpen && (
                                    <div className="absolute bottom-20 left-2 right-2 sm:left-20 sm:w-96 bg-panel-light dark:bg-panel-dark p-3 rounded-lg shadow-lg max-h-80 overflow-auto z-50 animate-fade-in">
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                value={gifQuery}
                                                onChange={(e) => setGifQuery(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runGifSearch(); } }}
                                                placeholder="Search GIFs"
                                                className="flex-1 rounded px-3 py-2 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark"
                                            />
                                            <button onClick={runGifSearch} className="px-3 py-2 rounded bg-primary text-white text-sm hover:bg-primary/90 transition-all">Search</button>
                                        </div>
                                        {gifLoading ? (
                                            <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center py-4">Searching...</div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-2">
                                                {gifResults.length > 0 ? gifResults.map(g => (
                                                    <img key={g.id} src={g.preview || g.url} className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity animate-fade-in" onClick={() => handleSendGif(g.url)} />
                                                )) : (
                                                    <div className="col-span-3 text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">No GIFs found. Try another search.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-text-secondary-light dark:text-white text-6xl opacity-20 block mb-4">mail</span>
                                <h3 className="text-lg sm:text-xl text-text-primary-light dark:text-white font-bold mb-2">Select a conversation</h3>
                                <p className="text-text-primary-light dark:text-white text-xs sm:text-sm">
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


