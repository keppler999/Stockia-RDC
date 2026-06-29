// ============================================
// 📁 SEED - DONNÉES INITIALES
// Version: 3.0.0
// Description: Données initiales et démo synchronisées avec le schéma global
// ============================================

import * as SQLite from "expo-sqlite";

// === INTERFACES ===
export interface SeedData {
  utilisateurs: any[];
  magasins: any[];
  categories: any[];
  unites_mesure: any[];
  parametres_systeme: any[];
  clients?: any[];
  produits?: any[];
}

export interface SeedOptions {
  /** Réinitialiser les données existantes */
  reset?: boolean;
  /** Inclure les données de démonstration */
  includeDemo?: boolean;
  /** Nombre de produits de démonstration */
  demoProductsCount?: number;
}

// === CONSTANTES ===
const DEMO_PRODUCTS_COUNT = 20;
const DATABASE_NAME = "stockia_secure.db";

// ============================================
// 👤 UTILISATEURS
// ============================================
export const SEED_USERS = [
  {
    nom: "Administrateur",
    username: "admin",
    password: "admin123",
    role: "ADMIN",
    email: "admin@stockia.com",
    actif: 1,
  },
  {
    nom: "Gérant Boutique",
    username: "gerant",
    password: "gerant123",
    role: "GERANT",
    email: "gerant@stockia.com",
    actif: 1,
  },
  {
    nom: "Caissier Principal",
    username: "caisse",
    password: "caisse123",
    role: "CAISSIER",
    email: "caissier@stockia.com",
    actif: 1,
  },
  {
    nom: "Magasinier Dépôt",
    username: "magasin",
    password: "magasin123",
    role: "MAGASINIER",
    email: "magasinier@stockia.com",
    actif: 1,
  },
];

// ============================================
// 🏪 MAGASINS
// ============================================
export const SEED_STORES = [
  {
    nom: "Stockia Store - Kinshasa",
    adresse: "123 Avenue de la Paix, Kinshasa",
    telephone: "+243 812 345 678",
    email: "contact@stockia.com",
    devise_par_defaut: "USD",
    actif: 1,
  },
];

// ============================================
// 🏷️ CATÉGORIES
// ============================================
export const SEED_CATEGORIES = [
  { nom: "Alimentation", description: "Produits alimentaires", couleur: "#4CAF50" },
  { nom: "Boissons", description: "Boissons et jus", couleur: "#2196F3" },
  { nom: "Snacks", description: "Snacks et encas", couleur: "#FF9800" },
  { nom: "Hygiène", description: "Produits d'hygiène", couleur: "#9C27B0" },
  { nom: "Beauté", description: "Produits de beauté", couleur: "#E91E63" },
  { nom: "Pharmacie", description: "Produits pharmaceutiques", couleur: "#F44336" },
  { nom: "Ménage", description: "Produits d'entretien", couleur: "#607D8B" },
  { nom: "Électroménager", description: "Appareils électroménagers", couleur: "#795548" },
  { nom: "Vêtements", description: "Vêtements et accessoires", couleur: "#3F51B5" },
  { nom: "Accessoires", description: "Accessoires divers", couleur: "#009688" },
];

// ============================================
// 📏 UNITÉS DE MESURE
// ============================================
export const SEED_UNITS = [
  { nom: "unité", symbole: "u", description: "Pièce unitaire" },
  { nom: "kilogramme", symbole: "kg", description: "Kilogramme" },
  { nom: "gramme", symbole: "g", description: "Gramme" },
  { nom: "litre", symbole: "L", description: "Litre" },
  { nom: "millilitre", symbole: "mL", description: "Millilitre" },
  { nom: "paquet", symbole: "pqt", description: "Paquet" },
  { nom: "boîte", symbole: "bte", description: "Boîte" },
  { nom: "sac", symbole: "sac", description: "Sac" },
  { nom: "bouteille", symbole: "btl", description: "Bouteille" },
  { nom: "carton", symbole: "ctn", description: "Carton" },
];

