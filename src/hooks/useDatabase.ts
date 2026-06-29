// ============================================
// 📁 HOOKS - USEDATABASE
// Version: 3.1.0
// Description: Abstraction réactive pour expo-sqlite (v14+) avec routage Read/Write
// ============================================

import * as Haptics from "expo-haptics";
import * as SQLite from "expo-sqlite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dbService } from "../services/DatabaseService";

// === INTERFACES ===
export interface DatabaseState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  stats: {
    tableCount: number;
    totalRows: number;
    size: string;
    lastBackup: string | null;
    integrity: boolean;
  } | null;
  queryCount: number;
  lastQuery: string | null;
  lastQueryTime: number | null;
}

export interface QueryOptions {
  timeout?: number;
  transaction?: boolean;
  log?: boolean;
}

export interface QueryResult<T = any> {
  data: T[];
  changes: number;
  lastInsertRowId: number;
  executionTime: number;
  success: boolean;
  error?: string;
}

export interface UseDatabaseReturn {
  state: DatabaseState;
  query: <T = any>(sql: string, params?: any[], options?: QueryOptions) => Promise<QueryResult<T>>;
  transaction: <T>(callback: (db: SQLite.SQLiteDatabase) => Promise<T>) => Promise<T>;
  backup: () => Promise<{ success: boolean; path?: string; error?: string }>;
  restore: (path: string) => Promise<{ success: boolean; error?: string }>;
  getBackups: () => Promise<{ name: string; size: number; date: Date; path: string }[]>;
  deleteBackup: (name: string) => Promise<boolean>;
  cleanup: () => Promise<{ deleted: number; tables: string[] }>;
  checkIntegrity: () => Promise<{ valid: boolean; errors: string[] }>;
  reset: () => Promise<boolean>;
  getStats: () => Promise<DatabaseState["stats"]>;
  preparedQuery: <T = any>(sql: string, params: any[]) => Promise<QueryResult<T>>;
}

