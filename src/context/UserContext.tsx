import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

// === CONSTANTES ===
const DATABASE_NAME = "stockia_secure.db";
const STORAGE_KEYS = {
  USER_SESSION: "@stockia_user",
  USER_TOKEN: "@stockia_token",
  PRINT_ENABLED: "@stockia_print_enabled",
  BLOCKED_STATUS: "@stockia_blocked_status",
  LAST_LOGIN: "@stockia_last_login",
  APP_THEME: "@stockia_theme",
  NOTIFICATIONS: "@stockia_notifications",
  AUTO_BACKUP: "@stockia_auto_backup",
};

// === INTERFACES ===
export interface UserSession {
  id: number;
  nom: string;
  username: string;
  email?: string;
  role: "ADMIN" | "GERANT" | "CAISSIER" | "MAGASINIER";
  avatar?: string;
  magasin_id?: number;
  magasin_nom?: string;
  permissions?: string[];
  derniere_connexion?: string;
}

export interface AppSettings {
  printEnabled: boolean;
  darkMode: boolean;
  notifications: boolean;
  autoBackup: boolean;
  devise: string;
  nomBoutique: string;
}

export interface LicenceInfo {
  statut: "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING";
  dateActivation?: string;
  dateExpiration?: string;
  joursRestants?: number;
  nomTitulaire?: string;
  emailTitulaire?: string;
}

export interface UserContextType {
  // Utilisateur
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  isLoading: boolean;

  // Authentification
  login: (username: string, password: string) => Promise<UserSession>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  updateUser: (updates: Partial<UserSession>) => Promise<void>;

  // Permissions
  hasPermission: (permission: string) => boolean;
  isAuthenticated: boolean;
  userRole: UserSession["role"] | null;

  // Paramètres
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  printEnabled: boolean;
  setPrintEnabled: (enabled: boolean) => void;

  // Licence
  licence: LicenceInfo | null;
  checkLicence: () => Promise<boolean>;
  blocked: boolean;
  setBlocked: (blocked: boolean) => void;

