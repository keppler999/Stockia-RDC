import * as SQLite from "expo-sqlite";
import { formatDate } from "../utils/helpers";

// === INTERFACES ===
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

export interface ClientWithStats extends Client {
  nombre_ventes: number;
  total_dettes: number;
  derniere_vente?: string;
  moyenne_panier: number;
  dernier_achat_montant: number;
}

export interface ClientDebt {
  id: number;
  client_id: number;
  client_nom?: string;
  vente_id: number;
  facture_numero: string;
  montant_initial: number;
  montant_restant: number;
  taux_interet?: number;
  echeance?: string;
  statut: "EN_COURS" | "SOLDE" | "IMPAGEE";
  date_creation: string;
  date_solde?: string;
  notes?: string;
}

export interface CreateClientData {
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  points_fidelite?: number;
}

export interface UpdateClientData {
  nom?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  points_fidelite?: number;
  actif?: number;
}

export interface ClientFilter {
  search?: string;
  withDebts?: boolean;
  activeOnly?: boolean;
  minDate?: string;
  maxDate?: string;
  minPoints?: number;
  maxPoints?: number;
  sortBy?: "nom" | "total_achats" | "points_fidelite" | "date_inscription";
  sortOrder?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
}

export interface DebtFilter {
  clientId?: number;
  status?: ClientDebt["statut"][];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  totalPoints: number;
  averagePoints: number;
  totalDebts: number;
  averageDebt: number;
  topClients: { name: string; total: number; count: number }[];
  monthlyGrowth: { month: string; count: number }[];
}

// === CONSTANTES ===
const DATABASE_NAME = "stockia_secure.db";

export class ClientService {
  private static instance: ClientService;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  static getInstance(): ClientService {
    if (!ClientService.instance) {
      ClientService.instance = new ClientService();
    }
    return ClientService.instance;
  }

