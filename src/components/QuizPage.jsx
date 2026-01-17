import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Footer from './Footer';
// --- Data Layer (No Backend) ---
// This array holds all the quiz questions and answers.
const quizData = [
{
id: 1,
question: "What is the fundamental economic problem that all societies face?",
options: [
"Technological advancement",
"Scarcity of resources",
"Distribution of wealth",
"Government intervention",
],
correctAnswerIndex: 1,
explanation: "Scarcity is the basic economic problem that arisesbecause people have unlimited wants but resources are limited."
},
{
id: 2,
question: "Which of the following is considered a factor of production?",

options: [
"Money",
"Capital (e.g., machinery)",
"Stocks and bonds",
"Consumer goods",
],
correctAnswerIndex: 1,
explanation: "The four factors of production are land, labor, capital, and entrepreneurship. Capital includes man-made resources like machinery and tools."
},
{
id: 3,
question: "What does the 'Law of Demand' state?",
options: [
"As price increases, quantity demanded increases.",
"Price and quantity demanded are not related.",
"As price increases, quantity demanded decreases.",
"As income increases, demand always increases.",
],
correctAnswerIndex: 2,
explanation: "The Law of Demand states that, all other factors being equal, as the price of a good or service increases, consumer demand for the good or service will decrease."
},
{
id: 4,
question: "An economy operating on its production possibility frontier (PPF) is considered:",
options: [
"Inefficient",
"Unattainable",
"Efficient",
"In recession"
],
correctAnswerIndex: 2,

explanation: "Any point on the PPF curve represents an efficient allocation of resources, meaning the economy is producing as much as it can with its available resources."
}
];
// --- Helper Components ---
import AppHeader from './AppHeader';
import Footer from './Footer';
// QuizOption Component
const QuizOption = ({ option, index, selectedAnswer, correctAnswer,
onSelect, isAnswered }) => {
const isSelected = selectedAnswer === index;

const isCorrect = correctAnswer === index;
const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
let buttonClasses = "w-full text-left p-4 rounded-lg border-2 transition-colors flex items-center gap-4 ";
let letterClasses = "flex items-center justify-center size-6 rounded-full font-bold ";
if (isAnswered) {
if (isSelected && isCorrect) {
buttonClasses += "border-success bg-success/10 ring-2 ring-success";
letterClasses += "bg-success text-white";
} else if (isSelected && !isCorrect) {
buttonClasses += "border-error bg-error/10";
letterClasses += "bg-error text-white";
} else if (isCorrect) {
buttonClasses += "border-success bg-success/10"; 
// Show correct answer if wrong one was picked
letterClasses += "bg-success text-white";
} else {
buttonClasses += "border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60";
letterClasses += "bg-slate-200 dark:bg-slate-600 text-secondary dark:text-white";
}
} else {
buttonClasses += "border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10";
letterClasses += "bg-slate-200 dark:bg-slate-600 text-secondary dark:text-white";
}
return (
<button className={buttonClasses} onClick={() =>
onSelect(index)} disabled={isAnswered}>

<div className={letterClasses}>{optionLetter}</div>
<span className="flex-1 text-secondary
dark:text-white">{option}</span>
{isAnswered && isSelected && isCorrect && <span
className="material-symbols-outlined text-success
ml-auto">check_circle</span>}
{isAnswered && isSelected && !isCorrect && <span
className="material-symbols-outlined text-error
ml-auto">cancel</span>}
</button>
);
};
// --- Main Page Component ---
function QuizPage() {
	const location = useLocation();
	const incoming = location.state && location.state.questions;
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [questions, setQuestions] = useState(incoming && incoming.length ? incoming : quizData);
	const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(null));

	useEffect(() => {
		if (incoming && incoming.length) {
			setQuestions(incoming);
			setUserAnswers(Array(incoming.length).fill(null));
			setCurrentQuestionIndex(0);
		}
	}, [incoming]);
const [showResults, setShowResults] = useState(false);
	const currentQuestion = questions[currentQuestionIndex];
	const selectedAnswer = userAnswers[currentQuestionIndex];
const isAnswered = selectedAnswer !== null;
const handleSelectAnswer = (optionIndex) => {
if (!isAnswered) {
const newAnswers = [...userAnswers];
newAnswers[currentQuestionIndex] = optionIndex;
setUserAnswers(newAnswers);
}
};
const handleNext = () => {
if (currentQuestionIndex < quizData.length - 1) {
setCurrentQuestionIndex(currentQuestionIndex + 1);
}

};
const handlePrevious = () => {
if (currentQuestionIndex > 0) {
setCurrentQuestionIndex(currentQuestionIndex - 1);
}
};
const handleSubmit = () => {
setShowResults(true);
};
const handleRestart = () => {
setCurrentQuestionIndex(0);
setUserAnswers(Array(quizData.length).fill(null));
setShowResults(false);
};
	const score = useMemo(() => {
		return userAnswers.reduce((acc, answer, index) => {
			return answer === (questions[index] && questions[index].correctAnswerIndex) ? acc + 1 : acc;
		}, 0);
	}, [userAnswers, questions]);

const progressPercentage = ((currentQuestionIndex + 1) /
quizData.length) * 100;
if (showResults) {
return (
<div className="bg-background-light dark:bg-background-dark
font-display text-secondary dark:text-slate-200 min-h-screen flex flex-col">
<AppHeader />
<main className="flex-1 px-4 py-8">
<div className="max-w-2xl mx-auto bg-white
dark:bg-secondary rounded-xl shadow-lg p-6 sm:p-8 text-center">

<h1 className="text-3xl font-bold text-secondary
dark:text-white">Quiz Completed!</h1>
<p className="text-slate-500 dark:text-slate-400 mt-2">You
have successfully finished the quiz.</p>
<div className="my-8">
<p className="text-lg">Your Score:</p>
<p className="text-5xl font-bold text-primary
my-2">{score} / {quizData.length}</p>
<p className="text-xl font-medium">{((score /
quizData.length) * 100).toFixed(0)}%</p>
</div>
<button
onClick={handleRestart}
className="w-full sm:w-auto flex items-center justify-center
gap-2 rounded-lg h-12 px-6 bg-primary text-white text-base font-bold
hover:bg-primary/90 transition-colors"
>
<span
className="material-symbols-outlined">refresh</span>
<span>Take Again</span>
</button>
</div>
</main>
</div>
    <Footer darkMode={darkMode} />
);
}
return (
<div className="bg-background-light dark:bg-background-dark
font-display text-secondary dark:text-slate-200 min-h-screen flex flex-col">
<div className="relative flex flex-1 h-auto w-full flex-col">
<AppHeader />
<main className="flex-1 px-4 sm:px-6 lg:px-10 py-8">
<div className="flex flex-col max-w-4xl mx-auto">
<div className="flex items-center gap-4 mb-4">

<a className="flex items-center gap-1 text-slate-500
dark:text-slate-400 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary" href="#">
<span
className="material-symbols-outlined">arrow_back</span>
<span className="text-sm font-medium">Back to Study
Hub</span>
</a>
</div>
<div className="bg-white dark:bg-secondary rounded-xl
shadow-lg p-6 sm:p-8">
<div className="flex flex-col sm:flex-row justify-between
sm:items-center gap-4 mb-6">
<div>
<h1 className="text-2xl font-bold text-secondary
dark:text-white">Introduction to Economics Quiz</h1>
<p className="text-slate-500 dark:text-slate-400
mt-1">Based on "ECON101_Chapter1.pdf"</p>
</div>
<div className="flex-shrink-0">
<span className="text-sm font-medium text-secondary
dark:text-white bg-primary/10 dark:bg-primary/20 px-3 py-1.5
rounded-full">
Question {currentQuestionIndex + 1} of {quizData.length}
</span>
</div>
</div>
<div className="w-full bg-slate-200 dark:bg-slate-700
rounded-full h-2.5 mb-8">
<div className="bg-primary h-2.5 rounded-full" style={{ width:
`${progressPercentage}%` }}></div>
</div>
<div>
<p className="text-base text-slate-500 dark:text-slate-400
font-medium mb-2">Multiple Choice Question</p>

<h2 className="text-xl font-semibold text-secondary
dark:text-white">{currentQuestion.question}</h2>
</div>
<div className="mt-6 space-y-4">
{currentQuestion.options.map((option, index) => (
<QuizOption
key={index}
option={option}
index={index}
selectedAnswer={selectedAnswer}
correctAnswer={currentQuestion.correctAnswerIndex}
onSelect={handleSelectAnswer}
isAnswered={isAnswered}
/>
))}
</div>
{isAnswered && (
<div className={`mt-6 p-4 rounded-lg border-l-4
${selectedAnswer === currentQuestion.correctAnswerIndex ?
'bg-success/10 border-success' : 'bg-error/10 border-error'}`}>
<h3 className={`font-bold ${selectedAnswer ===
currentQuestion.correctAnswerIndex ? 'text-success' : 'text-error'}`}>
{selectedAnswer ===
currentQuestion.correctAnswerIndex ? 'Correct!' : 'Incorrect.'}
</h3>
<p className={`text-sm mt-1 ${selectedAnswer ===
currentQuestion.correctAnswerIndex ? 'text-success/80 dark:text-success/90' : 'text-error/80 dark:text-error/90'}`}>
{currentQuestion.explanation}
</p>
</div>
)}

<div className="mt-8 pt-6 border-t border-slate-200
dark:border-slate-700 flex flex-col sm:flex-row justify-between
items-center gap-4">
<button
onClick={handlePrevious}
disabled={currentQuestionIndex === 0}
className="w-full sm:w-auto flex items-center justify-center
gap-2 rounded-lg h-12 px-6 bg-slate-200 dark:bg-slate-700
text-secondary dark:text-white text-base font-bold hover:bg-slate-300
dark:hover:bg-slate-600 transition-colors disabled:opacity-50
disabled:cursor-not-allowed"
>
<span
className="material-symbols-outlined">arrow_back</span>
<span>Previous</span>
</button>
{currentQuestionIndex === quizData.length - 1 ? (
<button
onClick={handleSubmit}
disabled={!isAnswered}
className="w-full sm:w-auto flex items-center
justify-center gap-2 rounded-lg h-12 px-6 bg-accent text-secondary
text-base font-bold hover:bg-accent/90 transition-colors
disabled:opacity-50 disabled:cursor-not-allowed"
>
<span>Submit Quiz</span>
<span
className="material-symbols-outlined">task_alt</span>
</button>
) : (
<button
onClick={handleNext}
disabled={!isAnswered}
className="w-full sm:w-auto flex items-center
justify-center gap-2 rounded-lg h-12 px-6 bg-primary text-white text-base

font-bold hover:bg-primary/90 transition-colors disabled:opacity-50
disabled:cursor-not-allowed"
>
<span>Next Question</span>
<span
className="material-symbols-outlined">arrow_forward</span>
</button>
)}
</div>
</div>
</div>
</main>
</div>
    <Footer darkMode={darkMode} />
</div>
);
}
export default QuizPage;



