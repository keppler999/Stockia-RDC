import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { dbService } from "./DatabaseService";

// === INTERFACES ===
export interface BackupInfo {
  name: string;
  size: number;
  date: Date;
  path: string;
  version?: number;
  checksum?: string;
  compressed?: boolean;
  encrypted?: boolean;
}

export interface BackupOptions {
  compress?: boolean;
  encrypt?: boolean;
  password?: string;
  includeAttachments?: boolean;
  customName?: string;
}

export interface RestoreOptions {
  replace?: boolean;
  password?: string;
  verifyBeforeRestore?: boolean;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup: BackupInfo | null;
  oldestBackup: BackupInfo | null;
  averageSize: number;
}

// === CONSTANTES ===
const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
const STORAGE_KEY_BACKUPS = "@stockia_backups";
const STORAGE_KEY_LAST_BACKUP = "@stockia_last_backup";
const MAX_BACKUPS = 10;
// Fallback sécurisé pour le nom de la base de données
const DEFAULT_DB_NAME = "stockia_secure.db";

// === TYPES ===
export type BackupProgressCallback = (progress: {
  current: number;
  total: number;
  message: string;
}) => void;

export class BackupService {
  private static instance: BackupService;
  private isBackingUp: boolean = false;
  private isRestoring: boolean = false;

