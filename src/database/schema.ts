// ============================================
// 📁 SCHEMA - BASE DE DONNÉES
// Version: 3.0.0
// Description: Schéma complet et corrigé de la base de données BlueDeep
// ============================================

// === INTERFACES ===
export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
  primaryKey?: string | string[];
  foreignKeys?: SchemaForeignKey[];
  indexes?: SchemaIndex[];
  triggers?: SchemaTrigger[];
}

export interface SchemaColumn {
  name: string;
  type: "INTEGER" | "TEXT" | "REAL" | "BLOB" | "BOOLEAN" | "DATETIME";
  nullable?: boolean;
  default?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  check?: string;
}

export interface SchemaForeignKey {
  column: string;
  refTable: string;
  refColumn: string;
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  onUpdate?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
}

export interface SchemaIndex {
  name: string;
  columns: string[];
  unique?: boolean;
  where?: string;
}

export interface SchemaTrigger {
  name: string;
  timing: "BEFORE" | "AFTER" | "INSTEAD OF";
  event: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  statement: string;
}

// ============================================
// 🧑 TABLE: utilisateurs
// ============================================
export const USERS_TABLE: SchemaTable = {
  name: "utilisateurs",
  columns: [
    { name: "id", type: "INTEGER", primaryKey: true, autoIncrement: true },
    { name: "nom", type: "TEXT", nullable: false },
    { name: "username", type: "TEXT", nullable: false, unique: true },
    { name: "password", type: "TEXT", nullable: false },
    { name: "role", type: "TEXT", nullable: false, check: "role IN ('ADMIN', 'GERANT', 'CAISSIER', 'MAGASINIER')" },
    { name: "email", type: "TEXT", nullable: true },
    { name: "telephone", type: "TEXT", nullable: true },
    { name: "date_naissance", type: "TEXT", nullable: true },
    { name: "actif", type: "INTEGER", default: 1 },
    { name: "derniere_connexion", type: "TEXT", nullable: true },
    { name: "derniere_ip", type: "TEXT", nullable: true },
    { name: "tentatives_echouees", type: "INTEGER", default: 0 },
    { name: "verrouille_jusqu_a", type: "TEXT", nullable: true },
    { name: "avatar", type: "TEXT", nullable: true },
    { name: "magasin_id", type: "INTEGER", nullable: true },
    { name: "created_at", type: "TEXT", default: "CURRENT_TIMESTAMP" },
    { name: "updated_at", type: "TEXT", default: "CURRENT_TIMESTAMP" },
  ],
  foreignKeys: [
    { column: "magasin_id", refTable: "magasins", refColumn: "id", onDelete: "SET NULL" },
  ],
  indexes: [
    { name: "idx_utilisateurs_username", columns: ["username"], unique: true },
    { name: "idx_utilisateurs_email", columns: ["email"] },
    { name: "idx_utilisateurs_role", columns: ["role"] },
    { name: "idx_utilisateurs_magasin", columns: ["magasin_id"] },
  ],
};

// ============================================
// 🏪 TABLE: magasins
// ============================================
export const STORES_TABLE: SchemaTable = {
  name: "magasins",
  columns: [
    { name: "id", type: "INTEGER", primaryKey: true, autoIncrement: true },
    { name: "nom", type: "TEXT", nullable: false },
    { name: "adresse", type: "TEXT", nullable: true },
    { name: "telephone", type: "TEXT", nullable: true },
    { name: "telephone_2", type: "TEXT", nullable: true },
    { name: "email", type: "TEXT", nullable: true },
    { name: "site_web", type: "TEXT", nullable: true },
    { name: "logo_url", type: "TEXT", nullable: true },
    { name: "region", type: "TEXT", nullable: true },
    { name: "code_postal", type: "TEXT", nullable: true },
    { name: "devise_par_defaut", type: "TEXT", default: "USD" },
    { name: "actif", type: "INTEGER", default: 1 },
    { name: "created_at", type: "TEXT", default: "CURRENT_TIMESTAMP" },
  ],
  indexes: [
    { name: "idx_magasins_actif", columns: ["actif"] },
    { name: "idx_magasins_nom", columns: ["nom"] },
  ],
};