// ============================================
// ⚙️ PARAMÈTRES SYSTÈME
// ============================================
export const SEED_PARAMS = [
  { cle: "nom_boutique", valeur: "Stockia Store - Kinshasa", description: "Nom de la boutique" },
  { cle: "devise_symbole", valeur: "USD", description: "Symbole de la devise" },
  { cle: "taux_tva", valeur: "18", description: "Taux de TVA en pourcentage" },
  { cle: "seuil_stock_alerte", valeur: "5", description: "Seuil d'alerte pour le stock" },
  { cle: "objectif_journalier", valeur: "500", description: "Objectif de CA journalier" },
  { cle: "impression_automatique", valeur: "1", description: "Impression automatique des tickets" },
  { cle: "marge_par_defaut", valeur: "30", description: "Marge bénéficiaire par défaut" },
  { cle: "format_facture", valeur: "STANDARD", description: "Format des factures" },
];

// ============================================
// 📦 PRODUITS DE DÉMONSTRATION
// ============================================
export const SEED_DEMO_PRODUCTS = [
  {
    code_barre: "1234567890123",
    nom: "Huile de Palme 1L",
    categorie: "Alimentation",
    prix_achat: 3.50,
    prix_view: 4.50,
    stock_actuel: 20,
    stock_minimum: 5,
    unite_mesure: "bouteille",
    actif: 1,
  },
  {
    code_barre: "1234567890124",
    nom: "Riz Parfumé 5kg",
    categorie: "Alimentation",
    prix_achat: 8.00,
    prix_view: 10.50,
    stock_actuel: 15,
    stock_minimum: 3,
    unite_mesure: "sac",
    actif: 1,
  },
  {
    code_barre: "1234567890125",
    nom: "Sucre 1kg",
    categorie: "Alimentation",
    prix_achat: 2.00,
    prix_view: 2.80,
    stock_actuel: 10,
    stock_minimum: 2,
    unite_mesure: "paquet",
    actif: 1,
  },
  {
    code_barre: "1234567890126",
    nom: "Eau Minérale 1.5L",
    categorie: "Boissons",
    prix_achat: 0.50,
    prix_view: 0.80,
    stock_actuel: 30,
    stock_minimum: 10,
    unite_mesure: "bouteille",
    actif: 1,
  },
  {
    code_barre: "1234567890127",
    nom: "Biscuits Assortis",
    categorie: "Snacks",
    prix_achat: 1.20,
    prix_view: 1.80,
    stock_actuel: 25,
    stock_minimum: 5,
    unite_mesure: "paquet",
    actif: 1,
  },
  {
    code_barre: "1234567890128",
    nom: "Savon Liquide 500mL",
    categorie: "Hygiène",
    prix_achat: 2.50,
    prix_view: 3.50,
    stock_actuel: 12,
    stock_minimum: 4,
    unite_mesure: "bouteille",
    actif: 1,
  },
  {
    code_barre: "1234567890129",
    nom: "Crème Hydratante",
    categorie: "Beauté",
    prix_achat: 4.00,
    prix_view: 6.00,
    stock_actuel: 8,
    stock_minimum: 3,
    unite_mesure: "unité",
    actif: 1,
  },
  {
    code_barre: "1234567890130",
    nom: "Paracétamol 500mg",
    categorie: "Pharmacie",
    prix_achat: 1.50,
    prix_view: 2.50,
    stock_actuel: 20,
    stock_minimum: 5,
    unite_mesure: "boîte",
    actif: 1,
  },
  {
    code_barre: "1234567890131",
    nom: "Détergent 1L",
    categorie: "Ménage",
    prix_achat: 3.00,
    prix_view: 4.00,
    stock_actuel: 10,
    stock_minimum: 3,
    unite_mesure: "bouteille",
    actif: 1,
  },
  {
    code_barre: "1234567890132",
    nom: "Fer à Repasser",
    categorie: "Électroménager",
    prix_achat: 25.00,
    prix_view: 35.00,
    stock_actuel: 5,
    stock_minimum: 2,
    unite_mesure: "unité",
    actif: 1,
  },
];

