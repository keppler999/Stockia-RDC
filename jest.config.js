// ============================================
// 📁 JEST CONFIGURATION - TESTS
// ============================================

module.exports = {
  // === PRESET ===
  preset: "jest-expo",

  // === ENVIRONNEMENT ===
  testEnvironment: "node",

  // === TRANSFORM ===
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },

  // === MODULES ===
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^react-native$": "react-native",
    "^react-native-web$": "react-native-web",
    "^expo$": "expo",
    "^expo-sqlite$": "expo-sqlite",
    "^expo-file-system$": "expo-file-system",
    "^expo-sharing$": "expo-sharing",
    "^expo-haptics$": "expo-haptics",
    "^expo-crypto$": "expo-crypto",
    "^expo-device$": "expo-device",
    "^expo-application$": "expo-application",
    "^expo-local-authentication$": "expo-local-authentication",
    "^expo-barcode-scanner$": "expo-barcode-scanner",
    "^expo-notifications$": "expo-notifications",
    "^expo-splash-screen$": "expo-splash-screen",
    "^expo-network$": "expo-network",
    "^expo-battery$": "expo-battery",
    "^@react-native-async-storage/async-storage$": "@react-native-async-storage/async-storage",
    "^@react-native-clipboard/clipboard$": "@react-native-clipboard/clipboard",
    "^@react-navigation/native$": "@react-navigation/native",
    "^@react-navigation/native-stack$": "@react-navigation/native-stack",
    "^@react-navigation/bottom-tabs$": "@react-navigation/bottom-tabs",
    "^react-native-chart-kit$": "react-native-chart-kit",
    "^react-native-bluetooth-escpos-printer$": "react-native-bluetooth-escpos-printer",
    "^@sentry/react-native$": "@sentry/react-native",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
  },

  // === PATHS ===
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.(ts|tsx|js|jsx)", "**/?(*.)+(spec|test).(ts|tsx|js|jsx)"],

  // === COLLECT COVERAGE ===
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/**/types.ts",
    "!src/**/constants.ts",
    "!src/**/*.mock.ts",
    "!src/**/*.test.ts",
    "!src/**/*.test.tsx",
    "!src/**/__tests__/**",
    "!src/**/__mocks__/**",
    "!src/database/migrations/**",
    "!src/database/seed.ts",
  ],

  // === COVERAGE ===
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // === REPORTERS ===
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "coverage",
        outputName: "junit.xml",
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
        ancestorSeparator: " › ",
        usePathForSuiteName: true,
      },
    ],
  ],

  // === TIMEOUT ===
  testTimeout: 30000,

  // === SETUP ===
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],

  // === VERBOSE ===
  verbose: true,

  // === CACHE ===
  cacheDirectory: ".jest/cache",

  // === WATCH PLUGINS ===
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],

  // === GLOBALS ===
  globals: {
    __DEV__: true,
  },

  // === ERROR ON DEPRECATED ===
  errorOnDeprecated: true,

  // === TEST ENVIRONMENT OPTIONS ===
  testEnvironmentOptions: {
    url: "http://localhost",
  },

  // === HASTE ===
  haste: {
    defaultPlatform: "ios",
    platforms: ["ios", "android"],
  },

  // === TRANSFORM IGNORE ===
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo|expo-.*|react-native-.*|@expo/.*|@sentry/.*|@react-native-async-storage/.*|react-native-chart-kit|react-native-bluetooth-escpos-printer)",
  ],
};