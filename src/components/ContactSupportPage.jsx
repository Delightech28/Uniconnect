import React, { useState } from 'react';
import AppHeader from './AppHeader';
import { useTheme } from '../hooks/useTheme';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import Footer from './Footer';

const ContactSupportPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Get current user
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setFormData(prev => ({
          ...prev,
          email: currentUser.email || '',
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'contactSubmissions'), {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
        status: 'pending',
      });
      
      toast.success('Your inquiry has been submitted successfully!');
      setFormData({
        name: '',
        email: user?.email || '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden font-display">
      {/* Inline styles for Material Symbols settings */}
      <style>
        {`
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}
      </style>

      <div className="layout-container flex h-full grow flex-col">
        
        {/* Shared AppHeader */}
        <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />

        {/* Main Content */}
        <main className="px-4 sm:px-10 md:px-20 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full flex-1 gap-8">
            
            {/* Title Section */}
            <div className="flex flex-col items-center gap-4 text-center py-10">
              <p className="text-slate-900 dark:text-slate-50 text-4xl sm:text-5xl font-black leading-tight tracking-[-0.033em]">Contact Support</p>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl">We're here to help with any questions or issues you may have. Fill out the form below, and we'll get back to you as soon as possible.</p>
            </div>

            {/* Content Grid */}
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
              
              {/* Left Column: Form */}
              <div className="flex-1">
                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="name">Full Name</label>
                    <input 
                      className="form-input block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:border-primary focus:ring-primary/50" 
                      id="name" 
                      name="name" 
                      placeholder="Enter your full name" 
                      type="text" 
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">Email Address</label>
                    <input 
                      className="form-input block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:border-primary focus:ring-primary/50" 
                      id="email" 
                      name="email" 
                      placeholder="you@example.com" 
                      type="email" 
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="subject">Subject</label>
                    <input 
                      className="form-input block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:border-primary focus:ring-primary/50" 
                      id="subject" 
                      name="subject" 
                      placeholder="e.g., Issue with UniWallet" 
                      type="text" 
                      value={formData.subject}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="message">Message</label>
                    <textarea 
                      className="form-textarea block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-background-light dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:border-primary focus:ring-primary/50" 
                      id="message" 
                      name="message" 
                      placeholder="Please describe your issue in detail..." 
                      rows="6"
                      value={formData.message}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  <button 
                    className="flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    type="submit"
                    disabled={loading}
                  >
                    <span className="truncate">{loading ? 'Submitting...' : 'Submit Inquiry'}</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Sidebar */}
              <div className="lg:w-80 flex flex-col gap-8">
                
                {/* Alternative Contact Box */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">Alternative Contact</h3>
                  <div className="flex flex-col gap-4 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary mt-0.5">mail</span>
                      <div className="flex flex-col">
                        <p className="font-medium text-slate-700 dark:text-slate-300">Email Us</p>
                        <a className="text-primary hover:underline" href="mailto:unispaceinnovationhub@gmail.com">unispaceinnovationhub@gmail.com</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary mt-0.5">call</span>
                      <div className="flex flex-col">
                        <p className="font-medium text-slate-700 dark:text-slate-300">Call Us</p>
                        <p className="text-slate-600 dark:text-slate-400">+234 (0) 123 456 7890</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary mt-0.5">schedule</span>
                      <div className="flex flex-col">
                        <p className="font-medium text-slate-700 dark:text-slate-300">Operating Hours</p>
                        <p className="text-slate-600 dark:text-slate-400">Mon - Fri, 9 AM - 5 PM (WAT)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resolution Tips Box */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">For a Faster Resolution</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li>Include your username or student ID.</li>
                    <li>Provide specific details of the issue.</li>
                    <li>Mention the device and browser you're using.</li>
                    <li>Attach screenshots if possible.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex items-center justify-center p-6 border-t border-slate-200 dark:border-slate-800 mt-10">
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <a className="hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary" href="#">Terms of Service</a>
            <a className="hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary" href="#">Privacy Policy</a>
            <p>© 2025 UniSpace. All rights reserved.</p>
          </div>
        </footer>
      <Footer darkMode={darkMode} />
      </div>
    </div>
  );
};

export default ContactSupportPage;