// ============================================
// 👤 CLIENTS DE DÉMONSTRATION
// ============================================
export const SEED_DEMO_CLIENTS = [
  {
    nom: "Jean Mbuyi",
    telephone: "+243 812 345 679",
    email: "jean@email.com",
    adresse: "Kinshasa, RDC",
    points_fidelite: 50,
    actif: 1,
  },
  {
    nom: "Marie Kabila",
    telephone: "+243 812 345 680",
    email: "marie@email.com",
    adresse: "Lubumbashi, RDC",
    points_fidelite: 30,
    actif: 1,
  },
  {
    nom: "Pierre Kasongo",
    telephone: "+243 812 345 681",
    email: "pierre@email.com",
    adresse: "Goma, RDC",
    points_fidelite: 20,
    actif: 1,
  },
];

// ============================================
// 🚀 FONCTION DE SEED
// ============================================

export async function seedDatabase(options: SeedOptions = {}): Promise<void> {
  const { reset = false, includeDemo = true, demoProductsCount = DEMO_PRODUCTS_COUNT } = options;

  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    console.log("[Seed] Début du seeding...");

    // === RÉINITIALISATION ===
    if (reset) {
      console.log("[Seed] Réinitialisation des données...");
      await db.execAsync("DELETE FROM utilisateurs;");
      await db.execAsync("DELETE FROM magasins;");
      await db.execAsync("DELETE FROM categories;");
      await db.execAsync("DELETE FROM unites_mesure;");
      await db.execAsync("DELETE FROM parametres_systeme;");
      await db.execAsync("DELETE FROM clients;");
      await db.execAsync("DELETE FROM produits;");
      console.log("[Seed] Données réinitialisées");
    }

    // === TRANSACTION ===
    await db.withTransactionAsync(async () => {
      // 1. Utilisateurs
      console.log("[Seed] Insertion des utilisateurs...");
      for (const user of SEED_USERS) {
        await db.runAsync(
          `INSERT OR IGNORE INTO utilisateurs (
            nom, username, password, role, email, actif
          ) VALUES (?, ?, ?, ?, ?, ?);`,
          [user.nom, user.username, user.password, user.role, user.email, user.actif]
        );
      }

      // 2. Magasins
      console.log("[Seed] Insertion des magasins...");
      for (const store of SEED_STORES) {
        await db.runAsync(
          `INSERT OR IGNORE INTO magasins (
            nom, adresse, telephone, email, devise_par_defaut, actif
          ) VALUES (?, ?, ?, ?, ?, ?);`,
          [store.nom, store.adresse, store.telephone, store.email, store.devise_par_defaut, store.actif]
        );
      }

      // 3. Catégories
      console.log("[Seed] Insertion des catégories...");
      for (const category of SEED_CATEGORIES) {
        await db.runAsync(
          `INSERT OR IGNORE INTO categories (nom, description, couleur, actif) VALUES (?, ?, ?, 1);`,
          [category.nom, category.description, category.couleur]
        );
      }

      // 4. Unités de mesure
      console.log("[Seed] Insertion des unités de mesure...");
      for (const unit of SEED_UNITS) {
        await db.runAsync(
          `INSERT OR IGNORE INTO unites_mesure (nom, symbole, description, actif) VALUES (?, ?, ?, 1);`,
          [unit.nom, unit.symbole, unit.description]
        );
      }

      // 5. Paramètres système
      console.log("[Seed] Insertion des paramètres système...");
      for (const param of SEED_PARAMS) {
        await db.runAsync(
          `INSERT OR IGNORE INTO parametres_systeme (cle, valeur, description) VALUES (?, ?, ?);`,
          [param.cle, param.valeur, param.description]
        );
      }

      // 6. Clients de démonstration
      if (includeDemo) {
        console.log("[Seed] Insertion des clients de démonstration...");
        for (const client of SEED_DEMO_CLIENTS) {
          await db.runAsync(
            `INSERT OR IGNORE INTO clients (
              nom, telephone, email, adresse, date_naissance, genre, 
              profession, notes, avatar_url, points_fidelite, total_achats, actif
            ) VALUES (?, ?, ?, ?, '', 'M', '', '', '', ?, 0, ?);`,
            [client.nom, client.telephone, client.email, client.adresse, client.points_fidelite, client.actif]
          );
        }
      }

      // 7. Produits de démonstration (Aligné sur les 19 paramètres requis par l'application)
      if (includeDemo) {
        console.log("[Seed] Insertion des produits de démonstration...");
        const products = SEED_DEMO_PRODUCTS.slice(0, demoProductsCount);
        for (const product of products) {
          await db.runAsync(
            `INSERT OR IGNORE INTO produits (
              code_barre, nom, categorie, sous_categorie, description,
              prix_achat, prix_view, prix_promo, taux_tva,
              stock_actuel, stock_minimum, stock_securite,
              unite_mesure, poids, emplacement, image_url, code_fournisseur,
              date_peremption, actif
            ) VALUES (?, ?, ?, '', '', ?, ?, 0.0, 16.0, ?, ?, 2, ?, 0.0, '', '', '', '', ?);`,
            [
              product.code_barre,
              product.nom,
              product.categorie,
              product.prix_achat,
              product.prix_view,
              product.stock_actuel,
              product.stock_minimum,
              product.unite_mesure,
              product.actif
            ]
          );
        }
      }
    });

    console.log("[Seed] Seeding terminé avec succès !");
  } catch (error) {
    console.error("[Seed] Erreur lors du seeding:", error);
    throw error;
  }
}

