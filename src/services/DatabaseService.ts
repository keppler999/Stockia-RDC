import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";

// === CONSTANTES ===
const DATABASE_NAME = "stockia_secure.db";
const DB_VERSION_KEY = "@stockia_db_version";
const CURRENT_DB_VERSION = 3;

// === INTERFACES ===
export interface Migration {
  version: number;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
  down?: (db: SQLite.SQLiteDatabase) => Promise<void>;
  description: string;
}

export interface BackupInfo {
  name: string;
  size: number;
  date: Date;
  path: string;
}

export interface DatabaseStats {
  tableCount: number;
  totalRows: number;
  size: string;
  lastBackup: string | null;
  integrity: boolean;
}

export interface QueryResult<T = any> {
  success: boolean;
  data?: T[];
  error?: string;
  count?: number;
}

// === INTERFACES DES TABLES ===
export interface Utilisateur {
  id: number;
  nom: string;
  username: string;
  password: string;
  role: "ADMIN" | "GERANT" | "CAISSIER" | "MAGASINIER";
  email?: string;
  actif: number;
  derniere_connexion?: string;
  created_at: string;
}

export interface Produit {
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

export interface Vente {
  id: number;
  facture_numero: string;
  client_id?: number;
  utilisateur_id: number;
  montant_brut: number;
  remise: number;
  montant_net: number;
  montant_paye: number;
  monnaie_rendue?: number;
  mode_paiement: string;
  statut: string;
  date_vente: string;
  notes?: string;
}

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
}

export interface Dette {
  id: number;
  client_id: number;
  vente_id?: number;
  montant_total: number;
  montant_restant: number;
  statut: "EN_COURS" | "PAYEE";
  date_creation: string;
  updated_at: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private isMigrating = false;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // === INITIALISATION ===
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log("[DatabaseService] Initialisation...");
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      // Activation des contraintes de clés étrangères et optimisations
      await this.db.execAsync("PRAGMA foreign_keys = ON;");
      await this.db.execAsync("PRAGMA journal_mode = WAL;");
      await this.db.execAsync("PRAGMA synchronous = NORMAL;");

      // Vérification et migration
      const currentVersion = await this.getDatabaseVersion();
      if (currentVersion < CURRENT_DB_VERSION) {
        await this.migrateDatabase(currentVersion);
      } else {
        console.log(`[DatabaseService] Version ${CURRENT_DB_VERSION} à jour`);
      }

