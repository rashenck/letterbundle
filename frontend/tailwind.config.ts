import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5f0',
          100: '#f5ebe3',
          200: '#ebd7c1',
          300: '#dab89a',
          400: '#c79873',
          500: '#b8845e',
          600: '#a36a4a',
          700: '#8b543d',
          800: '#6b4435',
          900: '#554231',
        }
      }
    },
  },
  plugins: [],
}
export default config
