import React, { useState, useEffect, useRef } from 'react';
import Footer from './Footer';
const userImage =
"https://lh3.googleusercontent.com/a/ACg8ocK_1YyM922Y1m_mZJiw8-e2pZk2q2qG9U9qY_U0p9qC=s96-c"; 
// Replace The initial conversation state
const initialMessages = [
{
id: 1,
sender: 'user',
text: 'What is the functionalist perspective on education?',
},
{
id: 2,
sender: 'ai',
text: `Based on the document, the functionalist perspective on
education, as detailed on page 45, views it as a crucial social institution
that serves several key functions in society. These include:`,
list: [
'Socialization: Teaching children the norms, values, and skills they need to function as members of society.',
'Social Integration: Moulding students from diverse backgrounds into a cohesive unit.',

'Social Placement: Identifying and channelling individuals into appropriate social and occupational roles based on their talents and abilities.',
]
},
{
id: 3,
sender: 'user',
text: 'Can you elaborate on social placement?',
}
];
// Mock AI responses
const aiResponses = {
"default": "I'm sorry, I can only provide pre-defined answers based on the document. Can you try one of the suggested questions?",
"summarize": "Chapter 3 focuses on cultural diversity and social norms. It argues that culture is a key component in shaping individual identity and societal cohesion. The main points include the definition of culture, the concepts of ethnocentrism and cultural relativism, and the role of subcultures.",
"theories": "The key theories discussed are Functionalism, Conflict Theory, and Symbolic Interactionism. Each offers a unique perspective on how society operates.",
"stratification": "Social stratification is a system by which a society ranks categories of people in a hierarchy. In the document, it's explained as being based on factors like wealth, income, education, family background, and power."
}
const ChatMessage = ({ message }) => {
const isUser = message.sender === 'user';
return (
<div className={`flex gap-4 ${isUser ? 'justify-end' : ''}`}>
{!isUser && (

<div className="size-8 flex-shrink-0 bg-primary/10 rounded-full
flex items-center justify-center">
<span className="material-symbols-outlined text-primary
text-xl">smart_toy</span>
</div>
)}
<div className={`rounded-lg p-4 max-w-xl ${isUser ?
'bg-background-light dark:bg-slate-800' : 'bg-transparent border border-primary/20'}`}>
<p className="text-secondary
dark:text-dark-text">{message.text}</p>
{message.list && (
<ul className="list-disc list-inside mt-3 space-y-1
text-secondary dark:text-dark-text">
{message.list.map((item, index) => <li
key={index}>{item}</li>)}
</ul>
)}
</div>
{isUser && (
<div
className="bg-center bg-no-repeat aspect-square bg-cover
rounded-full size-8 flex-shrink-0"
style={{ backgroundImage: `url("${userImage}")` }}
></div>
)}
</div>
);
};
const ChatInterface = ({ question, setQuestion }) => {
const [messages, setMessages] = useState(initialMessages);
const [isTyping, setIsTyping] = useState(false);
const messagesEndRef = useRef(null);

const scrollToBottom = () => {
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
};
useEffect(scrollToBottom, [messages, isTyping]);
const handleSendMessage = (e) => {
e.preventDefault();
if (!question.trim()) return;
const newUserMessage = { id: Date.now(), sender: 'user', text:
question };
setMessages(prev => [...prev, newUserMessage]);
setQuestion('');
setIsTyping(true);
// Simulate AI response
setTimeout(() => {
let responseText = aiResponses.default;
const lowerCaseQuestion = question.toLowerCase();
if (lowerCaseQuestion.includes("summarize")) {
responseText = aiResponses.summarize;
} else if (lowerCaseQuestion.includes("theories")) {
responseText = aiResponses.theories;
} else if (lowerCaseQuestion.includes("stratification")) {
responseText = aiResponses.stratification;
}
const aiMessage = { id: Date.now() + 1, sender: 'ai', text:
responseText };
setMessages(prev => [...prev, aiMessage]);
setIsTyping(false);
}, 2000);
};
return (

<div className="w-full lg:w-2/3 flex flex-col bg-white
dark:bg-dark-card rounded-xl shadow-md">
<div className="p-6 border-b border-slate-200
dark:border-slate-700">
<h1 className="text-2xl font-bold text-secondary
dark:text-white">Ask AI</h1>
<p className="text-slate-500 dark:text-dark-subtext mt-1">Get
instant answers from your document.</p>
</div>
<div className="flex-1 p-6 overflow-y-auto space-y-6">
{messages.map(msg => <ChatMessage key={msg.id}
message={msg} />)}
{isTyping && (
<div className="flex gap-4">
<div className="size-8 flex-shrink-0 bg-primary/10
rounded-full flex items-center justify-center">
<span className="material-symbols-outlined text-primary
text-xl">smart_toy</span>
</div>
<div className="bg-transparent rounded-lg p-4 max-w-xl
border border-primary/20 animate-pulse">
<div className="h-3 bg-slate-300 dark:bg-slate-600
rounded w-3/4"></div>
<div className="h-3 bg-slate-300 dark:bg-slate-600
rounded w-1/2 mt-2"></div>
</div>
</div>
)}
<div ref={messagesEndRef} />
</div>
<div className="p-6 border-t border-slate-200
dark:border-slate-700 mt-auto">
<form onSubmit={handleSendMessage} className="relative">

<input
type="text"
value={question}
onChange={(e) => setQuestion(e.target.value)}
className="form-input w-full h-12 pl-4 pr-12 rounded-lg
bg-background-light dark:bg-slate-800 border-slate-300
dark:border-slate-600 focus:ring-primary focus:border-primary
text-secondary dark:text-white"
placeholder="Ask a follow-up question..."
/>
<button type="submit" className="absolute right-2 top-1/2
-translate-y-1/2 bg-primary text-white size-8 rounded-md flex
items-center justify-center hover:bg-primary/90 transition-colors">
<span className="material-symbols-outlined
text-xl">arrow_upward</span>
</button>
</form>
</div>
</div>
);
};
export default ChatInterface;



