import React from 'react';

const Logo = ({ className = '', isDarkMode = false }) => {
  return (
    <svg
      viewBox="0 0 400 500"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="50" y="50" width="300" height="400" rx="80" fill="#07bc0c" />
      <path
        d="M110 150h50v140c0 30 20 50 40 50s40-20 40-50V150h50v140c0 60-40 100-90 100s-90-40-90-100V150z"
        fill="black"
      />
    </svg>
  );
};

export default Logo;