// ============================================
// 📦 TABLE: produits
// ============================================
export const PRODUCTS_TABLE: SchemaTable = {
  name: "produits",
  columns: [
    { name: "id", type: "INTEGER", primaryKey: true, autoIncrement: true },
    { name: "code_barre", type: "TEXT", nullable: true, unique: true },
    { name: "nom", type: "TEXT", nullable: false },
    { name: "categorie", type: "TEXT", nullable: false },
    { name: "sous_categorie", type: "TEXT", nullable: true },
    { name: "description", type: "TEXT", nullable: true },
    { name: "prix_achat", type: "REAL", nullable: false },
    { name: "prix_view", type: "REAL", nullable: false },
    { name: "prix_promo", type: "REAL", nullable: true },
    { name: "taux_tva", type: "REAL", default: 18 },
    { name: "stock_actuel", type: "INTEGER", default: 0 },
    { name: "stock_minimum", type: "INTEGER", default: 5 },
    { name: "stock_securite", type: "INTEGER", default: 3 },
    { name: "unite_mesure", type: "TEXT", default: "unité" },
    { name: "poids", type: "REAL", nullable: true },
    { name: "emplacement", type: "TEXT", nullable: true },
    { name: "image_url", type: "TEXT", nullable: true },
    { name: "code_fournisseur", type: "TEXT", nullable: true },
    { name: "date_peremption", type: "TEXT", nullable: true },
    { name: "actif", type: "INTEGER", default: 1 },
    { name: "created_at", type: "TEXT", default: "CURRENT_TIMESTAMP" },
    { name: "updated_at", type: "TEXT", default: "CURRENT_TIMESTAMP" },
  ],
  indexes: [
    { name: "idx_produits_code_barre", columns: ["code_barre"], unique: true },
    { name: "idx_produits_nom", columns: ["nom"] },
    { name: "idx_produits_categorie", columns: ["categorie"] },
    { name: "idx_produits_stock", columns: ["stock_actuel"] },
    { name: "idx_produits_actif", columns: ["actif"] },
    { name: "idx_produits_fournisseur", columns: ["code_fournisseur"] },
    { name: "idx_produits_peremption", columns: ["date_peremption"] },
  ],
};

// ============================================
// 👤 TABLE: clients
// ============================================
export const CLIENTS_TABLE: SchemaTable = {
  name: "clients",
  columns: [
    { name: "id", type: "INTEGER", primaryKey: true, autoIncrement: true },
    { name: "nom", type: "TEXT", nullable: false },
    { name: "telephone", type: "TEXT", nullable: true },
    { name: "email", type: "TEXT", nullable: true },
    { name: "adresse", type: "TEXT", nullable: true },
    { name: "date_naissance", type: "TEXT", nullable: true },
    { name: "genre", type: "TEXT", nullable: true, check: "genre IN ('M', 'F', 'AUTRE')" },
    { name: "profession", type: "TEXT", nullable: true },
    { name: "notes", type: "TEXT", nullable: true },
    { name: "avatar_url", type: "TEXT", nullable: true },
    { name: "points_fidelite", type: "INTEGER", default: 0 },
    { name: "total_achats", type: "REAL", default: 0 },
    { name: "date_inscription", type: "TEXT", default: "CURRENT_TIMESTAMP" },
    { name: "derniere_visite", type: "TEXT", nullable: true },
    { name: "actif", type: "INTEGER", default: 1 },
  ],
  indexes: [
    { name: "idx_clients_nom", columns: ["nom"] },
    { name: "idx_clients_telephone", columns: ["telephone"] },
    { name: "idx_clients_email", columns: ["email"] },
    { name: "idx_clients_points", columns: ["points_fidelite"] },
    { name: "idx_clients_actif", columns: ["actif"] },
  ],
};

