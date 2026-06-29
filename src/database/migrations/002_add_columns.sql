-- ============================================
-- 📁 MIGRATION 002 - AJOUT DE COLONNES
-- Version: 2.0.0
-- Date: 2024-01-15
-- Description: Ajout de colonnes aux tables existantes
-- ============================================

-- ============================================
-- 📦 TABLE: produits
-- ============================================

-- Ajout de la colonne poids
ALTER TABLE produits ADD COLUMN poids REAL;

-- Ajout de la colonne unite_mesure (si non existante)
ALTER TABLE produits ADD COLUMN unite_mesure TEXT DEFAULT 'unité';

-- Ajout de la colonne taux_tva
ALTER TABLE produits ADD COLUMN taux_tva REAL DEFAULT 18;

-- Ajout de la colonne code_fournisseur
ALTER TABLE produits ADD COLUMN code_fournisseur TEXT;

-- Ajout de la colonne date_peremption
ALTER TABLE produits ADD COLUMN date_peremption TEXT;

-- Ajout de la colonne image_url
ALTER TABLE produits ADD COLUMN image_url TEXT;

-- Ajout de la colonne description
ALTER TABLE produits ADD COLUMN description TEXT;

-- ============================================
-- 👤 TABLE: clients
-- ============================================

-- Ajout de la colonne date_naissance
ALTER TABLE clients ADD COLUMN date_naissance TEXT;

-- Ajout de la colonne genre
ALTER TABLE clients ADD COLUMN genre TEXT CHECK(genre IN ('M', 'F', 'AUTRE'));

-- Ajout de la colonne profession
ALTER TABLE clients ADD COLUMN profession TEXT;

-- Ajout de la colonne notes
ALTER TABLE clients ADD COLUMN notes TEXT;

-- Ajout de la colonne avatar_url
ALTER TABLE clients ADD COLUMN avatar_url TEXT;

-- ============================================
-- 👤 TABLE: utilisateurs
-- ============================================

-- Ajout de la colonne telephone
ALTER TABLE utilisateurs ADD COLUMN telephone TEXT;

-- Ajout de la colonne date_naissance
ALTER TABLE utilisateurs ADD COLUMN date_naissance TEXT;

-- Ajout de la colonne derniere_ip
ALTER TABLE utilisateurs ADD COLUMN derniere_ip TEXT;

-- Ajout de la colonne tentatives_echouees
ALTER TABLE utilisateurs ADD COLUMN tentatives_echouees INTEGER DEFAULT 0;

-- Ajout de la colonne verrouille_jusqu_a
ALTER TABLE utilisateurs ADD COLUMN verrouille_jusqu_a TEXT;

-- ============================================
-- 🛒 TABLE: ventes
-- ============================================

-- Ajout de la colonne type_vente
ALTER TABLE ventes ADD COLUMN type_vente TEXT DEFAULT 'STANDARD' CHECK(type_vente IN ('STANDARD', 'RETOUR', 'ECHANGE'));

-- Ajout de la colonne remise_employe
ALTER TABLE ventes ADD COLUMN remise_employe REAL DEFAULT 0;

-- Ajout de la colonne points_utilises
ALTER TABLE ventes ADD COLUMN points_utilises INTEGER DEFAULT 0;

-- Ajout de la colonne point_fidelite_gagnes
ALTER TABLE ventes ADD COLUMN point_fidelite_gagnes INTEGER DEFAULT 0;

-- Ajout de la colonne vendeur_id
ALTER TABLE ventes ADD COLUMN vendeur_id INTEGER;

-- Ajout de la colonne date_annulation
ALTER TABLE ventes ADD COLUMN date_annulation TEXT;

-- ============================================
-- 📦 TABLE: mouvements_stock
-- ============================================

-- Ajout de la colonne reference
ALTER TABLE mouvements_stock ADD COLUMN reference TEXT;

-- Ajout de la colonne emplacement_source
ALTER TABLE mouvements_stock ADD COLUMN emplacement_source TEXT;

