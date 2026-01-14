import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme';
import uni7 from '../assets/uni7.jpg';
// --- Data for Features and Testimonials (Makes JSX cleaner) ---
const featuresData = [
{
icon: 'storefront',
title: 'UniMarket',
description: 'Your campus marketplace. Buy and sell textbooks,gadgets, and services securely with your UniConnect e-wallet.',
id: 'unimarket',
},
{
icon: 'school',
title: 'UniDoc',
description: 'Ace your exams. Get AI-powered study notes, paste questions, and collaborative study groups.',
id: 'UniDoc',
},
{
icon: 'newspaper',
title: 'CampusFeed',
description: 'Stay in the loop. Discover campus news, events, and stories from students across Nigeria.',
id: 'campusfeed',
},
];
const testimonialsData = [
{
name: 'Adebayo Adekunle',
image:
'https://lh3.googleusercontent.com/aida-public/AB6AXuC2HsF5rVaHiFQQpqRGxc1SVB1nip4X4kinmLPHL5_r9iv_DO5MIij303kG3PkOiz4nvbvbr901PgYAz7HAIermgRAl3y-ssNNCOkJgNXERN6LGlUgQjIKpncOtvdlE58kgzCglxSFB7WmWwFPgQoZwW18BRmahL9VQr07XmpMELMojpvPdSk6zXudjejAmpxBtqcNBdJQpOco-gdGxGJQ-QNq73nV-pYJSNPGnfRExlU8KKIa08621kohMQ0yr9JQn4hTnuVBD2_7dz',
rating: 5,
quote: '"UniMarket is a lifesaver! I sold my old textbooks and bought a new phone all in one place. The e-wallet is so convenient."',
},
{
name: 'Chiamaka Okoro',
image:
'https://lh3.googleusercontent.com/aida-public/AB6AXuBr_eHQZx19URplTvUsnRJLkKhF6ZnzMeNaCdzhK2keoFSKTtA66hyixxybvFAMgYPzQV4GgFaB-LcFKFFvbucSg6GwUbabN0waaXjAeZatkk66eSW6bvlyMTXz6BW3X9g_QHKmNTIipnaUTr78Ou1I1Dh99TSaDMX-pJt01AZ7zo7tsoQf4ALxbEAHbcTusHHyfxlIn9DicnjJdzWoV4L9-iLxuRMCcKkSUCDCmp6CLcQG64qI3RHt0XxrJnDHI1ZJYUtndZYwNbO3',
rating: 4.5,
quote: '"UniDoc\'s AI notes are a game-changer. I finally understood that difficult course. Highly recommend!"',
},
{
name: 'Musa Ibrahim',
image:
'https://lh3.googleusercontent.com/aida-public/AB6AXuCRwXNorEHW5q-wKXLExjxFHGOwf-iATpXg2CNY-3vRRvzsmfZOTugkImB-Qt-m8MYshP7TxluQE0hi6H2m5DCKRt9A2DYJt_7SU3uZ5st-svY7AN-5bxqls1IJkHRvGGGQ81Za3eIkWKv-GhXUL71TPTkWY8ozWrDpAX1AraFx0oulm_ukEXHunB80KijJJl5Al7R9zsBrLPNcyW8MrjRDurzOLnSPRlyK-a8TyR82P__KLp6T4edWZH09eXPV3Gxav6vVQw4UJZtK',
rating: 5,
quote: '"CampusFeed helps me feel connected to my university community, even when I\'m studying from home. Great for finding events!"',
},
];
// --- Sub-components for better organization ---
const StarRating = ({ rating }) => {
const fullStars = Math.floor(rating);
const halfStar = rating % 1 !== 0;
const stars = [];
for (let i = 0; i < fullStars; i++) {
stars.push(<span key={`full_${i}`}
className="material-symbols-outlined !text-lg">star</span>);
}
if (halfStar) {
stars.push(<span key="half" className="material-symbols-outlined
!text-lg">star_half</span>);
}
return <div className="flex text-accent">{stars}</div>;
};
// --- Main Landing Page Component ---
const UniConnectLandingPage = () => {
const [isMenuOpen, setIsMenuOpen] = useState(false);
const { darkMode, toggleTheme } = useTheme();
	const navigate = useNavigate();

	// Redirect signed-in users away from the public landing page
	useEffect(() => {
		const unsub = onAuthStateChanged(auth, (user) => {
			if (user) {
				// If authenticated, send them to the main dashboard
				navigate('/dashboard');
			}
		});
		return () => unsub();
	}, [navigate]);

	// Capture referral code in URL (e.g. ?ref=abc123) and store for attribution
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		const ref = params.get('ref');
		if (ref) {
			try {
				localStorage.setItem('referral_code', ref);
				toast.success('Referral code captured — thanks for sharing!');
			} catch (err) {
				console.warn('Could not store referral code:', err);
			}
		}
	}, []);
