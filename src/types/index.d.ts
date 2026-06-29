// ============================================
// 🌍 DÉCLARATIONS GLOBALES ET CONFIGURATION ENVS
// ============================================

declare global {
  // Déclaration correcte de la variable globale Expo/React Native
  var __DEV__: boolean;

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      API_URL?: string;
      SENTRY_DSN?: string;
      SUPPORT_EMAIL?: string;
      WHATSAPP_NUMBER?: string;
    }
  }

  // ============================================
  // 🎯 TYPES DE BASE
  // ============================================

  type ID = string | number;
  type KeyOf<T> = keyof T;
  type ValueOf<T> = T[keyof T];
 
  type Callback<T = void> = (data?: T) => void;
  type AsyncCallback<T = void> = (data?: T) => Promise<void>;
  type DynamicObject = Record<string, any>;
  type LoadingState = "idle" | "loading" | "success" | "error";

  interface QueryResult<T = any> {
    success: boolean;
    data?: T[];
    error?: string;
    count?: number;
    message?: string;
  }

  interface SortOptions<T = any> {
    field: keyof T;
    direction: "ASC" | "DESC";
  }

  interface PaginationOptions {
    page: number;
    limit: number;
    offset?: number;
    sort?: SortOptions;
  }

  interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }

  // ============================================
  // 👤 TYPES UTILISATEUR
  // ============================================

  type UserRole = "ADMIN" | "GERANT" | "CAISSIER" | "MAGASINIER";

  interface UserSession {
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
    created_at?: string;
  }

  interface UserSettings {
    printEnabled: boolean;
    darkMode: boolean;
    notifications: boolean;
    autoBackup: boolean;
    devise: string;
    nomBoutique: string;
    language: string;
    currency: string;
  }

  interface AuthCredentials {
    username: string;
    password: string;
    rememberMe?: boolean;
  }

  interface AuthResult {
    success: boolean;
    user?: UserSession;
    token?: string;
    error?: string;
    requiresTwoFactor?: boolean;
  }

  // ============================================
  // 📦 TYPES PRODUIT
  // ============================================

  interface Product {
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

  interface ProductWithStats extends Product {
    total_ventes: number;
    total_quantite: number;
    dernier_mouvement?: string;
    marge: number;
    rotation: number;
  }

  interface StockMovement {
    id: number;
    produit_id: number;
    type_mouvement: "VENTE" | "APPROVISIONNEMENT" | "PERTE" | "RETOUR" | "AJUSTEMENT";
    quantite: number;
    stock_avant: number;
    stock_apres: number;
    date_mouvement: string;
    commentaire?: string;
    utilisateur_id?: number;
    utilisateur_nom?: string;
  }

  interface StockAlert {
    id: number;
    produit_id: number;
    nom: string;
    stock_actuel: number;
    stock_minimum: number;
    categorie: string;
    emplacement?: string;
    niveau: "critique" | "alerte" | "info";
  }

  interface ProductLot {
    id: number;
    produit_id: number;
    numero_lot: string;
    quantite: number;
    prix_achat_lot?: number;
    date_fabrication?: string;
    date_expiration?: string;
    emplacement?: string;
    created_at: string;
  }

  // ============================================
  // 🛒 TYPES VENTE & CLIENTS
  // ============================================

  interface Sale {
    id: number;
    facture_numero: string;
    client_id?: number;
    utilisateur_id: number;
    utilisateur_nom?: string;
    montant_brut: number;
    remise: number;
    montant_net: number;
    montant_paye: number;
    monnaie_rendue?: number;
    mode_paiement: "CASH" | "MOBILE_MONEY" | "CARTE" | "CHEQUE";
    statut: "COMPLETEE" | "ANNULEE" | "EN_ATTENTE";
    date_vente: string;
    notes?: string;
    client_nom?: string;
    client_telephone?: string;
  }

  interface SaleDetail {
    id: number;
    vente_id: number;
    produit_id: number;
    produit_nom?: string;
    quantite: number;
    prix_unitaire: number;
    remise_ligne: number;
    sous_total: number;
    code_barre?: string;
  }

  interface Client {
    id: number;
    nom: string;
    telephone?: string;
    email?: string;
    adresse?: string;
    points_fidelite: number;
    total_achats: number;
    nombre_ventes?: number;
    date_inscription: string;
    derniere_visite?: string;
    actif: number;
    dettes?: number;
  }

  interface Debt {
    id: number;
    client_id: number;
    client_nom?: string;
    vente_id: number;
    facture_numero?: string;
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
  // 💳 TYPES PAIEMENT
  // ============================================

  type PaymentMode = "CASH" | "MOBILE_MONEY" | "CARTE" | "CHEQUE";

  interface PaymentInfo {
    mode: PaymentMode;
    montantRecu: number;
    monnaie: number;
    reference?: string;
    transactionId?: string;
    date_paiement: string;
    statut: "EN_ATTENTE" | "CONFIRME" | "ECHOUE";
  }

  interface PaymentTransaction {
    id: string;
    vente_id: number;
    montant: number;
    mode: PaymentMode;
    reference: string;
    statut: string;
    date_creation: string;
    date_confirmation?: string;
    details?: Record<string, any>;
  }

  // ============================================
  // 🖨️ TYPES IMPRESSION
  // ============================================

  interface PrintItem {
    nom: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
    remise?: number;
    code_barre?: string;
    categorie?: string;
  }

  interface PrintReceiptData {
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
    qrCode?: string;
    barcode?: string;
  }

  interface PrintConfig {
    paperSize: "58mm" | "80mm";
    charsPerLine: number;
    encoding: string;
    codepage: number;
    fontSize: number;
    fontBold: boolean;
    fontItalic: boolean;
    fontUnderline: boolean;
    align: "left" | "center" | "right";
    copies: number;
    cutPaper: boolean;
  }

  interface PrintResult {
    success: boolean;
    error?: string;
    ticketPath?: string;
    retry?: boolean;
  }

  // ============================================
  // 📱 TYPES BLUETOOTH
  // ============================================

  interface BluetoothDevice {
    address: string;
    name: string;
    type?: string;
    connected?: boolean;
    rssi?: number;
    manufacturerData?: any;
  }

  interface PrinterStatus {
    connected: boolean;
    ready: boolean;
    deviceName?: string;
    deviceAddress?: string;
    paper?: boolean;
    error?: string;
    battery?: number;
    temperature?: number;
  }

  interface BluetoothScanOptions {
    timeout?: number;
    deviceFilter?: string[];
    allowDuplicates?: boolean;
  }

  // ============================================
  // 🔐 TYPES LICENCE
  // ============================================

  interface LicenceInfo {
    statut: "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING" | "DEMO";
    dateActivation?: string;
    dateExpiration?: string;
    joursRestants?: number;
    nomTitulaire?: string;
    emailTitulaire?: string;
    versionLicence?: string;
    typeLicence?: "STANDARD" | "PREMIUM" | "ENTERPRISE";
    deviceFingerprint?: string;
    cleLicence?: string;
  }

  interface LicenceActivation {
    code: string;
    deviceFingerprint: string;
    dateActivation: string;
    dateExpiration: string;
    type: "STANDARD" | "PREMIUM" | "ENTERPRISE";
  }

  // ============================================
  // 📊 TYPES STATISTIQUES (KPI)
  // ============================================

  interface KPI {
    caJour: number;
    caMois: number;
    caAnnee: number;
    caPrecedent?: number;
    beneficesJour: number;
    beneficesMois: number;
    beneficesAnnee: number;
    margeMoyenne: number;
    panierMoyen: number;
    panierMoyenMois: number;
    tauxConversion: number;
    tauxFidelisation: number;
    nombreVentes: number;
    nombreClients: number;
    produitsVendus: number;
    stockTotal: number;
    valeurStock: number;
    rotationStock: number;
    joursStock: number;
    dettesEnCours: number;
    dettesRecouvrees: number;
    objectifAtteint: boolean;
    progressionObjectif: number;
  }

  interface TopProduct {
    id: number;
    nom: string;
    quantite: number;
    total: number;
    categorie: string;
    marge?: number;
  }

  interface TopClient {
    id: number;
    nom: string;
    total_achats: number;
    points: number;
    nombre_ventes: number;
    telephone?: string;
  }

  interface CategorySale {
    nom: string;
    total: number;
    couleur: string;
    pourcentage: number;
  }

  interface MonthlySale {
    mois: string;
    ca: number;
    benefices: number;
    nombre_ventes: number;
    panier_moyen: number;
  }

  interface DailySale {
    date: string;
    total: number;
    nombre: number;
    panier_moyen: number;
  }

  interface PeriodComparison {
    actuel: number;
    precedent: number;
    variation: number;
    tendance: "hausse" | "baisse" | "stable";
  }

  // ============================================
  // 🧭 TYPES DE NAVIGATION (React Navigation)
  // ============================================

  interface NavigationParams {
    screen?: string;
    params?: Record<string, any>;
    replace?: boolean;
    reset?: boolean;
  }

  type AppRoutes = {
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

  type ScreenName = keyof AppRoutes;

  interface NavigationProps {
    navigation: any;
    route: any;
  }

  // ============================================
  // ⚙️ CONFIGURATION & ERREURS
  // ============================================

  interface AppConfig {
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
    language: string;
    currency: string;
  }

  interface AppError {
    code: string;
    message: string;
    details?: Record<string, any>;
    stack?: string;
    timestamp: string;
    userMessage?: string;
  }

  type ErrorLevel = "info" | "warning" | "error" | "critical";

  interface ErrorResponse {
    success: false;
    error: AppError;
  }

  interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: string;
  }

  interface ApiPaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }

  // ============================================
  // 🔧 AUDIT & NOTIFICATIONS
  // ============================================

  interface AuditLog {
    id: number;
    utilisateur_id?: number;
    utilisateur_nom?: string;
    action: string;
    details?: string;
    timestamp: string;
    ip_address?: string;
    device_info?: string;
  }

  type AuditAction =
    | "LOGIN"
    | "LOGOUT"
    | "LOGIN_FAILED"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "EXPORT"
    | "IMPORT"
    | "BACKUP"
    | "RESTORE"
    | "PRINT"
    | "SALE"
    | "REFUND"
    | "CANCEL"
    | "STOCK_MOVEMENT"
    | "USER_MANAGEMENT"
    | "SYSTEM_CONFIG";

  interface Notification {
    id: string;
    title: string;
    body: string;
    type: "info" | "success" | "warning" | "error";
    data?: Record<string, any>;
    timestamp: string;
    read: boolean;
  }

  interface NotificationConfig {
    sound: boolean;
    vibration: boolean;
    priority: "high" | "normal" | "low";
    channelId?: string;
  }
}

// Ligne indispensable pour indiquer à TypeScript que ce fichier est un script d'ambiance global
export {};