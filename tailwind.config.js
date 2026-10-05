/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"EB Garamond"', 'Merriweather', 'Lora', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        literary: ['"Playfair Display"', 'Georgia', 'serif']
      },
      colors: {
        parchment: {
          50: '#FAF8F5',
          100: '#F5EFEB',
          200: '#EADFD7',
          300: '#DFCEC0',
          800: '#3D342B',
          900: '#2A231C',
        }
      }
    },
  },
  plugins: [],
};
