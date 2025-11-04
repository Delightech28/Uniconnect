import React, { useState } from 'react';
// --- Data for select options ---
const institutions = [
'University of Lagos',
'Ahmadu Bello University',
'University of Ibadan',
'Obafemi Awolowo University',
'University of Nigeria, Nsukka',
];
const UniConnectRegistration = () => {
const [step, setStep] = useState(1);
const [formData, setFormData] = useState({
email: '',
password: '',
registerAs: 'student',
institution: institutions[0], // Set default institution
documentType: 'University ID',
file: null,
});
const [showPassword, setShowPassword] = useState(false);
// --- Event Handlers ---
const handleInputChange = (e) => {
const { id, value, type, files } = e.target;
setFormData((prevData) => ({
...prevData,
[id]: type === 'file' ? files[0] : value,
}));
};
const handleNext = (e) => {
e.preventDefault();
if (formData.registerAs === 'student') {
setStep(2);
} else {
// If registering as a guest, skip step 2 and go to success
setStep('success');
}
};
const handleSubmit = (e) => {
e.preventDefault();
console.log('Final form data:', formData);
setStep('success');
};
// --- Progress Bar Logic ---
const progressPercentage = step === 1 ? (formData.registerAs ===
'student' ? 50 : 100) : 100;
const stepText = step === 1 && formData.registerAs === 'student' ?
'Step 1 of 2' : 'Step 2 of 2';
return (
<div className="relative flex min-h-screen flex-col justify-center
overflow-hidden p-4">
<div className="m-auto flex w-full max-w-lg flex-col items-center
rounded-xl p-6 sm:p-8 shadow-lg bg-white dark:bg-gray-800">
<div className="w-full">
{step !== 'success' && (
<div className="mb-8">
<div className="flex justify-between mb-1">
<p className="text-sm font-medium text-slate-700
dark:text-slate-300">
{formData.registerAs === 'student' ? stepText : 'Complete'}
</p>
<p className="text-sm font-medium text-slate-700
dark:text-slate-300">{progressPercentage}%</p>
</div>
<div className="h-2 w-full rounded bg-slate-200
dark:bg-slate-700">
<div className="h-2 rounded bg-primary transition-all
duration-300" style={{ width: `${progressPercentage}%` }}></div>
</div>
</div>
)}
{/* --- Step 1: Account Creation --- */}
{step === 1 && (
<div>
<div className="mb-6 text-center">
<h1 className="text-3xl font-black text-slate-900
dark:text-white">Create your UniConnect account</h1>
</div>
<form onSubmit={handleNext} className="space-y-6">
<button type="button" className="flex w-full cursor-pointer
items-center justify-center gap-3 rounded-lg border border-slate-300
bg-white px-5 py-3 text-base font-medium text-slate-700
hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800
dark:text-slate-300 dark:hover:bg-slate-700">
<svg className="h-5 w-5" viewBox="0 0 24 24"
xmlns="http://www.w3.org/2000/svg"><path d="M22.56
12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21
3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98
7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86
0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
fill="#34A853"></path><path d="M5.84
14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43
8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21
1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66
2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
<span>Sign up with Google</span>
</button>
<div className="relative flex items-center">
<div className="w-full flex-grow border-t border-slate-300
dark:border-slate-600"></div>
<span className="mx-4 flex-shrink text-sm font-medium
text-slate-500 dark:text-slate-400">OR</span>
<div className="w-full flex-grow border-t border-slate-300
dark:border-slate-600"></div>
</div>
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="email">Email</label>
<input className="form-input block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
placeholder:text-slate-400 focus:border-primary focus:ring-primary
dark:border-slate-600 dark:bg-slate-800 dark:text-white
dark:placeholder:text-slate-500" id="email" type="email"
placeholder="Enter your email" value={formData.email}
onChange={handleInputChange} required />
</div>
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300"
htmlFor="password">Password</label>
<div className="relative">
<input className="form-input block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
placeholder:text-slate-400 focus:border-primary focus:ring-primary
dark:border-slate-600 dark:bg-slate-800 dark:text-white
dark:placeholder:text-slate-500" id="password" type={showPassword ?
'text' : 'password'} placeholder="Enter your password"
value={formData.password} onChange={handleInputChange} required
/>
<button type="button" onClick={() =>
setShowPassword(!showPassword)} className="absolute inset-y-0
right-0 flex items-center pr-3 text-slate-400 hover:text-slate-500
dark:text-slate-500 dark:hover:text-slate-400">
<span
className="material-symbols-outlined">{showPassword ? 'visibility_off'
: 'visibility'}</span>
</button>
</div>
</div>
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="registerAs">Register
as</label>
<select className="form-select block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
focus:border-primary focus:ring-primary dark:border-slate-600
dark:bg-slate-800 dark:text-white" id="registerAs"
value={formData.registerAs} onChange={handleInputChange}>
<option value="student">Student</option>
<option value="guest">Guest</option>
</select>
</div>
{formData.registerAs === 'student' && (
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="institution">Select
Institution</label>
<select className="form-select block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
focus:border-primary focus:ring-primary dark:border-slate-600
dark:bg-slate-800 dark:text-white" id="institution"
value={formData.institution} onChange={handleInputChange}>
{institutions.map(inst => <option key={inst}
value={inst}>{inst}</option>)}
</select>
</div>
)}
<button type="submit" className="flex w-full cursor-pointer
items-center justify-center rounded-lg bg-primary px-5 py-4 text-base
font-bold tracking-wide text-white hover:bg-primary/90">
Next
</button>
</form>
</div>
)}
{/* --- Step 2: Verification --- */}
{step === 2 && (
<div>
<div className="mb-6 text-center">
<h1 className="text-3xl font-black text-slate-900
dark:text-white">Verify your student status</h1>
</div>
<form onSubmit={handleSubmit} className="space-y-6">
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="document-type">Document
Type</label>
<select className="form-select block w-full rounded-lg
border-slate-300 bg-background-light p-4 text-base text-slate-900
focus:border-primary focus:ring-primary dark:border-slate-600
dark:bg-slate-800 dark:text-white" id="documentType"
value={formData.documentType} onChange={handleInputChange}>
<option>University ID</option>
<option>School Fees Receipt</option>
</select>
</div>
<div>
<label className="mb-2 block text-sm font-medium
text-slate-700 dark:text-slate-300" htmlFor="file">Proof of
Studentship</label>
<div className="flex items-center justify-center w-full">
<label htmlFor="file" className="flex flex-col items-center
justify-center w-full h-48 border-2 border-slate-300 border-dashed
rounded-lg cursor-pointer bg-slate-50 dark:hover:bg-slate-700
dark:bg-slate-800 hover:bg-slate-100 dark:border-slate-600
dark:hover:border-slate-500">
<div className="flex flex-col items-center justify-center
pt-5 pb-6 text-center">
<span className="material-symbols-outlined text-4xl
text-slate-400 dark:text-slate-500">cloud_upload</span>
{formData.file ? (
<p className="font-semibold
text-primary">{formData.file.name}</p>
) : (
<>
<p className="mb-2 text-sm text-slate-500
dark:text-slate-400"><span className="font-semibold">Click to
upload</span> or drag and drop</p>
<p className="text-xs text-slate-500
dark:text-slate-400">PNG, JPG or PDF</p>
</>
)}
</div>
<input id="file" type="file" className="hidden"
onChange={handleInputChange} />
</label>
</div>
</div>
<button type="submit" className="flex w-full cursor-pointer
items-center justify-center rounded-lg bg-primary px-5 py-4 text-base
font-bold tracking-wide text-white hover:bg-primary/90">
Submit
</button>
</form>
</div>
)}
{/* --- Success Message --- */}
{step === 'success' && (
<div className="text-center">
<div className="mb-4">
<span className="material-symbols-outlined text-6xl
text-green-500">check_circle</span>
</div>
<h1 className="text-3xl font-black text-slate-900
dark:text-white">Welcome to UniConnect!</h1>
<p className="mt-2 text-base text-slate-600
dark:text-slate-400">
{formData.registerAs === 'student'
? 'Your account has been created and is pending verification.' : 'Your guest account has been successfully created.'
}
</p>
</div>
)}
<div className="mt-6 text-center text-sm text-slate-500
dark:text-slate-400">
<p>By creating an account, you agree to our <a
className="font-medium text-primary hover:underline" href="#">Terms
of Service</a> and <a className="font-medium text-primary
hover:underline" href="#">Privacy Policy</a>.</p>
</div>
</div>
</div>
</div>
);
};
export default UniConnectRegistration;