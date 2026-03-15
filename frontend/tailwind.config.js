/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        surface: {
          primary: '#020617',
          secondary: '#0f172a',
          tertiary: '#1e293b',
          card: 'rgba(15, 23, 42, 0.7)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-mesh':
          'radial-gradient(at 20% 20%, hsla(253,92%,70%,0.15) 0, transparent 50%), radial-gradient(at 80% 0%, hsla(189,92%,60%,0.12) 0, transparent 50%), radial-gradient(at 0% 80%, hsla(280,92%,70%,0.12) 0, transparent 50%)',
        'card-gradient': 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.05) 100%)',
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        'float-delay': 'float 8s ease-in-out 3s infinite',
        'float-slow': 'float 12s ease-in-out 1.5s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'gradient-shift': 'gradientShift 6s ease infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-24px) rotate(2deg)' },
          '66%': { transform: 'translateY(-12px) rotate(-2deg)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(99,102,241,0.2)',
        glow: '0 0 40px rgba(99,102,241,0.3)',
        'glow-lg': '0 0 80px rgba(99,102,241,0.4)',
        'glow-cyan': '0 0 40px rgba(6,182,212,0.3)',
        'glow-purple': '0 0 40px rgba(168,85,247,0.3)',
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-hover': '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
