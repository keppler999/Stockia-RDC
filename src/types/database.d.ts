// ============================================
// 🗄️ TYPES DE BASE DE DONNÉES
// ============================================

export interface DatabaseConfig {
  name: string;
  version: number;
  journalMode: "DELETE" | "TRUNCATE" | "PERSIST" | "MEMORY" | "WAL" | "OFF";
  synchronous: "OFF" | "NORMAL" | "FULL" | "EXTRA";
  foreignKeys: boolean;
  cacheSize: number;
  walMode: boolean;
}

export interface SQLQueryResult<T = any> {
  data: T[];
  changes: number;
  lastInsertRowId: number;
  error?: string;
  success: boolean;
}

export interface SQLQueryOptions {
  params?: any[];
  transaction?: boolean;
  timeout?: number;
}

// ============================================
// 📊 TYPES DES TABLES (SQLite utilise 0 | 1 pour actif)
// ============================================

export interface DBUtilisateur {
  id: number;
  nom: string;
  username: string;
  password: string;
  role: "ADMIN" | "GERANT" | "CAISSIER" | "MAGASINIER";
  email?: string;
  actif: 0 | 1;
  derniere_connexion?: string;
  avatar?: string;
  magasin_id?: number;
  created_at: string;
  updated_at: string;
}

export interface DBProduit {
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
  actif: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface DBClient {
  id: number;
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  points_fidelite: number;
  total_achats: number;
  date_inscription: string;
  derniere_visite?: string;
  actif: 0 | 1;
}

export interface DBVente {
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

export interface DBDetailVente {
  id: number;
  vente_id: number;
  produit_id: number;
  quantite: number;
  prix_unitaire: number;
  remise_ligne: number;
  sous_total: number;
}

export interface DBMouvementStock {
  id: number;
  produit_id: number;
  type_mouvement: "VENTE" | "APPROVISIONNEMENT" | "PERTE" | "RETOUR" | "AJUSTEMENT";
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  date_mouvement: string;
  commentaire?: string;
  utilisateur_id?: number;
}

export interface DBDette {
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

export interface DBFournisseur {
  id: number;
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  contact_personne?: string;
  categorie?: string;
  actif: 0 | 1;
  created_at: string;
}

export interface DBLot {
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

export interface DBParametre {
  cle: string;
  valeur: string;
  description?: string;
  modifiable: 0 | 1;
  updated_at: string;
}

export interface DBSession {
  id: number;
  utilisateur_id: number;
  token: string;
  date_debut: string;
  date_fin?: string;
  actif: 0 | 1;
  device_info?: string;
}

export interface DBAuditLog {
  id: number;
  utilisateur_id?: number;
  action: string;
  details?: string;
  timestamp: string;
  ip_address?: string;
  device_info?: string;
}

export interface DBLicence {
  id: number;
  cle_licence: string;
  device_fingerprint: string;
  date_activation: string;
  date_expiration: string;
  statut: "PENDING" | "ACTIVE" | "EXPIRED" | "REVOKED";
  derniere_utilisation?: string;
  temps_utilisation_total: number;
  type_licence: "STANDARD" | "PREMIUM" | "ENTERPRISE";
  nom_titulaire?: string;
  email_titulaire?: string;
}

export interface DBPromotion {
  id: number;
  produit_id: number;
  type_promotion: "REMISE_POURCENTAGE" | "REMISE_FIXE" | "ACHAT_OFFERT";
  valeur: number;
  date_debut: string;
  date_fin: string;
  actif: 0 | 1;
}

export interface DBMagasin {
  id: number;
  nom: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  devise_par_defaut: string;
  actif: 0 | 1;
  created_at: string;
}

export interface DBPaiement {
  id: number;
  vente_id: number;
  montant: number;
  mode_paiement: "CASH" | "MOBILE_MONEY" | "CARTE" | "CHEQUE";
  reference?: string;
  date_paiement: string;
  statut: "EN_ATTENTE" | "CONFIRME" | "ECHOUE";
}

// ============================================
// 📝 TYPES DE REQUÊTES SQL
// ============================================

export interface QueryParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
  filters?: Record<string, any>;
  search?: string;
}

export interface PaginatedQueryResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StockAlertQuery extends QueryParams {
  threshold?: number;
  includeOutOfStock?: boolean;
  category?: string;
}

export interface SalesQuery extends QueryParams {
  startDate?: string;
  endDate?: string;
  clientId?: number;
  userId?: number;
  status?: ("COMPLETEE" | "ANNULEE" | "EN_ATTENTE")[];
  paymentMode?: "CASH" | "MOBILE_MONEY" | "CARTE" | "CHEQUE";
  invoiceNumber?: string;
}

export interface StockMovementQuery extends QueryParams {
  productId?: number;
  startDate?: string;
  endDate?: string;
  movementTypes?: ("VENTE" | "APPROVISIONNEMENT" | "PERTE" | "RETOUR" | "AJUSTEMENT")[];
  userId?: number;
}

export interface ClientQuery extends QueryParams {
  search?: string;
  withDebts?: boolean;
  activeOnly?: boolean;
}

export interface StatsQuery {
  period: "day" | "week" | "month" | "year";
  startDate?: string;
  endDate?: string;
  category?: string;
  magasinId?: number;
}

// ============================================
// 🔄 TYPES DE MIGRATIONS & SAUVEGARDES
// ============================================

export interface Migration {
  version: number;
  description: string;
  up: string | ((db: any) => Promise<void>);
  down?: string | ((db: any) => Promise<void>);
  created_at: string;
}

export interface MigrationState {
  currentVersion: number;
  appliedMigrations: number[];
  lastApplied: string;
}

export interface BackupInfo {
  name: string;
  size: number;
  date: Date;
  path: string;
  version?: number;
  checksum?: string;
}

export interface BackupOptions {
  compress?: boolean;
  encrypt?: boolean;
  password?: string;
  includeAttachments?: boolean;
}

export interface RestoreOptions {
  replace?: boolean;
  password?: string;
  verifyBeforeRestore?: boolean;
}

// ============================================
// 🛠️ TYPES D'INDEX & TRANSACTIONS
// ============================================

export interface DatabaseIndex {
  name: string;
  table: string;
  columns: string[];
  unique?: boolean;
  where?: string;
}

export interface DatabaseConstraint {
  name: string;
  table: string;
  columns: string[];
  type: "PRIMARY KEY" | "FOREIGN KEY" | "UNIQUE" | "CHECK" | "NOT NULL";
  reference?: {
    table: string;
    columns: string[];
    onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
    onUpdate?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  };
  expression?: string;
}

export interface TransactionOptions {
  mode?: "DEFERRED" | "IMMEDIATE" | "EXCLUSIVE";
  timeout?: number;
  retryOnConflict?: boolean;
  maxRetries?: number;
}

export interface TransactionContext {
  id: string;
  startedAt: Date;
  status: "PENDING" | "ACTIVE" | "COMMITTED" | "ROLLED_BACK";
  operations: string[];
}

export interface DatabaseStats {
  tableCount: number;
  totalRows: number;
  size: string;
  lastBackup: string | null;
  integrity: boolean;
  cacheHitRatio?: number;
  pageReads?: number;
  pageWrites?: number;
}

export interface TableStats {
  name: string;
  rowCount: number;
  size: number;
  indexCount: number;
  lastModified: string;
}

export interface DatabaseTestConfig {
  testDatabase?: string;
  seedData?: Record<string, any[]>;
  cleanupAfterTests?: boolean;
}

export interface DatabaseTestResult {
  success: boolean;
  message: string;
  duration: number;
  details?: any;
} 