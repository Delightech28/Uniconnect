import React from 'react';
const SuggestedQuestion = ({ question, onSelect }) => (
<button
onClick={() => onSelect(question)}
className="w-full text-left text-sm p-3 rounded-lg
bg-background-light dark:bg-slate-800 text-secondary
dark:text-dark-subtext hover:bg-primary/10 hover:text-primary
dark:hover:bg-primary/20 transition-colors"
>
"{question}"
</button>
);
const DocumentInfo = ({ onSelectQuestion }) => {
const suggestedQuestions = [
"Summarize the main points of chapter 3.",
"What are the key theories discussed in the document?",
"Explain the concept of social stratification."
];
return (
<div className="w-full lg:w-1/3 flex-shrink-0 bg-white
dark:bg-dark-card rounded-xl shadow-md p-6 flex flex-col">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-primary
text-2xl">description</span>
<h2 className="text-xl font-bold text-secondary
dark:text-white">Your Document</h2>
</div>
<p className="text-sm text-slate-500 dark:text-dark-subtext mt-1
mb-4">You are asking questions about:</p>

<div className="border border-slate-200 dark:border-slate-700
rounded-lg p-4 flex items-center gap-4">
<div className="flex-shrink-0 size-12 flex items-center
justify-center bg-primary/10 rounded-lg">
<span className="material-symbols-outlined text-primary
text-3xl">picture_as_pdf</span>
</div>
<div className="flex-1 min-w-0">
<h3 className="text-base font-semibold text-secondary
dark:text-white truncate">Introduction to Sociology.pdf</h3>
<p className="text-sm text-slate-500 dark:text-dark-subtext">1.2
MB</p>
</div>
</div>
<div className="mt-4">
<button className="w-full flex items-center justify-center gap-2
rounded-lg h-10 px-4 bg-primary/10 text-primary text-sm font-bold
transition-colors hover:bg-primary/20">
<span className="material-symbols-outlined
text-base">swap_horiz</span>
<span>Change Document</span>
</button>
</div>
<div className="mt-6 border-t border-slate-200
dark:border-slate-700 pt-6">
<h3 className="text-lg font-semibold text-secondary
dark:text-white">Suggested Questions</h3>
<div className="space-y-3 mt-4">
{suggestedQuestions.map((q, index) => (
<SuggestedQuestion key={index} question={q}
onSelect={onSelectQuestion} />
))}
</div>
</div>
</div>

);
};
export default DocumentInfo;