/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#1e293b',
        muted: '#64748b',
        primary: '#176b66',
        canvas: '#f4f6f8'
      },
      boxShadow: { card: '0 2px 8px rgba(15, 23, 42, .04)' }
    }
  },
  plugins: []
};
