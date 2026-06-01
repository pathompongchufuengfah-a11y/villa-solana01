/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        cream:  { 50:'#fbf7ef', 100:'#f6efe0', 200:'#ebe0c8', 300:'#dccba6', 400:'#c9b07e' },
        sand:   { 500:'#a8895c', 600:'#8a6e44' },
        ocean:  { 50:'#eaf3f3', 100:'#cfe2e1', 200:'#9bc6c3', 400:'#3c8783', 500:'#2a6f6c', 600:'#1d5957', 700:'#134342', 800:'#0d2f2e' },
        ink:    { DEFAULT:'#1a1815', soft:'#3a352e', mute:'#6b6457' },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,20,15,.04), 0 10px 30px -10px rgba(20,20,15,.12)',
      },
      letterSpacing: {
        eyebrow: '.22em',
      },
    },
  },
  plugins: [],
};
