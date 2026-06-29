import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

// === INTERFACES ===
export interface Licence {
  id?: number; // Rendu optionnel pour les insertions
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

export interface LicenceInfo {
  statut: Licence["statut"] | "DEMO";
  dateActivation?: string;
  dateExpiration?: string;
  joursRestants?: number;
  nomTitulaire?: string;
  emailTitulaire?: string;
  versionLicence?: string;
  typeLicence?: Licence["type_licence"];
  deviceFingerprint?: string;
  cleLicence?: string;
}

export interface LicenceActivationData {
  code: string;
  deviceFingerprint: string;
  nomTitulaire?: string;
  emailTitulaire?: string;
}

export interface LicenceValidationResult {
  valid: boolean;
  message?: string;
  licence?: LicenceInfo;
}

export interface LicenceStats {
  totalLicences: number;
  activeLicences: number;
  expiredLicences: number;
  revokedLicences: number;
  pendingLicences: number;
  demoLicences: number;
}

// === CONSTANTES ===
const DATABASE_NAME = "stockia_secure.db";
const STORAGE_KEY_LICENCE = "@stockia_licence";
const STORAGE_KEY_DEVICE_FINGERPRINT = "@stockia_device_fingerprint";

const DEMO_LICENCE_DURATION = 15;
const DEFAULT_LICENCE_DURATION = 365;

export const LICENCE_TYPES = {
  STANDARD: "STANDARD",
  PREMIUM: "PREMIUM",
  ENTERPRISE: "ENTERPRISE",
} as const;

const LICENCE_TYPE_LABELS: Record<Licence["type_licence"], string> = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
  ENTERPRISE: "Entreprise",
};

const LICENCE_TYPE_FEATURES: Record<Licence["type_licence"], string[]> = {
  STANDARD: [
    "Gestion de caisse",
    "Gestion de stock",
    "Tableau de bord",
    "Impression Bluetooth",
    "1 utilisateur",
    "1 magasin",
  ],
  PREMIUM: [
    "Gestion de caisse",
    "Gestion de stock",
    "Tableau de bord",
    "Impression Bluetooth",
    "3 utilisateurs",
    "3 magasins",
    "Rapports avancés",
    "Support prioritaire",
  ],
  ENTERPRISE: [
    "Gestion de caisse",
    "Gestion de stock",
    "Tableau de bord",
    "Impression Bluetooth",
    "Utilisateurs illimités",
    "Magasins illimités",
    "Rapports avancés",
    "Support 24/7",
    "API personnalisée",
    "Formation incluse",
  ],
};

export class LicenceService {
  private static instance: LicenceService;
  private db: SQLite.SQLiteDatabase | null = null;
  private cachedLicence: LicenceInfo | null = null;
  private deviceFingerprint: string | null = null;

  private constructor() {}

  static getInstance(): LicenceService {
    if (!LicenceService.instance) {
      LicenceService.instance = new LicenceService();
    }
    return LicenceService.instance;
  }

