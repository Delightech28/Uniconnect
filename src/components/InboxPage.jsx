import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import useVerified from '../hooks/useVerified';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const MY_AVATAR_URL = null; // will load from auth user profile

// --- Helper Components ---
const AppHeader = () => (
        <header className="flex shrink-0 items-center justify-between 
whitespace-nowrap border-b border-solid border-border-light 
dark:border-border-dark px-6 sm:px-10 py-3 bg-panel-light 
dark:bg-panel-dark">
                {/* Header content... */}
        </header>
);
 
const ConversationItem = ({ convo, isActive, onSelect }) => (
    <div
        onClick={onSelect}
        className={`flex cursor-pointer items-center gap-4 px-4 py-3 min-h-[72px] justify-between ${isActive ? 'bg-primary/20 border-l-4 border-primary' : 'hover:bg-background-light dark:hover:bg-background-dark'}`}
    >
        <div className="flex items-center gap-3 w-full min-w-0">
            <div style={{ backgroundImage: `url(${convo.avatarUrl})` }} className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 shrink-0" />
            <div className="flex flex-col justify-center min-w-0 flex-1">
                <div className="flex justify-between items-center">
                    <p className={`text-base truncate ${isActive || convo.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>{convo.name}</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark shrink-0">{convo.timestamp}</p>
                </div>
                <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm truncate ${isActive ? 'text-text-primary-light dark:text-text-primary-dark' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>{convo.lastMessage}</p>
                    {convo.unreadCount > 0 && (
                        <div className="shrink-0 flex size-5 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">{convo.unreadCount}</div>
                    )}
                </div>
            </div>
        </div>
    </div>
); 
 
const MessageBubble = ({ message, senderAvatar, isMe }) => {
    return (
        <div className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
            <div style={{ backgroundImage: `url(${isMe ? (message.myAvatar || MY_AVATAR_URL) : senderAvatar})` }} className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0" />
            <div className="max-w-xs space-y-1 md:max-w-md">
                <div className={`p-3 rounded-xl ${isMe ? 'rounded-br-none bg-primary text-white' : 'rounded-bl-none bg-panel-light dark:bg-panel-dark'}`}>
                    {message.text && <p className="text-sm">{message.text}</p>}
                    {message.fileUrl && (
                        <div className="mt-2">
                            {message.fileType?.startsWith('image/') ? (
                                <img src={message.fileUrl} alt="attachment" className="max-w-xs rounded-lg max-h-64" />
                            ) : (
                                <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline hover:opacity-75">
                                    <span className="material-symbols-outlined text-base">download</span>
                                    <span className="text-sm">{message.fileName || 'File'}</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <p className={`text-xs text-text-secondary-light dark:text-text-secondary-dark ${isMe ? 'text-right' : ''}`}>{message.createdAt && new Date(message.createdAt.toDate()).toLocaleString()}</p>
            </div>
        </div>
    );
}; 
 
// --- Main Page Component --- 
function InboxPage() {
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConvoId, setActiveConvoId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const messagesRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (u) => {
            setUser(u);
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
                let avatarUrl = data.avatarUrl || '/default_avatar.png';

                // If name is still "Unknown", try to fetch from the other participant's user doc
                if (name === 'Unknown' && data.participants && user.uid) {
                    const otherParticipantId = data.participants.find((p) => p !== user.uid);
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
                                console.log('Fetched missing seller info for conversation:', name); // Debug
                            }
                        } catch (err) {
                            console.warn('Failed to fetch other participant info:', err);
                        }
                    }
                }

                return {
                    id: d.id,
                    ...data,
                    name,
                    avatarUrl,
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
        if (!q) return true;
        return (c.title || c.name || '').toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q);
    }), [conversations, searchTerm]);

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
                            
                            // Update conversation metadata
                            try {
                                const convoDoc = await getDoc(doc(db, 'conversations', activeConvoId));
                                if (convoDoc.exists()) {
                                    await updateDoc(doc(db, 'conversations', activeConvoId), {
                                        lastMessage: newMessage.trim() || '📎 File sent',
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
        <div className="flex h-screen w-full flex-col bg-background-light 
        dark:bg-background-dark text-text-primary-light 
        dark:text-text-primary-dark font-display"> 
            <main className="flex flex-1 overflow-hidden"> 
                {/* Conversation List (Sidebar) */} 
 
 
                <aside className={`w-full flex-col border-r border-solid 
border-border-light dark:border-border-dark bg-panel-light 
dark:bg-panel-dark md:w-2/5 lg:w-1/3 xl:w-1/4 ${isChatVisible ? 'hidden' 
: 'flex'} md:flex`}> 
                    <div className="flex items-center justify-between p-4 
border-b border-solid border-border-light dark:border-border-dark"> 
                        <h1 className="text-xl font-bold">Inbox</h1> 
                        <button className="flex h-10 w-10 items-center 
justify-center rounded-lg hover:bg-primary/10"> 
                            <span className="material-symbols-outlined text-2xl 
text-text-secondary-light 
dark:text-text-secondary-dark">edit_square</span> 
                        </button> 
                    </div> 
                    <div className="p-4"> 
                        <div className="relative"> 
                            <span className="material-symbols-outlined text-xl 
absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary-light 
dark:text-text-secondary-dark">search</span> 
                            <input  
                                className="form-input w-full rounded-lg 
border-none bg-background-light dark:bg-background-dark text-sm 
focus:outline-0 focus:ring-2 focus:ring-primary h-11 pl-12 
placeholder:text-text-secondary-light 
dark:placeholder:text-text-secondary-dark"  
                                placeholder="Search by name or keyword"  
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            /> 
                        </div> 
                    </div> 
                    <div className="flex-1 overflow-y-auto"> 
                        {filteredConversations.map(convo => ( 
                            <ConversationItem  
                                key={convo.id}  
                                convo={convo} 
                                isActive={convo.id === activeConvoId} 
 

                                onSelect={() => handleSelectConvo(convo.id)} 
                            /> 
                        ))} 
                    </div> 
                </aside> 
 
                {/* Chat Window */} 
                <section className={`w-full flex-col bg-background-light 
dark:bg-background-dark ${isChatVisible ? 'flex' : 'hidden'} md:flex`}> 
                    {activeConversation ? ( 
                        <div className="flex h-full flex-col"> 
                            {/* Chat Header */} 
                            <div className="flex items-center gap-4 border-b 
border-solid border-border-light dark:border-border-dark bg-panel-light 
dark:bg-panel-dark p-4 shrink-0"> 
                                {/* Back button for mobile */} 
                                <button onClick={() => setIsChatVisible(false)} 
className="md:hidden flex h-10 w-10 items-center justify-center 
rounded-full hover:bg-primary/10 text-text-secondary-light 
dark:text-text-secondary-dark"> 
                                    <span className="material-symbols-outlined 
text-2xl">arrow_back</span> 
                                </button> 
                                <div className="relative"> 
                                    <div style={{ backgroundImage: 
`url(${activeConversation.avatarUrl})` }} className="bg-center 
bg-no-repeat aspect-square bg-cover rounded-full size-12" /> 
                                    {activeConversation.isOnline && <div 
className="absolute bottom-0 right-0 size-3 rounded-full bg-primary 
border-2 border-panel-light dark:border-panel-dark" />} 
                                </div> 
                                <div className="flex-1"> 
                                    <h3 className="text-lg 
font-bold">{activeConversation.name}</h3> 
                                    {activeConversation.isOnline && <p 
className="text-sm text-primary">Online</p>} 
                                </div> 
 

                                <button className="flex h-10 w-10 items-center 
justify-center rounded-full hover:bg-primary/10 text-text-secondary-light 
dark:text-text-secondary-dark"><span 
className="material-symbols-outlined 
text-2xl">more_vert</span></button> 
                            </div> 
                            {/* Context Item Bar */} 
                            {activeConversation.contextItem && ( 
                                <div className="flex items-center gap-4 border-b 
border-solid border-border-light dark:border-border-dark bg-panel-light 
dark:bg-panel-dark p-3"> 
                                    <div className="h-12 w-12 bg-cover bg-center 
rounded-lg" style={{ backgroundImage: 
`url('${activeConversation.contextItem.imageUrl}')`}}></div> 
                                    <div className="flex-1"> 
                                        <p className="text-sm 
font-bold">{activeConversation.contextItem.name}</p> 
                                        <a className="text-sm text-primary 
hover:underline" href={activeConversation.contextItem.link}>View 
item</a> 
                                    </div> 
                                    <button className="flex h-8 w-8 items-center 
justify-center rounded-full hover:bg-primary/10 text-text-secondary-light 
dark:text-text-secondary-dark"><span 
className="material-symbols-outlined text-xl">close</span></button> 
                                </div> 
                            )} 
                            {/* Messages */} 
                            <div className="flex-1 space-y-6 overflow-y-auto 
p-6"> 
                                    {messages.map(msg => (
                                        <MessageBubble key={msg.id} message={msg} senderAvatar={activeConversation ? activeConversation.avatarUrl : null} isMe={user && msg.senderId === user.uid} />
                                    ))}
                            </div> 
                            {/* Message Input */} 
 
 
                            <div className="border-t border-solid 
border-border-light dark:border-border-dark bg-panel-light 
dark:bg-panel-dark p-4 shrink-0">
                                {selectedFile && (
                                    <div className="flex items-center gap-2 mb-2 p-2 bg-background-light dark:bg-background-dark rounded-lg">
                                        <span className="material-symbols-outlined text-sm">attachment</span>
                                        <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                                        <button 
                                            onClick={() => setSelectedFile(null)}
                                            className="text-text-secondary-light dark:text-text-secondary-dark hover:text-red-500"
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
                                        className="flex h-10 w-10 items-center 
justify-center rounded-full hover:bg-primary/10 text-text-secondary-light 
dark:text-text-secondary-dark shrink-0 disabled:opacity-50"
                                        disabled={isUploading}
                                    >
                                        <span className="material-symbols-outlined 
text-2xl">add_circle</span>
                                    </button> 
                                    <input 
                                        className="flex-1 rounded-full 
bg-background-light dark:bg-background-dark px-4 py-2 text-sm 
border-none focus:ring-2 focus:ring-primary disabled:opacity-50" 
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
                                        className="flex h-10 w-10 items-center 
justify-center rounded-full bg-primary text-white shrink-0 
hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-symbols-outlined 
text-2xl">{isUploading ? 'hourglass_empty' : 'send'}</span>
                                    </button> 
                                </div> 
                            </div> 
                        </div> 
                    ) : ( 
                        <div className="flex h-full items-center justify-center 
text-text-secondary-light dark:text-text-secondary-dark"> 
                            <p>Select a conversation to start chatting.</p> 
                        </div> 
                    )} 
                </section> 
            </main> 
        </div> 
    ); 
} 
 
export default InboxPage; 