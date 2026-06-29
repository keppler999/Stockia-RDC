import * as React from 'react';

// ============================================
// 📁 AUGMENTATION DES MODULES EXISTANTS (ex: NativeWind / Tailwind)
// ============================================

declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
}

// ============================================
// 📁 DÉCLARATIONS DES MODULES SANS TYPES OFFICIELS
// ============================================

// === MODULES EXPO ===
declare module "expo-sqlite" {
  export interface SQLiteDatabase {
    execAsync: (sql: string) => Promise<void>;
    runAsync: (sql: string, params?: any[]) => Promise<{ lastInsertRowId: number; changes: number }>;
    getFirstAsync: <T = any>(sql: string, params?: any[]) => Promise<T | null>;
    getAllAsync: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
    withTransactionAsync: <T>(callback: (db: SQLiteDatabase) => Promise<T>) => Promise<T>;
    closeAsync: () => Promise<void>;
  }
  export function openDatabaseAsync(name: string): Promise<SQLiteDatabase>;
}

declare module "expo-file-system" {
  export const documentDirectory: string;
  export const cacheDirectory: string;
  export const bundleDirectory: string;
  export interface FileInfo {
    exists: boolean;
    size: number;
    modificationTime?: number;
    uri: string;
  }
  export function getInfoAsync(fileUri: string): Promise<FileInfo>;
  export function readAsStringAsync(fileUri: string, options?: any): Promise<string>;
  export function writeAsStringAsync(fileUri: string, contents: string): Promise<void>;
  export function copyAsync(options: { from: string; to: string }): Promise<void>;
  export function deleteAsync(fileUri: string): Promise<void>;
  export function ensureDirAsync(dirUri: string): Promise<void>;
  export function readDirectoryAsync(dirUri: string): Promise<string[]>;
}

declare module "expo-sharing" {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(url: string, options?: { mimeType?: string; dialogTitle?: string }): Promise<void>;
}

declare module "expo-haptics" {
  export type ImpactFeedbackStyle = "light" | "medium" | "heavy";
  export type NotificationFeedbackType = "success" | "warning" | "error";
  export function impactAsync(style: ImpactFeedbackStyle): Promise<void>;
  export function notificationAsync(type: NotificationFeedbackType): Promise<void>;
  export function selectionAsync(): Promise<void>;
}

declare module "expo-crypto" {
  export type CryptoDigestAlgorithm = "SHA-1" | "SHA-256" | "SHA-512" | "MD5";
  export function digestStringAsync(algorithm: CryptoDigestAlgorithm, data: string): Promise<string>;
  export function getRandomBytesAsync(size: number): Promise<ArrayBuffer>;
}

declare module "expo-device" {
  export function getDeviceIdAsync(): Promise<string>;
  export function getModelNameAsync(): Promise<string>;
  export function isTabletAsync(): Promise<boolean>;
  export const osVersion: string;
  export const manufacturer: string;
  export const brand: string;
  export const modelName: string;
}

declare module "expo-application" {
  export function getIosIdForVendorAsync(): Promise<string>;
  export function getAndroidId(): Promise<string>;
  export function getApplicationName(): Promise<string>;
  export function getBuildNumber(): Promise<string>;
}

