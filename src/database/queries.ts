// ============================================
// 📁 REQUÊTES SQL PRÉDÉFINIES
// Version: 3.0.0
// Description: Requêtes SQL nettoyées et synchronisées pour BlueDeep
// ============================================

// === INTERFACES ===
export interface QueryDefinition {
  name: string;
  sql: string;
  description: string;
  params?: string[];
  returns?: string;
}

// === TYPES ===
export type QueryCategory =
  | "SELECT"
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "ANALYTICS"
  | "REPORTS"
  | "UTILITY";

// === CONSTANTES ===
export const QUERY_TYPES = {
  SELECT: "SELECT",
  INSERT: "INSERT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  ANALYTICS: "ANALYTICS",
  REPORTS: "REPORTS",
  UTILITY: "UTILITY",
} as const;

// ============================================
// 🔍 REQUÊTES SELECT
// ============================================

/**
 * Récupérer tous les produits avec leur stock et statistiques
 */
export const GET_ALL_PRODUCTS: QueryDefinition = {
  name: "get_all_products",
  sql: `
    SELECT 
      p.*,
      COALESCE(SUM(dv.quantite), 0) as total_vendus,
      COALESCE(SUM(dv.sous_total), 0) as total_ventes
    FROM produits p
    LEFT JOIN details_ventes dv ON p.id = dv.produit_id
    LEFT JOIN ventes v ON dv.vente_id = v.id AND v.statut = 'COMPLETEE'
    WHERE p.actif = 1
    GROUP BY p.id
    ORDER BY p.nom ASC
  `,
  description: "Récupère tous les produits actifs avec leurs statistiques de vente",
};

/**
 * Récupérer les produits en alerte de stock
 */
export const GET_PRODUCTS_ALERTE: QueryDefinition = {
  name: "get_products_alerte",
  sql: `
    SELECT 
      id, nom, categorie, stock_actuel, stock_minimum,
      (stock_minimum - stock_actuel) as manquant
    FROM produits
    WHERE actif = 1 AND stock_actuel <= stock_minimum
    ORDER BY (stock_minimum - stock_actuel) DESC
  `,
  description: "Récupère les produits dont le stock actuel est inférieur ou égal au seuil minimum",
};

/**
 * Récupérer les produits en rupture de stock
 */
export const GET_PRODUCTS_RUPTURE: QueryDefinition = {
  name: "get_products_rupture",
  sql: `
    SELECT id, nom, categorie, stock_actuel
    FROM produits
    WHERE actif = 1 AND stock_actuel <= 0
    ORDER BY nom ASC
  `,
  description: "Récupère les produits en rupture totale de stock",
};

/**
 * Récupérer les ventes du jour
 */
export const GET_SALES_TODAY: QueryDefinition = {
  name: "get_sales_today",
  sql: `
    SELECT 
      v.*,
      c.nom as client_nom,
      u.nom as utilisateur_nom
    FROM ventes v
    LEFT JOIN clients c ON v.client_id = c.id
    LEFT JOIN utilisateurs u ON v.utilisateur_id = u.id
    WHERE DATE(v.date_vente) = DATE('now', 'localtime')
    AND v.statut = 'COMPLETEE'
    ORDER BY v.date_vente DESC
  `,
  description: "Récupère les ventes complétées de la journée courante",
};

/**
 * Récupérer le chiffre d'affaires par période (12 derniers mois)
 */
export const GET_CA_BY_PERIODE: QueryDefinition = {
  name: "get_ca_by_periode",
  sql: `
    SELECT 
      strftime('%Y-%m', date_vente) as mois,
      SUM(montant_net) as total,
      COUNT(*) as nombre,
      AVG(montant_net) as panier_moyen
    FROM ventes
    WHERE statut = 'COMPLETEE'
    GROUP BY mois
    ORDER BY mois DESC
    LIMIT 12
  `,
  description: "Récupère le CA mensuel, volume et panier moyen sur les 12 derniers mois",
};

/**
 * Récupérer les top produits sur une période de 30 jours
 */
