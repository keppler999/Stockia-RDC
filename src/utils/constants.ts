import { Platform } from "react-native";

// ============================================
// 📱 CONSTANTES DE L'APPLICATION
// ============================================

/** Nom de l'application */
export const APP_NAME = "Stockia";

/** Nom complet de l'application */
export const APP_FULL_NAME = "Stockia - Gestion Commerciale Intelligente";

/** Version de l'application */
export const APP_VERSION = "2.1.0";

/** Code de build */
export const APP_BUILD = "2026.06.26";

/** Éditeur */
export const APP_EDITOR = "Spirale Agence";

/** Site web */
export const APP_WEBSITE = "https://spiraleagence.com";

/** Email de support */
export const SUPPORT_EMAIL = "support@spiraleagence.com";

/** Numéro WhatsApp support */
export const SUPPORT_WHATSAPP = "+24383009563";

/** Année de copyright */
export const COPYRIGHT_YEAR = new Date().getFullYear();

// ============================================
// 📦 BASE DE DONNÉES
// ============================================

/** Nom de la base de données */
export const DATABASE_NAME = "stockia_secure.db";

/** Version de la base de données */
export const DATABASE_VERSION = 3;

/** Préfixe des tables */
export const DB_PREFIX = "stk_";

// ============================================
// 🔐 STOCKAGE ASYNC - CLÉS
// ============================================

export const STORAGE_KEYS = {
  // Session utilisateur
  USER_SESSION: "@stockia_user",
  USER_TOKEN: "@stockia_token",
  LAST_LOGIN: "@stockia_last_login",

  // Paramètres
  PRINT_ENABLED: "@stockia_print_enabled",
  BLOCKED_STATUS: "@stockia_blocked_status",
  APP_THEME: "@stockia_theme",
  NOTIFICATIONS: "@stockia_notifications",
  AUTO_BACKUP: "@stockia_auto_backup",

  // Appareil
  DEVICE_ID: "@stockia_device_id",
  DEVICE_FINGERPRINT: "@stockia_fingerprint",

  // Licence
  LICENCE_KEY: "@stockia_licence_key",
  LICENCE_STATUS: "@stockia_licence_status",

  // Sauvegarde
  LAST_BACKUP: "@stockia_last_backup",

  // Sécurité
  LOGIN_ATTEMPTS: "@stockia_login_attempts",
  LOCKOUT_TIME: "@stockia_lockout_time",

  // Paramètres de l'appareil
  SAVED_PRINTERS: "@stockia_saved_printers",
  LAST_BLUETOOTH_DEVICE: "@stockia_last_bluetooth_device",

  // Version DB
  DB_VERSION: "@stockia_db_version",
} as const;// ============================================
// 🎨 COULEURS - DESIGN SYSTEM
// ============================================

export const COLORS = {
  // === COULEURS PRINCIPALES ===
  primary: "#1565C0",
  primaryLight: "#E3F2FD",
  primaryDark: "#0D47A1",
  primaryGradient: ["#1565C0", "#0D47A1"],

  // === COULEURS SECONDAIRES ===
  secondary: "#6A1B9A",
  secondaryLight: "#E8EAF6",
  secondaryDark: "#4A148C",

  // === COULEURS DE STATUT ===
  success: "#2E7D32",
  successLight: "#E8F5E9",
  successDark: "#1B5E20",

  danger: "#C62828",
  dangerLight: "#FFEBEE",
  dangerDark: "#B71C1C",

  warning: "#EF6C00",
  warningLight: "#FFF3E0",
  warningDark: "#E65100",

  info: "#00838F",
  infoLight: "#E0F7FA",
  infoDark: "#006064",

  // === COULEURS NEUTRES ===
  white: "#FFFFFF",
  black: "#000000",

  gray: "#757575",
  grayLight: "#F5F5F5",
  grayLighter: "#FAFAFA",
  grayDark: "#424242",

  border: "#E0E0E0",
  borderLight: "#EAEAEA",
  borderDark: "#BDBDBD",

  text: "#333333",
  textLight: "#666666",
  textLighter: "#999999",
  textDark: "#1A1A1A",

  // === COULEURS DE FOND ===
  background: "#F8F9FA",
  backgroundLight: "#FFFFFF",
  backgroundDark: "#EEEEEE",

  card: "#FFFFFF",
  cardShadow: "rgba(0, 0, 0, 0.05)",

  // === COULEURS DE STATUT STOCK ===
  stockOk: "#2E7D32",
  stockLow: "#EF6C00",
  stockOut: "#C62828",

  // === COULEURS DE MODE ===
  darkModeBackground: "#121212",
  darkModeCard: "#1E1E1E",
  darkModeText: "#FFFFFF",
  darkModeBorder: "#333333",

  // === COULEURS DE PAIEMENT ===
  cash: "#2E7D32",
  mobileMoney: "#1565C0",
  cardPayment: "#6A1B9A", // Renommé pour éviter le doublon
  cheque: "#EF6C00",

  // === COULEURS DE RÔLES ===
  roleAdmin: "#C62828",
  roleGerant: "#1565C0",
  roleCaissier: "#2E7D32",
  roleMagasinier: "#EF6C00",
} as const;// ============================================
// 📏 TAILLES - DESIGN SYSTEM
// ============================================

