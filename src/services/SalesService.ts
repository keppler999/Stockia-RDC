import * as SQLite from "expo-sqlite";
import { formatDateTime } from "../utils/helpers";
import { stockService } from "./StockService";

// === INTERFACES ===
export interface Sale {
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
  client_nom?: string;
  client_telephone?: string;
  utilisateur_nom?: string;
}

export interface SaleDetail {
  id: number;
  vente_id: number;
  produit_id: number;
  produit_nom?: string;
  code_barre?: string;
  quantite: number;
  prix_unitaire: number;
  remise_ligne: number;
  sous_total: number;
}

export interface SaleWithDetails extends Sale {
  details: SaleDetail[];
}

export interface SaleItem {
  produit_id: number;
  quantite: number;
  prix_unitaire: number;
  remise_ligne?: number;
}

export interface CreateSaleData {
  client_id?: number;
  utilisateur_id: number;
  items: SaleItem[];
  mode_paiement: Sale["mode_paiement"];
  remise?: number;
  montant_paye: number;
  notes?: string;
}

export interface SaleFilter {
  startDate?: string;
  endDate?: string;
  clientId?: number;
  userId?: number;
  status?: Sale["statut"][];
  paymentMode?: Sale["mode_paiement"][];
  invoiceNumber?: string;
  search?: string;
  sortBy?: "date_vente" | "montant_net" | "facture_numero";
  sortOrder?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
}

export interface SalesStats {
  totalSales: number;
  totalAmount: number;
  averageTicket: number;
  totalDiscount: number;
  totalProfit: number;
  margin: number;
  dailyData: { date: string; amount: number; count: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
  topCategories: { name: string; total: number }[];
  paymentMethods: { method: string; total: number; count: number }[];
}

// === CONSTANTES ===
const DATABASE_NAME = "stockia_secure.db";

export class SalesService {
  private static instance: SalesService;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  static getInstance(): SalesService {
    if (!SalesService.instance) {
      SalesService.instance = new SalesService();
    }
    return SalesService.instance;
  }

