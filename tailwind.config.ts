import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    // Include MarkOver sample content to preserve classes
    "./src/lib/markover-parser.ts",
    "./MARKOVER_GUIDE.md",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
