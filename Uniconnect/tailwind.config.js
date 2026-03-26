/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms'

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your original colors
        primary: "#07bc0c",
        secondary: "#0A3D62",
        accent: "#FFD700",
        "background-light": "#a1e0a1",
        "background-dark": "transparent",
        "text-light": "#333333",
        "text-dark": "#F5F5F5",

        // Client colors
        clientPrimary: '#123456',
        clientSecondary: '#abcdef',
        clientBackground: '#f0f0f0',
        'client-background-dark': '#1a1a1a',
        clientAccent: '#FFD700', // if needed

        // Any combined/shared colors
        background: "hsl(0 0% 100%)",
        foreground: "hsl(0 0% 3.9%)",
        "muted-foreground": "hsl(215 5.3% 44.7%)",
        border: "hsl(210 40% 96.1%)",
      },
      fontFamily: {
        display: ["Public Sans", "Lexend", "sans-serif"], // your original
        clientSans: ["Inter", "sans-serif"], // client font
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        72: '18rem', // custom spacing if needed
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [forms],
};
