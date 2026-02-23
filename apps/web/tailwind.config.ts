import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          850: '#1f1f22',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-up': 'fade-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'text-cycle': 'text-cycle 7.5s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
        'pulse-border': 'pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'text-cycle': {
          '0%, 5%': { opacity: '0', transform: 'translateY(20px)' },
          '10%, 28%': { opacity: '1', transform: 'translateY(0)' },
          '33%, 100%': { opacity: '0', transform: 'translateY(-20px)' },
        },
        'pulse-border': {
          '0%': { boxShadow: '0 0 0 0 rgba(24, 24, 27, 0.4)' },
          '70%': { boxShadow: '0 0 0 15px rgba(24, 24, 27, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(24, 24, 27, 0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
