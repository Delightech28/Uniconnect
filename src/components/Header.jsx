import React, { useState } from 'react'; 
import { Link } from 'react-router-dom';
 
 

// You can copy this component from the previous answer as it's identical 
const Logo = () => ( 
    <div className="flex items-center gap-4 text-secondary 
dark:text-white"> 
        <div className="size-6 text-primary"> 
            <svg fill="none" viewBox="0 0 48 48" 
xmlns="http://www.w3.org/2000/svg"> 
                <path d="M44 
4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" 
fill="currentColor"></path> 
            </svg> 
        </div> 
        <h2 className="text-xl font-bold leading-tight 
tracking-[-0.015em]">UniSpace</h2> 
    </div> 
); 
 
const SearchBar = () => ( 
    <label className="hidden md:flex flex-col min-w-40 !h-10 
max-w-64"> 
        <div className="flex w-full flex-1 items-stretch rounded-lg h-full"> 
            <div className="text-slate-500 flex border-none 
bg-background-light dark:bg-slate-800 items-center justify-center pl-4 
rounded-l-lg border-r-0"> 
                <span 
className="material-symbols-outlined">search</span> 
            </div> 
            <input className="form-input flex w-full min-w-0 flex-1 
resize-none overflow-hidden rounded-lg text-secondary dark:text-white 
focus:outline-0 focus:ring-0 border-none bg-background-light 
dark:bg-slate-800 focus:border-none h-full placeholder:text-slate-500 
px-4 rounded-l-none border-l-0 pl-2 text-base font-normal 
leading-normal" placeholder="Search" /> 
        </div> 
    </label> 
); 
 
 

const NavLinks = () => ( 
    <> 
        <a className="text-secondary dark:text-white text-sm 
font-medium leading-normal py-2" href="#">Dashboard</a> 
        <a className="text-secondary dark:text-white text-sm 
font-medium leading-normal py-2" href="#">Marketplace</a> 
        <a className="text-secondary dark:text-white text-sm 
font-medium leading-normal py-2" href="#">Study Hub</a> 
        <a className="text-secondary dark:text-white text-sm 
font-medium leading-normal py-2" href="#">CampusFeed</a> 
        <a className="text-secondary dark:text-white text-sm 
font-medium leading-normal py-2" href="#">Wallet</a> 
    </> 
); 
 
const UserProfile = ({ avatarUrl }) => { 
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
    return ( 
        <div className="relative"> 
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
className="focus:outline-none"> 
                <div  
                    className="bg-center bg-no-repeat aspect-square 
bg-cover rounded-full size-10"  
                    style={{ backgroundImage: `url("${avatarUrl}")` }} 
                    alt="User profile picture" 
                ></div> 
            </button> 
            {isDropdownOpen && ( 
                <div  
                    onMouseLeave={() => setIsDropdownOpen(false)}  
                    className="absolute right-0 mt-2 w-48 bg-white 
dark:bg-dark-card rounded-md shadow-lg py-1 z-20" 
                > 
                    <a className="block px-4 py-2 text-sm text-secondary 
dark:text-dark-text hover:bg-background-light dark:hover:bg-slate-800" 
href="#">Profile</a>


                    <Link className="block px-4 py-2 text-sm text-secondary 
dark:text-dark-text hover:bg-background-light dark:hover:bg-slate-800" 
to="/settings">Settings</Link>
                    <a className="block px-4 py-2 text-sm text-secondary 
dark:text-dark-text hover:bg-background-light dark:hover:bg-slate-800" 
href="#">Logout</a> 
                </div> 
            )} 
        </div> 
    ); 
}; 
 
const Header = ({ avatarUrl }) => { 
    const [isMenuOpen, setIsMenuOpen] = useState(false); 
 
    return ( 
        <header className="flex items-center justify-between 
whitespace-nowrap border-b border-solid border-slate-200 
dark:border-slate-700 px-4 sm:px-10 py-3 bg-white dark:bg-dark-card"> 
            <div className="flex items-center gap-8"> 
                <Logo /> 
                <SearchBar /> 
            </div> 
 
            <div className="hidden lg:flex flex-1 justify-end gap-6"> 
                <nav className="flex items-center gap-6"><NavLinks 
/></nav> 
                <button className="flex max-w-[480px] cursor-pointer 
items-center justify-center overflow-hidden rounded-lg h-10 
bg-background-light dark:bg-slate-800 text-secondary dark:text-white 
gap-2 text-sm font-bold min-w-0 px-2.5"> 
                    <span 
className="material-symbols-outlined">notifications</span> 
                </button> 
                <UserProfile avatarUrl={avatarUrl} /> 
            </div> 
 
 

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} 
className="lg:hidden text-secondary dark:text-white"> 
                <span className="material-symbols-outlined">{isMenuOpen 
? 'close' : 'menu'}</span> 
            </button> 
 
            {isMenuOpen && ( 
                <div className="absolute top-full left-0 w-full bg-white 
dark:bg-dark-card lg:hidden z-10 shadow-md"> 
                    <nav className="flex flex-col items-center gap-4 
p-4"><NavLinks /></nav> 
                </div> 
            )} 
        </header> 
    ); 
}; 
 
export default Header; 