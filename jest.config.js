export default {
  testEnvironment: 'node',
  transform: {},
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.js",          
    "!src/**/__tests__/**", 
    "!src/db/init.js",
    "!**/node_modules/**"       
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"]
}
