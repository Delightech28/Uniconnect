import React, { useState, useEffect } from 'react';
import uni4 from '../assets/uni4.jpg';
import { useTheme } from '../hooks/useTheme';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import AppHeader from './AppHeader';
const UniConnectLogin = () => {
const [formData, setFormData] = useState({
email: '',
password: '',
});
const [showPassword, setShowPassword] = useState(false);
const { darkMode, toggleTheme } = useTheme();
const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
const navigate = useNavigate();
// logo target: landing for anonymous, dashboard for logged-in
const logoTarget = auth && auth.currentUser ? '/dashboard' : '/';
    // If user is already authenticated, redirect to appropriate dashboard
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const registerAs = userDoc.data().registerAs;
                    navigate(registerAs === 'Guest' ? '/dashboard' : '/dashboard');
                }
            }
        });
        return () => unsub();
    }, [navigate]);
// theme handled by useTheme
const handleChange = (e) => {
const { id, value } = e.target;
setFormData((prevData) => ({
...prevData,
[id]: value,
}));
};
const togglePasswordVisibility = () => {
setShowPassword(!showPassword);
};
const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
        const { email, password } = formData;
        // Do NOT log credentials
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // successful login
        setLoading(false);
        // Get user data to determine dashboard
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
            const registerAs = userDoc.data().registerAs;
            navigate(registerAs === 'Guest' ? '/dashboard' : '/dashboard');
        } else {
            navigate('/dashboard'); // fallback
        }
    } catch (error) {
        setLoading(false);
        // Map common Firebase Auth errors to friendly messages
        const code = error?.code || '';
        if (code === 'auth/wrong-password') {
            setErrorMessage('Incorrect password. Please try again.');
        } else if (code === 'auth/user-not-found') {
            setErrorMessage("No account found for this email.");
        } else if (code === 'auth/invalid-email') {
            setErrorMessage('Please enter a valid email address.');
        } else {
            setErrorMessage('Login failed. Please check your credentials and try again.');
        }
        // Avoid logging sensitive info; log minimal error for debugging
        console.error('Login error code:', error?.code || error?.message || error);
    }
};
return (
    <div className="w-full h-screen flex flex-col">
        <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
        <div className="flex flex-1 overflow-y-auto auth-split relative">
            {/* Left: Hero image (desktop) */}
                <div className="auth-hero hidden md:flex md:w-1/2 relative items-center justify-center overflow-hidden">
                    {/* Centered floating image on login page */}
                    <div className="relative w-full flex items-center justify-center py-12 px-8">
                        {/* scaled up login hero (~5x) with preserved hover animation and added float */}
                        <div className="max-w-[350%] w-[350%] min-h-[400px] transform -rotate-6 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-700 ease-in-out hover:rotate-0 hover:scale-[1.02] float-2 relative">
                            <img src={uni4} alt="Welcome hero" className="w-full h-full object-cover block" />
                            <div className="absolute left-4 right-4 bottom-6 flex justify-center">
                                <div className="bg-black/40 backdrop-blur-sm rounded-md px-4 py-3 text-white max-w-[90%]">
                                    <h3 className="text-lg md:text-2xl font-extrabold">Welcome back</h3>
                                    <p className="text-xs md:text-sm mt-1">Sign in to continue to your UniSpace account — your campus hub for study, swap and social.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/6 pointer-events-none rounded-3xl" />
                    <div className="absolute left-6 top-6 w-36 h-36 rounded-full bg-primary/20 auth-deco" />
                </div>

            {/* Right: Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 pt-24">
                <div className="flex flex-col max-w-[480px] w-full justify-center py-10">
                <div className="flex flex-col items-center justify-center mb-8">

                </div>
                {/* moved hero header into the image overlay; keep this area compact */}
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 px-4 py-3">
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
<div>
<label htmlFor="email" className="text-text-primary
dark:text-gray-300 text-base font-medium leading-normal pb-2 block">
Email Address
</label>
<input
id="email"
className="form-input flex w-full min-w-0 flex-1 resize-none
overflow-hidden rounded-lg text-text-primary dark:text-white
focus:outline-0 focus:ring-0 border border-[#cfdbe7]
dark:border-gray-600 bg-background-light dark:bg-background-dark
focus:border-primary h-14 placeholder:text-gray-400 p-[15px] text-base"
placeholder="Enter your email address"
type="email"
value={formData.email}
onChange={handleChange}
required
disabled={loading}
/>
</div>
<div>
<label htmlFor="password" className="text-text-primary
dark:text-gray-300 text-base font-medium leading-normal pb-2 block">
Password
</label>
<div className="flex w-full flex-1 items-stretch">
<input
id="password"
className="form-input flex w-full min-w-0 flex-1 resize-none
overflow-hidden rounded-l-lg text-text-primary dark:text-white
focus:outline-0 focus:ring-0 border border-[#cfdbe7]
dark:border-gray-600 bg-background-light dark:bg-background-dark
focus:border-primary h-14 placeholder:text-gray-400 p-[15px] border-r-0"
placeholder="Enter your password"
type={showPassword ? 'text' : 'password'}
value={formData.password}
onChange={handleChange}
required
disabled={loading}
/>
<div
onClick={togglePasswordVisibility}
className="text-gray-400 flex border border-[#cfdbe7]
dark:border-gray-600 bg-background-light dark:bg-background-dark
items-center justify-center px-[15px] rounded-r-lg border-l-0
cursor-pointer"
>
<span
className="material-symbols-outlined">{showPassword ? 'visibility_off'
: 'visibility'}</span>
</div>
</div>
</div>
<button onClick={() => navigate('/change-password')} type="button" className="text-primary text-sm leading-normal pb-3
pt-1 px-0 text-right underline cursor-pointer hover:text-primary/80">
Forgot Password?
</button>
{errorMessage && (
    <div className="text-sm text-red-500 mb-2">{errorMessage}</div>
)}
<button
    type="submit"
    disabled={loading}
    className={`flex items-center justify-center w-full h-14 rounded-lg text-white text-base font-bold transition-colors ${loading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
>
    {loading ? 'Logging in...' : 'Login'}
</button>

<p className="text-text-primary dark:text-gray-300 text-sm
text-center">
Don't have an account?{' '}
<Link to="/signup" className="text-primary font-bold underline">
Sign Up
</Link>
</p>
</form>
                </div>
            </div>
        </div>
    </div>
);
};
export default UniConnectLogin;