  // === OBTENIR LA CONNEXION ===
  private async getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    }
    return this.db;
  }

  // === CLIENTS ===

  /**
   * Récupérer tous les clients avec filtres
   */
  async getClients(filter: ClientFilter = {}): Promise<ClientWithStats[]> {
    try {
      const db = await this.getDB();
      let query = `
        SELECT c.*,
               COUNT(v.id) as nombre_ventes,
               COALESCE(SUM(d.montant_restant), 0) as total_dettes,
               MAX(v.date_vente) as derniere_vente,
               COALESCE(AVG(v.montant_net), 0) as moyenne_panier,
               COALESCE((SELECT v2.montant_net
                FROM ventes v2
                WHERE v2.client_id = c.id
                AND v2.statut = 'COMPLETEE'
                ORDER BY v2.date_vente DESC
                LIMIT 1), 0) as dernier_achat_montant
        FROM clients c
        LEFT JOIN ventes v ON c.id = v.client_id AND v.statut = 'COMPLETEE'
        LEFT JOIN dettes d ON c.id = d.client_id AND d.statut = 'EN_COURS'
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filter.search) {
        query += " AND (c.nom LIKE ? OR c.telephone LIKE ? OR c.email LIKE ?)";
        params.push(`%${filter.search}%`, `%${filter.search}%`, `%${filter.search}%`);
      }

      if (filter.withDebts) {
        query += " AND EXISTS (SELECT 1 FROM dettes d2 WHERE d2.client_id = c.id AND d2.statut = 'EN_COURS')";
      }

      if (filter.activeOnly) {
        query += " AND c.actif = 1";
      }

      if (filter.minDate) {
        query += " AND c.date_inscription >= ?";
        params.push(filter.minDate);
      }

      if (filter.maxDate) {
        query += " AND c.date_inscription <= ?";
        params.push(filter.maxDate);
      }

      if (filter.minPoints !== undefined) {
        query += " AND c.points_fidelite >= ?";
        params.push(filter.minPoints);
      }

      if (filter.maxPoints !== undefined) {
        query += " AND c.points_fidelite <= ?";
        params.push(filter.maxPoints);
      }

      query += " GROUP BY c.id";

      // Sécurisation du tri pour éviter les injections
      const allowedSortFields = ["nom", "total_achats", "points_fidelite", "date_inscription"];
      const sortBy = filter.sortBy && allowedSortFields.includes(filter.sortBy) ? filter.sortBy : "nom";
      const sortOrder = filter.sortOrder === "DESC" ? "DESC" : "ASC";
      query += ` ORDER BY c.${sortBy} ${sortOrder}`;

      if (filter.limit !== undefined) {
        query += " LIMIT ?";
        params.push(filter.limit);
        if (filter.offset !== undefined) {
          query += " OFFSET ?";
          params.push(filter.offset);
        }
      }

      return await db.getAllAsync<ClientWithStats>(query, params);
    } catch (error) {
      console.error("[ClientService] Erreur getClients:", error);
      throw error;
    }
  }

  /**
   * Récupérer un client précis par son ID (Optimisé)
   */
  async getClientById(id: number): Promise<ClientWithStats | null> {
    try {
      const db = await this.getDB();
      const query = `
        SELECT c.*,
               COUNT(v.id) as nombre_ventes,
               COALESCE(SUM(d.montant_restant), 0) as total_dettes,
               MAX(v.date_vente) as derniere_vente,
               COALESCE(AVG(v.montant_net), 0) as moyenne_panier,
               COALESCE((SELECT v2.montant_net FROM ventes v2 WHERE v2.client_id = c.id AND v2.statut = 'COMPLETEE' ORDER BY v2.date_vente DESC LIMIT 1), 0) as dernier_achat_montant
        FROM clients c
        LEFT JOIN ventes v ON c.id = v.client_id AND v.statut = 'COMPLETEE'
        LEFT JOIN dettes d ON c.id = d.client_id AND d.statut = 'EN_COURS'
        WHERE c.id = ?
        GROUP BY c.id;
      `;
      const client = await db.getFirstAsync<ClientWithStats>(query, [id]);
      return client || null;
    } catch (error) {
      console.error("[ClientService] Erreur getClientById:", error);
      return null;
    }
  }

  async getClientByPhone(phone: string): Promise<Client | null> {
    try {
      const db = await this.getDB();
      const client = await db.getFirstAsync<Client>(
        "SELECT * FROM clients WHERE telephone = ? AND actif = 1;",
        [phone]
      );
      return client || null;
    } catch (error) {
      console.error("[ClientService] Erreur getClientByPhone:", error);
      return null;
    }
  }

  async getClientByEmail(email: string): Promise<Client | null> {
    try {
      const db = await this.getDB();
      const client = await db.getFirstAsync<Client>(
        "SELECT * FROM clients WHERE email = ? AND actif = 1;",
        [email]
      );
      return client || null;
    } catch (error) {
      console.error("[ClientService] Erreur getClientByEmail:", error);
      return null;
    }
  }

  /**
   * Créer un client
   */
  async createClient(data: CreateClientData): Promise<Client> {
    try {
      const db = await this.getDB();
      const now = new Date().toISOString();

      if (data.telephone) {
        const existing = await this.getClientByPhone(data.telephone);
        if (existing) {
          throw new Error(`Un client avec ce numéro de téléphone existe déjà: ${existing.nom}`);
        }
      }

      if (data.email) {
        const existing = await this.getClientByEmail(data.email);
        if (existing) {
          throw new Error(`Un client avec cet email existe déjà: ${existing.nom}`);
        }
      }

      const result = await db.runAsync(
        `INSERT INTO clients (
          nom, telephone, email, adresse, points_fidelite,
          total_achats, date_inscription, actif
        ) VALUES (?, ?, ?, ?, ?, 0, ?, 1);`,
        [
          data.nom.trim(),
          data.telephone || null,
          data.email || null,
          data.adresse || null,
          data.points_fidelite || 0,
          now,
        ]
      );

      const id = Number(result.lastInsertRowId);
      const client = await this.getClientById(id);
      if (!client) throw new Error("Erreur lors de la récupération du client créé.");
      return client;
    } catch (error) {
      console.error("[ClientService] Erreur createClient:", error);
      throw error;
    }
  }

  /**
   * Mettre à jour un client
   */
  async updateClient(id: number, data: UpdateClientData): Promise<Client | null> {
    try {
      const db = await this.getDB();
      const fields: string[] = [];
      const values: any[] = [];

      const allowedFields = ["nom", "telephone", "email", "adresse", "points_fidelite", "actif"];

      for (const field of allowedFields) {
        if (data[field as keyof UpdateClientData] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field as keyof UpdateClientData]);
        }
      }

      if (fields.length === 0) return await this.getClientById(id);

      if (data.telephone) {
        const existing = await this.getClientByPhone(data.telephone);
        if (existing && existing.id !== id) {
          throw new Error(`Ce numéro de téléphone est déjà utilisé par: ${existing.nom}`);
        }
      }

      if (data.email) {
        const existing = await this.getClientByEmail(data.email);
        if (existing && existing.id !== id) {
          throw new Error(`Cet email est déjà utilisé par: ${existing.nom}`);
        }
      }

      values.push(id);

      await db.runAsync(
        `UPDATE clients SET ${fields.join(", ")} WHERE id = ?;`,
        values
      );

      return await this.getClientById(id);
    } catch (error) {
      console.error("[ClientService] Erreur updateClient:", error);
      throw error;
    }
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      const db = await this.getDB();
      const result = await db.runAsync(
        "UPDATE clients SET actif = 0 WHERE id = ?;",
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      console.error("[ClientService] Erreur deleteClient:", error);
      throw error;
    }
  }

  async addPoints(clientId: number, points: number): Promise<Client | null> {
    try {
      const client = await this.getClientById(clientId);
      if (!client) throw new Error("Client non trouvé.");

      const newPoints = client.points_fidelite + points;
      return await this.updateClient(clientId, { points_fidelite: newPoints });
    } catch (error) {
      console.error("[ClientService] Erreur addPoints:", error);
      throw error;
    }
  }

  /**
   * Créer une dette
   */
  async createDebt(
    clientId: number,
    venteId: number,
    montant: number,
    echeance?: string,
    notes?: string
  ): Promise<ClientDebt> {
    try {
      const db = await this.getDB();
      const now = new Date().toISOString();

      const result = await db.runAsync(
        `INSERT INTO dettes (
          client_id, vente_id, montant_initial, montant_restant,
          echeance, statut, date_creation, notes
        ) VALUES (?, ?, ?, ?, ?, 'EN_COURS', ?, ?);`,
        [
          clientId,
          venteId,
          montant,
          montant,
          echeance || null,
          now,
          notes || null,
        ]
      );

      return await this.getDebtById(Number(result.lastInsertRowId));
    } catch (error) {
      console.error("[ClientService] Erreur createDebt:", error);
      throw error;
    }
  }

  /**
   * Récupérer les dettes
   */
  async getDebts(filter: DebtFilter = {}): Promise<ClientDebt[]> {
    try {
      const db = await this.getDB();
      let query = `
        SELECT d.*, c.nom as client_nom, v.facture_numero
        FROM dettes d
        JOIN clients c ON d.client_id = c.id
        JOIN ventes v ON d.vente_id = v.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filter.clientId) {
        query += " AND d.client_id = ?";
        params.push(filter.clientId);
      }

      if (filter.status && filter.status.length > 0) {
        query += ` AND d.statut IN (${filter.status.map(() => "?").join(", ")})`;
        params.push(...filter.status);
      }

      if (filter.startDate) {
        query += " AND d.date_creation >= ?";
        params.push(filter.startDate);
      }

      if (filter.endDate) {
        query += " AND d.date_creation <= ?";
        params.push(filter.endDate);
      }

      if (filter.minAmount !== undefined) {
        query += " AND d.montant_restant >= ?";
        params.push(filter.minAmount);
      }

      if (filter.maxAmount !== undefined) {
        query += " AND d.montant_restant <= ?";
        params.push(filter.maxAmount);
      }

      query += " ORDER BY d.date_creation DESC";

      return await db.getAllAsync<ClientDebt>(query, params);
    } catch (error) {
      console.error("[ClientService] Erreur getDebts:", error);
      throw error;
    }
  }

  async getDebtById(id: number): Promise<ClientDebt> {
    try {
      const db = await this.getDB();
      const debt = await db.getFirstAsync<ClientDebt>(
        `SELECT d.*, c.nom as client_nom, v.facture_numero
         FROM dettes d
         JOIN clients c ON d.client_id = c.id
         JOIN ventes v ON d.vente_id = v.id
         WHERE d.id = ?;`,
        [id]
      );
      if (!debt) throw new Error("Dette non trouvée.");
      return debt;
    } catch (error) {
      console.error("[ClientService] Erreur getDebtById:", error);
      throw error;
    }
  }

  /**
   * Enregistrer un paiement sur une dette
   */
  async recordPayment(debtId: number, montant: number): Promise<ClientDebt> {
    try {
      const db = await this.getDB();
      const debt = await this.getDebtById(debtId);

      if (debt.statut === "SOLDE") {
        throw new Error("Cette dette est déjà soldée.");
      }

      if (montant > debt.montant_restant) {
        throw new Error(`Le montant ne peut pas dépasser ${debt.montant_restant}`);
      }

      const newRestant = debt.montant_restant - montant;
      const newStatut = newRestant <= 0 ? "SOLDE" : "EN_COURS";
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE dettes SET
          montant_restant = ?, statut = ?, date_solde = ?
         WHERE id = ?;`,
        [newRestant, newStatut, newStatut === "SOLDE" ? now : null, debtId]
      );

      if (newStatut === "SOLDE") {
        const client = await this.getClientById(debt.client_id);
        if (client) {
          const pointsGagnes = Math.floor(montant / 10);
          await this.addPoints(client.id, pointsGagnes);
        }
      }

      return await this.getDebtById(debtId);
    } catch (error) {
      console.error("[ClientService] Erreur recordPayment:", error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques globales (Requêtes segmentées propres)
   */
  async getClientStats(): Promise<ClientStats> {
    try {
      const db = await this.getDB();

      // 1. Calcul des métriques clients de base
      const clientBase = await db.getFirstAsync<{ total: number; active: number; totalPoints: number; avgPoints: number }>(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN actif = 1 THEN 1 ELSE 0 END) as active,
                COALESCE(SUM(points_fidelite), 0) as totalPoints,
                COALESCE(AVG(points_fidelite), 0) as avgPoints
         FROM clients;`
      );

      // 2. Calcul des métriques sur les dettes (Séparé pour éviter la multiplication des lignes)
      const debtBase = await db.getFirstAsync<{ totalDebts: number; avgDebt: number }>(
        `SELECT COALESCE(SUM(montant_restant), 0) as totalDebts,
                COALESCE(AVG(montant_restant), 0) as avgDebt
         FROM dettes WHERE statut = 'EN_COURS';`
      );

      // 3. Top 5 clients
      const topClients = await db.getAllAsync<{ name: string; total: number; count: number }>(
        `SELECT c.nom as name,
                SUM(v.montant_net) as total,
                COUNT(v.id) as count
         FROM clients c
         JOIN ventes v ON c.id = v.client_id
         WHERE v.statut = 'COMPLETEE'
         GROUP BY c.id
         ORDER BY total DESC
         LIMIT 5;`
      );

      // 4. Croissance mensuelle
      const monthlyGrowth = await db.getAllAsync<{ month: string; count: number }>(
        `SELECT strftime('%Y-%m', date_inscription) as month,
                COUNT(*) as count
         FROM clients
         WHERE date_inscription >= date('now', '-11 months')
         GROUP BY month
         ORDER BY month ASC;`
      );

      return {
        totalClients: clientBase?.total || 0,
        activeClients: clientBase?.active || 0,
        totalPoints: clientBase?.totalPoints || 0,
        averagePoints: clientBase?.avgPoints || 0,
        totalDebts: debtBase?.totalDebts || 0,
        averageDebt: debtBase?.avgDebt || 0,
        topClients: topClients || [],
        monthlyGrowth: monthlyGrowth || [],
      };
    } catch (error) {
      console.error("[ClientService] Erreur getClientStats:", error);
      throw error;
    }
  }

  async getLoyalClients(minPurchases: number = 5, limit: number = 10): Promise<ClientWithStats[]> {
    try {
      const clients = await this.getClients({ activeOnly: true });
      return clients
        .filter(c => c.nombre_ventes >= minPurchases)
        .sort((a, b) => b.nombre_ventes - a.nombre_ventes)
        .slice(0, limit);
    } catch (error) {
      console.error("[ClientService] Erreur getLoyalClients:", error);
      return [];
    }
  }

  async getClientsWithDebts(): Promise<ClientWithStats[]> {
    try {
      return await this.getClients({ withDebts: true, activeOnly: true });
    } catch (error) {
      console.error("[ClientService] Erreur getClientsWithDebts:", error);
      return [];
    }
  }

  async exportClientsToCSV(): Promise<string> {
    try {
      const clients = await this.getClients({ activeOnly: true });
      const headers = ["ID", "Nom", "Téléphone", "Email", "Adresse", "Points", "Total Achats", "Nombre Ventes", "Date Inscription", "Dernière Visite"];
      const rows = clients.map(c => [
        c.id,
        `"${c.nom.replace(/"/g, '""')}"`, // Échappement des guillemets pour le CSV
        c.telephone || "",
        c.email || "",
        c.adresse ? `"${c.adresse.replace(/"/g, '""')}"` : "",
        c.points_fidelite,
        c.total_achats.toFixed(2),
        c.nombre_ventes || 0,
        formatDate(c.date_inscription),
        c.derniere_visite ? formatDate(c.derniere_visite) : "",
      ]);

      return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    } catch (error) {
      console.error("[ClientService] Erreur exportClientsToCSV:", error);
      throw error;
    }
  }

  async exportDebtsToCSV(): Promise<string> {
    try {
      const debts = await this.getDebts({ status: ["EN_COURS"] });
      const headers = ["Client", "Facture", "Montant Initial", "Montant Restant", "Date Création", "Échéance", "Statut"];
      const rows = debts.map(d => [
        `"${(d.client_nom || "").replace(/"/g, '""')}"`,
        d.facture_numero,
        d.montant_initial.toFixed(2),
        d.montant_restant.toFixed(2),
        formatDate(d.date_creation),
        d.echeance ? formatDate(d.echeance) : "",
        d.statut,
      ]);

      return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    } catch (error) {
      console.error("[ClientService] Erreur exportDebtsToCSV:", error);
      throw error;
    }
  }
}

// === EXPORT DE L'INSTANCE ===
export const clientService = ClientService.getInstance();
export default ClientService; 