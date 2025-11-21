import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'chess-light': '#f0d9b5',
        'chess-dark': '#b58863',
        'chess-light-dark': '#d4a574',
        'chess-dark-dark': '#8b6f47',
      },
    },
  },
  plugins: [],
}
export default config

