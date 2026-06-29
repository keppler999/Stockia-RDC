-- ============================================
-- 📁 MIGRATION 003 - NOUVELLES TABLES
-- Version: 3.0.0
-- Date: 2024-02-01
-- Description: Ajout de nouvelles tables
-- ============================================

-- ============================================
-- 📊 TABLE: rapports
-- ============================================
CREATE TABLE IF NOT EXISTS rapports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('VENTES', 'STOCK', 'FINANCIER', 'CLIENTS', 'PRODUITS')),
    periode TEXT NOT NULL CHECK(periode IN ('JOUR', 'SEMAINE', 'MOIS', 'ANNEE', 'PERSONNALISE')),
    date_debut TEXT NOT NULL,
    date_fin TEXT NOT NULL,
    donnees TEXT NOT NULL, -- JSON
    utilisateur_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================
-- 📋 TABLE: commandes_fournisseurs
-- ============================================
CREATE TABLE IF NOT EXISTS commandes_fournisseurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fournisseur_id INTEGER NOT NULL,
    numero_commande TEXT NOT NULL UNIQUE,
    date_commande TEXT NOT NULL,
    date_livraison_prevue TEXT,
    date_livraison_effective TEXT,
    statut TEXT NOT NULL CHECK(statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE')),
    montant_total REAL NOT NULL,
    notes TEXT,
    utilisateur_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================
-- 📦 TABLE: details_commandes
-- ============================================
CREATE TABLE IF NOT EXISTS details_commandes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commande_id INTEGER NOT NULL,
    produit_id INTEGER NOT NULL,
    quantite INTEGER NOT NULL,
    prix_unitaire REAL NOT NULL,
    remise REAL DEFAULT 0,
    sous_total REAL NOT NULL,
    quantite_recue INTEGER DEFAULT 0,
    FOREIGN KEY (commande_id) REFERENCES commandes_fournisseurs(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

-- ============================================
-- 🎯 TABLE: objectifs
-- ============================================
CREATE TABLE IF NOT EXISTS objectifs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('VENTES', 'CLIENTS', 'PRODUITS', 'BENEFICES')),
    valeur_cible REAL NOT NULL,
    periode TEXT NOT NULL CHECK(periode IN ('JOUR', 'SEMAINE', 'MOIS', 'ANNEE')),
    date_debut TEXT NOT NULL,
    date_fin TEXT,
    atteint INTEGER DEFAULT 0,
    date_atteint TEXT,
    utilisateur_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================
-- 📱 TABLE: notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER NOT NULL,
    titre TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('INFO', 'SUCCES', 'WARNING', 'ERREUR', 'ALERTE')),
    lu INTEGER DEFAULT 0,
    data TEXT, -- JSON
    date_creation TEXT NOT NULL,
    date_lecture TEXT,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ============================================
-- 🏷️ TABLE: categories
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL UNIQUE,
    description TEXT,
    couleur TEXT DEFAULT '#1565C0',
    actif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 📦 TABLE: unites_mesure
-- ============================================
CREATE TABLE IF NOT EXISTS unites_mesure (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL UNIQUE,
    symbole TEXT NOT NULL UNIQUE,
    description TEXT,
    actif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 🔄 TABLE: historique_prix
-- ============================================
CREATE TABLE IF NOT EXISTS historique_prix (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER NOT NULL,
    ancien_prix REAL NOT NULL,
    nouveau_prix REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('ACHAT', 'VENTE', 'PROMO')),
    raison TEXT,
    utilisateur_id INTEGER,
    date_modification TEXT NOT NULL,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================
-- 📊 TABLE: statistiques_journalieres
-- ============================================
CREATE TABLE IF NOT EXISTS statistiques_journalieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    total_ventes REAL NOT NULL DEFAULT 0,
    nombre_ventes INTEGER NOT NULL DEFAULT 0,
    total_clients INTEGER NOT NULL DEFAULT 0,
    nouveaux_clients INTEGER NOT NULL DEFAULT 0,
    total_produits_vendus INTEGER NOT NULL DEFAULT 0,
    total_benefices REAL NOT NULL DEFAULT 0,
    total_dettes REAL NOT NULL DEFAULT 0,
    total_remises REAL NOT NULL DEFAULT 0,
    panier_moyen REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 📋 TABLE: tickets_impression
-- ============================================
CREATE TABLE IF NOT EXISTS tickets_impression (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vente_id INTEGER NOT NULL,
    contenu TEXT NOT NULL,
    format TEXT DEFAULT 'THERMIQUE',
    copies INTEGER DEFAULT 1,
    imprimable INTEGER DEFAULT 1,
    date_impression TEXT,
    utilisateur_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================
-- 💰 TABLE: transactions_financieres
-- ============================================
CREATE TABLE IF NOT EXISTS transactions_financieres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('VENTE', 'ACHAT', 'DEPENSE', 'RECETTE', 'TRANSFERT')),
    montant REAL NOT NULL,
    description TEXT,
    categorie TEXT,
    reference TEXT,
    date_transaction TEXT NOT NULL,
    utilisateur_id INTEGER,
    magasin_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id) ON DELETE SET NULL
);

