import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as SQLite from "expo-sqlite";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// === INTERFACES ===
export interface AppSettings {
  /** Nom de la boutique */
  nomBoutique: string;
  /** Devise */
  devise: string;
  /** Symbole de la devise */
  deviseSymbole: string;
  /** Taux de TVA par défaut */
  tauxTVA: number;
  /** Seuil d'alerte stock */
  seuilStockAlerte: number;
  /** Objectif journalier */
  objectifJournalier: number;
  /** Impression automatique */
  impressionAutomatique: boolean;
  /** Mode sombre */
  darkMode: boolean;
  /** Notifications */
  notifications: boolean;
  /** Sauvegarde automatique */
  autoBackup: boolean;
  /** Langue */
  langue: string;
  /** Pays */
  pays: string;
  /** Format de date */
  formatDate: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  /** Format de prix */
  formatPrix: "standard" | "compact";
  /** Arrondi des prix */
  arrondi: number;
  /** Activer la biométrie */
  biometricEnabled: boolean;
  /** Activer le mode hors-ligne */
  offlineMode: boolean;
  /** Taille du papier d'impression */
  papierImpression: "58mm" | "80mm";
  /** Nombre de copies par défaut */
  copiesDefaut: number;
}

export interface SettingsContextType {
  /** Paramètres actuels */
  settings: AppSettings;
  /** Mettre à jour un paramètre */
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  /** Mettre à jour plusieurs paramètres */
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  /** Réinitialiser les paramètres */
  resetSettings: () => Promise<void>;
  /** Charger les paramètres */
  loadSettings: () => Promise<void>;
  /** Sauvegarder les paramètres */
  saveSettings: () => Promise<void>;
  /** Obtenir un paramètre */
  getSetting: <K extends keyof AppSettings>(key: K) => AppSettings[K];
  /** Vérifier si un paramètre est activé */
  isEnabled: (key: keyof AppSettings) => boolean;
}

// === PARAMÈTRES PAR DÉFAUT ===
const DEFAULT_SETTINGS: AppSettings = {
  nomBoutique: "Stockia Store",
  devise: "USD",
  deviseSymbole: "$",
  tauxTVA: 18,
  seuilStockAlerte: 5,
  objectifJournalier: 500,
  impressionAutomatique: true,
  darkMode: false,
  notifications: true,
  autoBackup: false,
  langue: "fr",
  pays: "CD",
  formatDate: "DD/MM/YYYY",
  formatPrix: "standard",
  arrondi: 2,
  biometricEnabled: false,
  offlineMode: false,
  papierImpression: "58mm",
  copiesDefaut: 1,
};

// === CONSTANTES ===
const STORAGE_KEY = "@stockia_settings";
const DATABASE_NAME = "stockia_secure.db";

// === CONTEXTE ===
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings doit être utilisé à l'intérieur d'un SettingsProvider");
  }
  return context;
};export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // === ÉTATS ===
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // === CHARGEMENT INITIAL ===
  useEffect(() => {
    loadSettings();
  }, []);

  // === CHARGER LES PARAMÈTRES ===
  const loadSettings = useCallback(async () => {
    try {
      // 1. Charger depuis AsyncStorage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        setIsLoaded(true);
        return;
      }

      // 2. Charger depuis la base de données
      await loadSettingsFromDB();
      setIsLoaded(true);

    } catch (error) {
      console.error("[SettingsContext] Erreur chargement:", error);
      // Utiliser les paramètres par défaut
      setSettings(DEFAULT_SETTINGS);
      setIsLoaded(true);
    }
  }, []);

  // === CHARGER DEPUIS LA BASE ===
  const loadSettingsFromDB = useCallback(async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      
      // Récupérer les paramètres
      const params = await db.getAllAsync<{ cle: string; valeur: string }>(
        "SELECT cle, valeur FROM parametres_systeme;"
      );

      const newSettings = { ...DEFAULT_SETTINGS };

      for (const param of params) {
        switch (param.cle) {
          case "nom_boutique":
            newSettings.nomBoutique = param.valeur;
            break;
          case "devise_symbole":
            newSettings.deviseSymbole = param.valeur;
            break;
          case "taux_tva":
            newSettings.tauxTVA = parseFloat(param.valeur) || 18;
            break;
          case "seuil_stock_alerte":
            newSettings.seuilStockAlerte = parseInt(param.valeur) || 5;
            break;
          case "objectif_journalier":
            newSettings.objectifJournalier = parseFloat(param.valeur) || 500;
            break;
          case "impression_automatique":
            newSettings.impressionAutomatique = param.valeur === "1";
            break;
        }
      }

      setSettings(newSettings);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));

    } catch (error) {
      console.error("[SettingsContext] Erreur chargement DB:", error);
    }
  }, []);// === SAUVEGARDER LES PARAMÈTRES ===