  // === OBTENIR LA CONNEXION ===
  private async getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    }
    return this.db;
  }

  // === GÉNÉRATION DU NUMÉRO DE FACTURE ===
  async generateInvoiceNumber(): Promise<string> {
    try {
      const db = await this.getDB();
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const searchDate = `${today.toISOString().slice(0, 10)}%`;
     
      const result = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM ventes WHERE date_vente LIKE ?;",
        [searchDate]
      );
     
      const count = (result?.count || 0) + 1;
      return `FC-${dateStr}-${String(count).padStart(4, '0')}`;
    } catch (error) {
      console.error("[SalesService] Erreur generateInvoiceNumber:", error);
      return `FC-${Date.now()}`;
    }
  }

  /**
   * Créer une vente
   */
  async createSale(data: CreateSaleData): Promise<SaleWithDetails> {
    try {
      const db = await this.getDB();
      const { items, utilisateur_id, client_id, mode_paiement, remise = 0, montant_paye, notes } = data;

      if (!items || items.length === 0) {
        throw new Error("La vente doit contenir au moins un article.");
      }

      let montant_brut = 0;
      const validatedItems: Array<{
        produit_id: number;
        quantite: number;
        prix_unitaire: number;
        remise_ligne: number;
        sous_total: number;
        stock_avant: number;
      }> = [];

      for (const item of items) {
        const product = await stockService.getProductById(item.produit_id);
        if (!product) {
          throw new Error(`Produit ${item.produit_id} non trouvé.`);
        }
        if (product.stock_actuel < item.quantite) {
          throw new Error(`Stock insuffisante pour ${product.nom}. Disponible: ${product.stock_actuel}`);
        }

        const prix_unitaire = item.prix_unitaire || product.prix_view;
        const remise_ligne = item.remise_ligne || 0;
        const sous_total = (prix_unitaire - remise_ligne) * item.quantite;
        montant_brut += (prix_unitaire * item.quantite);

        validatedItems.push({
          produit_id: item.produit_id,
          quantite: item.quantite,
          prix_unitaire,
          remise_ligne,
          sous_total,
          stock_avant: product.stock_actuel
        });
      }

      const montant_net = montant_brut - remise;
      const monnaie_rendue = montant_paye - montant_net;
      const facture_numero = await this.generateInvoiceNumber();
      const now = new Date().toISOString();

      let venteId: number | null = null;

      // Exécution de la transaction sécurisée
      await db.withTransactionAsync(async () => {
        // 1. Insérer la vente
        const result = await db.runAsync(
          `INSERT INTO ventes (
            facture_numero, client_id, utilisateur_id,
            montant_brut, remise, montant_net,
            montant_paye, monnaie_rendue, mode_paiement,
            statut, date_vente, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETEE', ?, ?);`,
          [
            facture_numero,
            client_id ?? null,
            utilisateur_id,
            montant_brut,
            remise,
            montant_net,
            montant_paye,
            monnaie_rendue > 0 ? monnaie_rendue : 0,
            mode_paiement,
            now,
            notes ?? null,
          ]
        );

        venteId = result.lastInsertRowId;

        // 2. Insérer les détails et ajuster le stock
        for (const entry of validatedItems) {
          await db.runAsync(
            `INSERT INTO details_ventes (
              vente_id, produit_id, quantite,
              prix_unitaire, remise_ligne, sous_total
            ) VALUES (?, ?, ?, ?, ?, ?);`,
            [
              venteId,
              entry.produit_id,
              entry.quantite,
              entry.prix_unitaire,
              entry.remise_ligne,
              entry.sous_total,
            ]
          );

          // Appel au stockService externe pour mise à jour de la table principale produits
          await stockService.removeStock(
            entry.produit_id,
            entry.quantite,
            "VENTE",
            `Vente #${facture_numero}`,
            utilisateur_id
          );

          // Enregistrement manuel du mouvement pour garantir la cohérence locale immédiate
          const newStock = entry.stock_avant - entry.quantite;
          await db.runAsync(
            `INSERT INTO mouvements_stock (
              produit_id, type_mouvement, quantite,
              stock_avant, stock_apres, date_mouvement,
              commentaire, utilisateur_id
            ) VALUES (?, 'VENTE', ?, ?, ?, ?, ?, ?);`,
            [
              entry.produit_id,
              entry.quantite,
              entry.stock_avant,
              newStock,
              now,
              `Vente #${facture_numero}`,
              utilisateur_id,
            ]
          );
        }

        // 3. Fidélité client
        if (client_id) {
          await db.runAsync(
            `UPDATE clients SET
              points_fidelite = points_fidelite + ?,
              total_achats = total_achats + ?,
              derniere_visite = ?
            WHERE id = ?;`,
            [Math.floor(montant_net / 10), montant_net, now, client_id]
          );
        }
      });

      if (!venteId) {
        throw new Error("L'insertion de la vente a échoué.");
      }

      const sale = await this.getSaleById(venteId);
      if (!sale) throw new Error("Impossible de récupérer la vente nouvellement créée.");
      return sale;

    } catch (error) {
      console.error("[SalesService] Erreur createSale:", error);
      throw error;
    }
  }

  /**
   * Récupérer une vente par ID
   */
  async getSaleById(id: number): Promise<SaleWithDetails | null> {
    try {
      const db = await this.getDB();

      const sale = await db.getFirstAsync<Sale>(
        `SELECT v.*,
                c.nom as client_nom,
                c.telephone as client_telephone,
                u.nom as utilisateur_nom
         FROM ventes v
         LEFT JOIN clients c ON v.client_id = c.id
         LEFT JOIN utilisateurs u ON v.utilisateur_id = u.id
         WHERE v.id = ?;`,
        [id]
      );

      if (!sale) return null;

      const details = await db.getAllAsync<SaleDetail>(
        `SELECT d.*, p.nom as produit_nom, p.code_barre
         FROM details_ventes d
         JOIN produits p ON d.produit_id = p.id
         WHERE d.vente_id = ?;`,
        [id]
      );

      return { ...sale, details };
    } catch (error) {
      console.error("[SalesService] Erreur getSaleById:", error);
      return null;
    }
  }

  /**
   * Récupérer une vente par numéro de facture
   */
  async getSaleByInvoice(invoiceNumber: string): Promise<SaleWithDetails | null> {
    try {
      const db = await this.getDB();
      const sale = await db.getFirstAsync<Sale>(
        `SELECT v.*, c.nom as client_nom, c.telephone as client_telephone
         FROM ventes v
         LEFT JOIN clients c ON v.client_id = c.id
         WHERE v.facture_numero = ?;`,
        [invoiceNumber]
      );

      if (!sale) return null;

      const details = await db.getAllAsync<SaleDetail>(
        `SELECT d.*, p.nom as produit_nom
         FROM details_ventes d
         JOIN produits p ON d.produit_id = p.id
         WHERE d.vente_id = ?;`,
        [sale.id]
      );

      return { ...sale, details };
    } catch (error) {
      console.error("[SalesService] Erreur getSaleByInvoice:", error);
      return null;
    }
  }

  /**
   * Récupérer les ventes avec filtres (Sécurisé et fortement typé)
   */
  async getSales(filter: SaleFilter = {}): Promise<Sale[]> {
    try {
      const db = await this.getDB();
      let query = `
        SELECT v.*,
                c.nom as client_nom,
                c.telephone as client_telephone,
                u.nom as utilisateur_nom
        FROM ventes v
        LEFT JOIN clients c ON v.client_id = c.id
        LEFT JOIN utilisateurs u ON v.utilisateur_id = u.id
        WHERE 1=1
      `;
      const params: (string | number | null)[] = [];

      if (filter.startDate) {
        query += " AND v.date_vente >= ?";
        params.push(filter.startDate.includes("T") ? filter.startDate : `${filter.startDate}T00:00:00.000Z`);
      }

      if (filter.endDate) {
        query += " AND v.date_vente <= ?";
        params.push(filter.endDate.includes("T") ? filter.endDate : `${filter.endDate}T23:59:59.999Z`);
      }

      if (filter.clientId) {
        query += " AND v.client_id = ?";
        params.push(filter.clientId);
      }

      if (filter.userId) {
        query += " AND v.utilisateur_id = ?";
        params.push(filter.userId);
      }

      if (filter.status && filter.status.length > 0) {
        const placeholders = filter.status.map(() => "?").join(", ");
        query += ` AND v.statut IN (${placeholders})`;
        filter.status.forEach(s => params.push(s));
      }

      if (filter.paymentMode && filter.paymentMode.length > 0) {
        const placeholders = filter.paymentMode.map(() => "?").join(", ");
        query += ` AND v.mode_paiement IN (${placeholders})`;
        filter.paymentMode.forEach(p => params.push(p));
      }

      if (filter.invoiceNumber) {
        query += " AND v.facture_numero LIKE ?";
        params.push(`%${filter.invoiceNumber}%`);
      }

      if (filter.search) {
        query += " AND (c.nom LIKE ? OR v.facture_numero LIKE ?)";
        params.push(`%${filter.search}%`, `%${filter.search}%`);
      }

      // Whitelisting du tri pour empêcher les injections SQL structurelles
      const allowedSortColumns = ["date_vente", "montant_net", "facture_numero"];
      if (filter.sortBy && allowedSortColumns.includes(filter.sortBy)) {
        const order = filter.sortOrder === "ASC" ? "ASC" : "DESC";
        query += ` ORDER BY v.${filter.sortBy} ${order}`;
      } else {
        query += " ORDER BY v.date_vente DESC";
      }

      if (filter.limit !== undefined) {
        query += " LIMIT ?";
        params.push(filter.limit);
        if (filter.offset !== undefined) {
          query += " OFFSET ?";
          params.push(filter.offset);
        }
      }

      return await db.getAllAsync<Sale>(query, params);
    } catch (error) {
      console.error("[SalesService] Erreur getSales:", error);
      throw error;
    }
  }

  async getClientSales(clientId: number, limit: number = 20): Promise<Sale[]> {
    return this.getSales({ clientId, limit });
  }

  async getUserSales(userId: number, limit: number = 20): Promise<Sale[]> {
    return this.getSales({ userId, limit });
  }

  async getTodaySales(): Promise<Sale[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSales({ startDate: today, endDate: today });
  }

  /**
   * Obtenir les statistiques des ventes
   */
  async getSalesStats(startDate?: string, endDate?: string): Promise<SalesStats> {
    try {
      const db = await this.getDB();
      const defaultEnd = new Date().toISOString().split('T')[0];
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      const defaultStartStr = defaultStart.toISOString().split('T')[0];

      const start = startDate ? (startDate.includes("T") ? startDate : `${startDate}T00:00:00.000Z`) : `${defaultStartStr}T00:00:00.000Z`;
      const end = endDate ? (endDate.includes("T") ? endDate : `${endDate}T23:59:59.999Z`) : `${defaultEnd}T23:59:59.999Z`;

      const stats = await db.getFirstAsync<{
        total: number;
        amount: number;
        avgTicket: number;
        discount: number;
        profit: number;
      }>(
        `SELECT
           COUNT(v.id) as total,
           COALESCE(SUM(v.montant_net), 0) as amount,
           COALESCE(AVG(v.montant_net), 0) as avgTicket,
           COALESCE(SUM(v.remise), 0) as discount,
           (SELECT COALESCE(SUM((dv.prix_unitaire - p.prix_achat) * dv.quantite), 0)
            FROM details_ventes dv
            JOIN produits p ON dv.produit_id = p.id
            JOIN ventes v2 ON dv.vente_id = v2.id
            WHERE v2.date_vente BETWEEN ? AND ? AND v2.statut = 'COMPLETEE') as profit
         FROM ventes v
         WHERE v.date_vente BETWEEN ? AND ?
         AND v.statut = 'COMPLETEE';`,
        [start, end, start, end]
      );

      const dailyData = await db.getAllAsync<{ date: string; amount: number; count: number }>(
        `SELECT DATE(date_vente) as date,
                COALESCE(SUM(montant_net), 0) as amount,
                COUNT(*) as count
         FROM ventes
         WHERE date_vente BETWEEN ? AND ?
         AND statut = 'COMPLETEE'
         GROUP BY DATE(date_vente)
         ORDER BY date ASC;`,
        [start, end]
      );

      const topProducts = await db.getAllAsync<{ name: string; quantity: number; total: number }>(
        `SELECT p.nom as name,
                SUM(dv.quantite) as quantity,
                SUM(dv.sous_total) as total
         FROM details_ventes dv
         JOIN produits p ON dv.produit_id = p.id
         JOIN ventes v ON dv.vente_id = v.id
         WHERE v.date_vente BETWEEN ? AND ?
         AND v.statut = 'COMPLETEE'
         GROUP BY dv.produit_id
         ORDER BY total DESC
         LIMIT 10;`,
        [start, end]
      );

      const topCategories = await db.getAllAsync<{ name: string; total: number }>(
        `SELECT p.categorie as name,
                SUM(dv.sous_total) as total
         FROM details_ventes dv
         JOIN produits p ON dv.produit_id = p.id
         JOIN ventes v ON dv.vente_id = v.id
         WHERE v.date_vente BETWEEN ? AND ?
         AND v.statut = 'COMPLETEE'
         GROUP BY p.categorie
         ORDER BY total DESC
         LIMIT 5;`,
        [start, end]
      );

      const paymentMethods = await db.getAllAsync<{ method: string; total: number; count: number }>(
        `SELECT mode_paiement as method,
                COALESCE(SUM(montant_net), 0) as total,
                COUNT(*) as count
         FROM ventes
         WHERE date_vente BETWEEN ? AND ?
         AND statut = 'COMPLETEE'
         GROUP BY mode_paiement;`,
        [start, end]
      );

      const total = stats?.total || 0;
      const amount = stats?.amount || 0;
      const profit = stats?.profit || 0;

      return {
        totalSales: total,
        totalAmount: amount,
        averageTicket: stats?.avgTicket || 0,
        totalDiscount: stats?.discount || 0,
        totalProfit: profit,
        margin: amount > 0 ? (profit / amount) * 100 : 0,
        dailyData: dailyData || [],
        topProducts: topProducts || [],
        topCategories: topCategories || [],
        paymentMethods: paymentMethods || [],
      };
    } catch (error) {
      console.error("[SalesService] Erreur getSalesStats:", error);
      throw error;
    }
  }

  async getTodayStats(): Promise<SalesStats> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSalesStats(today, today);
  }

  /**
   * Annuler une vente
   */
  async cancelSale(saleId: number, reason: string, userId?: number): Promise<boolean> {
    try {
      const db = await this.getDB();
      const sale = await this.getSaleById(saleId);

      if (!sale) throw new Error("Vente non trouvée.");
      if (sale.statut === "ANNULEE") throw new Error("Cette vente est déjà annulée.");

      const now = new Date().toISOString();

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "UPDATE ventes SET statut = 'ANNULEE', notes = ? WHERE id = ?;",
          [`Annulée: ${reason}`, saleId]
        );

        for (const detail of sale.details) {
          await stockService.addStock(
            detail.produit_id,
            detail.quantite,
            `Annulation vente #${sale.facture_numero}`,
            userId
          );
        }

        await db.runAsync(
          `INSERT INTO audit_logs (utilisateur_id, action, details, timestamp)
           VALUES (?, 'CANCEL_SALE', ?, ?);`,
          [userId ?? null, `Vente #${sale.facture_numero} annulée: ${reason}`, now]
        );
      });

      return true;
    } catch (error) {
      console.error("[SalesService] Erreur cancelSale:", error);
      throw error;
    }
  }

  /**
   * Rembourser une vente
   */
  async refundSale(saleId: number, reason: string, userId?: number): Promise<boolean> {
    try {
      const db = await this.getDB();
      const sale = await this.getSaleById(saleId);

      if (!sale) throw new Error("Vente non trouvée.");
      if (sale.statut === "ANNULEE") throw new Error("Cette vente est déjà annulée.");

      const now = new Date().toISOString();

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO remboursements (
            vente_id, montant, raison, date_remboursement, utilisateur_id
          ) VALUES (?, ?, ?, ?, ?);`,
          [saleId, sale.montant_net, reason, now, userId ?? null]
        );

        await db.runAsync(
          "UPDATE ventes SET statut = 'ANNULEE', notes = ? WHERE id = ?;",
          [`Remboursée: ${reason}`, saleId]
        );

        for (const detail of sale.details) {
          await stockService.addStock(
            detail.produit_id,
            detail.quantite,
            `Remboursement vente #${sale.facture_numero}`,
            userId
          );
        }

        await db.runAsync(
          `INSERT INTO audit_logs (utilisateur_id, action, details, timestamp)
           VALUES (?, 'REFUND_SALE', ?, ?);`,
          [userId ?? null, `Vente #${sale.facture_numero} remboursée: ${reason}`, now]
        );
      });

      return true;
    } catch (error) {
      console.error("[SalesService] Erreur refundSale:", error);
      throw error;
    }
  }

  /**
   * Exporter les ventes en CSV
   */
  async exportSalesToCSV(startDate?: string, endDate?: string): Promise<string> {
    try {
      const sales = await this.getSales({ startDate, endDate });
     
      const headers = [
        "ID", "Facture", "Date", "Client", "Montant", "Remise",
        "Net", "Paiement", "Statut", "Vendeur"
      ];

      const escapeCSV = (val: any) => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = sales.map(s => [
        s.id,
        escapeCSV(s.facture_numero),
        escapeCSV(formatDateTime(s.date_vente)),
        escapeCSV(s.client_nom),
        s.montant_brut.toFixed(2),
        s.remise.toFixed(2),
        s.montant_net.toFixed(2),
        escapeCSV(s.mode_paiement),
        escapeCSV(s.statut),
        escapeCSV(s.utilisateur_nom)
      ]);

      return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    } catch (error) {
      console.error("[SalesService] Erreur exportSalesToCSV:", error);
      throw error;
    }
  }

  /**
   * Exporter le rapport de ventes textuel
   */
  async exportSalesReport(startDate?: string, endDate?: string): Promise<string> {
    try {
      const stats = await this.getSalesStats(startDate, endDate);
      const lines: string[] = [];

      lines.push("=== RAPPORT DE VENTES ===");
      lines.push(`Période: ${startDate || "Début"} - ${endDate || "Aujourd'hui"}`);
      lines.push("");

      lines.push("=== STATISTIQUES GÉNÉRALES ===");
      lines.push(`Total des ventes: ${stats.totalSales}`);
      lines.push(`Montant total: ${stats.totalAmount.toFixed(2)}`);
      lines.push(`Panier moyen: ${stats.averageTicket.toFixed(2)}`);
      lines.push(`Remises totales: ${stats.totalDiscount.toFixed(2)}`);
      lines.push(`Bénéfice total: ${stats.totalProfit.toFixed(2)}`);
      lines.push(`Marge: ${stats.margin.toFixed(1)}%`);
      lines.push("");

      lines.push("=== TOP PRODUITS ===");
      for (const product of stats.topProducts) {
        lines.push(`${product.name}: ${product.quantity} unités - ${product.total.toFixed(2)}`);
      }
      lines.push("");

      lines.push("=== VENTES PAR CATÉGORIE ===");
      for (const category of stats.topCategories) {
        lines.push(`${category.name}: ${category.total.toFixed(2)}`);
      }
      lines.push("");

      lines.push("=== MODES DE PAIEMENT ===");
      for (const method of stats.paymentMethods) {
        lines.push(`${method.method}: ${method.count} ventes - ${method.total.toFixed(2)}`);
      }

      return lines.join("\n");
    } catch (error) {
      console.error("[SalesService] Erreur exportSalesReport:", error);
      throw error;
    }
  }
}

// === EXPORT DE L'INSTANCE ===
export const salesService = SalesService.getInstance();
export default SalesService; 