// theme handled by useTheme
const navLinks = [
{ title: 'UniMarket', href: '/unimarket' },
{ title: 'UniDoc', href: '/uni-doc' },
{ title: 'StudyHub', href: '/ai-tool' },
{ title: 'CampusFeed', href: '#campusfeed' },
];
return (
<div className="relative flex min-h-screen w-full flex-col
overflow-x-hidden">
<header className="sticky top-0 z-50 bg-background-light/80
dark:bg-background-dark/80 backdrop-blur-sm px-4 lg:px-10 py-3
border-b border-gray-200 dark:border-gray-700">
<div className="max-w-7xl mx-auto flex items-center
justify-between">
<div className="flex items-center gap-4 text-secondary
dark:text-primary">
<img src="/src/assets/logo/green_whitebg.png" alt="UniSpace" className="h-16 w-16 mb-1 object-contain" />
<h2 className="text-xl font-bold leading-tight
tracking-tight -ml-8"><Link to="/">niSpace</Link></h2>
</div>
{/* Desktop Navigation */}
<nav className="hidden md:flex items-center gap-8">
{navLinks.map(link => (
<Link key={link.title} to={link.href} className="text-sm font-medium
hover:text-primary dark:hover:text-primary">
{link.title}
</Link>
))}
</nav>
<div className="flex items-center gap-2">
{/* Dark Mode Toggle */}
<button
onClick={() => toggleTheme()}
className="flex items-center justify-center size-10 rounded-full
hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
aria-label="Toggle dark mode"
>
<span className="material-symbols-outlined">{darkMode ?
'light_mode' : 'dark_mode'}</span>
</button>
<div className='hidden sm:flex items-center gap-2'>
<Link to="/login" className="flex min-w-[84px] cursor-pointer
items-center justify-center overflow-hidden rounded-full h-10 px-4
bg-transparent border border-secondary dark:border-primary
text-secondary dark:text-primary text-sm font-bold tracking-wide
hover:bg-secondary/10 dark:hover:bg-primary/10">
Login
</Link>
<Link to="/signup" className="flex min-w-[84px] cursor-pointer
items-center justify-center overflow-hidden rounded-full h-10 px-4
bg-primary text-white text-sm font-bold tracking-wide
hover:bg-primary/90">
Sign Up
</Link>
</div>
{/* Mobile Menu Button */}
<button onClick={() => setIsMenuOpen(!isMenuOpen)}
className="md:hidden p-2">
<span className="material-symbols-outlined
text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
</button>
</div>
</div>
{/* Mobile Menu */}
{isMenuOpen && (
<div className="md:hidden mt-4 bg-background-light
dark:bg-background-dark">
<nav className="flex flex-col items-center gap-4 py-4">
{navLinks.map(link => (
<Link key={link.title} to={link.href} className="text-lg font-medium
hover:text-primary" onClick={() =>
setIsMenuOpen(false)}>
{link.title}
</Link>
))}
<div className='flex sm:hidden items-center gap-4 mt-4'>
<Link to="/login" className="flex min-w-[100px] cursor-pointer
items-center justify-center overflow-hidden rounded-full h-10 px-4
bg-transparent border border-secondary dark:border-primary
text-secondary dark:text-primary font-bold">
Login
</Link>
<Link to="/signup" className="flex min-w-[100px] cursor-pointer
items-center justify-center overflow-hidden rounded-full h-10 px-4
bg-primary text-white font-bold">
Sign Up
</Link>
</div>
</nav>
</div>
)}
</header>
<main className="flex-1">
{/* Hero Section */}
<section className="relative">
<div className="max-w-7xl mx-auto px-4 lg:px-10 py-20
lg:py-32">
<div className="grid grid-cols-1 lg:grid-cols-2 items-center
gap-12">
<div className="text-center lg:text-left">
<h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold
leading-tight tracking-tighter text-secondary dark:text-white">
Your University Life, <span
className="text-primary">Connected.</span>
</h1>
<p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto
lg:mx-0 text-text-light dark:text-gray-300">
The all-in-one platform for Nigerian students to buy, sell,
learn, and connect.
</p>
<div className="mt-8 flex flex-col sm:flex-row gap-4
justify-center lg:justify-start">
<button className="flex min-w-[160px] cursor-pointer
items-center justify-center rounded-full h-12 px-6 bg-primary text-white
text-base font-bold shadow-lg hover:bg-primary/90 transition-transform
transform hover:scale-105">
<Link to="/signup">Sign Up for Free</Link>
</button>
<button className="flex min-w-[160px] cursor-pointer
items-center justify-center rounded-full h-12 px-6 bg-secondary
text-white text-base font-bold shadow-lg hover:bg-secondary/90
transition-transform transform hover:scale-105">
Learn More
</button>
</div>
</div>
<div className="relative h-96 lg:h-[24rem]">
<img className="rounded-xl object-cover w-full h-full
shadow-2xl" alt="Diverse group of Nigerian students collaborating and
socializing"
src={uni7} />
</div>
</div>
</div>
</section>
{/* Features Section */}
<section className="py-20 lg:py-28 bg-white dark:bg-gray-900"
id="features">
<div className="max-w-7xl mx-auto px-4 lg:px-10">
<div className="text-center mb-16">
<h2 className="text-3xl lg:text-4xl font-extrabold
text-secondary dark:text-white">Explore UniSpace's Core
Features</h2>
<p className="mt-4 text-lg max-w-3xl mx-auto text-text-light
dark:text-gray-300">
UniSpace is more than just an app; it's a comprehensive
ecosystem designed to enhance every aspect of your university
experience.
</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-8">
{featuresData.map((feature) => {
const getLink = () => {
if (feature.title === 'UniMarket') return '/unimarket';
if (feature.title === 'UniDoc') return '/uni-doc';
return '#';
};

return (
<Link key={feature.title} to={getLink()} className="bg-background-light
dark:bg-background-dark p-8 rounded-xl shadow-lg hover:shadow-2xl
transition-shadow duration-300 cursor-pointer hover:transform hover:scale-105" id={feature.id}>
<div className="flex items-center justify-center size-16
rounded-full bg-primary/20 mb-6">
<span className="material-symbols-outlined text-primary
text-4xl">{feature.icon}</span>
</div>
<h3 className="text-2xl font-bold text-secondary
dark:text-white">{feature.title}</h3>
<p className="mt-2 text-text-light
dark:text-gray-300">{feature.description}</p>
</Link>
);
})}
</div>
</div>
</section>
{/* Testimonials Section */}
<section className="py-20 lg:py-28" id="testimonials">
<div className="max-w-5xl mx-auto px-4 lg:px-10">
<div className="text-center mb-16">
<h2 className="text-3xl lg:text-4xl font-extrabold
text-secondary dark:text-white">What Students Are Saying</h2>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-8">
{testimonialsData.map((testimonial) => (
<div key={testimonial.name} className="bg-white
dark:bg-gray-800 p-6 rounded-xl shadow-lg">
<div className="flex items-center gap-4 mb-4">
<img className="size-12 rounded-full object-cover"
alt={`Profile of ${testimonial.name}`} src={testimonial.image} />
<div>
<p className="font-bold text-secondary
dark:text-white">{testimonial.name}</p>
<StarRating rating={testimonial.rating} />
</div>
</div>
<p className="text-text-light
dark:text-gray-300">"{testimonial.quote}"</p>
</div>
))}
</div>
</div>
</section>
{/* CTA Section */}
<section className="bg-secondary dark:bg-gray-800">
<div className="max-w-4xl mx-auto px-4 lg:px-10 py-20 lg:py-24
text-center">
<h2 className="text-3xl lg:text-4xl font-extrabold
text-white">Ready to Revolutionize Your Uni Experience?</h2>
<div className="mt-8">
<button className="flex min-w-[200px] cursor-pointer
items-center justify-center rounded-full h-14 px-8 bg-accent
text-secondary text-lg font-bold shadow-lg mx-auto hover:bg-yellow-400
transition-transform transform hover:scale-105">
Get Started Now
</button>
</div>
</div>
</section>
</main>
{/* Footer */}
<footer className="bg-background-light dark:bg-background-dark
border-t border-gray-200 dark:border-gray-700">
<div className="max-w-7xl mx-auto px-4 lg:px-10 py-8">
<div className="flex flex-col md:flex-row justify-between
items-center gap-6">
<div className="text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} UniSpace. All Rights Reserved.</div>
<div className="flex gap-6">
<a className="text-sm hover:text-primary" href="#">About
Us</a>
<a className="text-sm hover:text-primary"
href="#">Contact</a>
<a className="text-sm hover:text-primary" href="#">FAQ</a>
<a className="text-sm hover:text-primary" href="#">Terms of
Service</a>
</div>
</div>
</div>
</footer>
</div>
);
};
export default UniConnectLandingPage;