  // Utilitaires
  lastLogin: string | null;
  deviceId: string;
}
export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  // === ÉTATS PRINCIPAUX ===
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [blocked, setBlocked] = useState<boolean>(false);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>("UNKNOWN");
  const [licence, setLicence] = useState<LicenceInfo | null>(null);

  // === ÉTATS PARAMÈTRES ===
  const [settings, setSettings] = useState<AppSettings>({
    printEnabled: false,
    darkMode: false,
    notifications: true,
    autoBackup: false,
    devise: "USD",
    nomBoutique: "Stockia Store",
  });

  // === PERMISSIONS PAR RÔLE ===
  const ROLE_PERMISSIONS: Record<UserSession["role"], string[]> = {
    ADMIN: [
      "*", // Super admin - toutes les permissions
      "manage_users",
      "manage_products",
      "manage_inventory",
      "view_reports",
      "manage_magasins",
      "manage_system",
      "create_sales",
      "view_all_sales",
      "manage_stock",
      "view_analytics",
      "manage_settings",
      "view_audit_logs",
    ],
    GERANT: [
      "manage_products",
      "manage_inventory",
      "view_reports",
      "create_sales",
      "view_all_sales",
      "manage_stock",
      "view_analytics",
      "manage_settings",
      "manage_clients",
    ],
    CAISSIER: [
      "create_sales",
      "view_own_sales",
      "manage_stock",
      "view_clients",
      "create_clients",
      "print_tickets",
    ],
    MAGASINIER: [
      "manage_inventory",
      "manage_stock",
      "view_products",
      "create_mouvements",
      "view_stock_reports",
    ],
  };

  // === INITIALISATION ===
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);

      // 1. Récupérer l'ID de l'appareil
      await getDeviceId();

      // 2. Charger la session utilisateur
      await loadSession();

      // 3. Charger les paramètres
      await loadSettings();

      // 4. Vérifier la licence
      await checkLicence();

      // 5. Vérifier la validité de la session
      if (user) {
        await checkSessionValidity();
      }
    } catch (error) {
      console.error("[UserContext] Erreur d'initialisation:", error);
    } finally {
      setIsLoading(false);
    }
  }; // === GESTION DE L'APPAREIL ===
  const getDeviceId = async () => {
    try {
      // Tentative de récupération d'un ID unique
      let id = await AsyncStorage.getItem("@stockia_device_id");
      if (!id) {
        // Générer un ID si inexistant
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        id = `STK-${timestamp}-${random}`;
        await AsyncStorage.setItem("@stockia_device_id", id);
      }
      setDeviceId(id);
    } catch (error) {
      console.error("[UserContext] Erreur device ID:", error);
      setDeviceId(`STK-${Date.now().toString(36)}`);
    }
  };

  // === CHARGEMENT DE LA SESSION ===
  const loadSession = async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }

      const lastLoginData = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOGIN);
      if (lastLoginData) {
        setLastLogin(lastLoginData);
      }

      const blockedData = await AsyncStorage.getItem(
        STORAGE_KEYS.BLOCKED_STATUS,
      );
      if (blockedData) {
        setBlocked(JSON.parse(blockedData));
      }
    } catch (error) {
      console.error("[UserContext] Erreur chargement session:", error);
    }
  };

  // === CHARGEMENT DES PARAMÈTRES ===
  const loadSettings = async () => {
    try {
      const printData = await AsyncStorage.getItem(STORAGE_KEYS.PRINT_ENABLED);
      const themeData = await AsyncStorage.getItem(STORAGE_KEYS.APP_THEME);
      const notifData = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const backupData = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_BACKUP);

      // Charger la devise et le nom depuis la DB
      let devise = "USD";
      let nomBoutique = "Stockia Store";

      try {
        const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        const deviseResult = await db.getFirstAsync<{ valeur: string }>(
          "SELECT valeur FROM parametres_systeme WHERE cle = 'devise_symbole';",
        );
        if (deviseResult) devise = deviseResult.valeur;

        const boutiqueResult = await db.getFirstAsync<{ valeur: string }>(
          "SELECT valeur FROM parametres_systeme WHERE cle = 'nom_boutique';",
        );
        if (boutiqueResult) nomBoutique = boutiqueResult.valeur;
      } catch (dbError) {
        console.warn("[UserContext] Erreur lecture paramètres DB:", dbError);
      }

      setSettings({
        printEnabled: printData ? JSON.parse(printData) : false,
        darkMode: themeData ? JSON.parse(themeData) : false,
        notifications: notifData ? JSON.parse(notifData) : true,
        autoBackup: backupData ? JSON.parse(backupData) : false,
        devise,
        nomBoutique,
      });
    } catch (error) {
      console.error("[UserContext] Erreur chargement paramètres:", error);
    }
  };

  // === VÉRIFICATION DE LA SESSION ===
  const checkSessionValidity = async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (!token) return false;

      // Vérifier la session en base de données
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const session = await db.getFirstAsync<{
        actif: number;
        date_fin: string;
      }>(
        "SELECT actif, date_fin FROM sessions WHERE token = ? AND actif = 1;",
        [token],
      );

      if (!session) {
        await logout();
        return false;
      }

      // Vérifier l'expiration
      if (session.date_fin && new Date(session.date_fin) < new Date()) {
        await logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("[UserContext] Erreur vérification session:", error);
      return false;
    }
  }; // === CONNEXION ===
  const login = useCallback(
    async (username: string, password: string): Promise<UserSession> => {
      try {
        const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

        // 1. Vérifier les identifiants
        const userResult = await db.getFirstAsync<{
          id: number;
          nom: string;
          username: string;
          role: string;
          email?: string;
          avatar?: string;
          magasin_id?: number;
          password: string;
        }>(
          "SELECT id, nom, username, role, email, avatar, magasin_id, password FROM utilisateurs WHERE username = ? AND actif = 1;",
          [username.trim()],
        );

        if (!userResult) {
          throw new Error("Identifiants invalides.");
        }

        // 2. Vérifier le mot de passe (hash en production)
        const isValidPassword = userResult.password === password;
        if (!isValidPassword) {
          throw new Error("Identifiants invalides.");
        }

        // 3. Créer la session utilisateur
        const sessionUser: UserSession = {
          id: userResult.id,
          nom: userResult.nom,
          username: userResult.username,
          role: userResult.role as UserSession["role"],
          email: userResult.email,
          avatar: userResult.avatar,
          magasin_id: userResult.magasin_id,
          permissions:
            ROLE_PERMISSIONS[userResult.role as UserSession["role"]] || [],
          derniere_connexion: new Date().toISOString(),
        };

        // 4. Générer un token
        const token = `stk_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

        // 5. Sauvegarder la session
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_SESSION,
          JSON.stringify(sessionUser),
        );
        await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
        await AsyncStorage.setItem(
          STORAGE_KEYS.LAST_LOGIN,
          new Date().toISOString(),
        );
        await AsyncStorage.removeItem(STORAGE_KEYS.BLOCKED_STATUS);

        // 6. Enregistrer en base
        await db.runAsync(
          `INSERT INTO sessions (utilisateur_id, token, date_debut, date_fin, actif)
       VALUES (?, ?, ?, ?, 1);`,
          [
            userResult.id,
            token,
            new Date().toISOString(),
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          ],
        );

        // 7. Mettre à jour la dernière connexion
        await db.runAsync(
          "UPDATE utilisateurs SET derniere_connexion = ? WHERE id = ?;",
          [new Date().toISOString(), userResult.id],
        );

        setUser(sessionUser);
        setLastLogin(new Date().toISOString());
        setBlocked(false);

        return sessionUser;
      } catch (error: any) {
        console.error("[UserContext] Erreur login:", error);
        throw new Error(error.message || "Erreur de connexion.");
      }
    },
    [],
  );

  // === DÉCONNEXION ===
  const logout = useCallback(async (): Promise<void> => {
    try {
      // 1. Supprimer le token de la base
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (token) {
        const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        await db.runAsync(
          "UPDATE sessions SET actif = 0, date_fin = ? WHERE token = ?;",
          [new Date().toISOString(), token],
        );
      }

      // 2. Supprimer les données locales
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_SESSION,
        STORAGE_KEYS.USER_TOKEN,
        STORAGE_KEYS.LAST_LOGIN,
      ]);

      setUser(null);
      setLastLogin(null);
    } catch (error) {
      console.error("[UserContext] Erreur logout:", error);
      // Même en cas d'erreur, on nettoie
      setUser(null);
    }
  }, []);

  // === VÉRIFICATION DE SESSION ===
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);

      if (!userData || !token) return false;

      return await checkSessionValidity();
    } catch (error) {
      console.error("[UserContext] Erreur checkSession:", error);
      return false;
    }
  }, []); // === MISE À JOUR DE L'UTILISATEUR ===
  const updateUser = useCallback(
    async (updates: Partial<UserSession>): Promise<void> => {
      if (!user) return;

      try {
        const updatedUser = { ...user, ...updates };
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_SESSION,
          JSON.stringify(updatedUser),
        );
        setUser(updatedUser);

        // Mettre à jour en base
        const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        const fields: string[] = [];
        const values: any[] = [];

        Object.entries(updates).forEach(([key, value]) => {
          if (key !== "id" && key !== "role" && key !== "permissions") {
            fields.push(`${key} = ?`);
            values.push(value);
          }
        });

        if (fields.length > 0) {
          values.push(user.id);
          await db.runAsync(
            `UPDATE utilisateurs SET ${fields.join(", ")} WHERE id = ?;`,
            values,
          );
        }
      } catch (error) {
        console.error("[UserContext] Erreur updateUser:", error);
        throw error;
      }
    },
    [user],
  );

  // === MISE À JOUR DES PARAMÈTRES ===
  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>): Promise<void> => {
      try {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);

        // Sauvegarder chaque paramètre modifié
        const savePromises: Promise<void>[] = [];

        if (newSettings.printEnabled !== undefined) {
          savePromises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.PRINT_ENABLED,
              JSON.stringify(newSettings.printEnabled),
            ),
          );
        }
        if (newSettings.darkMode !== undefined) {
          savePromises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.APP_THEME,
              JSON.stringify(newSettings.darkMode),
            ),
          );
        }
        if (newSettings.notifications !== undefined) {
          savePromises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.NOTIFICATIONS,
              JSON.stringify(newSettings.notifications),
            ),
          );
        }
        if (newSettings.autoBackup !== undefined) {
          savePromises.push(
            AsyncStorage.setItem(
              STORAGE_KEYS.AUTO_BACKUP,
              JSON.stringify(newSettings.autoBackup),
            ),
          );
        }

        await Promise.all(savePromises);

        // Mettre à jour la devise en base
        if (newSettings.devise) {
          const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
          await db.runAsync(
            "UPDATE parametres_systeme SET valeur = ? WHERE cle = 'devise_symbole';",
            [newSettings.devise],
          );
        }

        if (newSettings.nomBoutique) {
          const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
          await db.runAsync(
            "UPDATE parametres_systeme SET valeur = ? WHERE cle = 'nom_boutique';",
            [newSettings.nomBoutique],
          );
        }
      } catch (error) {
        console.error("[UserContext] Erreur updateSettings:", error);
        throw error;
      }
    },
    [settings],
  );

  // === VÉRIFICATION DES PERMISSIONS ===
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      const permissions = user.permissions || ROLE_PERMISSIONS[user.role] || [];
      return permissions.includes("*") || permissions.includes(permission);
    },
    [user],
  ); // === VÉRIFICATION DE LA LICENCE ===
  const checkLicence = useCallback(async (): Promise<boolean> => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const licenceResult = await db.getFirstAsync<{
        cle_licence: string;
        device_fingerprint: string;
        date_activation: string;
        date_expiration: string;
        statut: string;
      }>("SELECT * FROM licences WHERE device_fingerprint = ?;", [deviceId]);

      if (!licenceResult) {
        setLicence({ statut: "PENDING" });
        setBlocked(true);
        return false;
      }

      const now = new Date();
      const expiration = new Date(licenceResult.date_expiration);
      const joursRestants = Math.ceil(
        (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const licenceInfo: LicenceInfo = {
        statut: licenceResult.statut as LicenceInfo["statut"],
        dateActivation: licenceResult.date_activation,
        dateExpiration: licenceResult.date_expiration,
        joursRestants: joursRestants > 0 ? joursRestants : 0,
      };

      setLicence(licenceInfo);

      // Si licence expirée ou révoquée
      if (
        licenceResult.statut === "EXPIRED" ||
        licenceResult.statut === "REVOKED"
      ) {
        setBlocked(true);
        return false;
      }

      if (joursRestants <= 0) {
        await db.runAsync(
          "UPDATE licences SET statut = 'EXPIRED' WHERE device_fingerprint = ?;",
          [deviceId],
        );
        setBlocked(true);
        return false;
      }

      // Licence valide
      setBlocked(false);
      return true;
    } catch (error) {
      console.error("[UserContext] Erreur checkLicence:", error);
      // En cas d'erreur, on bloque par sécurité
      setBlocked(true);
      return false;
    }
  }, [deviceId]);

  // === ACTIVATION DE LA LICENCE ===
  const activateLicence = useCallback(
    async (cleLicence: string): Promise<boolean> => {
      try {
        const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

        // Vérifier si la licence existe
        const existing = await db.getFirstAsync<{ id: number }>(
          "SELECT id FROM licences WHERE cle_licence = ?;",
          [cleLicence],
        );

        if (!existing) {
          throw new Error("Clé de licence invalide.");
        }

        // Mettre à jour avec le fingerprint de l'appareil
        await db.runAsync(
          `UPDATE licences 
       SET device_fingerprint = ?, date_activation = ?, statut = 'ACTIVE', 
           derniere_utilisation = ?, temps_utilisation_total = 0
       WHERE cle_licence = ?;`,
          [
            deviceId,
            new Date().toISOString(),
            new Date().toISOString(),
            cleLicence,
          ],
        );

        // Re-vérifier la licence
        await checkLicence();
        return true;
      } catch (error) {
        console.error("[UserContext] Erreur activation licence:", error);
        throw error;
      }
    },
    [deviceId, checkLicence],
  ); // === VALEURS MÉMOISÉES ===
  const contextValue = useMemo<UserContextType>(
    () => ({
      // Utilisateur
      user,
      setUser,
      isLoading,

      // Authentification
      login,
      logout,
      checkSession,
      updateUser,

      // Permissions
      hasPermission,
      isAuthenticated: !!user,
      userRole: user?.role || null,

      // Paramètres
      settings,
      updateSettings,
      printEnabled: settings.printEnabled,
      setPrintEnabled: (enabled: boolean) => {
        setSettings((prev) => ({ ...prev, printEnabled: enabled }));
        AsyncStorage.setItem(
          STORAGE_KEYS.PRINT_ENABLED,
          JSON.stringify(enabled),
        );
      },

      // Licence
      licence,
      checkLicence,
      blocked,
      setBlocked,

      // Utilitaires
      lastLogin,
      deviceId,
    }),
    [
      user,
      isLoading,
      login,
      logout,
      checkSession,
      updateUser,
      hasPermission,
      settings,
      updateSettings,
      licence,
      blocked,
      lastLogin,
      deviceId,
    ],
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

// === HOOK PERSONNALISÉ ===
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error(
      "useUser doit être utilisé à l'intérieur d'un UserProvider",
    );
  }
  return context;
}

export default UserContext;
