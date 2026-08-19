/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#06070A',
        canvas: '#090B10',
        surface: '#10131A',
        elevated: '#171B24',
        primary: '#F8F9FC',
        secondary: '#A3A8B3',
        subtle: '#676E7A',
        accent: '#756CFF',
        'accent-soft': '#9E98FF',
        success: '#52D98A',
        danger: '#FF5871',
      },
      borderRadius: { card: '28px', control: '18px' },
    },
  },
  plugins: [],
};