-- ============================================
-- 📦 TABLE: inventaires
-- ============================================
CREATE TABLE IF NOT EXISTS inventaires (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    date_debut TEXT NOT NULL,
    date_fin TEXT,
    statut TEXT DEFAULT 'EN_COURS' CHECK(statut IN ('EN_COURS', 'TERMINE', 'ANNULE')),
    notes TEXT,
    utilisateur_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================
-- 📋 TABLE: details_inventaires
-- ============================================
CREATE TABLE IF NOT EXISTS details_inventaires (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventaire_id INTEGER NOT NULL,
    produit_id INTEGER NOT NULL,
    quantite_theorique INTEGER NOT NULL,
    quantite_reelle INTEGER NOT NULL,
    ecart INTEGER NOT NULL,
    commentaire TEXT,
    FOREIGN KEY (inventaire_id) REFERENCES inventaires(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

-- ============================================
-- 📊 TABLE: performances
-- ============================================
CREATE TABLE IF NOT EXISTS performances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER NOT NULL,
    periode TEXT NOT NULL CHECK(periode IN ('JOUR', 'SEMAINE', 'MOIS', 'ANNEE')),
    date_debut TEXT NOT NULL,
    date_fin TEXT NOT NULL,
    total_ventes REAL NOT NULL DEFAULT 0,
    nombre_ventes INTEGER NOT NULL DEFAULT 0,
    total_clients INTEGER NOT NULL DEFAULT 0,
    satisfaction REAL DEFAULT 0,
    score INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ============================================
-- 📦 TABLE: retours_produits
-- ============================================
CREATE TABLE IF NOT EXISTS retours_produits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vente_id INTEGER NOT NULL,
    produit_id INTEGER NOT NULL,
    quantite INTEGER NOT NULL,
    raison TEXT NOT NULL,
    statut TEXT DEFAULT 'EN_ATTENTE' CHECK(statut IN ('EN_ATTENTE', 'APPROUVE', 'REFUSE', 'TRAITE')),
    date_retour TEXT NOT NULL,
    date_traitement TEXT,
    utilisateur_id INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================
-- 📊 INDEX
-- ============================================

-- Index sur les rapports
CREATE INDEX IF NOT EXISTS idx_rapports_type ON rapports(type);
CREATE INDEX IF NOT EXISTS idx_rapports_date ON rapports(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_rapports_utilisateur ON rapports(utilisateur_id);

-- Index sur les commandes
CREATE INDEX IF NOT EXISTS idx_commandes_fournisseur ON commandes_fournisseurs(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes_fournisseurs(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_date ON commandes_fournisseurs(date_commande);

-- Index sur les détails de commandes
CREATE INDEX IF NOT EXISTS idx_details_commandes_commande ON details_commandes(commande_id);
CREATE INDEX IF NOT EXISTS idx_details_commandes_produit ON details_commandes(produit_id);

-- Index sur les objectifs
CREATE INDEX IF NOT EXISTS idx_objectifs_type ON objectifs(type);
CREATE INDEX IF NOT EXISTS idx_objectifs_periode ON objectifs(periode);
CREATE INDEX IF NOT EXISTS idx_objectifs_utilisateur ON objectifs(utilisateur_id);

-- Index sur les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur ON notifications(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications(lu);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(date_creation);

-- Index sur les catégories
CREATE INDEX IF NOT EXISTS idx_categories_actif ON categories(actif);

-- Index sur l'historique des prix
CREATE INDEX IF NOT EXISTS idx_historique_prix_produit ON historique_prix(produit_id);
CREATE INDEX IF NOT EXISTS idx_historique_prix_date ON historique_prix(date_modification);

-- Index sur les statistiques journalières
CREATE INDEX IF NOT EXISTS idx_stats_date ON statistiques_journalieres(date);

-- Index sur les tickets d'impression
CREATE INDEX IF NOT EXISTS idx_tickets_vente ON tickets_impression(vente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_date ON tickets_impression(created_at);

-- Index sur les transactions financières
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions_financieres(date_transaction);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions_financieres(type);
CREATE INDEX IF NOT EXISTS idx_transactions_utilisateur ON transactions_financieres(utilisateur_id);

-- Index sur les inventaires
CREATE INDEX IF NOT EXISTS idx_inventaires_statut ON inventaires(statut);
CREATE INDEX IF NOT EXISTS idx_inventaires_date ON inventaires(date_debut);

-- Index sur les détails d'inventaires
CREATE INDEX IF NOT EXISTS idx_details_inventaires_inventaire ON details_inventaires(inventaire_id);
CREATE INDEX IF NOT EXISTS idx_details_inventaires_produit ON details_inventaires(produit_id);

-- Index sur les performances
CREATE INDEX IF NOT EXISTS idx_performances_utilisateur ON performances(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_performances_periode ON performances(periode);

-- Index sur les retours produits
CREATE INDEX IF NOT EXISTS idx_retours_vente ON retours_produits(vente_id);
CREATE INDEX IF NOT EXISTS idx_retours_produit ON retours_produits(produit_id);
CREATE INDEX IF NOT EXISTS idx_retours_statut ON retours_produits(statut);