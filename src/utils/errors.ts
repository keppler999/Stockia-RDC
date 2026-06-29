// ============================================
// ❌ GESTION DES ERREURS
// ============================================

// === CODES D'ERREUR ===
export const ERROR_CODES = {
  // AUTH
  AUTH_INVALID_CREDENTIALS: "AUTH_001",
  AUTH_USER_NOT_FOUND: "AUTH_002",
  AUTH_ACCOUNT_LOCKED: "AUTH_003",
  AUTH_ACCOUNT_INACTIVE: "AUTH_004",
  AUTH_EMAIL_NOT_VERIFIED: "AUTH_005",
  AUTH_SESSION_EXPIRED: "AUTH_006",
  AUTH_TOKEN_INVALID: "AUTH_007",
  AUTH_PERMISSION_DENIED: "AUTH_008",
  AUTH_LOGIN_ATTEMPTS_EXCEEDED: "AUTH_009",
  AUTH_PASSWORD_WEAK: "AUTH_010",
  
  // DB
  DB_CONNECTION_ERROR: "DB_001",
  DB_QUERY_ERROR: "DB_002",
  DB_MIGRATION_ERROR: "DB_003",
  DB_NOT_INITIALIZED: "DB_004",
  DB_CONSTRAINT_VIOLATION: "DB_005",
  DB_RECORD_NOT_FOUND: "DB_006",
  DB_DUPLICATE_ENTRY: "DB_007",
  
  // BLUETOOTH
  BT_NOT_AVAILABLE: "BT_001",
  BT_NOT_CONNECTED: "BT_002",
  BT_CONNECTION_ERROR: "BT_003",
  BT_SCAN_ERROR: "BT_004",
  BT_PRINT_ERROR: "BT_005",
  BT_PAPER_OUT: "BT_006",
  BT_DEVICE_NOT_FOUND: "BT_007",
  
  // STOCK
  STOCK_INSUFFICIENT: "STK_001",
  STOCK_NOT_FOUND: "STK_002",
  STOCK_ALREADY_EXISTS: "STK_003",
  STOCK_MOVEMENT_ERROR: "STK_004",
  STOCK_MINIMUM_EXCEEDED: "STK_005",
  
  // VENTE
  SALE_EMPTY_CART: "SAL_001",
  SALE_INVALID_PAYMENT: "SAL_002",
  SALE_INSUFFICIENT_AMOUNT: "SAL_003",
  SALE_NOT_FOUND: "SAL_004",
  SALE_ALREADY_PAID: "SAL_005",
  SALE_CANCELLED: "SAL_006",
  
  // CLIENTS
  CLIENT_NOT_FOUND: "CLT_001",
  CLIENT_ALREADY_EXISTS: "CLT_002",
  CLIENT_DEBT_EXCEEDED: "CLT_003",
  
  // RESEAU
  NETWORK_ERROR: "NET_001",
  NETWORK_TIMEOUT: "NET_002",
  NETWORK_CONNECTION_LOST: "NET_003",
  
  // LICENCE
  LICENCE_INVALID: "LIC_001",
  LICENCE_EXPIRED: "LIC_002",
  LICENCE_REVOKED: "LIC_003",
  LICENCE_NOT_FOUND: "LIC_004",
  LICENCE_ACTIVATION_FAILED: "LIC_005",
  
  // SAUVEGARDE
  BACKUP_FAILED: "BAK_001",
  RESTORE_FAILED: "BAK_002",
  BACKUP_NOT_FOUND: "BAK_003",
  BACKUP_CORRUPTED: "BAK_004",
  
  // VALIDATION
  VALIDATION_ERROR: "VAL_001",
  INVALID_INPUT: "VAL_002",
  MISSING_FIELD: "VAL_003",
  INVALID_FORMAT: "VAL_004",
  
  // GENERAL
  UNKNOWN_ERROR: "GEN_001",
  NOT_IMPLEMENTED: "GEN_002",
  PERMISSION_DENIED: "GEN_003",
  RESOURCE_NOT_FOUND: "GEN_004",
  CONFLICT: "GEN_005",
  TIMEOUT: "GEN_006",
  SERVICE_UNAVAILABLE: "GEN_007",
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // AUTH
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: "Identifiants invalides.",
  [ERROR_CODES.AUTH_USER_NOT_FOUND]: "Utilisateur non trouvé.",
  [ERROR_CODES.AUTH_ACCOUNT_LOCKED]: "Compte verrouillé.",
  [ERROR_CODES.AUTH_ACCOUNT_INACTIVE]: "Compte désactivé.",
  [ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED]: "Email non vérifié.",
  [ERROR_CODES.AUTH_SESSION_EXPIRED]: "Session expirée.",
  [ERROR_CODES.AUTH_TOKEN_INVALID]: "Token invalide.",
  [ERROR_CODES.AUTH_PERMISSION_DENIED]: "Permission refusée.",
  [ERROR_CODES.AUTH_LOGIN_ATTEMPTS_EXCEEDED]: "Trop de tentatives.",
  [ERROR_CODES.AUTH_PASSWORD_WEAK]: "Mot de passe trop faible.",

  // DB
  [ERROR_CODES.DB_CONNECTION_ERROR]: "Erreur de connexion DB.",
  [ERROR_CODES.DB_QUERY_ERROR]: "Erreur de requête DB.",
  [ERROR_CODES.DB_MIGRATION_ERROR]: "Erreur de migration DB.",
  [ERROR_CODES.DB_NOT_INITIALIZED]: "DB non initialisée.",
  [ERROR_CODES.DB_CONSTRAINT_VIOLATION]: "Contrainte DB violée.",
  [ERROR_CODES.DB_RECORD_NOT_FOUND]: "Enregistrement non trouvé.",
  [ERROR_CODES.DB_DUPLICATE_ENTRY]: "Entrée en double.",

  // BT
  [ERROR_CODES.BT_NOT_AVAILABLE]: "Bluetooth non disponible.",
  [ERROR_CODES.BT_NOT_CONNECTED]: "Bluetooth non connecté.",
  [ERROR_CODES.BT_CONNECTION_ERROR]: "Erreur de connexion BT.",
  [ERROR_CODES.BT_SCAN_ERROR]: "Erreur de scan BT.",
  [ERROR_CODES.BT_PRINT_ERROR]: "Erreur d'impression.",
  [ERROR_CODES.BT_PAPER_OUT]: "Papier épuisé.",
  [ERROR_CODES.BT_DEVICE_NOT_FOUND]: "Appareil BT non trouvé.",

  // STOCK
  [ERROR_CODES.STOCK_INSUFFICIENT]: "Stock insuffisant.",
  [ERROR_CODES.STOCK_NOT_FOUND]: "Produit non trouvé.",
  [ERROR_CODES.STOCK_ALREADY_EXISTS]: "Produit existe déjà.",
  [ERROR_CODES.STOCK_MOVEMENT_ERROR]: "Erreur mouvement stock.",
  [ERROR_CODES.STOCK_MINIMUM_EXCEEDED]: "Stock minimum dépassé.",

  // VENTE
  [ERROR_CODES.SALE_EMPTY_CART]: "Panier vide.",
  [ERROR_CODES.SALE_INVALID_PAYMENT]: "Paiement invalide.",
  [ERROR_CODES.SALE_INSUFFICIENT_AMOUNT]: "Montant insuffisant.",
  [ERROR_CODES.SALE_NOT_FOUND]: "Vente non trouvée.",
  [ERROR_CODES.SALE_ALREADY_PAID]: "Vente déjà payée.",
  [ERROR_CODES.SALE_CANCELLED]: "Vente annulée.",

  // CLIENTS
  [ERROR_CODES.CLIENT_NOT_FOUND]: "Client non trouvé.",
  [ERROR_CODES.CLIENT_ALREADY_EXISTS]: "Client existe déjà.",
  [ERROR_CODES.CLIENT_DEBT_EXCEEDED]: "Dette client dépassée.",

  // RESEAU
  [ERROR_CODES.NETWORK_ERROR]: "Erreur réseau.",
  [ERROR_CODES.NETWORK_TIMEOUT]: "Timeout réseau.",
  [ERROR_CODES.NETWORK_CONNECTION_LOST]: "Connexion perdue.",

  // LICENCE
  [ERROR_CODES.LICENCE_INVALID]: "Licence invalide.",
  [ERROR_CODES.LICENCE_EXPIRED]: "Licence expirée.",
  [ERROR_CODES.LICENCE_REVOKED]: "Licence révoquée.",
  [ERROR_CODES.LICENCE_NOT_FOUND]: "Licence non trouvée.",
  [ERROR_CODES.LICENCE_ACTIVATION_FAILED]: "Échec activation licence.",

  // BACKUP
  [ERROR_CODES.BACKUP_FAILED]: "Échec sauvegarde.",
  [ERROR_CODES.RESTORE_FAILED]: "Échec restauration.",
  [ERROR_CODES.BACKUP_NOT_FOUND]: "Sauvegarde non trouvée.",
  [ERROR_CODES.BACKUP_CORRUPTED]: "Sauvegarde corrompue.",

  // VALIDATION
  [ERROR_CODES.VALIDATION_ERROR]: "Erreur validation.",
  [ERROR_CODES.INVALID_INPUT]: "Entrée invalide.",
  [ERROR_CODES.MISSING_FIELD]: "Champ manquant.",
  [ERROR_CODES.INVALID_FORMAT]: "Format invalide.",

  // GENERAL
  [ERROR_CODES.UNKNOWN_ERROR]: "Erreur inconnue.",
  [ERROR_CODES.NOT_IMPLEMENTED]: "Non implémenté.",
  [ERROR_CODES.PERMISSION_DENIED]: "Permission refusée.",
  [ERROR_CODES.RESOURCE_NOT_FOUND]: "Ressource non trouvée.",
  [ERROR_CODES.CONFLICT]: "Conflit.",
  [ERROR_CODES.TIMEOUT]: "Timeout.",
  [ERROR_CODES.SERVICE_UNAVAILABLE]: "Service indisponible.",
};export class AppError extends Error {
  code: ErrorCode;
  details?: Record<string, any>;
  timestamp: string;
  userMessage: string;

  constructor(code: ErrorCode, details?: Record<string, any>, customMessage?: string) {
    const message = customMessage || ERROR_MESSAGES[code] || "Une erreur est survenue.";
    super(message);
    
    this.name = "AppError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.userMessage = message;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON(): Record<string, any> {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  toString(): string {
    return `[${this.code}] ${this.message}`;
  }
}export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: ((error: AppError) => void)[] = [];
  private errorHistory: AppError[] = [];
  private maxHistorySize: number = 100;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  capture(error: AppError | Error | string, code?: ErrorCode): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(
        code || ERROR_CODES.UNKNOWN_ERROR,
        { originalError: error.message, stack: error.stack }
      );
    } else {
      appError = new AppError(
        code || ERROR_CODES.UNKNOWN_ERROR,
        { message: error }
      );
    }

    this.logError(appError);
    this.notifyListeners(appError);

    return appError;
  }

  async captureAsync<T>(
    promise: Promise<T>,
    errorCode?: ErrorCode
  ): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      throw this.capture(error as Error, errorCode);
    }
  }

  captureSilent(error: AppError | Error | string, code?: ErrorCode): void {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(code || ERROR_CODES.UNKNOWN_ERROR, { error });
    this.logError(appError);
  }

  private logError(error: AppError): void {
    console.error(`[${error.code}] ${error.message}`, error.details);
    
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.pop();
    }
  }

  private notifyListeners(error: AppError): void {
    for (const listener of this.errorListeners) {
      try {
        listener(error);
      } catch (e) {
        console.error("Erreur dans le listener d'erreur:", e);
      }
    }
  }

  addListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  clearHistory(): void {
    this.errorHistory = [];
  }

  getErrorsByCode(code: ErrorCode): AppError[] {
    return this.errorHistory.filter(error => error.code === code);
  }

  getLastErrors(count: number = 10): AppError[] {
    return this.errorHistory.slice(0, count);
  }
}export const errorHandler = ErrorHandler.getInstance();

