import React, { useState, useMemo } from 'react'; 
// --- Helper Components & Logic --- 
// A component for displaying a password validation rule 
const PasswordRule = ({ isValid, text }) => (
<p className={`flex items-center ${isValid ? 'text-green-500' : 'text-slate-400 dark:text-slate-500'}`}> 
<span className="material-symbols-outlined text-base mr-2"> 
{isValid ? 'check_circle' : 'cancel'} 
</span> 
<span>{text}</span> 
</p> 
); 
// A component for a form input field with a label and error message 
const FormInput = ({ id, label, error, ...props }) => ( 
<div> 

        <label htmlFor={id} className="block text-sm font-medium 
text-secondary dark:text-white mb-2">{label}</label> 
        <div className="relative"> 
            <input
                id={id}
                className={`form-input block w-full rounded-lg bg-background-light dark:bg-slate-800 text-secondary dark:text-white focus:ring-primary focus:border-primary ${error ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-600'}`} 
                {...props} 
            /> 
        </div> 
        {error && ( 
            <p className="mt-2 text-sm text-red-600 flex items-center"> 
                <span className="material-symbols-outlined text-base 
inline-block align-middle mr-1">error</span> 
                {error} 
            </p> 
        )} 
    </div> 
); 
 
 
// --- Main Page Component --- 
function ChangePasswordPage() { 
    const [passwords, setPasswords] = useState({ 
        current: '', 
        new: '', 
        confirm: '', 
    }); 
    const [errors, setErrors] = useState({}); 
    const [showSuccess, setShowSuccess] = useState(false); 
     
    // In a real app, this would be checked against a server. 
    const FAKE_CURRENT_PASSWORD = 'password123'; 
 
 

    const handleInputChange = (e) => { 
        const { name, value } = e.target; 
        setPasswords(prev => ({ ...prev, [name]: value })); 
        // Clear success message on new input 
        if (showSuccess) setShowSuccess(false); 
        // Clear errors as user types 
        if (errors[name]) { 
            setErrors(prev => ({ ...prev, [name]: null })); 
        } 
    }; 
     
    // Use memoization to avoid re-calculating validation on every render 
    const validationStatus = useMemo(() => { 
        const { new: newPassword, confirm: confirmPassword } = 
passwords; 
        return { 
            hasMinLength: newPassword.length >= 8, 
            hasNumber: /\d/.test(newPassword), 
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), 
            match: newPassword && newPassword === confirmPassword, 
        }; 
    }, [passwords.new, passwords.confirm]); 
     
    const validateForm = () => { 
        const newErrors = {}; 
        if (passwords.current !== FAKE_CURRENT_PASSWORD) { 
            newErrors.current = 'Incorrect current password.'; 
        } 
        if (!validationStatus.hasMinLength || !validationStatus.hasNumber || !validationStatus.hasSpecialChar) {
            newErrors.new = 'New password does not meet all requirements.'; 
        } 
        if (!validationStatus.match) { 
            newErrors.confirm = 'Passwords do not match.'; 
        } 
        setErrors(newErrors); 
 

        return Object.keys(newErrors).length === 0; 
    }; 
 
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        setShowSuccess(false); 
         
        if (validateForm()) { 
            console.log('Password change successful!'); 
            setShowSuccess(true); 
            // Reset fields 
            setPasswords({ current: '', new: '', confirm: '' }); 
            setErrors({}); 
        } else { 
            console.log('Validation failed:', errors); 
        } 
    }; 
 
    return ( 
        <div className="bg-background-light dark:bg-background-dark 
font-display min-h-screen"> 
            {/* Header could be here */} 
            <main className="px-4 sm:px-6 lg:px-10 py-8"> 
                <div className="max-w-2xl mx-auto"> 
                    <div className="flex items-center gap-4 pb-8"> 
                        <a href="#" className="text-secondary dark:text-white"> 
                            <span 
className="material-symbols-outlined">arrow_back</span> 
                        </a> 
                        <h1 className="text-secondary dark:text-white tracking-light text-2xl sm:text-3xl font-bold leading-tight">Change Password</h1> 
                    </div> 
                    <div className="bg-white dark:bg-secondary rounded-xl 
shadow-md p-6 lg:p-8"> 
                        <form className="space-y-6" onSubmit={handleSubmit} noValidate> 
 

                            <FormInput 
                                id="current-password" 
                                name="current" 
                                label="Current Password" 
                                type="password" 
                                placeholder="Enter your current password" 
                                value={passwords.current} 
                                onChange={handleInputChange} 
                                error={errors.current} 
                            /> 
                             
                            <div> 
                                <FormInput 
                                    id="new-password" 
                                    name="new" 
                                    label="New Password" 
                                    type="password" 
                                    placeholder="Enter your new password" 
                                    value={passwords.new} 
                                    onChange={handleInputChange} 
                                /> 
                                <div className="mt-3 text-sm space-y-1"> 
                                    <PasswordRule 
isValid={validationStatus.hasMinLength} text="Minimum 8 characters" /> 
                                    <PasswordRule isValid={validationStatus.hasSpecialChar} text="At least one special character (!, @, #, etc.)" /> 
                                    <PasswordRule 
isValid={validationStatus.hasNumber} text="At least one number" /> 
                                </div> 
                            </div> 
                             
                            <FormInput 
                                id="confirm-password" 
                                name="confirm" 
                                label="Confirm New Password" 
                                type="password" 
 

                                placeholder="Confirm your new password" 
                                value={passwords.confirm} 
                                onChange={handleInputChange} 
                                error={passwords.confirm && 
!validationStatus.match ? 'Passwords do not match.' : errors.confirm} 
                            /> 
                             
                            {showSuccess && ( 
                                <div className="bg-green-100 
dark:bg-green-900/50 border border-green-200 dark:border-green-800 
text-green-700 dark:text-green-300 px-4 py-3 rounded-lg" role="alert"> 
                                    <strong className="font-bold">Success! 
</strong> 
                                    <span className="block sm:inline">Your 
password has been updated.</span> 
                                </div> 
                            )} 
 
                            <div className="flex justify-end pt-4"> 
                                <button type="submit" className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-secondary"> 
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
 
export default ChangePasswordPage; 