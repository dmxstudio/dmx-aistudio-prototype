/** Meridian — Tailwind theme preset. Dirección B · Swiss systematic.
 *  Usage: module.exports = { presets: [require('./meridian.tailwind.js')] } */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2348E0',
          ink: '#162E93',
          50: '#EEF2FE', 100: '#D6E0FD', 200: '#ADC0FB', 300: '#7E99F6',
          400: '#4F6FEE', 500: '#2348E0', 600: '#1B39B8', 700: '#162E93',
          800: '#142772', 900: '#0E1B4D',
        },
        ink: '#0E1116',
        mist: '#EEF1F5',
        neutral: {
          0: '#FFFFFF', 50: '#F7F9FC', 100: '#EEF1F5', 200: '#E0E5EC',
          300: '#CBD2DC', 400: '#9AA3B2', 500: '#6B7280', 600: '#4B5563',
          700: '#353B45', 800: '#1E232B', 900: '#0E1116',
        },
        success: '#1A8F5E', warning: '#C77A11', danger: '#D03A3A',
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: { sm: '6px', md: '10px', lg: '16px' },
    },
  },
};