export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const isValidErrorCode = (code: string): code is ErrorCode => {
  return Object.values(ERROR_CODES).includes(code as ErrorCode);
};

export const getErrorMessage = (code: ErrorCode): string => {
  return ERROR_MESSAGES[code] || "Erreur inconnue";
};

export const formatUserError = (error: AppError | Error | string): string => {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message || "Une erreur est survenue.";
  }
  return error;
};

export const ensureAppError = (error: unknown, defaultCode?: ErrorCode): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(
      defaultCode || ERROR_CODES.UNKNOWN_ERROR,
      { originalError: error.message, stack: error.stack }
    );
  }
  return new AppError(
    defaultCode || ERROR_CODES.UNKNOWN_ERROR,
    { error: String(error) }
  );
};export const isNetworkError = (error: AppError | Error): boolean => {
  const code = error instanceof AppError ? error.code : "";
  const networkCodes: string[] = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.NETWORK_TIMEOUT,
    ERROR_CODES.NETWORK_CONNECTION_LOST,
  ];
  return networkCodes.includes(code as string);
};

export const isAuthError = (error: AppError | Error): boolean => {
  const code = error instanceof AppError ? error.code : "";
  const authCodes: string[] = [
    ERROR_CODES.AUTH_INVALID_CREDENTIALS,
    ERROR_CODES.AUTH_USER_NOT_FOUND,
    ERROR_CODES.AUTH_ACCOUNT_LOCKED,
    ERROR_CODES.AUTH_SESSION_EXPIRED,
    ERROR_CODES.AUTH_TOKEN_INVALID,
    ERROR_CODES.AUTH_PERMISSION_DENIED,
  ];
  return authCodes.includes(code as string);
};