// ============================================
// 🛒 TABLE: ventes
// ============================================
export const SALES_TABLE: SchemaTable = {
  name: "ventes",
  columns: [
    { name: "id", type: "INTEGER", primaryKey: true, autoIncrement: true },
    { name: "facture_numero", type: "TEXT", nullable: false, unique: true },
    { name: "client_id", type: "INTEGER", nullable: true },
    { name: "utilisateur_id", type: "INTEGER", nullable: false },
    { name: "vendeur_id", type: "INTEGER", nullable: true },
    { name: "montant_brut", type: "REAL", nullable: false },
    { name: "remise", type: "REAL", default: 0 },
    { name: "remise_employe", type: "REAL", default: 0 },
    { name: "montant_net", type: "REAL", nullable: false },
    { name: "montant_paye", type: "REAL", nullable: false },
    { name: "monnaie_rendue", type: "REAL", nullable: true },
    { name: "mode_paiement", type: "TEXT", nullable: false, check: "mode_paiement IN ('CASH', 'MOBILE_MONEY', 'CARTE', 'CHEQUE')" },
    { name: "type_vente", type: "TEXT", default: "STANDARD", check: "type_vente IN ('STANDARD', 'RETOUR', 'ECHANGE')" },
    { name: "statut", type: "TEXT", default: "COMPLETEE", check: "statut IN ('COMPLETEE', 'ANNULEE', 'EN_ATTENTE')" },
    { name: "points_utilises", type: "INTEGER", default: 0 },
    { name: "point_fidelite_gagnes", type: "INTEGER", default: 0 },
    { name: "date_vente", type: "TEXT", nullable: false },
    { name: "date_annulation", type: "TEXT", nullable: true },
    { name: "notes", type: "TEXT", nullable: true },
  ],
  foreignKeys: [
    { column: "client_id", refTable: "clients", refColumn: "id", onDelete: "SET NULL" },
    { column: "utilisateur_id", refTable: "utilisateurs", refColumn: "id", onDelete: "CASCADE" },
    { column: "vendeur_id", refTable: "utilisateurs", refColumn: "id", onDelete: "SET NULL" },
  ],
  indexes: [
    { name: "idx_ventes_facture", columns: ["facture_numero"], unique: true },
    { name: "idx_ventes_date", columns: ["date_vente"] },
    { name: "idx_ventes_client", columns: ["client_id"] },
    { name: "idx_ventes_utilisateur", columns: ["utilisateur_id"] },
    { name: "idx_ventes_statut", columns: ["statut"] },
    { name: "idx_ventes_type", columns: ["type_vente"] },
    { name: "idx_ventes_paiement", columns: ["mode_paiement"] },
  ],
};

// ============================================
// 📋 TABLE: details_ventes
// ============================================
export const SALE_DETAILS_TABLE: SchemaTable = {
  name: "details_ventes",
  columns: [
    { name: "id", type: "INTEGER", primaryKey: true, autoIncrement: true },
    { name: "vente_id", type: "INTEGER", nullable: false },
    { name: "produit_id", type: "INTEGER", nullable: false },
    { name: "quantite", type: "INTEGER", nullable: false },
    { name: "prix_unitaire", type: "REAL", nullable: false },
    { name: "remise_ligne", type: "REAL", default: 0 },
    { name: "sous_total", type: "REAL", nullable: false },
  ],
  foreignKeys: [
    { column: "vente_id", refTable: "ventes", refColumn: "id", onDelete: "CASCADE" },
    { column: "produit_id", refTable: "produits", refColumn: "id", onDelete: "CASCADE" },
  ],
  indexes: [
    { name: "idx_details_ventes_vente", columns: ["vente_id"] },
    { name: "idx_details_ventes_produit", columns: ["produit_id"] },
  ],
};

// ============================================
// 📦 TABLE: mouvements_stock
// ============================================
export const STOCK_MOVEMENTS_TABLE: SchemaTable = {
  name: "mouvements_stock",
  columns: [
    { name: "id", type: "INTEGER", primaryKey: true, autoIncrement: true },
    { name: "produit_id", type: "INTEGER", nullable: false },
    { name: "type_mouvement", type: "TEXT", nullable: false, check: "type_mouvement IN ('VENTE', 'APPROVISIONNEMENT', 'PERTE', 'RETOUR', 'AJUSTEMENT')" },
    { name: "quantite", type: "INTEGER", nullable: false },
    { name: "stock_avant", type: "INTEGER", nullable: false },
    { name: "stock_apres", type: "INTEGER", nullable: false },
    { name: "valeur_unitaire", type: "REAL", nullable: true },
    { name: "valeur_totale", type: "REAL", nullable: true },
    { name: "reference", type: "TEXT", nullable: true },
    { name: "emplacement_source", type: "TEXT", nullable: true },
    { name: "emplacement_destination", type: "TEXT", nullable: true },
    { name: "date_mouvement", type: "TEXT", nullable: false },
    { name: "commentaire", type: "TEXT", nullable: true },
    { name: "utilisateur_id", type: "INTEGER", nullable: true },
  ],
  foreignKeys: [
    { column: "produit_id", refTable: "produits", refColumn: "id", onDelete: "CASCADE" },
    { column: "utilisateur_id", refTable: "utilisateurs", refColumn: "id", onDelete: "SET NULL" },
  ],
  indexes: [
    { name: "idx_mouvements_produit", columns: ["produit_id"] },
    { name: "idx_mouvements_date", columns: ["date_mouvement"] },
    { name: "idx_mouvements_type", columns: ["type_mouvement"] },
    { name: "idx_mouvements_reference", columns: ["reference"] },
  ],
};

