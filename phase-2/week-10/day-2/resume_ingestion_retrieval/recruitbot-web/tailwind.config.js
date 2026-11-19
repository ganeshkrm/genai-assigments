import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // RecruitBot brand — purple-led palette
        primary: "#5A287D", // brand purple
        accent: "#B46FD6", // light purple (gradient end)
        // Backgrounds (dark, subtly purple-tinted)
        "bg-base": "#0E0A14",
        "bg-surface": "#170F21",
        "bg-card": "#1E1430",
        // Text
        "text-primary": "#F3F0F7",
        "text-muted": "#9A8FB0",
        // Search mode / retrieval scores
        "score-vector": "#6E8BFF", // vector (raw) — blue
        "score-bm25": "#E8528A", // keyword (raw) — pink
        "score-hybrid": "#B46FD6", // smart pipeline — brand purple
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "rb-pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
        "rb-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200%" },
          "100%": { backgroundPosition: "200%" },
        },
      },
      animation: {
        "status-pulse": "rb-pulse 2s ease-in-out infinite",
        "dot-bounce": "rb-bounce 0.6s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite linear",
      },
    },
  },
  plugins: [animate],
};
