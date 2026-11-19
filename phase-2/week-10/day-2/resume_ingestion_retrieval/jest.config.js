/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        // Compile tests to CommonJS so Jest can run them, independent of the
        // app's node16 module setting.
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node10",
          esModuleInterop: true,
          strict: true,
          ignoreDeprecations: "6.0",
        },
      },
    ],
  },
  testMatch: ["**/tests/**/*.test.ts"],
};