      this.isInitialized = true;
      console.log("[DatabaseService] Initialisation terminée");
    } catch (error) {
      console.error("[DatabaseService] Erreur initialisation:", error);
      throw error;
    }
  }

  // === OBTENIR LA CONNEXION ===
  async getConnection(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db || !this.isInitialized) {
      this.isInitialized = false; // Reset sécurisé en cas de coupure forcée
      await this.initialize();
    }
    return this.db!;
  }

  // === FERMETURE ===
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }

  // === VERSION DE LA BASE ===
  private async getDatabaseVersion(): Promise<number> {
    try {
      const version = await AsyncStorage.getItem(DB_VERSION_KEY);
      return version ? parseInt(version, 10) : 0;
    } catch (error) {
      console.error("[DatabaseService] Erreur récupération version:", error);
      return 0;
    }
  }

  private async setDatabaseVersion(version: number): Promise<void> {
    try {
      await AsyncStorage.setItem(DB_VERSION_KEY, version.toString());
    } catch (error) {
      console.error("[DatabaseService] Erreur sauvegarde version:", error);
    }
  }

  // === MIGRATIONS ===
  private async migrateDatabase(fromVersion: number): Promise<void> {
    if (this.isMigrating) {
      console.log("[DatabaseService] Migration déjà en cours");
      return;
    }

    this.isMigrating = true;
    console.log(`[DatabaseService] Migration de la version ${fromVersion} vers ${CURRENT_DB_VERSION}`);

    try {
      const db = this.db || (await SQLite.openDatabaseAsync(DATABASE_NAME));
      const migrations = this.getMigrations();

      for (const migration of migrations) {
        if (migration.version > fromVersion && migration.version <= CURRENT_DB_VERSION) {
          console.log(`[DatabaseService] Exécution migration v${migration.version}: ${migration.description}`);
         
          await db.withTransactionAsync(async () => {
            await migration.up(db);
            await this.setDatabaseVersion(migration.version);
          });
         
          console.log(`[DatabaseService] Migration v${migration.version} terminée`);
        }
      }
      console.log("[DatabaseService] Toutes les migrations terminées");
    } catch (error) {
      console.error("[DatabaseService] Erreur migration:", error);
      throw error;
    } finally {
      this.isMigrating = false;
    }
  }

  // === DÉFINITION DES MIGRATIONS ===
  private getMigrations(): Migration[] {
    return [
      {
        version: 1,
        description: "Création des tables initiales",
        up: async (db: SQLite.SQLiteDatabase) => {
          await db.execAsync(`
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
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS produits (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              code_barre TEXT UNIQUE,
              nom TEXT NOT NULL,
              categorie TEXT NOT NULL,
              prix_achat REAL NOT NULL,
              prix_view REAL NOT NULL,
              stock_actuel INTEGER NOT NULL DEFAULT 0,
              stock_minimum INTEGER NOT NULL DEFAULT 5,
              actif INTEGER DEFAULT 1,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS clients (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              nom TEXT NOT NULL,
              telephone TEXT,
              points_fidelite INTEGER DEFAULT 0,
              total_achats REAL DEFAULT 0,
              date_inscription TEXT DEFAULT CURRENT_TIMESTAMP,
              actif INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS ventes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              facture_numero TEXT NOT NULL UNIQUE,
              client_id INTEGER,
              utilisateur_id INTEGER NOT NULL,
              montant_brut REAL NOT NULL,
              remise REAL DEFAULT 0,
              montant_net REAL NOT NULL,
              montant_paye REAL NOT NULL,
              mode_paiement TEXT NOT NULL,
              statut TEXT DEFAULT 'COMPLETEE',
              date_vente TEXT NOT NULL,
              FOREIGN KEY (client_id) REFERENCES clients(id),
              FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
            );

            CREATE TABLE IF NOT EXISTS details_ventes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              vente_id INTEGER NOT NULL,
              produit_id INTEGER NOT NULL,
              quantite INTEGER NOT NULL,
              prix_unitaire REAL NOT NULL,
              remise_ligne REAL DEFAULT 0,
              sous_total REAL NOT NULL,
              FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE CASCADE,
              FOREIGN KEY (produit_id) REFERENCES produits(id)
            );
          `);
        },
      },
      {
        version: 2,
        description: "Ajout des tables de mouvements, paramètres et dettes",
        up: async (db: SQLite.SQLiteDatabase) => {
          await db.execAsync(`
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
              FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
            );

            CREATE TABLE IF NOT EXISTS parametres_systeme (
              cle TEXT PRIMARY KEY,
              valeur TEXT NOT NULL,
              description TEXT,
              modifiable INTEGER DEFAULT 1,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

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

            /* FIX : Ajout explicite de la table dettes qui manquait */
            CREATE TABLE IF NOT EXISTS dettes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              client_id INTEGER NOT NULL,
              vente_id INTEGER,
              montant_total REAL NOT NULL,
              montant_restant REAL NOT NULL,
              statut TEXT DEFAULT 'EN_COURS' CHECK(statut IN ('EN_COURS', 'PAYEE')),
              date_creation TEXT NOT NULL,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
              FOREIGN KEY (vente_id) REFERENCES ventes(id) ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements_stock(date_mouvement);
            CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
          `);
        },
      },
      {
        version: 3,
        description: "Ajout des tables de licence et logs",
        up: async (db: SQLite.SQLiteDatabase) => {
          await db.execAsync(`
            CREATE TABLE IF NOT EXISTS licences (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              cle_licence TEXT NOT NULL,
              device_fingerprint TEXT NOT NULL,
              date_activation TEXT NOT NULL,
              date_expiration TEXT NOT NULL,
              statut TEXT DEFAULT 'PENDING' CHECK(statut IN ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED')),
              derniere_utilisation TEXT,
              temps_utilisation_total INTEGER DEFAULT 0,
              type_licence TEXT DEFAULT 'STANDARD',
              nom_titulaire TEXT,
              email_titulaire TEXT
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              utilisateur_id INTEGER,
              action TEXT NOT NULL,
              details TEXT,
              timestamp TEXT NOT NULL,
              FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS lots (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              produit_id INTEGER NOT NULL,
              numero_lot TEXT NOT NULL,
              quantite INTEGER NOT NULL,
              date_fabrication TEXT,
              date_expiration TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_licences_fingerprint ON licences(device_fingerprint);
            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_lots_expiration ON lots(date_expiration);

            INSERT OR IGNORE INTO parametres_systeme (cle, valeur, description) VALUES
            ('nom_boutique', 'Stockia Store', 'Nom de la boutique'),
            ('devise_symbole', 'USD', 'Symbole de la devise'),
            ('taux_tva', '18', 'Taux de TVA en pourcentage'),
            ('seuil_stock_alerte', '5', 'Seuil d''alerte pour le stock'),
            ('objectif_journalier', '500', 'Objectif de CA journalier'),
            ('impression_automatique', '1', 'Impression automatique des tickets');
          `);
        },
      },
    ];
  }

  // === CRUD GÉNÉRIQUE ===
  async create<T = any>(table: string, data: Partial<T>): Promise<number> {
    try {
      const db = await this.getConnection();
      const keys = Object.keys(data);
      const placeholders = keys.map(() => "?").join(", ");
      const values = Object.values(data);

      const query = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders});`;
      const result = await db.runAsync(query, values);

      return result.lastInsertRowId;
    } catch (error) {
      console.error(`[DatabaseService] Erreur create ${table}:`, error);
      throw error;
    }
  }

  async read<T = any>(
    table: string,
    where?: Record<string, any>,
    orderBy?: { field: string; direction: "ASC" | "DESC" },
    limit?: number,
  ): Promise<T[]> {
    try {
      const db = await this.getConnection();
      let query = `SELECT * FROM ${table}`;
      const params: any[] = [];

      if (where && Object.keys(where).length > 0) {
        const conditions = Object.keys(where)
          .map((key) => `${key} = ?`)
          .join(" AND ");
        query += ` WHERE ${conditions}`;
        params.push(...Object.values(where));
      }

      if (orderBy) {
        query += ` ORDER BY ${orderBy.field} ${orderBy.direction}`;
      }

      if (limit) {
        query += ` LIMIT ?`;
        params.push(limit);
      }

      return await db.getAllAsync<T>(query, params);
    } catch (error) {
      console.error(`[DatabaseService] Erreur read ${table}:`, error);
      return [];
    }
  }

  async update<T = any>(table: string, id: number, data: Partial<T>): Promise<boolean> {
    try {
      const db = await this.getConnection();
      const keys = Object.keys(data);
      const setClause = keys.map((key) => `${key} = ?`).join(", ");
      const values = [...Object.values(data), id];

      const query = `UPDATE ${table} SET ${setClause} WHERE id = ?;`;
      const result = await db.runAsync(query, values);

      return result.changes > 0;
    } catch (error) {
      console.error(`[DatabaseService] Erreur update ${table}:`, error);
      throw error;
    }
  }

  async delete(table: string, id: number): Promise<boolean> {
    try {
      const db = await this.getConnection();
      const query = `DELETE FROM ${table} WHERE id = ?;`;
      const result = await db.runAsync(query, [id]);

      return result.changes > 0;
    } catch (error) {
      console.error(`[DatabaseService] Erreur delete ${table}:`, error);
      throw error;
    }
  }

  async findOne<T = any>(table: string, where: Record<string, any>): Promise<T | null> {
    try {
      const results = await this.read<T>(table, where, undefined, 1);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`[DatabaseService] Erreur findOne ${table}:`, error);
      return null;
    }
  }

  async count(table: string, where?: Record<string, any>): Promise<number> {
    try {
      const db = await this.getConnection();
      let query = `SELECT COUNT(*) as count FROM ${table}`;
      const params: any[] = [];

      if (where && Object.keys(where).length > 0) {
        const conditions = Object.keys(where)
          .map((key) => `${key} = ?`)
          .join(" AND ");
        query += ` WHERE ${conditions}`;
        params.push(...Object.values(where));
      }

      const result = await db.getFirstAsync<{ count: number }>(query, params);
      return result?.count || 0;
    } catch (error) {
      console.error(`[DatabaseService] Erreur count ${table}:`, error);
      return 0;
    }
  }

  // === REQUÊTES SPÉCIALISÉES ===
  async getProduitsAlerte(): Promise<Produit[]> {
    try {
      const db = await this.getConnection();
      return await db.getAllAsync<Produit>(
        `SELECT * FROM produits
         WHERE stock_actuel <= stock_minimum
         AND actif = 1
         ORDER BY (stock_minimum - stock_actuel) DESC;`,
      );
    } catch (error) {
      console.error("[DatabaseService] Erreur getProduitsAlerte:", error);
      return [];
    }
  }

  async getProduitsRupture(): Promise<Produit[]> {
    try {
      const db = await this.getConnection();
      return await db.getAllAsync<Produit>(
        `SELECT * FROM produits
         WHERE stock_actuel <= 0
         AND actif = 1
         ORDER BY nom ASC;`,
      );
    } catch (error) {
      console.error("[DatabaseService] Erreur getProduitsRupture:", error);
      return [];
    }
  }

  async getTopProduits(limit: number = 10, periode: "jour" | "mois" | "annee" = "mois"): Promise<any[]> {
    try {
      const db = await this.getConnection();
      const dateTarget = this.getDateFilterValue(periode);

      return await db.getAllAsync(
        `SELECT p.id, p.nom, p.categorie,
                SUM(dv.quantite) as total_quantite,
                SUM(dv.sous_total) as total_ventes,
                COUNT(DISTINCT v.id) as nombre_ventes
         FROM details_ventes dv
         JOIN produits p ON dv.produit_id = p.id
         JOIN ventes v ON dv.vente_id = v.id
         WHERE v.date_vente >= ?
         GROUP BY dv.produit_id
         ORDER BY total_ventes DESC
         LIMIT ?;`,
        [dateTarget, limit],
      );
    } catch (error) {
      console.error("[DatabaseService] Erreur getTopProduits:", error);
      return [];
    }
  }

  async getChiffreAffaires(periode: "jour" | "mois" | "annee" = "mois"): Promise<number> {
    try {
      const db = await this.getConnection();
      const dateTarget = this.getDateFilterValue(periode);

      const result = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(montant_net) as total
         FROM ventes
         WHERE date_vente >= ?
         AND statut = 'COMPLETEE';`,
        [dateTarget],
      );

      return result?.total || 0;
    } catch (error) {
      console.error("[DatabaseService] Erreur getChiffreAffaires:", error);
      return 0;
    }
  }

  async getBenefices(periode: "jour" | "mois" | "annee" = "mois"): Promise<number> {
    try {
      const db = await this.getConnection();
      const dateTarget = this.getDateFilterValue(periode);

      const result = await db.getFirstAsync<{ profit: number }>(
        `SELECT SUM((dv.prix_unitaire - p.prix_achat) * dv.quantite) as profit
         FROM details_ventes dv
         JOIN produits p ON dv.produit_id = p.id
         JOIN ventes v ON dv.vente_id = v.id
         WHERE v.date_vente >= ?
         AND v.statut = 'COMPLETEE';`,
        [dateTarget],
      );

      return result?.profit || 0;
    } catch (error) {
      console.error("[DatabaseService] Erreur getBenefices:", error);
      return 0;
    }
  }

  async getTopClients(limit: number = 5, periode: "jour" | "mois" | "annee" = "mois"): Promise<any[]> {
    try {
      const db = await this.getConnection();
      const dateTarget = this.getDateFilterValue(periode);

      return await db.getAllAsync(
        `SELECT c.id, c.nom, c.telephone,
                SUM(v.montant_net) as total_achats,
                COUNT(v.id) as nombre_ventes,
                c.points_fidelite
         FROM clients c
         JOIN ventes v ON c.id = v.client_id
         WHERE v.date_vente >= ?
         AND v.statut = 'COMPLETEE'
         GROUP BY c.id
         ORDER BY total_achats DESC
         LIMIT ?;`,
        [dateTarget, limit],
      );
    } catch (error) {
      console.error("[DatabaseService] Erreur getTopClients:", error);
      return [];
    }
  }

  async getDettesEnCours(): Promise<any[]> {
    try {
      const db = await this.getConnection();
      return await db.getAllAsync(
        `SELECT d.*, c.nom as client_nom, c.telephone
         FROM dettes d
         JOIN clients c ON d.client_id = c.id
         WHERE d.statut = 'EN_COURS'
         ORDER BY d.date_creation DESC;`,
      );
    } catch (error) {
      console.error("[DatabaseService] Erreur getDettesEnCours:", error);
      return [];
    }
  }

  async getTotalDettes(): Promise<number> {
    try {
      const db = await this.getConnection();
      const result = await db.getFirstAsync<{ total: number }>(
        "SELECT SUM(montant_restant) as total FROM dettes WHERE statut = 'EN_COURS';",
      );
      return result?.total || 0;
    } catch (error) {
      console.error("[DatabaseService] Erreur getTotalDettes:", error);
      return 0;
    }
  }

  async getStatsGenerales(): Promise<any> {
    try {
      const db = await this.getConnection();

      const [produits, clients, ventes, dettes] = await Promise.all([
        db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM produits WHERE actif = 1;"),
        db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM clients WHERE actif = 1;"),
        db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM ventes WHERE statut = 'COMPLETEE';"),
        db.getFirstAsync<{ total: number }>("SELECT SUM(montant_restant) as total FROM dettes WHERE statut = 'EN_COURS';"),
      ]);

      return {
        produits: produits?.count || 0,
        clients: clients?.count || 0,
        ventes: ventes?.count || 0,
        dettes: dettes?.total || 0,
      };
    } catch (error) {
      console.error("[DatabaseService] Erreur getStatsGenerales:", error);
      return null;
    }
  }

  private getDateFilterValue(periode: "jour" | "mois" | "annee"): string {
    const now = new Date();
    switch (periode) {
      case "jour":
        return now.toISOString().split("T")[0]; // YYYY-MM-DD
      case "mois":
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      case "annee":
        return `${now.getFullYear()}-01-01`;
      default:
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    }
  }

  // === SAUVEGARDE ===
  async backup(): Promise<BackupInfo> {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
      const info = await FileSystem.getInfoAsync(dbPath);

      if (!info.exists) {
        throw new Error("Base de données originale non trouvée");
      }

      const backupDir = `${FileSystem.documentDirectory}backups/`;
      await FileSystem.ensureDirAsync(backupDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `stockia_backup_${timestamp}.db`;
      const backupPath = `${backupDir}${backupName}`;

      // Étape importante : Fermeture stricte pour vider les WAL loggers
      await this.close();

      await FileSystem.copyAsync({
        from: dbPath,
        to: backupPath,
      });

      // Relancer l'accès
      await this.initialize();

      const backupInfo: BackupInfo = {
        name: backupName,
        size: info.size,
        date: new Date(),
        path: backupPath,
      };

      await AsyncStorage.setItem("@stockia_last_backup", JSON.stringify(backupInfo));
      return backupInfo;
    } catch (error) {
      console.error("[DatabaseService] Erreur backup:", error);
      // S'assurer de rouvrir l'accès en cas d'erreur
      await this.initialize().catch(() => {});
      throw error;
    }
  }

  async getBackups(): Promise<BackupInfo[]> {
    try {
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupDir);

      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(backupDir);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        if (file.endsWith(".db")) {
          const path = `${backupDir}${file}`;
          const info = await FileSystem.getInfoAsync(path);
          if (info.exists) {
            backups.push({
              name: file,
              size: info.size,
              date: new Date(info.modificationTime * 1000 || 0), // Fix typage modificationTime
              path: path,
            });
          }
        }
      }

      return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error("[DatabaseService] Erreur getBackups:", error);
      return [];
    }
  }

  async restore(backupPath: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(backupPath);
      if (!info.exists) {
        throw new Error("Fichier de sauvegarde non trouvé");
      }

      const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;

      await this.close();

      await FileSystem.copyAsync({
        from: backupPath,
        to: dbPath,
      });

      await this.initialize();
      return true;
    } catch (error) {
      console.error("[DatabaseService] Erreur restore:", error);
      await this.initialize().catch(() => {});
      throw error;
    }
  }

  async deleteBackup(backupName: string): Promise<boolean> {
    try {
      const path = `${FileSystem.documentDirectory}backups/${backupName}`;
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        await FileSystem.deleteAsync(path);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[DatabaseService] Erreur deleteBackup:", error);
      return false;
    }
  }

  // === NETTOYAGE ===
  async cleanup(): Promise<{ deleted: number; tables: string[] }> {
    try {
      const db = await this.getConnection();
      let totalDeleted = 0;

      // Logs de plus de 3 mois
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const logsResult = await db.runAsync("DELETE FROM audit_logs WHERE timestamp < ?;", [threeMonthsAgo.toISOString()]);
      totalDeleted += logsResult.changes;

      // Sessions expirées
      const sessionsResult = await db.runAsync("DELETE FROM sessions WHERE date_fin < ? OR actif = 0;", [new Date().toISOString()]);
      totalDeleted += sessionsResult.changes;

      // Grâce au ON DELETE CASCADE, supprimer de la table `ventes` supprime automatiquement les `details_ventes` liés !
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const ventesResult = await db.runAsync("DELETE FROM ventes WHERE date_vente < ?;", [oneYearAgo.toISOString()]);
      totalDeleted += ventesResult.changes;

      return {
        deleted: totalDeleted,
        tables: ["audit_logs", "sessions", "ventes (et details_ventes via CASCADE)"],
      };
    } catch (error) {
      console.error("[DatabaseService] Erreur cleanup:", error);
      throw error;
    }
  }

  // === STATISTIQUES ===
  async getStats(): Promise<DatabaseStats> {
    try {
      const db = await this.getConnection();

      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
      );

      let totalRows = 0;
      for (const table of tables) {
        const result = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM ${table.name};`);
        totalRows += result?.count || 0;
      }

      const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      const size = fileInfo.exists ? fileInfo.size : 0;
      const sizeStr = size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;

      let lastBackup: string | null = null;
      try {
        const backupData = await AsyncStorage.getItem("@stockia_last_backup");
        if (backupData) {
          const backup = JSON.parse(backupData);
          lastBackup = new Date(backup.date).toLocaleString();
        }
      } catch (e) {}

      const integrity = await db.getFirstAsync<{ integrity_check: string }>("PRAGMA integrity_check;");

      return {
        tableCount: tables.length,
        totalRows,
        size: sizeStr,
        lastBackup,
        integrity: integrity?.integrity_check === "ok",
      };
    } catch (error) {
      console.error("[DatabaseService] Erreur getStats:", error);
      return {
        tableCount: 0,
        totalRows: 0,
        size: "0 KB",
        lastBackup: null,
        integrity: false,
      };
    }
  }

  // === TRANSACTION ===
  async transaction<T>(callback: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
    try {
      const db = await this.getConnection();
      return await db.withTransactionAsync(callback);
    } catch (error) {
      console.error("[DatabaseService] Erreur transaction:", error);
      throw error;
    }
  }

  // === EXÉCUTION DE REQUÊTES BRUTES ===
  async execute<T = any>(query: string, params: any[] = []): Promise<QueryResult<T>> {
    try {
      const db = await this.getConnection();
      const results = await db.getAllAsync<T>(query, params);
      return {
        success: true,
        data: results,
        count: results.length,
      };
    } catch (error: any) {
      console.error("[DatabaseService] Erreur execute:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // === RÉINITIALISATION COMPLÈTE ===
  async resetDatabase(): Promise<boolean> {
    try {
      await this.close();
      const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
      const info = await FileSystem.getInfoAsync(dbPath);
      if (info.exists) {
        await FileSystem.deleteAsync(dbPath);
      }
      await this.initialize();
      return true;
    } catch (error) {
      console.error("[DatabaseService] Erreur resetDatabase:", error);
      return false;
    }
  }
}

export const dbService = DatabaseService.getInstance();
export default DatabaseService; 
