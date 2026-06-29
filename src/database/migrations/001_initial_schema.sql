-- ============================================
-- 📁 MIGRATION 001 - SCHÉMA INITIAL
-- Version: 1.0.0
-- Date: 2024-01-01
-- Description: Création des tables de base
-- ============================================

-- ============================================
-- 🔐 TABLE: utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'GERANT', 'CAISSIER', 'MAGASINIER')),
    email TEXT,
    actif INTEGER DEFAULT 1,
    derniere_connexion TEXT,
    avatar TEXT,
    magasin_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id) ON DELETE SET NULL
);

-- ============================================
-- 🏪 TABLE: magasins
-- ============================================
CREATE TABLE IF NOT EXISTS magasins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    adresse TEXT,
    telephone TEXT,
    email TEXT,
    devise_par_defaut TEXT DEFAULT 'USD',
    actif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 📦 TABLE: produits
-- ============================================
CREATE TABLE IF NOT EXISTS produits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_barre TEXT UNIQUE,
    nom TEXT NOT NULL,
    categorie TEXT NOT NULL,
    sous_categorie TEXT,
    prix_achat REAL NOT NULL,
    prix_view REAL NOT NULL,
    prix_promo REAL,
    stock_actuel INTEGER NOT NULL DEFAULT 0,
    stock_minimum INTEGER NOT NULL DEFAULT 5,
    stock_securite INTEGER DEFAULT 3,
    unite_mesure TEXT DEFAULT 'unité',
    poids REAL,
    emplacement TEXT,
    actif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 👤 TABLE: clients
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    telephone TEXT,
    email TEXT,
    adresse TEXT,
    points_fidelite INTEGER DEFAULT 0,
    total_achats REAL DEFAULT 0,
    date_inscription TEXT DEFAULT CURRENT_TIMESTAMP,
    derniere_visite TEXT,
    actif INTEGER DEFAULT 1
);

-- ============================================
-- 🛒 TABLE: ventes
-- ============================================
CREATE TABLE IF NOT EXISTS ventes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    facture_numero TEXT NOT NULL UNIQUE,
    client_id INTEGER,
    utilisateur_id INTEGER NOT NULL,
    montant_brut REAL NOT NULL,
    remise REAL DEFAULT 0,
    montant_net REAL NOT NULL,
    montant_paye REAL NOT NULL,
    monnaie_rendue REAL,
    mode_paiement TEXT NOT NULL CHECK(mode_paiement IN ('CASH', 'MOBILE_MONEY', 'CARTE', 'CHEQUE')),
    statut TEXT DEFAULT 'COMPLETEE' CHECK(statut IN ('COMPLETEE', 'ANNULEE', 'EN_ATTENTE')),
    date_vente TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ============================================
-- 📋 TABLE: details_ventes
-- ============================================
CREATE TABLE IF NOT EXISTS details_ventes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vente_id INTEGER NOT NULL,
    produit_id INTEGER NOT NULL,
    quantite INTEGER NOT NULL,
    prix_unitaire REAL NOT NULL,
    remise_ligne REAL DEFAULT 0,
    sous_total REAL NOT NULL,
    FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

-- ============================================
-- 📦 TABLE: mouvements_stock
-- ============================================
CREATE TABLE IF NOT EXISTS mouvements_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER NOT NULL,
    type_mouvement TEXT NOT NULL CHECK(type_mouvement IN ('VENTE', 'APPROVISIONNEMENT', 'PERTE', 'RETOUR', 'AJUSTEMENT')),
    quantite INTEGER NOT NULL,
    stock_avant INTEGER NOT NULL,
    stock_apres INTEGER NOT NULL,
    date_mouvement TEXT NOT NULL,
    commentaire TEXT,
    utilisateur_id INTEGER,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================
-- 💰 TABLE: dettes
-- ============================================
CREATE TABLE IF NOT EXISTS dettes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    vente_id INTEGER NOT NULL,
    montant_initial REAL NOT NULL,
    montant_restant REAL NOT NULL,
    taux_interet REAL DEFAULT 0,
    echeance TEXT,
    statut TEXT NOT NULL CHECK(statut IN ('EN_COURS', 'SOLDE', 'IMPAGEE')),
    date_creation TEXT NOT NULL,
    date_solde TEXT,
    notes TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE
);

-- ============================================
-- 🏷️ TABLE: lots
-- ============================================
CREATE TABLE IF NOT EXISTS lots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER NOT NULL,
    numero_lot TEXT NOT NULL,
    quantite INTEGER NOT NULL,
    prix_achat_lot REAL,
    date_fabrication TEXT,
    date_expiration TEXT,
    emplacement TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

-- ============================================
-- 🔑 TABLE: sessions
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    date_debut TEXT NOT NULL,
    date_fin TEXT,
    actif INTEGER DEFAULT 1,
    device_info TEXT,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ============================================
-- 📊 TABLE: audit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TEXT NOT NULL,
    ip_address TEXT,
    device_info TEXT,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================
