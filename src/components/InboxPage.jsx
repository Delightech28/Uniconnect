import React, { useState, useMemo } from 'react'; 
// --- Data Layer (No Backend) ---
const conversationsData = [
  {
    id: 1,
    name: 'Chidi Nwosu',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDojarS4kjIhSt_KaDGkDrr0B51I0GyEDZUGy9Ptz0BzJNkRO5hkBYmX20baVoiPLqDbarPIQhWJrnybuyuaaVEFgIpRFhRqx_lyr36YyCIrY9pGJ-F3VJHM3HsVqwkXE-xeabCCwfHrgqtETmCzVbl4wOGqIUR0Wf6ycv1aFzdZuCG_qiQ8Tf36uvd2vItDoy-zFcKLAMLcgvysb0F147JbtTl3eFYGwj1ERFL0z_UhU-6By4oEC05lZUrD2OjAEvdhK68ZZpoE1gC',
    lastMessage: 'Okay, sounds good. See you then.',
    timestamp: '3:45 PM',
    unreadCount: 0,
    isOnline: true,
    contextItem: {
      name: 'Calculus 101 Textbook',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFkc1jy_u43gJER-tcMJaBkI2j90hiwKXSMkUgaQcuYLNkCGSDv6xolHvt5W3rW_4Lj7NZOUoIgN8uYG1965-kWcPdQn2K3Z9uNY0f2BKmMGsTNsieDag4RAuUKu210eYFXyxFX-DUWxI05llsYoNSWTJE9a269A4OGrbr_HCOeyqB3DpUFjvzOt1_QAaZmZfk2D_sY_PMHMJE8OIB8a6QcSRz_s-ISsZbJluxFaO3lwthlnj7LHi5hYu5Yx0pWB18_aikyoXc7suK',
      link: '#'
    },
    messages: [
      { id: 1, text: 'Hey, is the textbook still available? I\'m interested in buying it.', timestamp: '3:42 PM', sender: 'them' },
      { id: 2, text: 'Hi! Yes, it is. We can meet up on campus tomorrow if you like?', timestamp: '3:44 PM', sender: 'me' },
      { id: 3, text: 'Okay, sounds good. See you then.', timestamp: '3:45 PM', sender: 'them' }
    ]
  },
  {
    id: 2,
    name: 'PHY 202 Study Group',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdQ78MSlVvgrGjjZ5wKYoQCPR-EnygoQgIF6DYI_IxBE6sG13U-ahLKsB2tMCBG6dmNOn1kQ9W_v0Zn0anhH13aZM4dyDASCEqvmsyZeEqkXYmMTa-reIIf5LD0tMKA9LhblMBCcjSpGanIr_w7vKYjnClAXrBopzuvxyyv-8wqLK2MiCj_1m3ac9WUMCyv_PtI2w7KSNgn1OFVnuo7bv2yOOmzwmEWYUoT2YmmKMt8sxXcrLQvGb-iZ3OchZ6V5XzGVYuCGjHVy4a',
    lastMessage: 'Don\'t forget the session is at 5 PM.',
    timestamp: '1:12 PM',
    unreadCount: 1,
    isOnline: false,
    messages: [{ id: 1, text: 'Don\'t forget the session is at 5 PM.', timestamp: '1:12 PM', sender: 'them' }]
  },
  {
    id: 3,
    name: 'Amina Bello',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM-MwfAAw1IbYBJKW9fa4BNdYtj7ZqkN0Ng9LVcn2VkgyimeItdk1LLrh5KEqYcyiEP_o8v8BLptHyWj6wo77ZRpuS5S1cV_g6pBzzR3h0VeSaETn5crTOGW1bGY_r2MLOgGb1YMzCK3Xo5BLWQ7tWY3upgNkEI2alYWQZyVuY3t2ddnllzhpb3Yk7hhjZfuRPQr_9SNyfRhCn8e-xG3TzetjTNxofo7MUyBUYvtk7m77p-0gI7c5bML3wtKszBD3bqK0Tr-bYfTKE',
    lastMessage: 'You: Yes, it\'s still available!',
    timestamp: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    messages: [{ id: 1, text: 'Yes, it\'s still available!', timestamp: 'Yesterday', sender: 'me' }]
  },
  {
    id: 4,
    name: 'Tunde Adeboye',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4OQuDYx6QVDvFlV6gFzJYa7x_bu5XA4gWsnA_ZYaFJ7ul2PNqYeYIFYWRqIVa6W6mLGOydFwxLi3SAmC0-B5OuVTzzn19a8vHKVKOFo8Z485wk-7lgsXYFWy6W0UBHXx2lqnsO5fPNb8DxCOF5YzwERVi5dYGwEWo79HfFI_vO90EN5saYiA3XsQVHWIGq9ic6Y3-RAANJcxjxptMDN8D8cZ1CRWFqP7pzBJePwDbWvoTEUEEBiRdpXFLis2VbTcIjD0v0Yfsj1jJ',
    lastMessage: 'I was wondering about question 5b.',
    timestamp: 'Mon',
    unreadCount: 0,
    isOnline: false,
    messages: [{ id: 1, text: 'I was wondering about question 5b.', timestamp: 'Mon', sender: 'them' }]
  }
];