declare module "expo-local-authentication" {
  export type AuthenticationType = "fingerprint" | "face" | "iris";
  export function hasHardwareAsync(): Promise<boolean>;
  export function isEnrolledAsync(): Promise<boolean>;
  export function supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
  export function authenticateAsync(options?: {
    promptMessage?: string;
    fallbackLabel?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{ success: boolean; error?: string }>;
}

declare module "expo-barcode-scanner" {
  export type BarCodeScannerResult = {
    type: string;
    data: string;
  };
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function getPermissionsAsync(): Promise<{ status: string }>;
  export const BarCodeScanner: React.ComponentType<{
    onBarCodeScanned: (result: BarCodeScannerResult) => void;
    style?: any;
  }>;
}

declare module "expo-notifications" {
  export type Notification = {
    date: number;
    request: {
      identifier: string;
      content: {
        title?: string;
        body?: string;
        data?: any;
      };
    };
  };
  export type NotificationResponse = {
    notification: Notification;
    actionIdentifier: string;
  };
  export function getPermissionsAsync(): Promise<{ status: string }>;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function setNotificationChannelAsync(channelId: string, options: any): Promise<void>;
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<{ data: string }>;
  export function addNotificationReceivedListener(listener: (notification: Notification) => void): void;
  export function addNotificationResponseReceivedListener(listener: (response: NotificationResponse) => void): void;
  export function setNotificationHandler(handler: any): void;
}

declare module "expo-splash-screen" {
  export function preventAutoHideAsync(): Promise<void>;
  export function hideAsync(): Promise<void>;
}

declare module "expo-network" {
  export function getNetworkStateAsync(): Promise<{
    type: "wifi" | "cellular" | "ethernet" | "unknown" | "none";
    isConnected: boolean;
    isInternetReachable?: boolean;
  }>;
}

declare module "expo-battery" {
  export function getBatteryLevelAsync(): Promise<number>;
  export function getBatteryStateAsync(): Promise<"charging" | "discharging" | "full" | "unknown">;
  export function isLowPowerModeEnabledAsync(): Promise<boolean>;
}

// === MODULES TIERS ===
declare module "@react-native-async-storage/async-storage" {
  export default class AsyncStorage {
    static getItem(key: string): Promise<string | null>;
    static setItem(key: string, value: string): Promise<void>;
    static removeItem(key: string): Promise<void>;
    static multiGet(keys: string[]): Promise<[string, string | null][]>;
    static multiSet(keyValuePairs: [string, string][]): Promise<void>;
    static multiRemove(keys: string[]): Promise<void>;
    static getAllKeys(): Promise<string[]>;
    static clear(): Promise<void>;
  }
}

declare module "@react-native-clipboard/clipboard" {
  export default class Clipboard {
    static setString(text: string): void;
    static getString(): Promise<string>;
  }
}

// === MODULES NAVIGATION ===
declare module "@react-navigation/native" {
  export const NavigationContainer: React.ComponentType<{ children: React.ReactNode; theme?: any }>;
  export function useNavigation<T = any>(): T;
  export function useRoute<T = any>(): T;
  export function useFocusEffect(effect: () => void | (() => void)): void;
  export function useIsFocused(): boolean;
  export type RouteProp<ParamList, RouteName extends keyof ParamList> = {
    key: string;
    name: RouteName;
    params: ParamList[RouteName];
  };
}

declare module "@react-navigation/native-stack" {
  export const createNativeStackNavigator: () => {
    Navigator: React.ComponentType<{
      initialRouteName?: string;
      screenOptions?: any;
      children: React.ReactNode;
    }>;
    Screen: React.ComponentType<{
      name: string;
      component: React.ComponentType<any>;
      options?: any;
      children?: React.ReactNode;
    }>;
    Group: React.ComponentType<{
      screenOptions?: any;
      children: React.ReactNode;
    }>;
  };
  export type NativeStackNavigationProp<ParamList, RouteName extends keyof ParamList> = {
    navigate: <T extends keyof ParamList>(screen: T, params?: ParamList[T]) => void;
    replace: <T extends keyof ParamList>(screen: T, params?: ParamList[T]) => void;
    goBack: () => void;
    reset: (options: { index: number; routes: { name: keyof ParamList }[] }) => void;
    popToTop: () => void;
  };
}

declare module "@react-navigation/bottom-tabs" {
  export const createBottomTabNavigator: () => {
    Navigator: React.ComponentType<{
      initialRouteName?: string;
      screenOptions?: any;
      children: React.ReactNode;
    }>;
    Screen: React.ComponentType<{
      name: string;
      component: React.ComponentType<any>;
      options?: any;
      children?: React.ReactNode;
    }>;
  };
  export type BottomTabNavigationProp<ParamList, RouteName extends keyof ParamList> = {
    navigate: <T extends keyof ParamList>(screen: T, params?: ParamList[T]) => void;
    goBack: () => void;
  };
}

// === MODULES GRAPHIQUES ===
declare module "react-native-chart-kit" {
  export interface ChartConfig {
    backgroundColor?: string;
    backgroundGradientFrom?: string;
    backgroundGradientTo?: string;
    decimalPlaces?: number;
    color?: (opacity: number) => string;
    labelColor?: (opacity: number) => string;
    style?: any;
    propsForDots?: any;
    propsForLabels?: any;
    propsForBackground?: any;
    propsForHorizontalLabels?: any;
    propsForVerticalLabels?: any;
  }

  export interface LineChartProps {
    data: {
      labels: string[];
      datasets: {
        data: number[];
        color?: (opacity: number) => string;
        strokeWidth?: number;
      }[];
    };
    width: number;
    height: number;
    chartConfig: ChartConfig;
    bezier?: boolean;
    style?: any;
    onDataPointClick?: (data: any) => void;
    formatYLabel?: (label: string) => string;
    formatXLabel?: (label: string) => string;
  }

  export interface BarChartProps {
    data: {
      labels: string[];
      datasets: {
        data: number[];
        color?: (opacity: number) => string;
      }[];
    };
    width: number;
    height: number;
    chartConfig: ChartConfig;
    style?: any;
    showValuesOnTopOfBars?: boolean;
    fromZero?: boolean;
  }

  export interface PieChartProps {
    data: {
      name: string;
      population: number;
      color: string;
      legendFontColor?: string;
      legendFontSize?: number;
    }[];
    width: number;
    height: number;
    chartConfig: ChartConfig;
    accessor: string;
    backgroundColor?: string;
    paddingLeft?: string;
    absolute?: boolean;
    hasLegend?: boolean;
  }

  export interface ProgressChartProps {
    data: {
      labels: string[];
      data: number[];
      colors?: string[];
    };
    width: number;
    height: number;
    chartConfig: ChartConfig;
    style?: any;
  }

  export class LineChart extends React.Component<LineChartProps> {}
  export class BarChart extends React.Component<BarChartProps> {}
  export class PieChart extends React.Component<PieChartProps> {}
  export class ProgressChart extends React.Component<ProgressChartProps> {}
}

// === MODULES BLUETOOTH ===
declare module "react-native-bluetooth-escpos-printer" {
  export const BluetoothManager: {
    isConnected: () => Promise<boolean>;
    scanDevices: (timeout: number) => Promise<{ address: string; name: string; type?: string; rssi?: number }[]>;
    connect: (address: string) => Promise<void>;
    getConnectedDevice: () => Promise<{ address: string; name: string }>;
    close: () => Promise<void>;
  };

  export const BluetoothEscposPrinter: {
    printerInit: () => Promise<void>;
    printText: (text: string, options?: any) => Promise<void>;
    printCutPaper: () => Promise<void>;
    openDrawer: () => Promise<void>;
    printQRCode: (text: string) => Promise<void>;
    printBarcode: (text: string) => Promise<void>;
  };
}

// === MODULES SENTRY ===
declare module "@sentry/react-native" {
  export function init(options: { dsn: string; environment?: string }): void;
  export function captureException(error: Error): void;
  export function captureMessage(message: string): void;
  export function setUser(user: { id?: string; email?: string; username?: string }): void;
  export function setTag(key: string, value: string): void;
  export function setExtra(key: string, value: any): void;
  export function addBreadcrumb(breadcrumb: { message: string; category?: string; level?: string }): void;
}