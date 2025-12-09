import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import useVerified from '../hooks/useVerified';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
// --- Data for UI elements ---
const navLinks = [
{ name: 'Dashboard', path: '/dashboard', active: false },
{ name: 'Marketplace', path: '/unimarket', active: false },
{ name: 'Study Hub', path: '/study-hub', active: true },
{ name: 'CampusFeed', path: '#campusfeed', active: false },
{ name: 'Wallet', path: '/uni-wallet', active: false },
];
const featureCards = [
{
icon: 'menu_book',
title: 'Available Quizzes',
subtitle: 'Ready-made quizzes',
description: 'Browse a library of quizzes on various subjects uploaded by the community.',
buttonText: 'Explore Quizzes',
isSpecial: false,
},
{
icon: 'timeline',
title: 'Learning Paths',
subtitle: 'Structured courses',
description: 'Follow curated learning paths to master topics step-by-step.',
buttonText: 'Discover Paths',
isSpecial: false,
},
{
icon: 'verified_user',
title: 'Unlock Full Potential',
subtitle: 'Become a verified student',

description: 'Verify your student status to save your progress and get detailed performance analytics.',
buttonText: 'Verify Now',
isSpecial: true,
},
];
// --- Sub-components for better organization ---
const FeatureCard = ({ icon, title, subtitle, description, buttonText,
isSpecial = false }) => (
<div className={`bg-white dark:bg-secondary rounded-xl shadow-md
p-6 flex flex-col ${isSpecial ? 'border border-dashed border-primary/50 dark:border-primary/40' : ''}`}>
<div className="flex items-center gap-4">
<div className="flex-shrink-0 size-12 rounded-lg bg-primary/10
flex items-center justify-center">
<span className="material-symbols-outlined text-primary
text-3xl">{icon}</span>
</div>
<div>
<h3 className="text-lg font-bold text-secondary
dark:text-white">{title}</h3>
<p className="text-sm text-slate-500
dark:text-slate-400">{subtitle}</p>
</div>
</div>
<p className="text-secondary dark:text-white mt-4
flex-grow">{description}</p>
<button className={`mt-4 w-full flex items-center justify-center
rounded-lg h-10 px-4 font-bold ${isSpecial ? 'bg-primary text-white' :
'bg-primary/10 text-primary'}`}>
<span>{buttonText}</span>
</button>

</div>
);
// --- Main Page Component ---
const StudyHubPage = () => {
const { darkMode, toggleTheme } = useTheme();
	const navigate = useNavigate();
	const { isLoading, verified, status } = useVerified();

	useEffect(() => {
		if (!isLoading && !verified) {
			if (status === 'failed') {
				toast.error('Your verification failed. You cannot access Study Hub.');
				navigate('/verification-failed');
			} else {
				navigate('/verification-pending');
			}
		}
	}, [isLoading, verified, status, navigate]);
	const fileInputRef = useRef(null);

	const handleUploadClick = () => {
		if (fileInputRef.current) fileInputRef.current.click();
	};

	const generateQuestionsFromText = (text, maxQuestions = 6) => {
		if (!text) return [];
		// Split into sentences (simple heuristic)
		const sentences = text
			.replace(/\n+/g, ' ')
			.split(/(?<=[.!?])\s+/)
			.map(s => s.trim())
			.filter(Boolean);

		const questions = [];
		const take = Math.min(maxQuestions, Math.max(1, Math.floor(sentences.length / 5)));
		// If not enough sentences, limit by available
		const candidates = sentences.slice(0, Math.max(take * 4, sentences.length));

		for (let i = 0; i < Math.min(take, sentences.length); i++) {
			const correct = sentences[i];
			// pick up to 3 distractors from other sentences
			const others = sentences.filter((s, idx) => idx !== i);
			const distractors = [];
			for (let j = 0; j < 3; j++) {
				if (others.length === 0) break;
				const idx = Math.floor(Math.random() * others.length);
				distractors.push(others.splice(idx, 1)[0]);
			}
			const options = [correct, ...distractors].slice(0, 4);
			// shuffle options
			for (let k = options.length - 1; k > 0; k--) {
				const r = Math.floor(Math.random() * (k + 1));
				[options[k], options[r]] = [options[r], options[k]];
			}
			const correctIndex = options.indexOf(correct);

			questions.push({
				id: `auto-${i}`,
				question: `Which of the following statements is taken from the document?`,
				options: options.map(o => (o.length > 140 ? o.slice(0, 137) + '...' : o)),
				correctAnswerIndex: correctIndex,
				explanation: correct,
			});
		}

		// Fallback: if no questions generated, create a simple true/false Q
		if (questions.length === 0 && sentences.length > 0) {
			const s = sentences[0];
			questions.push({
				id: 'auto-0',
				question: `True or false: ${s.slice(0, 120)}...`,
				options: ['True', 'False'],
				correctAnswerIndex: 0,
				explanation: s,
			});
		}

		return questions;
	};

	const handleFileChange = async (e) => {
		const file = e.target.files && e.target.files[0];
		if (!file) return;
		try {
			if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
				const arrayBuffer = await file.arrayBuffer();
				const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
				let fullText = '';
				for (let i = 1; i <= pdf.numPages; i++) {
					const page = await pdf.getPage(i);
					const content = await page.getTextContent();
					const strings = content.items.map(item => item.str);
					fullText += strings.join(' ') + '\n';
				}
				const questions = generateQuestionsFromText(fullText, 6);
				navigate('/quiz', { state: { questions, sourceTitle: file.name } });
			} else {
				// Try to read as text
				const text = await file.text();
				const questions = generateQuestionsFromText(text, 6);
				navigate('/quiz', { state: { questions, sourceTitle: file.name } });
			}
		} catch (err) {
			console.error('Failed to extract PDF text:', err);
			// Fallback: navigate to quiz with empty questions to let user proceed
			navigate('/quiz', { state: { questions: [], sourceTitle: file.name } });
		}
	};
	return (
<div className="relative flex min-h-screen w-full flex-col">
<AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
<main className="flex-1 px-4 sm:px-10 py-8">
<div className="max-w-7xl mx-auto">
<div className="text-center">
<h1 className="text-secondary dark:text-white text-3xl
sm:text-4xl font-bold">Welcome to the Study Hub</h1>
<p className="text-slate-500 dark:text-slate-400 mt-2
max-w-2xl mx-auto">
Your central space for learning. Upload materials, generate
quizzes, and get answers instantly.
</p>
</div>
	<input ref={fileInputRef} type="file" accept="application/pdf, text/plain" onChange={handleFileChange} className="hidden" />

	<a href="#" className="mt-10 bg-white dark:bg-secondary
rounded-xl shadow-md p-8 max-w-3xl mx-auto block hover:shadow-lg
hover:ring-2 hover:ring-primary/50 transition-all duration-300">
<div className="text-center">
<div className="flex justify-center items-center size-16
bg-primary/10 rounded-full mx-auto">
<span className="material-symbols-outlined text-primary
text-3xl">cloud_upload</span>
</div>

<h2 className="text-xl font-bold text-secondary dark:text-white
mt-4">Start by Uploading Your Study Material</h2>
<p className="text-slate-500 dark:text-slate-400 mt-1">Upload
a PDF or document to generate quizzes and ask questions.</p>
						<div onClick={handleUploadClick} role="button" tabIndex={0} className="mt-6 flex items-center justify-center gap-2
w-full max-w-xs mx-auto rounded-lg h-12 px-6 bg-primary text-white
text-base font-bold cursor-pointer">
							<span className="material-symbols-outlined">upload_file</span>
							<span>Upload Document</span>
						</div>
</div>
<div className="mt-8 border-t border-slate-200
dark:border-slate-700 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6
text-center">
<div className="flex flex-col items-center">
<div className="flex justify-center items-center size-12
bg-primary/10 rounded-full"><span
className="material-symbols-outlined text-primary
text-2xl">quiz</span></div>
<h3 className="text-lg font-semibold text-secondary
dark:text-white mt-3">AI Quiz Generation</h3>
<p className="text-slate-500 dark:text-slate-400 text-sm
mt-1">Automatically create quizzes from your uploaded documents to
test your knowledge.</p>
</div>
<div className="flex flex-col items-center">
<div className="flex justify-center items-center size-12
bg-primary/10 rounded-full"><span
className="material-symbols-outlined text-primary
text-2xl">help_outline</span></div>
<h3 className="text-lg font-semibold text-secondary
dark:text-white mt-3">Ask Your Document</h3>
<p className="text-slate-500 dark:text-slate-400 text-sm
mt-1">Get quick answers and summaries for specific questions about
your study material.</p>
</div>

</div>
</a>
<div className="mt-12">
<div className="flex justify-between items-center mb-6">
<h2 className="text-2xl font-bold text-secondary
dark:text-white">Explore &amp; Learn</h2>
<a className="text-primary font-medium text-sm
hover:underline" href="#">View All</a>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-6">
{featureCards.map(card => (
<FeatureCard key={card.title} {...card} />
))}
</div>
</div>
</div>
</main>
</div>
);
};
export default StudyHubPage;