// ============================================
// 💰 TABLE: dettes
// ============================================
export const DEBTS_TABLE: SchemaTable = {
  name: "dettes",
  columns: [
    { name: "id", type: "INTEGER", primaryKey: true, autoIncrement: true },
    { name: "client_id", type: "INTEGER", nullable: false },
    { name: "vente_id", type: "INTEGER", nullable: false },
    { name: "montant_initial", type: "REAL", nullable: false },
    { name: "montant_restant", type: "REAL", nullable: false },
    { name: "taux_interet", type: "REAL", default: 0 },
    { name: "interet_couru", type: "REAL", default: 0 },
    { name: "penalites", type: "REAL", default: 0 },
    { name: "echeance", type: "TEXT", nullable: true },
    { name: "statut", type: "TEXT", nullable: false, check: "statut IN ('EN_COURS', 'SOLDE', 'IMPAGEE')" },
    { name: "dernier_paiement", type: "TEXT", nullable: true },
    { name: "nombre_paiements", type: "INTEGER", default: 0 },
    { name: "date_creation", type: "TEXT", nullable: false },
    { name: "date_solde", type: "TEXT", nullable: true },
    { name: "notes", type: "TEXT", nullable: true },
  ],
  foreignKeys: [
    { column: "client_id", refTable: "clients", refColumn: "id", onDelete: "CASCADE" },
    { column: "vente_id", refTable: "ventes", refColumn: "id", onDelete: "CASCADE" },
  ],
  indexes: [
    { name: "idx_dettes_client", columns: ["client_id"] },
    { name: "idx_dettes_statut", columns: ["statut"] },
    { name: "idx_dettes_echeance", columns: ["echeance"] },
    { name: "idx_dettes_vente", columns: ["vente_id"] },
  ],
};

// ============================================
// 🔑 TABLE: sessions
// ============================================
export const SESSIONS_TABLE: SchemaTable = {
  name: "sessions",
  columns: [
    { name: "id", type: "INTEGER", primaryKey: true, autoIncrement: true },
    { name: "utilisateur_id", type: "INTEGER", nullable: false },
    { name: "token", type: "TEXT", nullable: false, unique: true },
    { name: "date_debut", type: "TEXT", nullable: false },
    { name: "date_fin", type: "TEXT", nullable: true },
    { name: "ip_address", type: "TEXT", nullable: true },
    { name: "user_agent", type: "TEXT", nullable: true },
    { name: "derniere_activite", type: "TEXT", nullable: true },
    { name: "actif", type: "INTEGER", default: 1 },
    { name: "device_info", type: "TEXT", nullable: true },
  ],
  foreignKeys: [
    { column: "utilisateur_id", refTable: "utilisateurs", refColumn: "id", onDelete: "CASCADE" },
  ],
  indexes: [
    { name: "idx_sessions_token", columns: ["token"], unique: true },
    { name: "idx_sessions_utilisateur", columns: ["utilisateur_id"] },
    { name: "idx_sessions_actif", columns: ["actif"] },
    { name: "idx_sessions_activite", columns: ["derniere_activite"] },
  ],
};

// ============================================
// 📊 TABLE: audit_logs
// ============================================
export const AUDIT_LOGS_TABLE: SchemaTable = {
  name: "audit_logs",
  columns: [
    { name: "id", type: "INTEGER", primaryKey: true, autoIncrement: true },
    { name: "utilisateur_id", type: "INTEGER", nullable: true },
    { name: "action", type: "TEXT", nullable: false },
    { name: "details", type: "TEXT", nullable: true },
    { name: "niveau", type: "TEXT", default: "INFO", check: "niveau IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')" },
    { name: "module", type: "TEXT", nullable: true },
    { name: "ip_address", type: "TEXT", nullable: true },
    { name: "device_info", type: "TEXT", nullable: true },
    { name: "session_id", type: "INTEGER", nullable: true },
    { name: "timestamp", type: "TEXT", nullable: false },
  ],
  foreignKeys: [
    { column: "utilisateur_id", refTable: "utilisateurs", refColumn: "id", onDelete: "SET NULL" },
    { column: "session_id", refTable: "sessions", refColumn: "id", onDelete: "SET NULL" },
  ],
  indexes: [
    { name: "idx_audit_utilisateur", columns: ["utilisateur_id"] },
    { name: "idx_audit_timestamp", columns: ["timestamp"] },
    { name: "idx_audit_action", columns: ["action"] },
    { name: "idx_audit_niveau", columns: ["niveau"] },
  ],
};

