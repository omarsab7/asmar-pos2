import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        espresso: "#15131c",
        panel: "#1d1a27",
        card: "#221d2e",
        mocha: "#6e4a2b",
        caramel: "#c8985a",
        gold: "#e0b878",
        cream: "#f3ead8",
      },
    },
  },
  plugins: [],
};
export default config;