-- Ajout de la colonne emplacement_destination
ALTER TABLE mouvements_stock ADD COLUMN emplacement_destination TEXT;

-- Ajout de la colonne valeur_unitaire
ALTER TABLE mouvements_stock ADD COLUMN valeur_unitaire REAL;

-- Ajout de la colonne valeur_totale
ALTER TABLE mouvements_stock ADD COLUMN valeur_totale REAL;

-- ============================================
-- 💰 TABLE: dettes
-- ============================================

-- Ajout de la colonne interet_couru
ALTER TABLE dettes ADD COLUMN interet_couru REAL DEFAULT 0;

-- Ajout de la colonne dernier_paiement
ALTER TABLE dettes ADD COLUMN dernier_paiement TEXT;

-- Ajout de la colonne nombre_paiements
ALTER TABLE dettes ADD COLUMN nombre_paiements INTEGER DEFAULT 0;

-- Ajout de la colonne penalites
ALTER TABLE dettes ADD COLUMN penalites REAL DEFAULT 0;

-- ============================================
-- 📊 TABLE: audit_logs
-- ============================================

-- Ajout de la colonne niveau
ALTER TABLE audit_logs ADD COLUMN niveau TEXT DEFAULT 'INFO' CHECK(niveau IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL'));

-- Ajout de la colonne module
ALTER TABLE audit_logs ADD COLUMN module TEXT;

-- Ajout de la colonne session_id
ALTER TABLE audit_logs ADD COLUMN session_id INTEGER;

-- ============================================
-- 🔑 TABLE: sessions
-- ============================================

-- Ajout de la colonne ip_address
ALTER TABLE sessions ADD COLUMN ip_address TEXT;

-- Ajout de la colonne user_agent
ALTER TABLE sessions ADD COLUMN user_agent TEXT;

-- Ajout de la colonne derniere_activite
ALTER TABLE sessions ADD COLUMN derniere_activite TEXT;

-- ============================================
-- 🏷️ TABLE: fournisseurs
-- ============================================

-- Ajout de la colonne site_web
ALTER TABLE fournisseurs ADD COLUMN site_web TEXT;

-- Ajout de la colonne numero_tva
ALTER TABLE fournisseurs ADD COLUMN numero_tva TEXT;

-- Ajout de la colonne compte_bancaire
ALTER TABLE fournisseurs ADD COLUMN compte_bancaire TEXT;

-- Ajout de la colonne evaluation
ALTER TABLE fournisseurs ADD COLUMN evaluation INTEGER DEFAULT 0;

-- Ajout de la colonne notes
ALTER TABLE fournisseurs ADD COLUMN notes TEXT;

-- ============================================
-- 🏪 TABLE: magasins
-- ============================================

-- Ajout de la colonne telephone_2
ALTER TABLE magasins ADD COLUMN telephone_2 TEXT;

-- Ajout de la colonne site_web
ALTER TABLE magasins ADD COLUMN site_web TEXT;

-- Ajout de la colonne logo_url
ALTER TABLE magasins ADD COLUMN logo_url TEXT;

-- Ajout de la colonne region
ALTER TABLE magasins ADD COLUMN region TEXT;

-- Ajout de la colonne code_postal
ALTER TABLE magasins ADD COLUMN code_postal TEXT;

-- ============================================
-- 🎯 TABLE: promotions
-- ============================================

-- Ajout de la colonne description
ALTER TABLE promotions ADD COLUMN description TEXT;

-- Ajout de la colonne quantite_minimum
ALTER TABLE promotions ADD COLUMN quantite_minimum INTEGER DEFAULT 1;

-- Ajout de la colonne quantite_maximum
ALTER TABLE promotions ADD COLUMN quantite_maximum INTEGER;

-- Ajout de la colonne code_promo
ALTER TABLE promotions ADD COLUMN code_promo TEXT UNIQUE;

-- Ajout de la colonne utilisation_max
ALTER TABLE promotions ADD COLUMN utilisation_max INTEGER;

-- Ajout de la colonne utilisation_count
ALTER TABLE promotions ADD COLUMN utilisation_count INTEGER DEFAULT 0;

-- ============================================
-- 📦 TABLE: lots
-- ============================================

-- Ajout de la colonne prix_vente
ALTER TABLE lots ADD COLUMN prix_vente REAL;

-- Ajout de la colonne remise
ALTER TABLE lots ADD COLUMN remise REAL DEFAULT 0;

-- Ajout de la colonne emplacement_exact
ALTER TABLE lots ADD COLUMN emplacement_exact TEXT;

-- ============================================
-- 💳 TABLE: paiements
-- ============================================

-- Ajout de la colonne frais_transaction
ALTER TABLE paiements ADD COLUMN frais_transaction REAL DEFAULT 0;

-- Ajout de la colonne numero_transaction
ALTER TABLE paiements ADD COLUMN numero_transaction TEXT;

-- Ajout de la colonne operateur
ALTER TABLE paiements ADD COLUMN operateur TEXT;

-- Ajout de la colonne date_confirmation
ALTER TABLE paiements ADD COLUMN date_confirmation TEXT;

-- ============================================
-- 🔐 TABLE: licences
-- ============================================

-- Ajout de la colonne version_licence
ALTER TABLE licences ADD COLUMN version_licence TEXT;

-- Ajout de la colonne date_renouvellement
ALTER TABLE licences ADD COLUMN date_renouvellement TEXT;

-- Ajout de la colonne renouvellement_auto
ALTER TABLE licences ADD COLUMN renouvellement_auto INTEGER DEFAULT 0;

-- Ajout de la colonne entreprise
ALTER TABLE licences ADD COLUMN entreprise TEXT;

-- Ajout de la colonne notes
ALTER TABLE licences ADD COLUMN notes TEXT;

-- ============================================
-- 🔄 TABLE: password_resets
-- ============================================

-- Ajout de la colonne ip_address
ALTER TABLE password_resets ADD COLUMN ip_address TEXT;

-- Ajout de la colonne user_agent
ALTER TABLE password_resets ADD COLUMN user_agent TEXT;

-- Ajout de la colonne reset_completed
ALTER TABLE password_resets ADD COLUMN reset_completed INTEGER DEFAULT 0;

-- ============================================
-- 📦 TABLE: remboursements
-- ============================================

-- Ajout de la colonne mode_remboursement
ALTER TABLE remboursements ADD COLUMN mode_remboursement TEXT DEFAULT 'CASH' CHECK(mode_remboursement IN ('CASH', 'MOBILE_MONEY', 'CARTE', 'CHEQUE'));

-- Ajout de la colonne reference_remboursement
ALTER TABLE remboursements ADD COLUMN reference_remboursement TEXT;

-- Ajout de la colonne frais
ALTER TABLE remboursements ADD COLUMN frais REAL DEFAULT 0;

-- Ajout de la colonne approuve_par
ALTER TABLE remboursements ADD COLUMN approuve_par INTEGER;

-- ============================================
-- 📊 INDEX SUPPLÉMENTAIRES
-- ============================================

-- Index sur les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_produits_fournisseur ON produits(code_fournisseur);
CREATE INDEX IF NOT EXISTS idx_produits_peremption ON produits(date_peremption);
CREATE INDEX IF NOT EXISTS idx_clients_genre ON clients(genre);
CREATE INDEX IF NOT EXISTS idx_ventes_type ON ventes(type_vente);
CREATE INDEX IF NOT EXISTS idx_ventes_vendeur ON ventes(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_audit_niveau ON audit_logs(niveau);
CREATE INDEX IF NOT EXISTS idx_sessions_activite ON sessions(derniere_activite);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code_promo);
CREATE INDEX IF NOT EXISTS idx_paiements_transaction ON paiements(numero_transaction);