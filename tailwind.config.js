/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,jsx}',
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          accent: '#3b82f6',
          purple: '#8b5cf6',
          amber: '#f59e0b',
        },
        slate: {
          750: '#1a2438',
          850: '#151f32',
          950: '#070d17',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