export function useDatabase(): UseDatabaseReturn {
  const [state, setState] = useState<DatabaseState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    stats: null,
    queryCount: 0,
    lastQuery: null,
    lastQueryTime: null,
  });

  const isMountedRef = useRef(true);

  // === INITIALISATION SÉCURISÉE ===
  const initializeDatabase = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await dbService.initialize();
      const stats = await dbService.getStats();

      if (!isMountedRef.current) return;

      setState((prev) => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        stats,
        error: null,
      }));
      console.log("[useDatabase] Base de données synchronisée et prête.");
    } catch (error: any) {
      console.error("[useDatabase] Erreur lors de l'initialisation:", error);
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Erreur d'initialisation de la base",
        }));
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    initializeDatabase();
    return () => {
      isMountedRef.current = false;
    };
  }, [initializeDatabase]);

  // === EXÉCUTION DES REQUÊTES (Avec routage Read / Write) ===
  const query = useCallback(
    async <T = any>(
      sql: string,
      params: any[] = [],
      options: QueryOptions = {}
    ): Promise<QueryResult<T>> => {
      const startTime = Date.now();
      const isWriteQuery = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)/i.test(sql);

      try {
        setState((prev) => ({ ...prev, isLoading: true }));
        const db = await dbService.getConnection();
        
        let data: T[] = [];
        let changes = 0;
        let lastInsertRowId = 0;

        if (isWriteQuery) {
          // Requête d'écriture : Exécution via runAsync pour obtenir les métadonnées SQLite
          const writeResult = await db.runAsync(sql, params);
          changes = writeResult.changes;
          lastInsertRowId = writeResult.lastInsertRowId;
        } else {
          // Requête de lecture : Exécution via getAllAsync
          data = await db.getAllAsync<T>(sql, params);
        }

        const executionTime = Date.now() - startTime;

        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            queryCount: prev.queryCount + 1,
            lastQuery: sql.substring(0, 100) + (sql.length > 100 ? "..." : ""),
            lastQueryTime: executionTime,
          }));
        }

        return {
          data,
          changes,
          lastInsertRowId,
          executionTime,
          success: true,
        };
      } catch (error: any) {
        console.error("[useDatabase] Erreur d'exécution SQL:", error);
        const executionTime = Date.now() - startTime;

        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message || "Erreur d'exécution de la requête",
          }));
        }

        return {
          data: [],
          changes: 0,
          lastInsertRowId: 0,
          executionTime,
          success: false,
          error: error.message,
        };
      }
    },
    []
  );

  // === TRANSACTIONS COMPATIBLES ===
  const transaction = useCallback(async <T>(callback: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const db = await dbService.getConnection();
      const result = await db.withTransactionAsync(callback);

      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: false, queryCount: prev.queryCount + 1 }));
      }
      return result;
    } catch (error: any) {
      console.error("[useDatabase] Échec de la transaction:", error);
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Erreur de transaction",
        }));
      }
      throw error;
    }
  }, []);

  const preparedQuery = useCallback(
    async <T = any>(sql: string, params: any[]): Promise<QueryResult<T>> => {
      return query<T>(sql, params);
    },
    [query]
  );

  // === SAUVEGARDE ===
  const backup = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const backupInfo = await dbService.backup();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
      return { success: true, path: backupInfo.path };
    } catch (error: any) {
      console.error("[useDatabase] Erreur backup:", error);
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: false, error: error.message || "Erreur de sauvegarde" }));
      }
      return { success: false, error: error.message };
    }
  }, []);

  // === RESTAURATION ===
  const restore = useCallback(async (path: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await dbService.restore(path);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const stats = await dbService.getStats();

      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: false, stats }));
      }
      return { success: true };
    } catch (error: any) {
      console.error("[useDatabase] Erreur de restauration:", error);
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: false, error: error.message || "Erreur de restauration" }));
      }
      return { success: false, error: error.message };
    }
  }, []);

  const getBackups = useCallback(async () => {
    try {
      return await dbService.getBackups();
    } catch (error) {
      console.error("[useDatabase] Erreur lors de la récupération des backups:", error);
      return [];
    }
  }, []);

  const deleteBackup = useCallback(async (name: string) => {
    try {
      const result = await dbService.deleteBackup(name);
      if (result) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      return result;
    } catch (error) {
      console.error("[useDatabase] Erreur suppression backup:", error);
      return false;
    }
  }, []);

  // === MAINTENANCE & NETTOYAGE ===
  const cleanup = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const result = await dbService.cleanup();
      const stats = await dbService.getStats();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: false, stats }));
      }
      return result;
    } catch (error: any) {
      console.error("[useDatabase] Erreur lors du nettoyage:", error);
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: false, error: error.message || "Erreur de nettoyage" }));
      }
      return { deleted: 0, tables: [] };
    }
  }, []);

  const checkIntegrity = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const result = await dbService.checkIntegrity();

      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
      return result;
    } catch (error: any) {
      console.error("[useDatabase] Erreur checkIntegrity:", error);
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: false, error: error.message || "Erreur d'intégrité" }));
      }
      return { valid: false, errors: [error.message] };
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const result = await dbService.resetDatabase();

      if (result) {
        const stats = await dbService.getStats();
        if (isMountedRef.current) {
          setState((prev) => ({ ...prev, isLoading: false, stats, error: null }));
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return result;
    } catch (error: any) {
      console.error("[useDatabase] Erreur lors du reset général:", error);
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: false, error: error.message || "Erreur de réinitialisation" }));
      }
      return false;
    }
  }, []);

  const getStats = useCallback(async () => {
    try {
      const stats = await dbService.getStats();
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, stats }));
      }
      return stats;
    } catch (error) {
      console.error("[useDatabase] Erreur getStats:", error);
      return null;
    }
  }, []);

  // === MÉMOÏSATION DE L'INTERFACE DE RETOUR ===
  const value = useMemo<UseDatabaseReturn>(
    () => ({
      state,
      query,
      transaction,
      backup,
      restore,
      getBackups,
      deleteBackup,
      cleanup,
      checkIntegrity,
      reset,
      getStats,
      preparedQuery,
    }),
    [state, query, transaction, backup, restore, getBackups, deleteBackup, cleanup, checkIntegrity, reset, getStats, preparedQuery]
  );

  return value;
}

// === HOOKS DÉRIVÉS UNIFIÉS ===
export function useDatabaseStats(): DatabaseState["stats"] {
  return useDatabase().state.stats;
}

export function useDatabaseError(): string | null {
  return useDatabase().state.error;
}

export function useDatabaseLoading(): boolean {
  return useDatabase().state.isLoading;
}

export function useDatabaseQueryCount(): number {
  return useDatabase().state.queryCount;
}

export default useDatabase;