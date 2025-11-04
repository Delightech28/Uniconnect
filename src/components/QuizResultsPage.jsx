 import React, { useState, useEffect } from 'react'; 
 
// --- Data for UI elements --- 
const analysisData = { 
  strengths: { 
    title: 'Your Strengths', 
    icon: 'thumb_up', 
    color: 'text-green-600 dark:text-green-400', 
    description: 'You have a solid understanding of the', 
    topics: ['Sources of Nigerian Law', 'Structure of the Federal overnment'], 
  }, 
  improvements: { 
    title: 'Areas for Improvement', 
    icon: 'lightbulb', 
    color: 'text-orange-600 dark:text-orange-400', 
    description: 'You missed a few questions related to', 
    topics: ['Fundamental Human Rights', 'Judicial Powers chapter'], 
  }, 
}; 
 
  
const focusTopics = [ 
  { 
    title: 'Fundamental Human Rights (Chapter 4)', 
    description: 'Review the specifics of rights enforcement procedures and the limitations placed on certain rights. Pay close attention to sections 4.3 and 4.5 in the provided study material.', 
  }, 
  { 
    title: 'Judicial Powers and Jurisdiction of Courts (Chapter 7)', 
    description: 'Revisit the hierarchy of courts in Nigeria and the distinction between original and appellate jurisdiction. Focus on the Supreme Court\'s role.', 
  }, 
]; 
 
// --- Sub-components for better organization --- 
 
const StatCard = ({ icon, label, iconBg, iconColor, children }) => ( 
    <div className="flex flex-col items-center justify-center p-6 
rounded-xl bg-slate-50 dark:bg-slate-800"> 
        <div className={`flex items-center justify-center h-32 w-32 
rounded-full ${iconBg}`}> 
            {children || <span className={`material-symbols-outlined 
text-5xl ${iconColor}`}>{icon}</span>} 
        </div> 
        <p className="mt-4 text-lg font-semibold text-slate-900 
dark:text-white">{label}</p> 
    </div> 
); 
 
const PerformanceAnalysisCard = ({ data }) => ( 
    <div> 
        <h3 className={`flex items-center text-lg font-semibold mb-2 
${data.color}`}> 
            <span className="material-symbols-outlined 
mr-2">{data.icon}</span> {data.title} 
        </h3> 
  
        <p className="text-slate-600 dark:text-slate-400"> 
            {data.description}{' '} 
            {data.topics.map((topic, index) => ( 
                <React.Fragment key={topic}> 
                    <span className="font-semibold text-slate-800 
dark:text-slate-200">{topic}</span> 
                    {index < data.topics.length - 1 && ' and the '} 
                </React.Fragment> 
            ))} 
            . 
        </p> 
    </div> 
); 
 
const FocusTopicItem = ({ title, description }) => ( 
    <li className="flex items-start"> 
        <span className="material-symbols-outlined text-primary 
dark:text-blue-300 mt-1 mr-3">target</span> 
        <div> 
            <h4 className="font-semibold text-slate-800 
dark:text-slate-200">{title}</h4> 
            <p className="text-slate-600 dark:text-slate-400 
text-sm">{description}</p> 
        </div> 
    </li> 
); 
 
