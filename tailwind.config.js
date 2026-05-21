/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0edff',
          100: '#e4deff',
          200: '#cbbeff',
          300: '#a994ff',
          400: '#8b6bff',
          500: '#6C63FF',
          600: '#5a4de8',
          700: '#4a3dcc',
          800: '#3b30a8',
          900: '#2d2485',
        },
      },
      keyframes: {
        pop: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%':     { transform: 'translateX(-6px)' },
          '60%':     { transform: 'translateX(6px)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(108,99,255,0.45)' },
          '50%':     { boxShadow: '0 0 0 10px rgba(108,99,255,0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        pop:        'pop 0.3s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
        slideUp:    'slideUp 0.4s ease-out forwards',
        shake:      'shake 0.4s ease-in-out',
        pulseGlow:  'pulseGlow 2s ease-in-out infinite',
        fadeIn:     'fadeIn 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