const saveSettings = useCallback(async () => {
  if (isSaving) return;

  try {
    setIsSaving(true);
    
    // Sauvegarder dans AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    // Sauvegarder dans la base de données
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    const paramsToSave = [
      { cle: "nom_boutique", valeur: settings.nomBoutique },
      { cle: "devise_symbole", valeur: settings.deviseSymbole },
      { cle: "taux_tva", valeur: settings.tauxTVA.toString() },
      { cle: "seuil_stock_alerte", valeur: settings.seuilStockAlerte.toString() },
      { cle: "objectif_journalier", valeur: settings.objectifJournalier.toString() },
      { cle: "impression_automatique", valeur: settings.impressionAutomatique ? "1" : "0" },
    ];

    for (const param of paramsToSave) {
      await db.runAsync(
        `INSERT OR REPLACE INTO parametres_systeme (cle, valeur, updated_at)
         VALUES (?, ?, ?);`,
        [param.cle, param.valeur, new Date().toISOString()]
      );
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log("[SettingsContext] Paramètres sauvegardés");

  } catch (error) {
    console.error("[SettingsContext] Erreur sauvegarde:", error);
    throw new Error("Impossible de sauvegarder les paramètres.");
  } finally {
    setIsSaving(false);
  }
}, [settings, isSaving]);

// === METTRE À JOUR UN PARAMÈTRE ===
const updateSetting = useCallback(async <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  setSettings((prev) => ({
    ...prev,
    [key]: value,
  }));

  // Sauvegarder automatiquement
  await saveSettings();
}, [saveSettings]);

// === METTRE À JOUR PLUSIEURS PARAMÈTRES ===
const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  
  setSettings((prev) => ({
    ...prev,
    ...newSettings,
  }));

  await saveSettings();
}, [saveSettings]);// === RÉINITIALISER ===
const resetSettings = useCallback(async () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  
  setSettings(DEFAULT_SETTINGS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  
  // Réinitialiser dans la base
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  
  const defaultParams = [
    { cle: "nom_boutique", valeur: DEFAULT_SETTINGS.nomBoutique },
    { cle: "devise_symbole", valeur: DEFAULT_SETTINGS.deviseSymbole },
    { cle: "taux_tva", valeur: DEFAULT_SETTINGS.tauxTVA.toString() },
    { cle: "seuil_stock_alerte", valeur: DEFAULT_SETTINGS.seuilStockAlerte.toString() },
    { cle: "objectif_journalier", valeur: DEFAULT_SETTINGS.objectifJournalier.toString() },
    { cle: "impression_automatique", valeur: DEFAULT_SETTINGS.impressionAutomatique ? "1" : "0" },
  ];

  for (const param of defaultParams) {
    await db.runAsync(
      `INSERT OR REPLACE INTO parametres_systeme (cle, valeur, updated_at)
       VALUES (?, ?, ?);`,
      [param.cle, param.valeur, new Date().toISOString()]
    );
  }

  console.log("[SettingsContext] Paramètres réinitialisés");
}, []);

// === OBTENIR UN PARAMÈTRE ===
const getSetting = useCallback(<K extends keyof AppSettings>(key: K): AppSettings[K] => {
  return settings[key];
}, [settings]);

// === VÉRIFIER SI UN PARAMÈTRE EST ACTIVÉ ===
const isEnabled = useCallback((key: keyof AppSettings): boolean => {
  const value = settings[key];
  return typeof value === "boolean" ? value : false;
}, [settings]);  // === VALEURS ===
  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      updateSetting,
      updateSettings,
      resetSettings,
      loadSettings,
      saveSettings,
      getSetting,
      isEnabled,
    }),
    [
      settings,
      updateSetting,
      updateSettings,
      resetSettings,
      loadSettings,
      saveSettings,
      getSetting,
      isEnabled,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// === HOOK PERSONNALISÉ ===
export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettingsContext doit être utilisé à l'intérieur d'un SettingsProvider");
  }
  return context;
};

// === HOOKS SPÉCIFIQUES ===
export const useTheme = () => {
  const { settings } = useSettings();
  return {
    darkMode: settings.darkMode,
    colors: settings.darkMode ? {
      background: "#121212",
      card: "#1E1E1E",
      text: "#FFFFFF",
      border: "#333333",
    } : {
      background: "#F8F9FA",
      card: "#FFFFFF",
      text: "#333333",
      border: "#E0E0E0",
    },
  };
};

export const useCurrency = () => {
  const { settings } = useSettings();
  return {
    devise: settings.devise,
    symbole: settings.deviseSymbole,
    format: (amount: number) => {
      return `${settings.deviseSymbole}${amount.toFixed(settings.arrondi)}`;
    },
  };
};

export const usePrintSettings = () => {
  const { settings } = useSettings();
  return {
    papier: settings.papierImpression,
    copies: settings.copiesDefaut,
    autoPrint: settings.impressionAutomatique,
  };
};

// === EXPORT ===
export default SettingsProvider;