  // === OBTENIR LA CONNEXION ===
  private async getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    }
    return this.db;
  }

  // === FINGERPRINT ===
  async getDeviceFingerprint(): Promise<string> {
    if (this.deviceFingerprint) {
      return this.deviceFingerprint;
    }

    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY_DEVICE_FINGERPRINT);
      if (cached) {
        this.deviceFingerprint = cached;
        return cached;
      }

      const deviceId = (await Device.getDeviceIdAsync()) || "unknown";
      const modelName = (await Device.getModelNameAsync()) || "Unknown";
      const osVersion = Device.osVersion || "Unknown";

      const rawFingerprint = `${deviceId}-${modelName}-${osVersion}-${Platform.OS}`;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawFingerprint
      );

      const fingerprint = `STK-${hash.substring(0, 16).toUpperCase()}`;

      await AsyncStorage.setItem(STORAGE_KEY_DEVICE_FINGERPRINT, fingerprint);
      this.deviceFingerprint = fingerprint;

      return fingerprint;
    } catch (error) {
      console.error("[LicenceService] Erreur fingerprint:", error);
      const fallback = `STK-${Date.now().toString(36).toUpperCase()}`;
      this.deviceFingerprint = fallback;
      return fallback;
    }
  }

  // === VÉRIFICATION DE LA LICENCE ===
  async checkLicence(): Promise<LicenceValidationResult> {
    try {
      const fingerprint = await this.getDeviceFingerprint();
      const db = await this.getDB();

      const licence = await db.getFirstAsync<Licence>(
        `SELECT * FROM licences
         WHERE device_fingerprint = ?
         ORDER BY date_activation DESC
         LIMIT 1;`,
        [fingerprint]
      );

      if (!licence) {
        const demoLicence = await this.createDemoLicence(fingerprint);
        return {
          valid: true,
          message: "Mode démo actif",
          licence: await this.formatLicenceInfo(demoLicence),
        };
      }

      if (licence.statut === "REVOKED") {
        return {
          valid: false,
          message: "Cette licence a été révoquée.",
          licence: await this.formatLicenceInfo(licence),
        };
      }

      const now = new Date();
      const expiration = new Date(licence.date_expiration);

      if (now > expiration) {
        await db.runAsync(
          "UPDATE licences SET statut = 'EXPIRED' WHERE id = ?;",
          [licence.id]
        );
        licence.statut = "EXPIRED";

        return {
          valid: false,
          message: "Votre licence a expiré.",
          licence: await this.formatLicenceInfo(licence),
        };
      }

      await db.runAsync(
        `UPDATE licences SET
          derniere_utilisation = ?,
          temps_utilisation_total = temps_utilisation_total + 1
         WHERE id = ?;`,
        [new Date().toISOString(), licence.id]
      );

      this.cachedLicence = await this.formatLicenceInfo(licence);

      return {
        valid: true,
        message: "Licence valide",
        licence: this.cachedLicence,
      };
    } catch (error) {
      console.error("[LicenceService] Erreur checkLicence:", error);
      return {
        valid: false,
        message: "Erreur de vérification de la licence.",
      };
    }
  }

  // === FORMATER LES INFORMATIONS ===
  private async formatLicenceInfo(licence: Licence): Promise<LicenceInfo> {
    const now = new Date();
    const expiration = new Date(licence.date_expiration);
    const joursRestants = Math.ceil(
      (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      statut: licence.statut,
      dateActivation: licence.date_activation,
      dateExpiration: licence.date_expiration,
      joursRestants: joursRestants > 0 ? joursRestants : 0,
      nomTitulaire: licence.nom_titulaire || undefined,
      emailTitulaire: licence.email_titulaire || undefined,
      typeLicence: licence.type_licence,
      deviceFingerprint: licence.device_fingerprint,
      cleLicence: licence.cle_licence,
    };
  }

  // === CRÉER UNE LICENCE DÉMO ===
  private async createDemoLicence(fingerprint: string): Promise<Licence> {
    try {
      const db = await this.getDB();
      const now = new Date();
      const expiration = new Date(now);
      expiration.setDate(expiration.getDate() + DEMO_LICENCE_DURATION);

      const demoKey = `DEMO-${Date.now().toString(36).toUpperCase()}`;

      // CORRECTION : Alignement strict des colonnes '?' et des valeurs fournies
      const result = await db.runAsync(
        `INSERT INTO licences (
          cle_licence, device_fingerprint, date_activation,
          date_expiration, statut, type_licence,
          nom_titulaire, email_titulaire, temps_utilisation_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          demoKey,
          fingerprint,
          now.toISOString(),
          expiration.toISOString(),
          "ACTIVE",
          "STANDARD",
          "Utilisateur Démo",
          "demo@stockia.com",
          0,
        ]
      );

      const licence = await db.getFirstAsync<Licence>(
        "SELECT * FROM licences WHERE id = ?;",
        [result.lastInsertRowId]
      );

      if (!licence) throw new Error("Échec de la récupération de la licence démo créée.");
      return licence;
    } catch (error) {
      console.error("[LicenceService] Erreur createDemoLicence:", error);
      throw new Error("Impossible de créer la licence démo.");
    }
  }

  // === ACTIVER UNE LICENCE ===
  async activateLicence(data: LicenceActivationData): Promise<LicenceValidationResult> {
    try {
      const db = await this.getDB();
      const { code, deviceFingerprint, nomTitulaire, emailTitulaire } = data;

      const licence = await db.getFirstAsync<Licence>(
        "SELECT * FROM licences WHERE cle_licence = ?;",
        [code]
      );

      if (!licence) {
        return {
          valid: false,
          message: "Clé de licence invalide.",
        };
      }

      if (licence.device_fingerprint && licence.device_fingerprint !== "PENDING" && licence.device_fingerprint !== "DEMO") {
        return {
          valid: false,
          message: "Cette licence a déjà été activée sur un autre appareil.",
        };
      }

      const now = new Date();
      const expiration = new Date(licence.date_expiration);
      if (now > expiration) {
        await db.runAsync(
          "UPDATE licences SET statut = 'EXPIRED' WHERE id = ?;",
          [licence.id]
        );
        return {
          valid: false,
          message: "Cette licence a expiré.",
        };
      }

      await db.runAsync(
        `UPDATE licences SET
          device_fingerprint = ?,
          date_activation = ?,
          statut = 'ACTIVE',
          nom_titulaire = ?,
          email_titulaire = ?
         WHERE id = ?;`,
        [
          deviceFingerprint,
          now.toISOString(),
          nomTitulaire || licence.nom_titulaire || null,
          emailTitulaire || licence.email_titulaire || null,
          licence.id,
        ]
      );

      const updatedLicence = await db.getFirstAsync<Licence>(
        "SELECT * FROM licences WHERE id = ?;",
        [licence.id]
      );

      this.cachedLicence = await this.formatLicenceInfo(updatedLicence!);

      return {
        valid: true,
        message: "Licence activée avec succès.",
        licence: this.cachedLicence,
      };
    } catch (error) {
      console.error("[LicenceService] Erreur activateLicence:", error);
      return {
        valid: false,
        message: "Erreur lors de l'activation de la licence.",
      };
    }
  }

  // === CRÉER UNE LICENCE (ADMIN) ===
  async createLicence(
    type: Licence["type_licence"] = "STANDARD",
    duration: number = DEFAULT_LICENCE_DURATION,
    nomTitulaire?: string,
    emailTitulaire?: string
  ): Promise<{ cle: string; licence: Licence }> {
    try {
      const db = await this.getDB();

      const random = await Crypto.getRandomBytesAsync(16);
      const key = `STK-${Array.from(new Uint8Array(random))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .substring(0, 12)
        .toUpperCase()
        .match(/.{4}/g)
        ?.join("-")}`;

      const now = new Date();
      const expiration = new Date(now);
      expiration.setDate(expiration.getDate() + duration);

      // CORRECTION : Toutes les valeurs variables passent par les '?'
      const result = await db.runAsync(
        `INSERT INTO licences (
          cle_licence, device_fingerprint, date_activation,
          date_expiration, statut, type_licence,
          nom_titulaire, email_titulaire, temps_utilisation_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          key,
          "PENDING",
          now.toISOString(),
          expiration.toISOString(),
          "PENDING",
          type,
          nomTitulaire || null,
          emailTitulaire || null,
          0
        ]
      );

      const licence = await db.getFirstAsync<Licence>(
        "SELECT * FROM licences WHERE id = ?;",
        [result.lastInsertRowId]
      );

      if (!licence) throw new Error("Échec de la récupération de la licence générée.");

      return { cle: key, licence };
    } catch (error) {
      console.error("[LicenceService] Erreur createLicence:", error);
      throw new Error("Impossible de créer la licence.");
    }
  }

  // === RÉCUPÉRER TOUTES LES LICENCES ===
  async getAllLicences(): Promise<Licence[]> {
    try {
      const db = await this.getDB();
      return await db.getAllAsync<Licence>(
        "SELECT * FROM licences ORDER BY date_activation DESC;"
      );
    } catch (error) {
      console.error("[LicenceService] Erreur getAllLicences:", error);
      return [];
    }
  }

  // === STATISTIQUES ===
  async getLicenceStats(): Promise<LicenceStats> {
    try {
      const db = await this.getDB();

      const stats = await db.getFirstAsync<{
        total: number;
        active: number;
        expired: number;
        revoked: number;
        pending: number;
      }>(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN statut = 'ACTIVE' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN statut = 'EXPIRED' THEN 1 ELSE 0 END) as expired,
          SUM(CASE WHEN statut = 'REVOKED' THEN 1 ELSE 0 END) as revoked,
          SUM(CASE WHEN statut = 'PENDING' THEN 1 ELSE 0 END) as pending
         FROM licences;`
      );

      const demoResult = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM licences WHERE cle_licence LIKE 'DEMO%';"
      );

      return {
        totalLicences: stats?.total || 0,
        activeLicences: stats?.active || 0,
        expiredLicences: stats?.expired || 0,
        revokedLicences: stats?.revoked || 0,
        pendingLicences: stats?.pending || 0,
        demoLicences: demoResult?.count || 0,
      };
    } catch (error) {
      console.error("[LicenceService] Erreur getLicenceStats:", error);
      return {
        totalLicences: 0,
        activeLicences: 0,
        expiredLicences: 0,
        revokedLicences: 0,
        pendingLicences: 0,
        demoLicences: 0,
      };
    }
  }

  // === RÉVOQUER UNE LICENCE ===
  async revokeLicence(licenceId: number): Promise<boolean> {
    try {
      const db = await this.getDB();

      await db.runAsync(
        `UPDATE licences SET
          statut = 'REVOKED',
          derniere_utilisation = ?
         WHERE id = ?;`,
        [new Date().toISOString(), licenceId]
      );

      return true;
    } catch (error) {
      console.error("[LicenceService] Erreur revokeLicence:", error);
      return false;
    }
  }

  // === SUPPRIMER UNE LICENCE ===
  async deleteLicence(licenceId: number): Promise<boolean> {
    try {
      const db = await this.getDB();
      await db.runAsync("DELETE FROM licences WHERE id = ?;", [licenceId]);
      return true;
    } catch (error) {
      console.error("[LicenceService] Erreur deleteLicence:", error);
      return false;
    }
  }

  // === NETTOYER LE CACHE ===
  clearCache(): void {
    this.cachedLicence = null;
  }

  // === RÉCUPÉRER LES TYPES ===
  getLicenceTypes(): typeof LICENCE_TYPES {
    return LICENCE_TYPES;
  }

  getLicenceTypeLabels(): Record<Licence["type_licence"], string> {
    return LICENCE_TYPE_LABELS;
  }

  getLicenceFeatures(type: Licence["type_licence"]): string[] {
    return LICENCE_TYPE_FEATURES[type] || LICENCE_TYPE_FEATURES.STANDARD;
  }

  // === VÉRIFIER UNE FONCTIONNALITÉ ===
  async isFeatureAvailable(feature: string): Promise<boolean> {
    try {
      const result = await this.checkLicence();
      if (!result.valid || !result.licence) return false;

      const type = result.licence.typeLicence || "STANDARD";
      const features = this.getLicenceFeatures(type);
      return features.includes(feature);
    } catch (error) {
      console.error("[LicenceService] Erreur isFeatureAvailable:", error);
      return false;
    }
  }
}

// === EXPORT ===
export const licenceService = LicenceService.getInstance();

export default LicenceService; 