export const SIZES = {
  fontSize: {
    xxs: 10,
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 32,
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    round: 9999,
  },
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
    xxxl: 40,
  },
  height: {
    input: { sm: 36, md: 44, lg: 52 },
    button: { sm: 32, md: 44, lg: 52 },
    header: 56,
    tabBar: 60,
  },
  width: {
    screen: "100%",
    maxContent: 1200,
  },
} as const;

// ============================================
// 🔤 TYPOGRAPHIE
// ============================================

export const TYPOGRAPHY = {
  fontFamily: {
    regular: "System",
    bold: "System-Bold",
    italic: "System-Italic",
    mono: "monospace",
  },
  weight: {
    thin: "100",
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    heavy: "800",
    black: "900",
  },
} as const;

// ============================================
// 🎯 RÔLES ET PERMISSIONS (RBAC)
// ============================================

export const ROLES = {
  ADMIN: "ADMIN",
  GERANT: "GERANT",
  CAISSIER: "CAISSIER",
  MAGASINIER: "MAGASINIER",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  GERANT: "Gérant",
  CAISSIER: "Caissier",
  MAGASINIER: "Magasinier",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: COLORS.roleAdmin,
  GERANT: COLORS.roleGerant,
  CAISSIER: COLORS.roleCaissier,
  MAGASINIER: COLORS.roleMagasinier,
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    "*",
    "manage_users",
    "manage_products",
    "manage_inventory",
    "view_reports",
    "manage_magasins",
    "manage_system",
    "create_sales",
    "view_all_sales",
    "manage_stock",
    "view_analytics",
    "manage_settings",
    "view_audit_logs",
    "manage_licences",
  ],
  GERANT: [
    "manage_products",
    "manage_inventory",
    "view_reports",
    "create_sales",
    "view_all_sales",
    "manage_stock",
    "view_analytics",
    "manage_settings",
    "manage_clients",
    "view_sales",
  ],
  CAISSIER: [
    "create_sales",
    "view_own_sales",
    "manage_stock",
    "view_clients",
    "create_clients",
    "print_tickets",
  ],
  MAGASINIER: [
    "manage_inventory",
    "manage_stock",
    "view_products",
    "create_mouvements",
    "view_stock_reports",
  ],
};

// ============================================
// 📋 MODES DE PAIEMENT
// ============================================

export const PAYMENT_MODES = {
  CASH: "CASH",
  MOBILE_MONEY: "MOBILE_MONEY",
  CARTE: "CARTE",
  CHEQUE: "CHEQUE",
} as const;

export type PaymentMode = (typeof PAYMENT_MODES)[keyof typeof PAYMENT_MODES];

export const PAYMENT_LABELS: Record<PaymentMode, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CARTE: "Carte Bancaire",
  CHEQUE: "Chèque",
};

export const PAYMENT_COLORS: Record<PaymentMode, string> = {
  CASH: COLORS.cash,
  MOBILE_MONEY: COLORS.mobileMoney,
  CARTE: COLORS.cardPayment,
  CHEQUE: COLORS.cheque,
};// ============================================
// 📦 TYPES DE MOUVEMENTS DE STOCK
// ============================================

export const MOVEMENT_TYPES = {
  VENTE: "VENTE",
  APPROVISIONNEMENT: "APPROVISIONNEMENT",
  PERTE: "PERTE",
  RETOUR: "RETOUR",
  AJUSTEMENT: "AJUSTEMENT",
} as const;

export type MovementType = (typeof MOVEMENT_TYPES)[keyof typeof MOVEMENT_TYPES];

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  VENTE: "Vente",
  APPROVISIONNEMENT: "Approvisionnement",
  PERTE: "Perte",
  RETOUR: "Retour",
  AJUSTEMENT: "Ajustement",
};

export const MOVEMENT_COLORS: Record<MovementType, string> = {
  VENTE: COLORS.danger,
  APPROVISIONNEMENT: COLORS.success,
  PERTE: COLORS.warning,
  RETOUR: COLORS.info,
  AJUSTEMENT: COLORS.secondary,
};

// ============================================
// 📝 MESSAGES D'ERREUR
// ============================================

