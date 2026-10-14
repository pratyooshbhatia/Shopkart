/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#1F3B2D', 600: '#2C5440', soft: '#E3ECE5' },
        linen: '#F5F2EA',
        gold: { DEFAULT: '#B98A3E', soft: '#F4EAD7' },
        clay: { DEFAULT: '#B5523B', soft: '#F6E1DA' },
        graphite: '#24231F',
        muted: '#77756C',
        line: '#E4DFD3',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(31,59,45,0.05), 0 10px 30px -14px rgba(31,59,45,0.20)',
        lift: '0 18px 40px -18px rgba(31,59,45,0.45)',
      },
    },
  },
  plugins: [],
}
