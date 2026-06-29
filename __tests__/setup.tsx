// ============================================
// 📁 TESTS SETUP - CONFIGURATION
// ============================================

import { jest } from "@jest/globals";
import "@testing-library/jest-native/extend-expect";
import React from "react";

// ============================================
// 🎭 MOCKS GLOBAUX
// ============================================

// === REACT NATIVE ===
jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: jest.fn((obj) => obj.ios),
  },
  Dimensions: {
    get: jest.fn(() => ({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    })),
  },
  PixelRatio: {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((style) => style),
  },
  Alert: {
    alert: jest.fn(),
  },
  Vibration: {
    vibrate: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn().mockResolvedValue(true),
  },
  Share: {
    share: jest.fn().mockResolvedValue({ action: "shared" }),
  },
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentState: "active",
  },
}));

// === EXPO ===
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    withTransactionAsync: jest.fn().mockImplementation((callback) => callback({})),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/documents/",
  cacheDirectory: "/mock/cache/",
  bundleDirectory: "/mock/bundle/",
  getInfoAsync: jest.fn().mockResolvedValue({
    exists: true,
    size: 1024,
    modificationTime: Date.now(),
    uri: "/mock/file",
  }),
  readAsStringAsync: jest.fn().mockResolvedValue("mock content"),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  ensureDirAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue(["file1.db", "file2.db"]),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-crypto", () => ({
  digestStringAsync: jest.fn().mockResolvedValue("mock-hash"),
  getRandomBytesAsync: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
}));

jest.mock("expo-device", () => ({
  getDeviceIdAsync: jest.fn().mockResolvedValue("mock-device-id"),
  getModelNameAsync: jest.fn().mockResolvedValue("iPhone 14"),
  isTabletAsync: jest.fn().mockResolvedValue(false),
  osVersion: "16.0",
  manufacturer: "Apple",
  brand: "Apple",
  modelName: "iPhone 14",
}));

jest.mock("expo-application", () => ({
  getIosIdForVendorAsync: jest.fn().mockResolvedValue("mock-vendor-id"),
  getAndroidId: jest.fn().mockResolvedValue("mock-android-id"),
  getApplicationName: jest.fn().mockResolvedValue("Stockia"),
  getBuildNumber: jest.fn().mockResolvedValue("1"),
}));

jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue(["fingerprint"]),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("expo-barcode-scanner", () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  BarCodeScanner: "BarCodeScanner",
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "mock-token" }),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({
    type: "wifi",
    isConnected: true,
    isInternetReachable: true,
  }),
}));

jest.mock("expo-battery", () => ({
  getBatteryLevelAsync: jest.fn().mockResolvedValue(0.8),
  getBatteryStateAsync: jest.fn().mockResolvedValue("charging"),
  isLowPowerModeEnabledAsync: jest.fn().mockResolvedValue(false),
}));// === NAVIGATION - CORRIGÉ ===
jest.mock("@react-navigation/native", () => {
  const MockNavigationContainer = ({ children }: { children: React.ReactNode }) => {
    const MockComponent = () => <>{children}</>;
    MockComponent.displayName = "MockNavigationContainer";
    return <MockComponent />;
  };
  MockNavigationContainer.displayName = "MockNavigationContainer";
  
  return {
    NavigationContainer: MockNavigationContainer,
    useNavigation: jest.fn(() => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      replace: jest.fn(),
    })),
    useRoute: jest.fn(() => ({
      params: {},
      key: "mock-key",
      name: "mock-route",
    })),
    useFocusEffect: jest.fn((effect) => effect()),
    useIsFocused: jest.fn(() => true),
  };
});

jest.mock("@react-navigation/native-stack", () => {
  const MockNavigator = ({ children }: { children: React.ReactNode }) => {
    const MockComponent = () => <>{children}</>;
    MockComponent.displayName = "MockNavigator";
    return <MockComponent />;
  };
  MockNavigator.displayName = "MockNavigator";
  
  const MockScreen = ({ children }: { children: React.ReactNode }) => {
    const MockComponent = () => <>{children}</>;
    MockComponent.displayName = "MockScreen";
    return <MockComponent />;
  };
  MockScreen.displayName = "MockScreen";
  
  const MockGroup = ({ children }: { children: React.ReactNode }) => {
    const MockComponent = () => <>{children}</>;
    MockComponent.displayName = "MockGroup";
    return <MockComponent />;
  };
  MockGroup.displayName = "MockGroup";
  
  return {
    createNativeStackNavigator: jest.fn(() => ({
      Navigator: MockNavigator,
      Screen: MockScreen,
      Group: MockGroup,
    })),
  };
});

jest.mock("@react-navigation/bottom-tabs", () => {
  const MockTabNavigator = ({ children }: { children: React.ReactNode }) => {
    const MockComponent = () => <>{children}</>;
    MockComponent.displayName = "MockTabNavigator";
    return <MockComponent />;
  };
  MockTabNavigator.displayName = "MockTabNavigator";
  
  const MockTabScreen = ({ children }: { children: React.ReactNode }) => {
    const MockComponent = () => <>{children}</>;
    MockComponent.displayName = "MockTabScreen";
    return <MockComponent />;
  };
  MockTabScreen.displayName = "MockTabScreen";
  
  return {
    createBottomTabNavigator: jest.fn(() => ({
      Navigator: MockTabNavigator,
      Screen: MockTabScreen,
    })),
  };
});// === BLUETOOTH ===
jest.mock("react-native-bluetooth-escpos-printer", () => ({
  BluetoothManager: {
    isConnected: jest.fn().mockResolvedValue(false),
    scanDevices: jest.fn().mockResolvedValue([]),
    connect: jest.fn().mockResolvedValue(undefined),
    getConnectedDevice: jest.fn().mockResolvedValue({ address: "mock-addr", name: "Mock Printer" }),
    close: jest.fn().mockResolvedValue(undefined),
  },
  BluetoothEscposPrinter: {
    printerInit: jest.fn().mockResolvedValue(undefined),
    printText: jest.fn().mockResolvedValue(undefined),
    printCutPaper: jest.fn().mockResolvedValue(undefined),
    openDrawer: jest.fn().mockResolvedValue(undefined),
    printQRCode: jest.fn().mockResolvedValue(undefined),
    printBarcode: jest.fn().mockResolvedValue(undefined),
  },
}));

// === MOCKS TIERS ===
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@react-native-clipboard/clipboard", () => ({
  setString: jest.fn(),
  getString: jest.fn().mockResolvedValue("mock-clipboard"),
}));

// === CHARTES ===
jest.mock("react-native-chart-kit", () => ({
  LineChart: "LineChart",
  BarChart: "BarChart",
  PieChart: "PieChart",
  ProgressChart: "ProgressChart",
}));

// === SENTRY ===
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// ============================================
// 🧹 NETTOYAGE APRÈS TESTS
// ============================================

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.resetAllMocks();
});

// ============================================
// 📊 LOGS DES TESTS
// ============================================

console.log("🧪 Configuration des tests chargée");