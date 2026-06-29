// ============================================
// 📁 SERVICES - EXPORT CENTRALISÉ GÉRE ET CORRIGÉ
// ============================================

// === 1. SERVICES PRINCIPAUX (CLASSES / CLASSES STATIQUES) ===
export { default as AuthService } from "./AuthService";
export { default as BackupService } from "./BackupService";
export { default as BluetoothService } from "./BluetoothService";
export { default as ClientService } from "./ClientService";
export { default as DatabaseService } from "./DatabaseService";
export { default as LicenceService } from "./LicenceService";
export { default as PrintService } from "./PrintService";
export { default as SalesService } from "./SalesService";
export { default as StockService } from "./StockService";

// === 2. INSTANCES PRÊTES À L'EMPLOI (SINGLETONS) ===
export { authService } from "./AuthService";
export { backupService } from "./BackupService";
export { bluetoothService } from "./BluetoothService";
export { clientService } from "./ClientService";
export { dbService } from "./DatabaseService";
export { licenceService } from "./LicenceService";
export { printService } from "./PrintService";
export { salesService } from "./SalesService";
export { stockService } from "./StockService";

// === 3. EXPORTATION DES TYPES (Nettoyée de tout doublon) ===
// REMARK: Ajuste le chemin "../utils/types" si tes types sont stockés ailleurs (ex: "../types")
export type {
  AuthResult,
  BackupInfo,
  BackupOptions,
  BackupProgressCallback,
  BackupStats,
  BluetoothConfig,
  BluetoothDevice,
  BluetoothDeviceInfo,
  Client,
  ClientDebt,
  ClientFilter,
  ClientStats,
  ClientWithStats,
  CreateClientData,
  CreateSaleData,
  DatabaseStats as DBDatabaseStats,
  QueryResult as DBQueryResult,
  DebtFilter,
  Licence,
  LicenceActivationData,
  LicenceInfo,
  LicenceStats,
  LicenceValidationResult,
  LoginAttempt,
  Migration,
  MovementFilter,
  PrintConfig,
  PrinterStatus,
  PrintItem,
  PrintOptions,
  PrintReceiptData,
  PrintResult,
  Product,
  ProductFilter,
  ProductWithStats,
  RestoreOptions,
  Sale,
  SaleDetail,
  SaleFilter,
  SaleItem,
  SalesStats,
  SaleWithDetails,
  SessionInfo,
  StockAlert,
  StockMovement,
  StockStats,
  UpdateClientData
} from "../utils/types";

// === 4. DOCKING CONSTANTES POUR ACCÈS DYNAMIQUE ===
export const SERVICES = {
  AuthService,
  DatabaseService,
  PrintService,
  BluetoothService,
  StockService,
  SalesService,
  ClientService,
  LicenceService,
  BackupService,
};

export const instances = {
  authService,
  dbService,
  printService,
  bluetoothService,
  stockService,
  salesService,
  clientService,
  licenceService,
  backupService,
};

// === 5. EXPORT PAR DÉFAUT ===
const servicesGlobals = {
  ...SERVICES,
  ...instances,
  SERVICES,
  instances,
};