-- 🔐 TABLE: licences
-- ============================================
CREATE TABLE IF NOT EXISTS licences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cle_licence TEXT NOT NULL,
    device_fingerprint TEXT NOT NULL,
    date_activation TEXT NOT NULL,
    date_expiration TEXT NOT NULL,
    statut TEXT DEFAULT 'PENDING' CHECK(statut IN ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED')),
    derniere_utilisation TEXT,
    temps_utilisation_total INTEGER DEFAULT 0,
    type_licence TEXT DEFAULT 'STANDARD' CHECK(type_licence IN ('STANDARD', 'PREMIUM', 'ENTERPRISE')),
    nom_titulaire TEXT,
    email_titulaire TEXT
);

-- ============================================
-- 🎯 TABLE: promotions
-- ============================================
CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER NOT NULL,
    type_promotion TEXT NOT NULL CHECK(type_promotion IN ('REMISE_POURCENTAGE', 'REMISE_FIXE', 'ACHAT_OFFERT')),
    valeur REAL NOT NULL,
    date_debut TEXT NOT NULL,
    date_fin TEXT NOT NULL,
    actif INTEGER DEFAULT 1,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

-- ============================================
-- 💳 TABLE: paiements
-- ============================================
CREATE TABLE IF NOT EXISTS paiements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vente_id INTEGER NOT NULL,
    montant REAL NOT NULL,
    mode_paiement TEXT NOT NULL CHECK(mode_paiement IN ('CASH', 'MOBILE_MONEY', 'CARTE', 'CHEQUE')),
    reference TEXT,
    date_paiement TEXT NOT NULL,
    statut TEXT NOT NULL CHECK(statut IN ('EN_ATTENTE', 'CONFIRME', 'ECHOUE')),
    FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE
);

-- ============================================
-- ⚙️ TABLE: parametres_systeme
-- ============================================
CREATE TABLE IF NOT EXISTS parametres_systeme (
    cle TEXT PRIMARY KEY,
    valeur TEXT NOT NULL,
    description TEXT,
    modifiable INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 🔄 TABLE: password_resets
-- ============================================
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ============================================
-- 📦 TABLE: remboursements
-- ============================================
CREATE TABLE IF NOT EXISTS remboursements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vente_id INTEGER NOT NULL,
    montant REAL NOT NULL,
    raison TEXT,
    date_remboursement TEXT NOT NULL,
    utilisateur_id INTEGER,
    FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================
-- 🏷️ TABLE: fournisseurs
-- ============================================
CREATE TABLE IF NOT EXISTS fournisseurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    telephone TEXT,
    email TEXT,
    adresse TEXT,
    contact_personne TEXT,
    categorie TEXT,
    actif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 📊 INDEX POUR LES PERFORMANCES
-- ============================================

-- Index sur les codes-barres
CREATE INDEX IF NOT EXISTS idx_produits_code_barre ON produits(code_barre);

-- Index sur les stocks
CREATE INDEX IF NOT EXISTS idx_produits_stock ON produits(stock_actuel);
CREATE INDEX IF NOT EXISTS idx_produits_actif ON produits(actif);
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie);

-- Index sur les ventes
CREATE INDEX IF NOT EXISTS idx_ventes_date ON ventes(date_vente);
CREATE INDEX IF NOT EXISTS idx_ventes_client ON ventes(client_id);
CREATE INDEX IF NOT EXISTS idx_ventes_utilisateur ON ventes(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_ventes_statut ON ventes(statut);
CREATE INDEX IF NOT EXISTS idx_ventes_facture ON ventes(facture_numero);

-- Index sur les détails de ventes
CREATE INDEX IF NOT EXISTS idx_details_ventes_vente ON details_ventes(vente_id);
CREATE INDEX IF NOT EXISTS idx_details_ventes_produit ON details_ventes(produit_id);

-- Index sur les mouvements de stock
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements_stock(date_mouvement);
CREATE INDEX IF NOT EXISTS idx_mouvements_produit ON mouvements_stock(produit_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_type ON mouvements_stock(type_mouvement);

-- Index sur les dettes
CREATE INDEX IF NOT EXISTS idx_dettes_client ON dettes(client_id);
CREATE INDEX IF NOT EXISTS idx_dettes_statut ON dettes(statut);

-- Index sur les sessions
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_utilisateur ON sessions(utilisateur_id);

-- Index sur les logs
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_utilisateur ON audit_logs(utilisateur_id);

-- Index sur les licences
CREATE INDEX IF NOT EXISTS idx_licences_fingerprint ON licences(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_licences_statut ON licences(statut);

-- Index sur les lots
CREATE INDEX IF NOT EXISTS idx_lots_expiration ON lots(date_expiration);
CREATE INDEX IF NOT EXISTS idx_lots_produit ON lots(produit_id);

-- Index sur les promotions
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_promotions_produit ON promotions(produit_id);

-- Index sur les paiements
CREATE INDEX IF NOT EXISTS idx_paiements_vente ON paiements(vente_id);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON paiements(statut);

-- Index sur les remboursements
CREATE INDEX IF NOT EXISTS idx_remboursements_vente ON remboursements(vente_id);