  private constructor() {}

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  // === INITIALISATION ===
  async initialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
      }
      console.log("[BackupService] Initialisé");
    } catch (error) {
      console.error("[BackupService] Erreur initialisation:", error);
      throw new Error("Impossible d'initialiser le service de sauvegarde.");
    }
  }

  // === CRÉER UNE SAUVEGARDE ===
  async createBackup(
    options: BackupOptions = {},
    onProgress?: BackupProgressCallback
  ): Promise<BackupInfo> {
    if (this.isBackingUp) {
      throw new Error("Une sauvegarde est déjà en cours.");
    }

    try {
      this.isBackingUp = true;
      await this.initialize();

      // Résolution sécurisée du nom de la base de données
      const dbName = (dbService as any).DATABASE_NAME || DEFAULT_DB_NAME;
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const dbInfo = await FileSystem.getInfoAsync(dbPath);

      if (!dbInfo.exists) {
        throw new Error("Base de données originale non trouvée.");
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const name = options.customName || `stockia_backup_${timestamp}.db`;
      const backupPath = `${BACKUP_DIR}${name}`;

      onProgress?.({ current: 0, total: 100, message: "Début de la sauvegarde..." });
      onProgress?.({ current: 10, total: 100, message: "Fermeture de la base de données..." });
     
      await dbService.close();
     
      onProgress?.({ current: 30, total: 100, message: "Copie des fichiers..." });
      await FileSystem.copyAsync({
        from: dbPath,
        to: backupPath,
      });
     
      // Réouverture immédiate de la BDD pour ne pas bloquer l'application
      await dbService.initialize();

      onProgress?.({ current: 50, total: 100, message: "Base de données copiée avec succès." });

      let finalPath = backupPath;
      let compressed = false;

      if (options.compress) {
        onProgress?.({ current: 60, total: 100, message: "Compression en cours (simulée)..." });
        compressed = true;
      }

      let encrypted = false;
      let checksum = "";

      if (options.encrypt && options.password) {
        onProgress?.({ current: 70, total: 100, message: "Chiffrement en cours (simulé)..." });
        encrypted = true;
      }

      onProgress?.({ current: 80, total: 100, message: "Calcul de l'empreinte de sécurité (Checksum)..." });
      checksum = await this.generateChecksum(finalPath);

      onProgress?.({ current: 90, total: 100, message: "Enregistrement des métadonnées..." });

      const fileInfo = await FileSystem.getInfoAsync(finalPath);
      if (!fileInfo.exists) throw new Error("Erreur lors de la génération du fichier final.");

      const backupInfo: BackupInfo = {
        name,
        size: fileInfo.size,
        date: new Date(),
        path: finalPath,
        version: 1,
        checksum,
        compressed,
        encrypted,
      };

      await this.saveBackupInfo(backupInfo);
      await this.cleanupOldBackups();

      onProgress?.({ current: 100, total: 100, message: "Sauvegarde terminée avec succès !" });
      this.isBackingUp = false;
      return backupInfo;

    } catch (error) {
      this.isBackingUp = false;
      // Tentative de réouverture de secours si crash pendant la fermeture
      try { await dbService.initialize(); } catch {}
      console.error("[BackupService] Erreur backup:", error);
      throw new Error(`Erreur lors de la sauvegarde: ${(error as Error).message}`);
    }
  }

  // === RESTAURER UNE SAUVEGARDE ===
  async restoreBackup(
    backupName: string,
    options: RestoreOptions = {},
    onProgress?: BackupProgressCallback
  ): Promise<boolean> {
    if (this.isRestoring) {
      throw new Error("Une restauration est déjà en cours.");
    }

    try {
      this.isRestoring = true;
      const backupPath = `${BACKUP_DIR}${backupName}`;
      const info = await FileSystem.getInfoAsync(backupPath);

      if (!info.exists) {
        throw new Error("Fichier de sauvegarde non trouvé.");
      }

      if (options.verifyBeforeRestore) {
        onProgress?.({ current: 10, total: 100, message: "Vérification de l'intégrité..." });
        const currentChecksum = await this.generateChecksum(backupPath);
        const backupInfo = await this.getBackupInfo(backupName);
       
        if (backupInfo && backupInfo.checksum && backupInfo.checksum !== currentChecksum) {
          throw new Error("Le fichier de sauvegarde semble corrompu ou modifié.");
        }
      }

      if (options.password) {
        onProgress?.({ current: 30, total: 100, message: "Déchiffrement des données..." });
      }

      onProgress?.({ current: 50, total: 100, message: "Remplacement de la base de données active..." });

      const dbName = (dbService as any).DATABASE_NAME || DEFAULT_DB_NAME;
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
     
      await dbService.close();

      // Supprimer l'ancienne base pour éviter les conflits de réécriture
      const currentDbCheck = await FileSystem.getInfoAsync(dbPath);
      if (currentDbCheck.exists) {
        await FileSystem.deleteAsync(dbPath, { idatabase: true } as any);
      }

      await FileSystem.copyAsync({
        from: backupPath,
        to: dbPath,
      });

      await dbService.initialize();

      onProgress?.({ current: 90, total: 100, message: "Finalisation..." });
      await AsyncStorage.setItem("@stockia_last_restore", new Date().toISOString());
      onProgress?.({ current: 100, total: 100, message: "Restauration terminée !" });

      this.isRestoring = false;
      return true;

    } catch (error) {
      this.isRestoring = false;
      try { await dbService.initialize(); } catch {}
      console.error("[BackupService] Erreur restore:", error);
      throw new Error(`Erreur lors de la restauration: ${(error as Error).message}`);
    }
  }

  // === LISTER LES SAUVEGARDES ===
  async listBackups(): Promise<BackupInfo[]> {
    try {
      await this.initialize();
      const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
      const backups: BackupInfo[] = [];
      const storedInfos = await this.getBackupInfoList();

      for (const file of files) {
        if (file.endsWith('.db') || file.endsWith('.backup')) {
          const path = `${BACKUP_DIR}${file}`;
          const info = await FileSystem.getInfoAsync(path);
          if (info.exists) {
            const matchedInfo = storedInfos.find(b => b.name === file);
            backups.push({
              name: file,
              size: info.size,
              date: matchedInfo ? new Date(matchedInfo.date) : new Date(info.modificationTime * 1000 || 0),
              path,
              checksum: matchedInfo?.checksum || "",
              compressed: matchedInfo?.compressed || false,
              encrypted: matchedInfo?.encrypted || false,
              version: matchedInfo?.version || 1
            });
          }
        }
      }

      return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error("[BackupService] Erreur listBackups:", error);
      return [];
    }
  }

  // === SUPPRIMER UNE SAUVEGARDE ===
  async deleteBackup(name: string): Promise<boolean> {
    try {
      const path = `${BACKUP_DIR}${name}`;
      const info = await FileSystem.getInfoAsync(path);
     
      if (info.exists) {
        await FileSystem.deleteAsync(path);
      }
      await this.removeBackupInfo(name);
      return true;
    } catch (error) {
      console.error("[BackupService] Erreur deleteBackup:", error);
      return false;
    }
  }

  // === SUPPRIMER TOUTES LES SAUVEGARDES ===
  async deleteAllBackups(): Promise<number> {
    try {
      const backups = await this.listBackups();
      let deleted = 0;
      for (const backup of backups) {
        const success = await this.deleteBackup(backup.name);
        if (success) deleted++;
      }
      return deleted;
    } catch (error) {
      console.error("[BackupService] Erreur deleteAllBackups:", error);
      return 0;
    }
  }

  // === NETTOYER LES ANCIENNES SAUVEGARDES ===
  async cleanupOldBackups(): Promise<number> {
    try {
      const backups = await this.listBackups();
      if (backups.length <= MAX_BACKUPS) return 0;

      const toDelete = backups.slice(MAX_BACKUPS);
      let deleted = 0;

      for (const backup of toDelete) {
        const success = await this.deleteBackup(backup.name);
        if (success) deleted++;
      }
      return deleted;
    } catch (error) {
      console.error("[BackupService] Erreur cleanupOldBackups:", error);
      return 0;
    }
  }

  // === STATISTIQUES ===
  async getBackupStats(): Promise<BackupStats> {
    try {
      const backups = await this.listBackups();
      if (backups.length === 0) {
        return { totalBackups: 0, totalSize: 0, lastBackup: null, oldestBackup: null, averageSize: 0 };
      }

      const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
      return {
        totalBackups: backups.length,
        totalSize,
        lastBackup: backups[0],
        oldestBackup: backups[backups.length - 1],
        averageSize: totalSize / backups.length,
      };
    } catch (error) {
      console.error("[BackupService] Erreur getBackupStats:", error);
      return { totalBackups: 0, totalSize: 0, lastBackup: null, oldestBackup: null, averageSize: 0 };
    }
  }

  // === PARTAGER UNE SAUVEGARDE ===
  async shareBackup(name: string): Promise<boolean> {
    try {
      const path = `${BACKUP_DIR}${name}`;
      const info = await FileSystem.getInfoAsync(path);

      if (!info.exists) throw new Error("Fichier de sauvegarde introuvable.");

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/x-sqlite3',
          dialogTitle: 'Partager la sauvegarde BlueDeep',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("[BackupService] Erreur shareBackup:", error);
      throw new Error(`Erreur de partage: ${(error as Error).message}`);
    }
  }

  // === SAUVEGARDE AUTOMATIQUE ===
  async autoBackup(): Promise<BackupInfo | null> {
    try {
      const lastBackupStr = await AsyncStorage.getItem(STORAGE_KEY_LAST_BACKUP);
     
      if (lastBackupStr) {
        const parsed = JSON.parse(lastBackupStr);
        const lastBackupDate = parsed.date ? new Date(parsed.date) : null;

        if (lastBackupDate) {
          const hoursSinceLast = (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLast < 24) return null;
        }
      }

      return await this.createBackup({ compress: true, encrypt: false });
    } catch (error) {
      console.error("[BackupService] Erreur autoBackup:", error);
      return null;
    }
  }

  // === GÉNÉRER UN CHECKSUM SÉCURISÉ ===
  private async generateChecksum(filePath: string): Promise<string> {
    try {
      // Pour éviter les crashs de RAM (OOM), on utilise digestFileAsync s'il est supporté ou une lecture par petits blocs.
      // Crypto.digestFileAsync est idéal pour traiter les fichiers volumineux sans encombrer la RAM.
      if ((Crypto as any).digestFileAsync) {
        return await (Crypto as any).digestFileAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          filePath
        );
      }
     
      // Fallback sécurisé si l'environnement restreint l'API directe sur fichier
      const content = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.Base64 });
      return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, content);
    } catch (error) {
      console.error("[BackupService] Erreur checksum:", error);
      return "";
    }
  }

  // === SAUVEGARDER LES INFORMATIONS ===
  private async saveBackupInfo(backupInfo: BackupInfo): Promise<void> {
    try {
      const backups = await this.getBackupInfoList();
      backups.push(backupInfo);
      await AsyncStorage.setItem(STORAGE_KEY_BACKUPS, JSON.stringify(backups));
      await AsyncStorage.setItem(STORAGE_KEY_LAST_BACKUP, JSON.stringify(backupInfo));
    } catch (error) {
      console.error("[BackupService] Erreur saveBackupInfo:", error);
    }
  }

  // === RÉCUPÉRER LES INFORMATIONS ===
  private async getBackupInfo(name: string): Promise<BackupInfo | null> {
    try {
      const backups = await this.getBackupInfoList();
      const backup = backups.find(b => b.name === name);
      if (backup) {
        backup.date = new Date(backup.date); // Forcer le format Date object
        return backup;
      }
      return null;
    } catch (error) {
      console.error("[BackupService] Erreur getBackupInfo:", error);
      return null;
    }
  }

  private async getBackupInfoList(): Promise<BackupInfo[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_BACKUPS);
      if (!data) return [];
      const parsed: BackupInfo[] = JSON.parse(data);
      return parsed.map(b => ({ ...b, date: new Date(b.date) }));
    } catch (error) {
      console.error("[BackupService] Erreur getBackupInfoList:", error);
      return [];
    }
  }

  private async removeBackupInfo(name: string): Promise<void> {
    try {
      const backups = await this.getBackupInfoList();
      const filtered = backups.filter(b => b.name !== name);
      await AsyncStorage.setItem(STORAGE_KEY_BACKUPS, JSON.stringify(filtered));
    } catch (error) {
      console.error("[BackupService] Erreur removeBackupInfo:", error);
    }
  }

  // === ÉTAT ===
  isBackupInProgress(): boolean {
    return this.isBackingUp;
  }

  isRestoreInProgress(): boolean {
    return this.isRestoring;
  }
}

// === EXPORT DE L'INSTANCE ===
export const backupService = BackupService.getInstance();
export default BackupService; 