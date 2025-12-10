import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
// --- Data for Reminder List ---
const reminderItems = [
{
title: 'Accepted Documents:',
description: 'Valid Student ID Card or Official University Document.',
},
{
title: 'Common Issues to Avoid:',
description: 'Blurry images, expired documents, or a name mismatch with your profile.',
},
];
// --- Sub-components for better organization ---
const Header = () => (
<header className="flex items-center justify-between
whitespace-nowrap border-b border-solid border-gray-200
dark:border-gray-700 px-6 sm:px-10 py-4">
<div className="flex items-center gap-4 text-black dark:text-white">
<div className="size-6 text-primary">
<svg fill="currentColor" viewBox="0 0 48 48"
xmlns="http://www.w3.org/2000/svg">
<path d="M44
4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"></path>
</svg>
</div>
<h2 className="text-xl font-bold leading-tight
tracking-tight">UniConnect</h2>
</div>
</header>
);
const FileUpload = ({ onFileSelect, selectedFile }) => {
const [isDragging, setIsDragging] = useState(false);
const fileInputRef = useRef(null);
const handleDragOver = useCallback((e) => { e.preventDefault();
    setIsDragging(true);
}, []);
const handleDragLeave = useCallback((e) => { e.preventDefault();
setIsDragging(false);
}, []);
const handleDrop = useCallback((e) => { e.preventDefault();
setIsDragging(false);
const files = e.dataTransfer.files;
if (files && files.length > 0) {
onFileSelect(files[0]);
}
}, [onFileSelect]);
const handleFileChange = (e) => {
const files = e.target.files;
if (files && files.length > 0) {
onFileSelect(files[0]);
}
};
const handleBrowseClick = () => {
fileInputRef.current.click();
};
return (
<div className={`flex w-full flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary'}`}
onDragOver={handleDragOver}
onDragLeave={handleDragLeave}
onDrop={handleDrop}
onClick={handleBrowseClick}
>
<input type="file" ref={fileInputRef} onChange={handleFileChange}
className="hidden" accept=".jpg,.jpeg,.png,.pdf" />
<div className="flex size-16 items-center justify-center rounded-full
bg-primary/10 text-primary">
<span className="material-symbols-outlined
!text-4xl">upload_file</span>
</div>
<div className="flex flex-col gap-1">
<p className="text-black dark:text-white text-lg font-bold
leading-tight tracking-tight">
{selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
</p>
<p className="text-gray-500 dark:text-gray-400 text-sm
font-normal">
{selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` :
'PNG, JPG, or PDF (max 5MB)'}
</p>
</div>
<button type="button" className="px-4 py-2 rounded-lg
bg-gray-100 dark:bg-gray-700 text-black dark:text-white text-sm
font-bold tracking-wide transition-colors hover:bg-gray-200
dark:hover:bg-gray-600 focus:outline-none focus:ring-2
focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-2
dark:focus:ring-offset-background-dark">
Select File
</button>
</div>
);
};
const ReminderItem = ({ title, description }) => (
<li className="flex items-start gap-3">
<span className="material-symbols-outlined text-primary
mt-1">check_circle</span>
<p className="text-black dark:text-white text-base font-normal
leading-normal flex-1">
<strong>{title}</strong> {description}
</p>
</li>
);
// --- Main Page Component ---
const ReuploadVerificationPage = () => {
const { darkMode, toggleTheme } = useTheme();
const [selectedFile, setSelectedFile] = useState(null);
const handleSubmit = () => {
if (selectedFile) {
// In a real app, this is where you'd handle the file upload.
alert(`Submitting file: ${selectedFile.name}`);
// Reset file state after submission
setSelectedFile(null);
} else {
alert("Please select a file to submit.");
}
};
return (
<div className="relative flex min-h-screen w-full flex-col">
<div className="absolute top-4 right-4 z-10">
<button
onClick={() => toggleTheme()}
className="flex items-center justify-center size-10 rounded-full
bg-white dark:bg-gray-800 shadow-md"
aria-label="Toggle dark mode"
>
<span className="material-symbols-outlined">{darkMode ?
'light_mode' : 'dark_mode'}</span>
</button>
</div>
<Header />
<main className="flex flex-1 justify-center py-10 sm:py-20 px-4">
<div className="flex w-full max-w-2xl flex-col items-center gap-8
rounded-xl border border-gray-200 dark:border-gray-700
bg-background-light dark:bg-gray-900/50 p-6 sm:p-10 text-center
shadow-sm">
<div className="flex flex-col gap-3 w-full">
<div className="flex justify-center items-center gap-2">
<span className="material-symbols-outlined !text-4xl
text-error text-red-500">warning</span>
<p className="text-black dark:text-white text-3xl sm:text-4xl
font-black leading-tight tracking-tighter">
Re-upload Your Documents
</p>
</div>
<p className="text-gray-600 dark:text-gray-300 text-base
font-normal leading-normal max-w-lg mx-auto">
Your previous verification attempt failed. Please review the
requirements and upload your documents again.
</p>
</div>
<FileUpload onFileSelect={setSelectedFile}
selectedFile={selectedFile} />
<div className="w-full rounded-lg bg-primary/10
dark:bg-primary/20 p-6 text-left">
<h3 className="text-black dark:text-white text-lg font-bold
leading-tight tracking-tight mb-4">
Please Remember
</h3>
<ul className="flex flex-col gap-3 list-none">
{reminderItems.map((item, index) => (
<ReminderItem key={index} title={item.title}
description={item.description} />
))}
</ul>
</div>
<div className="flex w-full flex-col items-center gap-4 mt-4">
<button
onClick={handleSubmit}
disabled={!selectedFile}
className="w-full px-8 py-3 rounded-lg bg-primary text-white
text-base font-bold tracking-wide transition-colors hover:bg-opacity-90
focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
dark:focus:ring-offset-background-dark disabled:bg-gray-400
disabled:cursor-not-allowed dark:disabled:bg-gray-600"
>
Submit Documents
</button>
</div>
</div>
</main>
</div>
);
};
export default ReuploadVerificationPage;