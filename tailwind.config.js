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
        "background-light": "#f5f8f6",
        "background-dark": "#102210",
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
    },
  },
  plugins: [forms],
};
