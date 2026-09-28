/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          500: '#0284c7', // Construction Primary Blue
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49', // Sidebar Slate
        },
        status: {
          draft: '#94a3b8',
          submitted: '#38bdf8',
          review: '#f59e0b',
          approved: '#10b981',
          rejected: '#ef4444',
          revision: '#f97316',
          processing: '#6366f1',
          completed: '#059669',
        }
      },
      screens: {
        'xs': '390px',
      }
    },
  },
  plugins: [],
};