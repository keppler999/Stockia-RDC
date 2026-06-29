// ============================================
// 📁 HOOKS - EXPORT CENTRALISÉ
// Version: 3.0.0
// Description: Point d'entrée unique pour tous les hooks personnalisés de l'application
// ============================================

// === 1. HOOKS APPLICATIFS & SYSTÈME ===
// === EXPORT PAR DÉFAUT GLOBAL ===
import useAppHook from "./useApp";
import useAuthHook from "./useAuth";
import useBluetoothHook from "./useBluetooth";
import useDatabaseHook from "./useDatabase";
import usePrintHook from "./usePrint";

export { default as useApp, useAppState, useBatteryLevel, useNetworkStatus, useOfflineMode } from "./useApp";

// === 2. AUTHENTIFICATION & SÉCURITÉ ===
export { default as useAuth, useAuthError, useAuthLoading, useBiometricAvailable, useCurrentUser, useIsAuthenticated } from "./useAuth";

// === 3. MATÉRIEL & BLUETOOTH ===
export { default as useBluetooth, useBluetoothConnection, useBluetoothDevices, useBluetoothSavedDevices, useBluetoothState } from "./useBluetooth";

// === 4. BASE DE DONNÉES ===
export { default as useDatabase, useDatabaseError, useDatabaseLoading, useDatabaseQueryCount, useDatabaseStats } from "./useDatabase";

// === 5. IMPRESSION TICKET ===
export { default as usePrint, usePrintConfig, usePrintState, usePrintStatus } from "./usePrint";

// === TYPES PARTAGÉS ===
export type {
    AppStateInfo,
    AuthState,
    BluetoothDevice,
    BluetoothScanOptions,
    BluetoothState,
    DatabaseState,
    LoginCredentials,
    LoginResult,
    PrintConfig,
    PrintItem,
    PrintReceiptData,
    PrintResult,
    PrintState,
    QueryOptions,
    QueryResult,
    UseAppReturn,
    UseAuthReturn,
    UseBluetoothReturn,
    UseDatabaseReturn,
    UsePrintReturn
} from "./types";

export default {
  useApp: useAppHook,
  useAuth: useAuthHook,
  useDatabase: useDatabaseHook,
  useBluetooth: useBluetoothHook,
  usePrint: usePrintHook,
};