const MY_AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuASiaC7c5CWLh6gAmeFfHB8NR_XIn-vM1yykQr4GP6NlwRgZbM6fALuFQyA-jjQL8e0vLfT1eebc_2SG65mWokpQpqZvXyirjPD_8XfxpSKaRfLwp0oqvcjUHEjGQwYn4qbkPsiNuD0GVQDcqs5y48PS0y0ksY6ZC5Hma4ydHSESxdrNX0aNUiqtqKoCDP98FT9QhcYuFkR6sO5sE_IVENbC3CJ2QtxEr4jYKtJrIVZQaYHoX-AIMz5FN1x9iOSgbRWtEgejw2gfbHt';// --- Helper Components --- 
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
 
const MessageBubble = ({ message, senderAvatar }) => {
    const isMe = message.sender === 'me';
    return (
        <div className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
            <div style={{ backgroundImage: `url(${isMe ? MY_AVATAR_URL : senderAvatar})` }} className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0" />
            <div className="max-w-xs space-y-1 md:max-w-md">
                <div className={`p-3 rounded-xl ${isMe ? 'rounded-br-none bg-primary text-white' : 'rounded-bl-none bg-panel-light dark:bg-panel-dark'}`}>
                    <p className="text-sm">{message.text}</p>
                </div>
                <p className={`text-xs text-text-secondary-light dark:text-text-secondary-dark ${isMe ? 'text-right' : ''}`}>{message.timestamp}</p>
            </div>
        </div>
    );
}; 
 
// --- Main Page Component --- 
function InboxPage() { 
    const [activeConvoId, setActiveConvoId] = useState(1); 
    const [searchTerm, setSearchTerm] = useState(''); 
    // State to manage mobile view 
    const [isChatVisible, setIsChatVisible] = useState(false); 
 
    const activeConversation = useMemo(() =>  
        conversationsData.find(c => c.id === activeConvoId), 
    [activeConvoId]); 
     
    const filteredConversations = useMemo(() =>  
        conversationsData.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            
c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) 
        ), 
    [searchTerm]); 
     
    const handleSelectConvo = (id) => { 
        setActiveConvoId(id); 
        setIsChatVisible(true); // Switch to chat view on mobile 
    }; 
 
    return ( 
        <div className="flex h-screen w-full flex-col bg-background-light 
dark:bg-background-dark text-text-primary-light 
dark:text-text-primary-dark font-display"> 
            {/* Header could be here, omitted for brevity, or use <AppHeader 
/> */} 
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
                                {activeConversation.messages.map(msg => ( 
                                    <MessageBubble key={msg.id} message={msg} 
senderAvatar={activeConversation.avatarUrl} /> 
                                ))} 
                            </div> 
                            {/* Message Input */} 
 
 
                            <div className="border-t border-solid 
border-border-light dark:border-border-dark bg-panel-light 
dark:bg-panel-dark p-4 shrink-0"> 
                                <div className="flex items-center gap-2"> 
                                    <button className="flex h-10 w-10 items-center 
justify-center rounded-full hover:bg-primary/10 text-text-secondary-light 
dark:text-text-secondary-dark shrink-0"><span 
className="material-symbols-outlined 
text-2xl">add_circle</span></button> 
                                    <input className="flex-1 rounded-full 
bg-background-light dark:bg-background-dark px-4 py-2 text-sm 
border-none focus:ring-2 focus:ring-primary" placeholder="Type a 
message..." type="text"/> 
                                    <button className="flex h-10 w-10 items-center 
justify-center rounded-full bg-primary text-white shrink-0 
hover:bg-primary/90"><span className="material-symbols-outlined 
text-2xl">send</span></button> 
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