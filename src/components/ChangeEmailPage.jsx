import React, { useState, useMemo } from 'react'; 
 
// --- Static Data (No Backend) --- 
const CURRENT_USER_EMAIL = 'adekunle.a@university.edu.ng'; 
const FAKE_CURRENT_PASSWORD = 'password123'; // For simulation 
 
// --- Helper Components --- 
const FormInput = ({ id, label, error, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-secondary dark:text-slate-300 mb-2">{label}</label>
        <input
            id={id}
            className={`form-input w-full rounded-lg text-secondary dark:text-white ${props.disabled ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-secondary'} ${error ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary/50'}`}
            {...props}
        />
        {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-500 flex items-center">
                <span className="material-symbols-outlined text-base mr-1">error</span>
                {error}
            </p>
        )}
    </div>
); 
 
// --- Main Page Component --- 
function ChangeEmailPage() { 
    const [formState, setFormState] = useState({ 
        newEmail: '', 
        confirmEmail: '', 
        password: '', 
    }); 
    const [errors, setErrors] = useState({}); 
    const [showSuccess, setShowSuccess] = useState(false); 
 
    const handleInputChange = (e) => { 
        const { id, value } = e.target; 
        setFormState(prev => ({ ...prev, [id]: value })); 
        // Clear errors as user types and hide success message 
        if(errors[id]) setErrors(prev => ({ ...prev, [id]: null })); 
        setShowSuccess(false); 
    }; 
 
    const doEmailsMatch = useMemo(() => { 
        return formState.newEmail && formState.newEmail === formState.confirmEmail; 
    }, [formState.newEmail, formState.confirmEmail]); 
 
    const validateForm = () => { 
        const newErrors = {}; 
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
         
        if (!emailRegex.test(formState.newEmail)) { 
            newErrors.newEmail = 'Please enter a valid email address.'; 
        } 
        if (!doEmailsMatch) { 
            newErrors.confirmEmail = 'The email addresses do not match. Please try again.'; 
        } 
        if (formState.password !== FAKE_CURRENT_PASSWORD) { 
 
 
            newErrors.password = 'Incorrect password. Please try again.'; 
        } 
         
        setErrors(newErrors); 
        return Object.keys(newErrors).length === 0; 
    }; 
 
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        setShowSuccess(false); 
 
        if (validateForm()) { 
            console.log('Email change request successful for:', formState.newEmail); 
            setShowSuccess(true); 
            // In a real app, the CURRENT_USER_EMAIL would update here after verification. 
            // Reset form for this demo 
            setFormState({ newEmail: '', confirmEmail: '', password: '' }); 
        } else { 
            console.log('Validation failed'); 
        } 
    }; 
 
    return ( 
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen"> 
            {/* Header could be here */} 
            <main className="px-4 sm:px-6 lg:px-10 py-8"> 
                <div className="max-w-5xl mx-auto"> 
                    <div className="flex items-center gap-3 mb-8"> 
                        <a href="#" className="flex items-center justify-center p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"> 
                            <span className="material-symbols-outlined text-secondary dark:text-white">arrow_back</span> 
                        </a> 
 

                        <h1 className="text-secondary dark:text-white tracking-light text-2xl sm:text-3xl font-bold leading-tight">Change Email Address</h1> 
                    </div> 
 
                    <div className="bg-white dark:bg-secondary rounded-xl shadow-md p-6 lg:p-8"> 
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Update the email address associated with your UniSpace account. For security, we require your current password to make this change.</p> 
                         
                        {showSuccess && ( 
                            <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg flex items-start gap-3"> 
                                <span className="material-symbols-outlined mt-0.5">check_circle</span> 
                                <div> 
                                    <h3 className="font-semibold">Email Successfully Updated</h3> 
                                    <p className="text-sm">A verification link has been sent to your new email address. Please click the link to confirm the change.</p> 
                                </div> 
                            </div> 
                        )} 
                         
                        <form className="space-y-6" onSubmit={handleSubmit} noValidate> 
                            <div> 
                                <label className="block text-sm font-medium text-secondary dark:text-slate-300 mb-2" htmlFor="current-email">Current Email Address</label> 
                                <input 
                                    id="current-email" 
 

                                    type="email" 
                                    disabled 
                                    readOnly 
                                    value={CURRENT_USER_EMAIL} 
                                    className="form-input w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                                /> 
                            </div> 
                             
                            <FormInput 
                                id="newEmail" 
                                label="New Email Address" 
                                type="email" 
                                placeholder="Enter your new email" 
                                value={formState.newEmail} 
                                onChange={handleInputChange} 
                                error={errors.newEmail} 
                            /> 
 
                            <FormInput 
                                id="confirmEmail" 
                                label="Confirm New Email Address" 
                                type="email" 
                                placeholder="Confirm your new email" 
                                value={formState.confirmEmail} 
                                onChange={handleInputChange} 
                                error={errors.confirmEmail} 
                            /> 
                             
                            <FormInput 
                                id="password" 
                                label="Current Password" 
                                type="password" 
                                placeholder="Enter your current password" 
                                value={formState.password} 
                                onChange={handleInputChange} 
 

                                error={errors.password} 
                            /> 
 
                            <div className="flex justify-end pt-4"> 
                                <button 
                                    type="submit" 
                                    className="bg-primary text-white font-bold py-2.5 px-6 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 dark:focus:ring-offset-secondary transition-colors duration-200" 
                                > 
                                    Save Changes 
                                </button> 
                            </div> 
                        </form> 
                    </div> 
                </div> 
            </main> 
        </div> 
    ); 
} 
 
export default ChangeEmailPage;