export const isDatabaseError = (error: AppError | Error): boolean => {
  const code = error instanceof AppError ? error.code : "";
  const dbCodes: string[] = [
    ERROR_CODES.DB_CONNECTION_ERROR,
    ERROR_CODES.DB_QUERY_ERROR,
    ERROR_CODES.DB_MIGRATION_ERROR,
    ERROR_CODES.DB_CONSTRAINT_VIOLATION,
  ];
  return dbCodes.includes(code as string);
};

export const isValidationError = (error: AppError | Error): boolean => {
  const code = error instanceof AppError ? error.code : "";
  const valCodes: string[] = [
    ERROR_CODES.VALIDATION_ERROR,
    ERROR_CODES.INVALID_INPUT,
    ERROR_CODES.MISSING_FIELD,
    ERROR_CODES.INVALID_FORMAT,
  ];
  return valCodes.includes(code as string);
};

export const isLicenceError = (error: AppError | Error): boolean => {
  const code = error instanceof AppError ? error.code : "";
  const licCodes: string[] = [
    ERROR_CODES.LICENCE_INVALID,
    ERROR_CODES.LICENCE_EXPIRED,
    ERROR_CODES.LICENCE_REVOKED,
  ];
  return licCodes.includes(code as string);
};

export const isBluetoothError = (error: AppError | Error): boolean => {
  const code = error instanceof AppError ? error.code : "";
  const btCodes: string[] = [
    ERROR_CODES.BT_NOT_AVAILABLE,
    ERROR_CODES.BT_NOT_CONNECTED,
    ERROR_CODES.BT_CONNECTION_ERROR,
    ERROR_CODES.BT_SCAN_ERROR,
    ERROR_CODES.BT_PRINT_ERROR,
  ];
  return btCodes.includes(code as string);
};

