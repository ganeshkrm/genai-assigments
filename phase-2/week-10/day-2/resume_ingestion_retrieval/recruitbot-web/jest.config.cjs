/**
 * Jest config — decoupled from Vite (the app's Vite 8 build is untouched).
 * Uses @swc/jest for fast TS/JSX transform; framer-motion & lucide-react are
 * mocked so their ESM never needs transpiling.
 */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src/test"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^framer-motion$": "<rootDir>/src/test/stubs/framer-motion.js",
    "^lucide-react$": "<rootDir>/src/test/stubs/lucide-react.js",
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", tsx: true },
          transform: { react: { runtime: "automatic" } },
        },
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!(zustand)/)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