// ============================================
// 🔐 TABLE: licences
// ============================================
export const LICENCES_TABLE: SchemaTable = {
  name: "licences",
  columns: [
    { name: "id", type: "INTEGER", primaryKey: true, autoIncrement: true },
    { name: "cle_licence", type: "TEXT", nullable: false },
    { name: "device_fingerprint", type: "TEXT", nullable: false },
    { name: "date_activation", type: "TEXT", nullable: false },
    { name: "date_expiration", type: "TEXT", nullable: false },
    { name: "date_renouvellement", type: "TEXT", nullable: true },
    { name: "renouvellement_auto", type: "INTEGER", default: 0 },
    { name: "statut", type: "TEXT", default: "PENDING", check: "statut IN ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED')" },
    { name: "type_licence", type: "TEXT", default: "STANDARD", check: "type_licence IN ('STANDARD', 'PREMIUM', 'ENTERPRISE')" },
    { name: "version_licence", type: "TEXT", nullable: true },
    { name: "entreprise", type: "TEXT", nullable: true },
    { name: "nom_titulaire", type: "TEXT", nullable: true },
    { name: "email_titulaire", type: "TEXT", nullable: true },
    { name: "derniere_utilisation", type: "TEXT", nullable: true },
    { name: "temps_utilisation_total", type: "INTEGER", default: 0 },
    { name: "notes", type: "TEXT", nullable: true },
  ],
  indexes: [
    { name: "idx_licences_fingerprint", columns: ["device_fingerprint"] },
    { name: "idx_licences_statut", columns: ["statut"] },
    { name: "idx_licences_cle", columns: ["cle_licence"] },
    { name: "idx_licences_expiration", columns: ["date_expiration"] },
  ],
};

// ============================================
// ⚙️ TABLE: parametres_systeme
// ============================================
export const SYSTEM_PARAMS_TABLE: SchemaTable = {
  name: "parametres_systeme",
  columns: [
    { name: "cle", type: "TEXT", primaryKey: true },
    { name: "valeur", type: "TEXT", nullable: false },
    { name: "description", type: "TEXT", nullable: true },
    { name: "modifiable", type: "INTEGER", default: 1 },
    { name: "updated_at", type: "TEXT", default: "CURRENT_TIMESTAMP" },
  ],
  indexes: [
    { name: "idx_parametres_cle", columns: ["cle"], unique: true },
  ],
};

// ============================================
// 📦 EXPORT DU SCHÉMA COMPLET
// ============================================
export const SCHEMA: SchemaTable[] = [
  USERS_TABLE,
  STORES_TABLE,
  PRODUCTS_TABLE,
  CLIENTS_TABLE,
  SALES_TABLE,
  SALE_DETAILS_TABLE,
  STOCK_MOVEMENTS_TABLE,
  DEBTS_TABLE,
  SESSIONS_TABLE,
  AUDIT_LOGS_TABLE,
  LICENCES_TABLE,
  SYSTEM_PARAMS_TABLE,
];

// ============================================
// 🏷️ MAPPING DES TABLES
// ============================================
export const TABLE_NAMES = {
  USERS: "utilisateurs",
  STORES: "magasins",
  PRODUCTS: "produits",
  CLIENTS: "clients",
  SALES: "ventes",
  SALE_DETAILS: "details_ventes",
  STOCK_MOVEMENTS: "mouvements_stock",
  DEBTS: "dettes",
  SESSIONS: "sessions",
  AUDIT_LOGS: "audit_logs",
  LICENCES: "licences",
  SYSTEM_PARAMS: "parametres_systeme",
} as const;

// ============================================
// 🎯 TYPES DES TABLES
// ============================================
export type TableName = typeof TABLE_NAMES[keyof typeof TABLE_NAMES];

export type SchemaMap = {
  [K in TableName]: SchemaTable;
};

// ============================================
// 📊 EXPORT PAR DÉFAUT
// ============================================
export default {
  SCHEMA,
  TABLE_NAMES,
  USERS_TABLE,
  STORES_TABLE,
  PRODUCTS_TABLE,
  CLIENTS_TABLE,
  SALES_TABLE,
  SALE_DETAILS_TABLE,
  STOCK_MOVEMENTS_TABLE,
  DEBTS_TABLE,
  SESSIONS_TABLE,
  AUDIT_LOGS_TABLE,
  LICENCES_TABLE,
  SYSTEM_PARAMS_TABLE,
};