export const ERROR_MESSAGES = {
  AUTH_INVALID_CREDENTIALS: "Identifiants invalides.",
  AUTH_USER_NOT_FOUND: "Utilisateur non trouvé.",
  AUTH_ACCOUNT_LOCKED: "Compte verrouillé. Veuillez patienter.",
  AUTH_ACCOUNT_INACTIVE: "Ce compte est désactivé.",
  AUTH_EMAIL_NOT_VERIFIED: "Email non vérifié.",
  AUTH_SESSION_EXPIRED: "Session expirée. Veuillez vous reconnecter.",
  DB_CONNECTION_ERROR: "Erreur de connexion à la base de données.",
  DB_QUERY_ERROR: "Erreur d'exécution de la requête.",
  DB_MIGRATION_ERROR: "Erreur lors de la migration de la base.",
  BT_NOT_AVAILABLE: "Bluetooth non disponible sur cet appareil.",
  BT_NOT_CONNECTED: "Aucune imprimante connectée.",
  BT_CONNECTION_ERROR: "Erreur de connexion Bluetooth.",
  BT_SCAN_ERROR: "Erreur de scan Bluetooth.",
  BT_PRINT_ERROR: "Erreur d'impression.",
  STOCK_INSUFFICIENT: "Stock insuffisant.",
  STOCK_NOT_FOUND: "Produit non trouvé.",
  STOCK_ALREADY_EXISTS: "Ce produit existe déjà.",
  SALE_EMPTY_CART: "Le panier est vide.",
  SALE_INVALID_PAYMENT: "Montant de paiement invalide.",
  SALE_INSUFFICIENT_AMOUNT: "Montant insuffisant.",
  NETWORK_ERROR: "Erreur de connexion réseau.",
  NETWORK_TIMEOUT: "Délai de connexion dépassé.",
  UNKNOWN_ERROR: "Une erreur inattendue est survenue.",
  NOT_IMPLEMENTED: "Fonctionnalité non implémentée.",
  INVALID_INPUT: "Données invalides.",
  PERMISSION_DENIED: "Permission refusée.",
  LICENCE_INVALID: "Licence invalide.",
  LICENCE_EXPIRED: "Licence expirée.",
  LICENCE_REVOKED: "Licence révoquée.",
} as const;

// ============================================
// ✅ MESSAGES DE SUCCÈS
// ============================================

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Connexion réussie.",
  LOGOUT_SUCCESS: "Déconnexion réussie.",
  SALE_SUCCESS: "Vente enregistrée avec succès.",
  STOCK_UPDATED: "Stock mis à jour avec succès.",
  BACKUP_SUCCESS: "Sauvegarde effectuée avec succès.",
  RESTORE_SUCCESS: "Restauration effectuée avec succès.",
  PRINT_SUCCESS: "Ticket imprimé avec succès.",
  SETTINGS_SAVED: "Paramètres sauvegardés.",
  LICENCE_ACTIVATED: "Licence activée avec succès.",
} as const;

// ============================================
// 🔄 STATUTS
// ============================================

export const STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  PAID: "PAID",
  UNPAID: "UNPAID",
} as const;

// ============================================
// ⚙️ PARAMÈTRES PAR DÉFAUT
// ============================================

export const DEFAULTS = {
  CURRENCY: "USD",
  CURRENCY_SYMBOL: "$",
  LANGUAGE: "fr",
  COUNTRY: "CD",
  TAX_RATE: 18,
  DEFAULT_DISCOUNT: 0,
  MAX_DISCOUNT_PERCENT: 100,
  ROUNDING: 2,
  DEFAULT_MIN_STOCK: 5,
  DEFAULT_SAFETY_STOCK: 3,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 5,
  SESSION_TIMEOUT: 30,
  TOKEN_EXPIRY: 7,
  PAPER_SIZE: "58mm",
  CHARS_PER_LINE: 32,
  AUTO_BACKUP_INTERVAL: 24,
  MAX_BACKUPS: 10,
} as const;

// ============================================
// 📱 PLATEFORME
// ============================================

export const PLATFORM = {
  IS_IOS: Platform.OS === "ios",
  IS_ANDROID: Platform.OS === "android",
  IS_WEB: Platform.OS === "web",
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
} as const;

export default {
  APP_NAME,
  APP_FULL_NAME,
  APP_VERSION,
  APP_EDITOR,
  DATABASE_NAME,
  COLORS,
  SIZES,
  ROLES,
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_PERMISSIONS,
  PAYMENT_MODES,
  PAYMENT_LABELS,
  PAYMENT_COLORS,
  MOVEMENT_TYPES,
  MOVEMENT_LABELS,
  MOVEMENT_COLORS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULTS,
  PLATFORM,
};