// --- Main Page Component --- 
const QuizResultsPage = () => { 
    const [darkMode, setDarkMode] = useState(false); 
    const [score, setScore] = useState(0); 
 
    const finalScore = 80; 
 
    useEffect(() => { 
        if (darkMode) document.documentElement.classList.add('dark'); 
        else document.documentElement.classList.remove('dark'); 
  
    }, [darkMode]); 
     
    useEffect(() => { 
        // Animate score on component mount 
        const timer = setTimeout(() => setScore(finalScore), 100); 
        return () => clearTimeout(timer); 
    }, []); 
 
    const strokeDashoffset = 314 - (314 * score) / 100; 
 
    return ( 
        <div className="relative flex min-h-screen flex-col justify-center 
overflow-hidden py-6 sm:py-12"> 
            <div className="absolute top-4 right-4 z-10"> 
                <button onClick={() => setDarkMode(!darkMode)} 
className="flex items-center justify-center size-12 rounded-full 
bg-white dark:bg-slate-800 shadow-md text-slate-700 
dark:text-slate-200" aria-label="Toggle dark mode"> 
                    <span className="material-symbols-outlined">{darkMode 
? 'light_mode' : 'dark_mode'}</span> 
                </button> 
            </div> 
            <div className="m-auto flex w-full max-w-4xl flex-col 
items-center rounded-xl p-6 sm:p-8 shadow-lg bg-white 
dark:bg-slate-900"> 
                <div className="w-full"> 
                    <div className="mb-6 text-center"> 
                        <h1 className="text-3xl font-black text-slate-900 
dark:text-white">Quiz Results: "Introduction to Nigerian Constitutional 
Law"</h1> 
                        <p className="mt-2 text-slate-600 
dark:text-slate-400">Great effort! Here is your performance 
breakdown.</p> 
                    </div> 
 
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 
mb-8"> 
  
                        <StatCard label="Your Score"> 
                            <div className="relative flex items-center 
justify-center h-32 w-32"> 
                                <svg className="h-full w-full -rotate-90 transform" 
viewBox="0 0 120 120"> 
                                    <circle className="text-slate-200 
dark:text-slate-700" cx="60" cy="60" fill="none" r="50" 
strokeWidth="10"></circle> 
                                    <circle className="text-green-500" cx="60" 
cy="60" fill="none" r="50" strokeDasharray="314" 
strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
strokeWidth="10" style={{ transition: 'stroke-dashoffset 0.5s' }}></circle> 
                                </svg> 
                                <span className="absolute text-3xl font-bold 
text-slate-800 dark:text-white">{score}%</span> 
                            </div> 
                        </StatCard> 
                        <StatCard icon="check_circle" label="16 Correct" 
iconBg="bg-green-100 dark:bg-green-900/50" iconColor="text-green-600 
dark:text-green-400" /> 
                        <StatCard icon="cancel" label="4 Incorrect" 
iconBg="bg-red-100 dark:bg-red-900/50" iconColor="text-red-600 
dark:text-red-400" /> 
                    </div> 
 
                    <div className="mb-8 p-6 rounded-xl bg-slate-50 
dark:bg-slate-800"> 
                        <h2 className="text-2xl font-bold text-slate-900 
dark:text-white mb-4">Performance Analysis</h2> 
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                           <PerformanceAnalysisCard 
data={analysisData.strengths} /> 
                           <PerformanceAnalysisCard 
data={analysisData.improvements} /> 
                        </div> 
                    </div> 
                     
  
                    <div className="mb-8 p-6 rounded-xl bg-primary/10 
dark:bg-primary/20 border border-primary/20"> 
                        <h2 className="flex items-center text-2xl font-bold 
text-slate-900 dark:text-white mb-4"> 
                            <span className="material-symbols-outlined mr-3 
text-primary dark:text-blue-300 text-3xl">school</span> 
                            Where to Focus Next 
                        </h2> 
                        <p className="text-slate-700 dark:text-slate-300 
mb-4">Based on your results, we recommend focusing on the following 
topics:</p> 
                        <ul className="space-y-3"> 
                           {focusTopics.map(topic => <FocusTopicItem 
key={topic.title} {...topic} />)} 
                        </ul> 
                    </div> 
                     
                    <div className="flex flex-col sm:flex-row gap-4 
justify-center"> 
                        <button className="flex w-full sm:w-auto items-center 
justify-center rounded-lg border border-primary px-5 py-3 text-base 
font-bold text-primary tracking-wide hover:bg-primary/10 
dark:hover:bg-primary/20"> 
                            <span className="material-symbols-outlined 
mr-2">visibility</span><span>Review Answers</span> 
                        </button> 
                        <button className="flex w-full sm:w-auto items-center 
justify-center rounded-lg bg-primary px-5 py-3 text-base font-bold 
text-white tracking-wide hover:bg-primary/90"> 
                            <span className="material-symbols-outlined 
mr-2">refresh</span><span>Retake Quiz</span> 
                        </button> 
                    </div> 
                </div> 
            </div> 
        </div> 
    ); 
  
}; 
export default QuizResultsPage;