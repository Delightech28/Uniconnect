import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth } from '../firebase';
import { syncDarkMode } from '../utils/darkModeUtils';

const Footer = ({ darkMode }) => {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [localDarkMode, setLocalDarkMode] = useState(darkMode);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			setIsLoggedIn(!!user);
		});
		return () => unsubscribe();
	}, []);

	// Sync dark mode locally
	useEffect(() => {
		setLocalDarkMode(darkMode);
		syncDarkMode(darkMode);
	}, [darkMode]);

	// Scroll to top when location changes
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [location.pathname]);

	const handleProtectedLink = (href) => {
		if (!isLoggedIn) {
			navigate('/login');
		} else {
			navigate(href);
		}
	};

	const handleNewsletterSignup = async (e) => {
		e.preventDefault();
		if (!email) {
			toast.error('Please enter your email');
			return;
		}
		setLoading(true);
		// Simulate API call
		setTimeout(() => {
			toast.success('Thanks for subscribing!');
			setEmail('');
			setLoading(false);
		}, 1000);
	};

	const currentYear = new Date().getFullYear();

	const productLinks = [
		{ label: 'UniMarket', href: '/unimarket', protected: true },
		{ label: 'UniDoc', href: '/uni-doc', protected: false },
		{ label: 'CampusFeed', href: '/campusfeed', protected: true },
		{ label: 'UniWallet', href: '/uni-wallet', protected: true },
		{ label: 'StudyHub', href: '/study-hub', protected: false },
		{ label: 'Pricing', href: '/pricing', protected: false },
	];

	const companyLinks = [];

	const resourcesLinks = [
		{ label: 'Help Center', href: '/help-and-support', protected: true },
		{ label: 'FAQ', href: '/faq', protected: true },
		{ label: 'Contact Support', href: '/contact-support', protected: true },
	];

	const legalLinks = [
		{ label: 'Terms of Service', href: '/terms-of-service' },
	];

	const socialLinks = [
		{ icon: 'facebook', label: 'Facebook', href: '#' },
		{ icon: 'x', label: 'Twitter', href: '#' },
		{ icon: 'instagram', label: 'Instagram', href: '#' },
		{ icon: 'linkedin', label: 'LinkedIn', href: '#' },
	];

	return (
		<footer className={`${localDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} border-t ${localDarkMode ? 'border-gray-800' : 'border-gray-200'} mt-16 lg:mt-24`}>
			{/* Newsletter Section - only show on landing page */}
			{location.pathname === '/' && (
				<div className={`${localDarkMode ? 'bg-gradient-to-r from-primary to-green-600' : 'bg-gradient-to-r from-primary via-green-500 to-green-600'} py-12 lg:py-16`}>
					<div className="max-w-6xl mx-auto px-4 lg:px-10">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
							<div>
								<h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">
									Stay Updated with Campus Culture
								</h3>
								<p className="text-green-100 text-sm lg:text-base">
									Get the latest updates on new features, campus stories, and exclusive offers delivered to your inbox.
								</p>
							</div>
							<form onSubmit={handleNewsletterSignup} className="flex flex-col sm:flex-row gap-3">
								<input
									type="email"
									placeholder="Enter your email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="flex-1 px-4 py-3 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm lg:text-base"
									disabled={loading}
								/>
								<button
									type="submit"
									disabled={loading}
									className="px-6 py-3 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap disabled:opacity-50"
								>
									{loading ? 'Subscribing...' : 'Subscribe'}
								</button>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Main Footer Content */}
			<div className={`max-w-6xl mx-auto px-4 lg:px-10 py-12 lg:py-16`}>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 mb-12">
					{/* Brand Section */}
					<div className="lg:col-span-1">
						<div className="flex items-center gap-2 mb-4">
							<img src="/logo/green_whitebg.png" alt="UniSpace" className="h-10 w-10 object-contain" />
							<h4 className="text-lg font-bold">UniSpace</h4>
						</div>
						<p className={`text-sm mb-6 ${localDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
							Connecting students across Nigerian universities. Your campus community hub for learning, selling, and building meaningful connections.
						</p>
						{/* <div className="flex gap-4">
							{socialLinks.map((social) => (
								<a
									key={social.label}
									href={social.href}
									aria-label={social.label}
									className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
										darkMode
											? 'bg-gray-800 hover:bg-primary text-gray-400 hover:text-white'
											: 'bg-gray-200 hover:bg-primary text-gray-600 hover:text-white'
									}`}
								>
									<span className="material-symbols-outlined text-lg">{social.icon}</span>
								</a>
							))}
						</div> */}
					</div>

					{/* Product Links */}
					<div>
						<h5 className="font-semibold mb-4 text-sm lg:text-base">Product</h5>
						<ul className="space-y-3">
							{productLinks.map((link) => (
								<li key={link.label}>
									{link.protected ? (
										<button
											onClick={() => handleProtectedLink(link.href)}
											className={`text-sm transition-colors ${
												localDarkMode
													? 'text-gray-400 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'
													: 'text-gray-600 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'
											}`}
										>
											{link.label}
										</button>
									) : (
										<Link
											to={link.href}
											className={`text-sm transition-colors ${
												localDarkMode
													? 'text-gray-400 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'
													: 'text-gray-600 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'
											}`}
										>
											{link.label}
										</Link>
									)}
								</li>
							))}
						</ul>
					</div>

	

					{/* Resources Links */}
					<div>
						<h5 className="font-semibold mb-4 text-sm lg:text-base">Resources</h5>
						<ul className="space-y-3">
							{resourcesLinks.map((link) => (
								<li key={link.label}>
									{link.protected ? (
										<button
											onClick={() => handleProtectedLink(link.href)}
											className={`text-sm transition-colors ${
												localDarkMode
													? 'text-gray-400 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'
													: 'text-gray-600 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'
											}`}
										>
											{link.label}
										</button>
									) : (
										<Link
											to={link.href}
											className={`text-sm transition-colors ${
												localDarkMode
													? 'text-gray-400 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'
													: 'text-gray-600 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'
											}`}
										>
											{link.label}
										</Link>
									)}
								</li>
							))}
						</ul>
					</div>

					{/* Legal Links */}
					<div>
						<h5 className="font-semibold mb-4 text-sm lg:text-base">Legal</h5>
						<ul className="space-y-3">
							{legalLinks.map((link) => (
								<li key={link.label}>
									<Link
										to={link.href}
										className={`text-sm transition-colors ${
											darkMode
												? 'text-gray-400 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'
												: 'text-gray-600 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'
										}`}
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Divider */}
			<div className={`h-px ${localDarkMode ? 'bg-gray-800' : 'bg-gray-200'} my-8`}></div>

			{/* Bottom Section */}
			<div className="flex flex-col md:flex-row justify-between items-center gap-4">
				<p className={`text-sm ${localDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
						© {currentYear} UniSpace. All rights reserved.
					</p>
				</div>
			</div>

			{/* Floating Decorative Elements */}
			<div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full -z-10 pointer-events-none"></div>
			<div className="absolute bottom-20 left-0 w-96 h-96 bg-primary/3 rounded-full -z-10 pointer-events-none"></div>
		</footer>
	);
};

export default Footer;