export const GET_TOP_PRODUCTS: QueryDefinition = {
  name: "get_top_products",
  sql: `
    SELECT 
      p.id,
      p.nom,
      p.categorie,
      SUM(dv.quantite) as total_vendus,
      SUM(dv.sous_total) as total_ventes,
      COUNT(DISTINCT v.id) as nombre_ventes
    FROM details_ventes dv
    JOIN produits p ON dv.produit_id = p.id
    JOIN ventes v ON dv.vente_id = v.id
    WHERE v.statut = 'COMPLETEE'
    AND v.date_vente >= datetime('now', '-30 days')
    GROUP BY p.id
    ORDER BY total_ventes DESC
    LIMIT ?
  `,
  description: "Récupère les produits générant le plus de CA sur les 30 derniers jours",
  params: ["limit"],
};

// ============================================
// ➕ REQUÊTES INSERT
// ============================================

/**
 * Insérer un nouveau produit
 */
export const INSERT_PRODUCT: QueryDefinition = {
  name: "insert_product",
  sql: `
    INSERT INTO produits (
      code_barre, nom, categorie, sous_categorie, description,
      prix_achat, prix_view, prix_promo, taux_tva,
      stock_actuel, stock_minimum, stock_securite,
      unite_mesure, poids, emplacement, image_url, code_fournisseur,
      date_peremption, actif
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  description: "Insère un nouveau produit dans le catalogue",
  params: [
    "code_barre", "nom", "categorie", "sous_categorie", "description",
    "prix_achat", "prix_view", "prix_promo", "taux_tva",
    "stock_actuel", "stock_minimum", "stock_securite",
    "unite_mesure", "poids", "emplacement", "image_url", "code_fournisseur",
    "date_peremption", "actif"
  ],
};

/**
 * Insérer une nouvelle vente
 */
export const INSERT_SALE: QueryDefinition = {
  name: "insert_sale",
  sql: `
    INSERT INTO ventes (
      facture_numero, client_id, utilisateur_id, vendeur_id,
      montant_brut, remise, remise_employe, montant_net,
      montant_paye, monnaie_rendue, mode_paiement, type_vente,
      statut, points_utilises, point_fidelite_gagnes, date_vente, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  description: "Insère une entête de transaction de vente",
  params: [
    "facture_numero", "client_id", "utilisateur_id", "vendeur_id",
    "montant_brut", "remise", "remise_employe", "montant_net",
    "montant_paye", "monnaie_rendue", "mode_paiement", "type_vente",
    "statut", "points_utilises", "point_fidelite_gagnes", "date_vente", "notes"
  ],
};

/**
 * Insérer un détail de vente
 */
export const INSERT_SALE_DETAIL: QueryDefinition = {
  name: "insert_sale_detail",
  sql: `
    INSERT INTO details_ventes (
      vente_id, produit_id, quantite,
      prix_unitaire, remise_ligne, sous_total
    ) VALUES (?, ?, ?, ?, ?, ?)
  `,
  description: "Insère une ligne d'article rattachée à une vente",
  params: ["vente_id", "produit_id", "quantite", "prix_unitaire", "remise_ligne", "sous_total"],
};

/**
 * Insérer un mouvement de stock
 */
export const INSERT_STOCK_MOVEMENT: QueryDefinition = {
  name: "insert_stock_movement",
  sql: `
    INSERT INTO mouvements_stock (
      produit_id, type_mouvement, quantite, stock_avant, stock_apres,
      valeur_unitaire, valeur_totale, reference, emplacement_source,
      emplacement_destination, date_mouvement, commentaire, utilisateur_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  description: "Enregistre un flux de stock (entrée, sortie, ajustement, perte)",
  params: [
    "produit_id", "type_mouvement", "quantite", "stock_avant", "stock_apres",
    "valeur_unitaire", "valeur_totale", "reference", "emplacement_source",
    "emplacement_destination", "date_mouvement", "commentaire", "utilisateur_id"
  ],
};

/**
 * Insérer un client
 */
export const INSERT_CLIENT: QueryDefinition = {
  name: "insert_client",
  sql: `
    INSERT INTO clients (
      nom, telephone, email, adresse, date_naissance, genre,
      profession, notes, avatar_url, points_fidelite, total_achats, actif
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  description: "Crée un nouveau profil client",
  params: [
    "nom", "telephone", "email", "adresse", "date_naissance", "genre",
    "profession", "notes", "avatar_url", "points_fidelite", "total_achats", "actif"
  ],
};

// ============================================
// ✏️ REQUÊTES UPDATE
// ============================================

/**
 * Mettre à jour le stock d'un produit
 */
export const UPDATE_PRODUCT_STOCK: QueryDefinition = {
  name: "update_product_stock",
  sql: `
    UPDATE produits 
    SET stock_actuel = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
  description: "Met à jour la quantité physique disponible d'un article",
  params: ["stock_actuel", "id"],
};

/**
 * Mettre à jour une vente existente
 */
export const UPDATE_SALE: QueryDefinition = {
  name: "update_sale",
  sql: `
    UPDATE ventes 
    SET 
      client_id = ?,
      montant_brut = ?,
      remise = ?,
      montant_net = ?,
      montant_paye = ?,
      monnaie_rendue = ?,
      mode_paiement = ?,
      statut = ?,
      notes = ?,
      date_annulation = ?
    WHERE id = ?
  `,
  description: "Modifie ou annule une entête de vente existante",
  params: [
    "client_id", "montant_brut", "remise", "montant_net",
    "montant_paye", "monnaie_rendue", "mode_paiement",
    "statut", "notes", "date_annulation", "id",
  ],
};

/**
 * Mettre à jour la fiche d'un client
 */
export const UPDATE_CLIENT: QueryDefinition = {
  name: "update_client",
  sql: `
    UPDATE clients 
    SET 
      nom = ?,
      telephone = ?,
      email = ?,
      adresse = ?,
      points_fidelite = ?,
      total_achats = ?,
      derniere_visite = ?,
      actif = ?
    WHERE id = ?
  `,
  description: "Met à jour l'ensemble des données d'un client",
  params: [
    "nom", "telephone", "email", "adresse",
    "points_fidelite", "total_achats", "derniere_visite",
    "actif", "id",
  ],
};

/**
 * Mettre à jour une dette suite à encaissement
 */
export const UPDATE_DEBT: QueryDefinition = {
  name: "update_debt",
  sql: `
    UPDATE dettes 
    SET 
      montant_restant = ?,
      statut = ?,
      date_solde = ?,
      dernier_paiement = ?,
      nombre_paiements = nombre_paiements + 1
    WHERE id = ?
  `,
  description: "Met à jour le solde restant d'un crédit client",
  params: ["montant_restant", "statut", "date_solde", "dernier_paiement", "id"],
};

// ============================================
// 📊 REQUÊTES ANALYTICS
// ============================================

/**
 * Statistiques consolidées de la journée courante
 */
export const GET_DAILY_STATS: QueryDefinition = {
  name: "get_daily_stats",
  sql: `
    SELECT 
      COALESCE(SUM(montant_net), 0) as ca,
      COUNT(*) as nombre_ventes,
      COALESCE(AVG(montant_net), 0) as panier_moyen,
      COALESCE(SUM(remise), 0) as total_remises,
      COUNT(DISTINCT client_id) as clients_uniques
    FROM ventes
    WHERE DATE(date_vente) = DATE('now', 'localtime')
    AND statut = 'COMPLETEE'
  `,
  description: "Calcul le CA total, remises et fréquentation du jour",
};

/**
 * Indicateurs mensuels historiques
 */
export const GET_MONTHLY_STATS: QueryDefinition = {
  name: "get_monthly_stats",
  sql: `
    SELECT 
      strftime('%Y-%m', date_vente) as mois,
      SUM(montant_net) as total_ca,
      COUNT(*) as nombre_ventes,
      AVG(montant_net) as panier_moyen,
      SUM(remise) as total_remises
    FROM ventes
    WHERE statut = 'COMPLETEE'
    AND date_vente >= datetime('now', '-12 months')
    GROUP BY mois
    ORDER BY mois DESC
  `,
  description: "Tableau de bord de l'évolution du CA mensuel sur un glissement de 12 mois",
};

/**
 * Top acheteurs (Portefeuille clients les plus rentables)
 */
export const GET_TOP_CLIENTS: QueryDefinition = {
  name: "get_top_clients",
  sql: `
    SELECT 
      c.id,
      c.nom,
      c.telephone,
      c.points_fidelite,
      COUNT(v.id) as nombre_ventes,
      SUM(v.montant_net) as total_achats
    FROM clients c
    JOIN ventes v ON c.id = v.client_id
    WHERE v.statut = 'COMPLETEE'
    AND v.date_vente >= datetime('now', '-30 days')
    GROUP BY c.id
    ORDER BY total_achats DESC
    LIMIT ?
  `,
  description: "Classement des clients par volume d'achat sur les 30 derniers jours",
  params: ["limit"],
};

/**
 * Ventilation des revenus par moyen de paiement
 */
export const GET_PAYMENT_DISTRIBUTION: QueryDefinition = {
  name: "get_payment_distribution",
  sql: `
    SELECT 
      mode_paiement,
      COUNT(*) as nombre,
      SUM(montant_net) as total
    FROM ventes
    WHERE statut = 'COMPLETEE'
    AND v.date_vente >= datetime('now', '-30 days')
    GROUP BY mode_paiement
    ORDER BY total DESC
  `,
  description: "Analyse des flux financiers par type de règlement sur 30 jours",
};

// ============================================
// 📦 EXPORT GLOBAL DES REQUÊTES
// ============================================

export const QUERIES = {
  GET_ALL_PRODUCTS,
  GET_PRODUCTS_ALERTE,
  GET_PRODUCTS_RUPTURE,
  GET_SALES_TODAY,
  GET_CA_BY_PERIODE,
  GET_TOP_PRODUCTS,
  INSERT_PRODUCT,
  INSERT_SALE,
  INSERT_SALE_DETAIL,
  INSERT_STOCK_MOVEMENT,
  INSERT_CLIENT,
  UPDATE_PRODUCT_STOCK,
  UPDATE_SALE,
  UPDATE_CLIENT,
  UPDATE_DEBT,
  GET_DAILY_STATS,
  GET_MONTHLY_STATS,
  GET_TOP_CLIENTS,
  GET_PAYMENT_DISTRIBUTION,
};

// ============================================
// 🏷️ GROUPEMENT DES REQUÊTES PAR CATÉGORIE
// ============================================

export const QUERIES_BY_CATEGORY: Record<QueryCategory, QueryDefinition[]> = {
  SELECT: [
    GET_ALL_PRODUCTS,
    GET_PRODUCTS_ALERTE,
    GET_PRODUCTS_RUPTURE,
    GET_SALES_TODAY,
    GET_CA_BY_PERIODE,
    GET_TOP_PRODUCTS,
  ],
  INSERT: [
    INSERT_PRODUCT,
    INSERT_SALE,
    INSERT_SALE_DETAIL,
    INSERT_STOCK_MOVEMENT,
    INSERT_CLIENT,
  ],
  UPDATE: [
    UPDATE_PRODUCT_STOCK,
    UPDATE_SALE,
    UPDATE_CLIENT,
    UPDATE_DEBT,
  ],
  DELETE: [],
  ANALYTICS: [
    GET_DAILY_STATS,
    GET_MONTHLY_STATS,
    GET_TOP_CLIENTS,
    GET_PAYMENT_DISTRIBUTION,
  ],
  REPORTS: [],
  UTILITY: [],
};

// ============================================
// 🔍 FONCTION DE RECHERCHE DE REQUÊTE
// ============================================

export const findQuery = (name: string): QueryDefinition | undefined => {
  return Object.values(QUERIES).find((q) => q.name === name);
};

// ============================================
// 📊 EXPORT PAR DÉFAUT
// ============================================

export default {
  QUERIES,
  QUERIES_BY_CATEGORY,
  findQuery,
  QUERY_TYPES,
};