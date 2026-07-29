/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#10202b",
          dark: "#0b151d",
          light: "#1a2e3d",
          border: "#243b4d",
        },
        paper: {
          DEFAULT: "#f2ece0",
          light: "#fbf8f3",
          dark: "#e4dbca",
          border: "#d8ceba",
        },
        gold: {
          DEFAULT: "#b8912f",
          light: "#d4a944",
          dark: "#967321",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
