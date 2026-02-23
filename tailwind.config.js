/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#22c55e', // Green 500
                secondary: '#15803d', // Green 700
                accent: '#86efac', // Green 300
                forest: '#2d9f2d', // Lighter Forest Green
                neon: '#39FF14',   // Neon Green
                dark: '#052e16',   // Very dark green 950
                light: '#f0fdf4',  // Green 50
                'dark-bg': '#022c22', // Dark mode background
                'dark-card': '#064e3b', // Dark mode card
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
