/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#0f172a',
        'sidebar-from': '#1e3a8a',
        'sidebar-to': '#1e293b',
        'primary-blue': '#1e40af',
        'primary-indigo': '#4f46e5',
        'text-light': '#e0e7ff',
        'text-medium': '#c7d2fe',
        'text-muted': '#a5b4fc',
      },
    },
  },
  plugins: [],
}