export const isCriticalError = (error: AppError | Error): boolean => {
  const code = error instanceof AppError ? error.code : "";
  const criticalCodes: string[] = [
    ERROR_CODES.DB_CONNECTION_ERROR,
    ERROR_CODES.DB_MIGRATION_ERROR,
    ERROR_CODES.LICENCE_INVALID,
    ERROR_CODES.LICENCE_EXPIRED,
    ERROR_CODES.LICENCE_REVOKED,
  ];
  return criticalCodes.includes(code as string);
};

// === CRÉATION D'ERREURS ===
export const createValidationError = (field: string, message: string): AppError => {
  return new AppError(
    ERROR_CODES.VALIDATION_ERROR,
    { field, message },
    message
  );
};

export const createMissingFieldError = (field: string): AppError => {
  return new AppError(
    ERROR_CODES.MISSING_FIELD,
    { field },
    `Le champ "${field}" est requis.`
  );
};

export const createPermissionError = (action: string): AppError => {
  return new AppError(
    ERROR_CODES.PERMISSION_DENIED,
    { action },
    `Permission refusée pour: ${action}`
  );
};

export const createNotFoundError = (resource: string, id: string | number): AppError => {
  return new AppError(
    ERROR_CODES.RESOURCE_NOT_FOUND,
    { resource, id },
    `${resource} avec l'identifiant ${id} non trouvé.`
  );
};

export const createConflictError = (resource: string, message?: string): AppError => {
  return new AppError(
    ERROR_CODES.CONFLICT,
    { resource },
    message || `Conflit avec ${resource}.`
  );
};

export default {
  ERROR_CODES,
  ERROR_MESSAGES,
  AppError,
  ErrorHandler,
  errorHandler,
  isAppError,
  isValidErrorCode,
  getErrorMessage,
  formatUserError,
  ensureAppError,
  isNetworkError,
  isAuthError,
  isDatabaseError,
  isValidationError,
  isLicenceError,
  isBluetoothError,
  isCriticalError,
  createValidationError,
  createMissingFieldError,
  createPermissionError,
  createNotFoundError,
  createConflictError,
};