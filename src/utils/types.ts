// ============================================
// 📦 TYPES GÉNÉRAUX
// ============================================

/** Type pour les IDs */
export type ID = string | number;

/** Type pour les clés de tableau */
export type KeyOf<T> = keyof T;

/** Type pour les valeurs possibles */
export type ValueOf<T> = T[keyof T];

/** Type pour les fonctions de callback */
export type Callback<T = void> = (data?: T) => void;

/** Type pour les fonctions asynchrones */
export type AsyncCallback<T = void> = (data?: T) => Promise<void>;

/** Type pour les objets avec des clés dynamiques */
export type DynamicObject = Record<string, any>;

/** Type pour les états de chargement */
export type LoadingState = "idle" | "loading" | "success" | "error";

/** Type pour les résultats de requête */
export interface QueryResult<T = any> {
  success: boolean;
  data?: T[];
  error?: string;
  count?: number;
}

/** Type pour les options de tri */
export interface SortOptions {
  field: string;
  direction: "ASC" | "DESC";
}

/** Type pour les options de pagination */
export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

/** Type pour les résultats paginés */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// 🎯 TYPES D'UTILISATEUR
// ============================================

/** Rôles utilisateur */
export type UserRole = "ADMIN" | "GERANT" | "CAISSIER" | "MAGASINIER";

/** Session utilisateur */
export interface UserSession {
  id: number;
  nom: string;
  username: string;
  role: UserRole;
  email?: string;
  avatar?: string;
  magasin_id?: number;
  magasin_nom?: string;
  permissions?: string[];
  derniere_connexion?: string;
}

/** Paramètres utilisateur */
export interface UserSettings {
  printEnabled: boolean;
  darkMode: boolean;
  notifications: boolean;
  autoBackup: boolean;
  devise: string;
  nomBoutique: string;
}

// ============================================
// 📦 TYPES DE PRODUIT
// ============================================

/** Produit */
export interface Product {
  id: number;
  code_barre?: string;
  nom: string;
  categorie: string;
  sous_categorie?: string;
  prix_achat: number;
  prix_view: number;
  prix_promo?: number;
  stock_actuel: number;
  stock_minimum: number;
  stock_securite?: number;
  unite_mesure?: string;
  poids?: number;
  emplacement?: string;
  actif: number;
  created_at: string;
  updated_at: string;
}

/** Mouvement de stock */
export interface StockMovement {
  id: number;
  produit_id: number;
  type_mouvement:
    | "VENTE"
    | "APPROVISIONNEMENT"
    | "PERTE"
    | "RETOUR"
    | "AJUSTEMENT";
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  date_mouvement: string;
  commentaire?: string;
  utilisateur_id?: number;
}

/** Alerte stock */
export interface StockAlert {
  id: number;
  nom: string;
  stock_actuel: number;
  stock_minimum: number;
  categorie: string;
}

// ============================================
// 🛒 TYPES DE VENTE
// ============================================

/** Vente */
export interface Sale {
  id: number;
  facture_numero: string;
  client_id?: number;
  utilisateur_id: number;
  montant_brut: number;
  remise: number;
  montant_net: number;
  montant_paye: number;
  monnaie_rendue?: number;
  mode_paiement: "CASH" | "MOBILE_MONEY" | "CARTE" | "CHEQUE";
  statut: "COMPLETEE" | "ANNULEE" | "EN_ATTENTE";
  date_vente: string;
  notes?: string;
}

/** Détail de vente */
export interface SaleDetail {
  id: number;
  vente_id: number;
  produit_id: number;
  quantite: number;
  prix_unitaire: number;
  remise_ligne: number;
  sous_total: number;
}

/** Client */
export interface Client {
  id: number;
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  points_fidelite: number;
  total_achats: number;
  date_inscription: string;
  derniere_visite?: string;
  actif: number;
} // ============================================
// 💳 TYPES DE PAIEMENT
// ============================================

/** Mode de paiement */
export type PaymentMode = "CASH" | "MOBILE_MONEY" | "CARTE" | "CHEQUE";

/** Informations de paiement */
export interface PaymentInfo {
  mode: PaymentMode;
  montantRecu: number;
  monnaie: number;
  reference?: string;
  transactionId?: string;
  date_paiement: string;
}

/** Dette */
export interface Debt {
  id: number;
  client_id: number;
  vente_id: number;
  montant_initial: number;
  montant_restant: number;
  taux_interet?: number;
  echeance?: string;
  statut: "EN_COURS" | "SOLDE" | "IMPAGEE";
  date_creation: string;
  date_solde?: string;
  notes?: string;
}

// ============================================
// 🖨️ TYPES D'IMPRESSION
// ============================================

/** Article à imprimer */
export interface PrintItem {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  remise?: number;
  code_barre?: string;
}

/** Données du ticket de caisse */
export interface PrintReceiptData {
  numero: string;
  date: string;
  vendeur: string;
  client?: string;
  items: PrintItem[];
  sousTotal: number;
  remise: number;
  remisesPromo: number;
  total: number;
  montantPaye: number;
  monnaie: number;
  modePaiement: string;
  devise: string;
  nomBoutique: string;
  notes?: string;
  footer?: string;
}