// ============================================
// 🛠️ FONCTIONS UTILITAIRES
// ============================================

/**
 * Vérifier si la base est vide
 */
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM utilisateurs;"
    );
    return result?.count === 0;
  } catch (error) {
    console.error("[Seed] Erreur vérification base vide:", error);
    return true;
  }
}

/**
 * Obtenir les statistiques de seeding
 */
export async function getSeedStats(): Promise<{
  users: number;
  stores: number;
  categories: number;
  units: number;
  params: number;
  clients: number;
  products: number;
}> {
  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    const stats = await db.getFirstAsync<{
      users: number;
      stores: number;
      categories: number;
      units: number;
      params: number;
      clients: number;
      products: number;
    }>(`
      SELECT 
        (SELECT COUNT(*) FROM utilisateurs) as users,
        (SELECT COUNT(*) FROM magasins) as stores,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM unites_mesure) as units,
        (SELECT COUNT(*) FROM parametres_systeme) as params,
        (SELECT COUNT(*) FROM clients) as clients,
        (SELECT COUNT(*) FROM produits) as products
    `);

    return {
      users: stats?.users || 0,
      stores: stats?.stores || 0,
      categories: stats?.categories || 0,
      units: stats?.units || 0,
      params: stats?.params || 0,
      clients: stats?.clients || 0,
      products: stats?.products || 0,
    };
  } catch (error) {
    console.error("[Seed] Erreur getSeedStats:", error);
    return { users: 0, stores: 0, categories: 0, units: 0, params: 0, clients: 0, products: 0 };
  }
}

/**
 * Réinitialiser et reseed la base
 */
export async function resetAndSeed(options?: SeedOptions): Promise<void> {
  await seedDatabase({ ...options, reset: true });
}

// ============================================
// 📦 EXPORT
// ============================================
export default {
  seedDatabase,
  resetAndSeed,
  isDatabaseEmpty,
  getSeedStats,
  SEED_USERS,
  SEED_STORES,
  SEED_CATEGORIES,
  SEED_UNITS,
  SEED_PARAMS,
  SEED_DEMO_PRODUCTS,
  SEED_DEMO_CLIENTS,
};