/** Configuration d'impression */
export interface PrintConfig {
  paperSize: "58mm" | "80mm";
  charsPerLine: number;
  encoding: string;
  codepage: number;
  fontSize: number;
  fontBold: boolean;
  fontItalic: boolean;
  fontUnderline: boolean;
  align: "left" | "center" | "right";
}

/** Résultat d'impression */
export interface PrintResult {
  success: boolean;
  error?: string;
  ticketPath?: string;
}

// ============================================
// 🔐 TYPES DE LICENCE
// ============================================

/** Informations de licence */
export interface LicenceInfo {
  statut: "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING" | "DEMO";
  dateActivation?: string;
  dateExpiration?: string;
  joursRestants?: number;
  nomTitulaire?: string;
  emailTitulaire?: string;
  versionLicence?: string;
  typeLicence?: "STANDARD" | "PREMIUM" | "ENTERPRISE";
}

// ============================================
// 📱 TYPES DE BLUETOOTH
// ============================================

/** Appareil Bluetooth */
export interface BluetoothDevice {
  address: string;
  name: string;
  type?: string;
  connected?: boolean;
}

/** Statut de l'imprimante */
export interface PrinterStatus {
  connected: boolean;
  ready: boolean;
  deviceName?: string;
  paper?: boolean;
  error?: string;
} // ============================================
// 🧭 TYPES DE NAVIGATION
// ============================================

/** Paramètres de navigation */
export interface NavigationParams {
  screen?: string;
  params?: Record<string, any>;
}

/** Routes de l'application */
export type AppRoutes = {
  Login: undefined;
  MainTabs: undefined;
  LicenceBlock: undefined;
  Dashboard: undefined;
  Caisse: undefined;
  Stock: undefined;
  Analytics: undefined;
  Settings: undefined;
  ProductManagement: undefined;
  ClientManagement: undefined;
  UserManagement: undefined;
  Reports: undefined;
  InventoryAdjustment: undefined;
};

// ============================================
// 📊 TYPES DE STATISTIQUES
// ============================================

/** Indicateur KPI */
export interface KPI {
  caJour: number;
  caMois: number;
  caAnnee: number;
  beneficesJour: number;
  beneficesMois: number;
  beneficesAnnee: number;
  margeMoyenne: number;
  panierMoyen: number;
  tauxConversion: number;
  nombreVentes: number;
  nombreClients: number;
  produitsVendus: number;
  stockTotal: number;
  valeurStock: number;
  rotationStock: number;
  dettesEnCours: number;
  dettesRecouvrees: number;
  objectifAtteint: boolean;
  progressionObjectif: number;
}

/** Top produit */
export interface TopProduct {
  id: number;
  nom: string;
  quantite: number;
  total: number;
  categorie: string;
}

/** Top client */
export interface TopClient {
  id: number;
  nom: string;
  total_achats: number;
  points: number;
  nombre_ventes: number;
}

/** Vente par catégorie */
export interface CategorySale {
  nom: string;
  total: number;
  couleur: string;
}

/** Vente par mois */
export interface MonthlySale {
  mois: string;
  ca: number;
  benefices: number;
  nombre_ventes: number;
}

// ============================================
// ⚙️ TYPES DE CONFIGURATION
// ============================================

/** Configuration de l'application */
export interface AppConfig {
  apiUrl: string;
  appName: string;
  appVersion: string;
  environment: "development" | "staging" | "production";
  sentryDsn?: string;
  supportEmail: string;
  supportWhatsapp: string;
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  tokenExpiry: number;
  autoBackupInterval: number;
  maxBackups: number;
}

/** Variables d'environnement */
export interface EnvVars {
  API_URL: string;
  SENTRY_DSN?: string;
  SUPPORT_EMAIL: string;
  WHATSAPP_NUMBER: string;
  APP_ENV: "development" | "staging" | "production";
  APP_VERSION: string;
}

// ============================================
// ❌ TYPES D'ERREUR
// ============================================

/** Erreur applicative */
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  timestamp: string;
}

/** Niveaux d'erreur */
export type ErrorLevel = "info" | "warning" | "error" | "critical";

/** Réponse d'erreur */
export interface ErrorResponse {
  success: false;
  error: AppError;
}

// ============================================
// 📦 EXPORT PRINCIPAL
// ============================================

export default {
  // Types généraux
  ID,
  KeyOf,
  ValueOf,
  Callback,
  AsyncCallback,
  DynamicObject,
  LoadingState,
  QueryResult,
  SortOptions,
  PaginationOptions,
  PaginatedResult,

  // Types utilisateur
  UserRole,
  UserSession,
  UserSettings,

  // Types produit
  Product,
  StockMovement,
  StockAlert,

  // Types vente
  Sale,
  SaleDetail,
  Client,
  PaymentMode,
  PaymentInfo,
  Debt,

  // Types impression
  PrintItem,
  PrintReceiptData,
  PrintConfig,
  PrintResult,

  // Types licence
  LicenceInfo,

  // Types Bluetooth
  BluetoothDevice,
  PrinterStatus,

  // Types navigation
  NavigationParams,
  AppRoutes,

  // Types statistiques
  KPI,
  TopProduct,
  TopClient,
  CategorySale,
  MonthlySale,

  // Types configuration
  AppConfig,
  EnvVars,

  // Types erreur
  AppError,
  ErrorLevel,
  ErrorResponse,
};
