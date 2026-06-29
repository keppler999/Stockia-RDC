// ============================================
// 🔐 DÉFINITION DES PERMISSIONS
// ============================================

/**
 * Liste de toutes les permissions disponibles
 */
export const PERMISSIONS = {
  // === PERMISSIONS GÉNÉRALES ===
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_ANALYTICS: "view_analytics",
  VIEW_REPORTS: "view_reports",

  // === PERMISSIONS UTILISATEURS ===
  MANAGE_USERS: "manage_users",
  VIEW_USERS: "view_users",
  CREATE_USER: "create_user",
  UPDATE_USER: "update_user",
  DELETE_USER: "delete_user",
  ASSIGN_ROLE: "assign_role",

  // === PERMISSIONS PRODUITS ===
  MANAGE_PRODUCTS: "manage_products",
  VIEW_PRODUCTS: "view_products",
  CREATE_PRODUCT: "create_product",
  UPDATE_PRODUCT: "update_product",
  DELETE_PRODUCT: "delete_product",
  VIEW_PRODUCT_STOCK: "view_product_stock",

  // === PERMISSIONS STOCK ===
  MANAGE_STOCK: "manage_stock",
  VIEW_STOCK: "view_stock",
  ADJUST_STOCK: "adjust_stock",
  VIEW_STOCK_MOVEMENTS: "view_stock_movements",
  CREATE_STOCK_MOVEMENT: "create_stock_movement",
  VIEW_STOCK_ALERTS: "view_stock_alerts",

  // === PERMISSIONS VENTES ===
  CREATE_SALES: "create_sales",
  VIEW_SALES: "view_sales",
  VIEW_ALL_SALES: "view_all_sales",
  VIEW_OWN_SALES: "view_own_sales",
  CANCEL_SALE: "cancel_sale",
  REFUND_SALE: "refund_sale",
  PRINT_TICKET: "print_ticket",

  // === PERMISSIONS CLIENTS ===
  MANAGE_CLIENTS: "manage_clients",
  VIEW_CLIENTS: "view_clients",
  CREATE_CLIENT: "create_client",
  UPDATE_CLIENT: "update_client",
  DELETE_CLIENT: "delete_client",
  VIEW_CLIENT_DEBTS: "view_client_debts",
  MANAGE_CLIENT_DEBTS: "manage_client_debts",

  // === PERMISSIONS MAGASINS ===
  MANAGE_MAGASINS: "manage_magasins",
  VIEW_MAGASINS: "view_magasins",
  CREATE_MAGASIN: "create_magasin",
  UPDATE_MAGASIN: "update_magasin",
  DELETE_MAGASIN: "delete_magasin",

  // === PERMISSIONS SYSTÈME ===
  MANAGE_SYSTEM: "manage_system",
  VIEW_SYSTEM_LOGS: "view_system_logs",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  MANAGE_SETTINGS: "manage_settings",
  VIEW_SETTINGS: "view_settings",
  UPDATE_SETTINGS: "update_settings",

  // === PERMISSIONS LICENCE ===
  MANAGE_LICENCES: "manage_licences",
  VIEW_LICENCES: "view_licences",
  ACTIVATE_LICENCE: "activate_licence",
  REVOKE_LICENCE: "revoke_licence",

  // === PERMISSIONS SAUVEGARDE ===
  BACKUP_DATA: "backup_data",
  RESTORE_DATA: "restore_data",
  EXPORT_DATA: "export_data",
  IMPORT_DATA: "import_data",

  // === PERMISSIONS RAPPORTS ===
  GENERATE_REPORTS: "generate_reports",
  EXPORT_REPORTS: "export_reports",
  VIEW_FINANCIAL_REPORTS: "view_financial_reports",
} as const;

// ============================================
// 👤 DÉFINITION DES RÔLES
// ============================================

/**
 * Types de rôles disponibles
 */
export type UserRole = "ADMIN" | "GERANT" | "CAISSIER" | "MAGASINIER";

/**
 * Labels des rôles
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  GERANT: "Gérant",
  CAISSIER: "Caissier",
  MAGASINIER: "Magasinier",
};

/**
 * Icônes des rôles
 */
export const ROLE_ICONS: Record<
  UserRole,
  keyof typeof import("@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json")
> = {
  ADMIN: "shield-checkmark",
  GERANT: "business",
  CAISSIER: "cash",
  MAGASINIER: "cube",
};

/**
 * Couleurs des rôles
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "#C62828",
  GERANT: "#1565C0",
  CAISSIER: "#2E7D32",
  MAGASINIER: "#EF6C00",
};

/**
 * Niveau de priorité des rôles (plus élevé = plus de privilèges)
 */
export const ROLE_PRIORITY: Record<UserRole, number> = {
  ADMIN: 100,
  GERANT: 80,
  CAISSIER: 60,
  MAGASINIER: 50,
};

/**
 * Description des rôles
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: "Accès complet à toutes les fonctionnalités et paramètres",
  GERANT: "Gestion complète des opérations, accès aux rapports",
  CAISSIER: "Gestion des ventes, clients et impression de tickets",
  MAGASINIER: "Gestion du stock, inventaire et approvisionnement",
};

/**
 * Hiérarchie des rôles (pour la comparaison)
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  ADMIN: ["ADMIN", "GERANT", "CAISSIER", "MAGASINIER"],
  GERANT: ["GERANT", "CAISSIER", "MAGASINIER"],
  CAISSIER: ["CAISSIER"],
  MAGASINIER: ["MAGASINIER"],
}; // ============================================
// 📋 MATRICE DES PERMISSIONS PAR RÔLE
// ============================================

/**
 * Toutes les permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    // Toutes les permissions
    "*",

    // Général
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_REPORTS,

    // Utilisateurs
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.ASSIGN_ROLE,

    // Produits
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.UPDATE_PRODUCT,
    PERMISSIONS.DELETE_PRODUCT,
    PERMISSIONS.VIEW_PRODUCT_STOCK,

    // Stock
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.ADJUST_STOCK,
    PERMISSIONS.VIEW_STOCK_MOVEMENTS,
    PERMISSIONS.CREATE_STOCK_MOVEMENT,
    PERMISSIONS.VIEW_STOCK_ALERTS,

    // Ventes
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.VIEW_ALL_SALES,
    PERMISSIONS.VIEW_OWN_SALES,
    PERMISSIONS.CANCEL_SALE,
    PERMISSIONS.REFUND_SALE,
    PERMISSIONS.PRINT_TICKET,

    // Clients
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_CLIENT,
    PERMISSIONS.UPDATE_CLIENT,
    PERMISSIONS.DELETE_CLIENT,
    PERMISSIONS.VIEW_CLIENT_DEBTS,
    PERMISSIONS.MANAGE_CLIENT_DEBTS,

    // Magasins
    PERMISSIONS.MANAGE_MAGASINS,
    PERMISSIONS.VIEW_MAGASINS,
    PERMISSIONS.CREATE_MAGASIN,
    PERMISSIONS.UPDATE_MAGASIN,
    PERMISSIONS.DELETE_MAGASIN,

    // Système
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_SYSTEM_LOGS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.UPDATE_SETTINGS,

    // Licence
    PERMISSIONS.MANAGE_LICENCES,
    PERMISSIONS.VIEW_LICENCES,
    PERMISSIONS.ACTIVATE_LICENCE,
    PERMISSIONS.REVOKE_LICENCE,

    // Sauvegarde
    PERMISSIONS.BACKUP_DATA,
    PERMISSIONS.RESTORE_DATA,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.IMPORT_DATA,

    // Rapports
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
  ],

  GERANT: [
    // Général
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_REPORTS,

    // Produits
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.UPDATE_PRODUCT,
    PERMISSIONS.VIEW_PRODUCT_STOCK,

    // Stock
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.ADJUST_STOCK,
    PERMISSIONS.VIEW_STOCK_MOVEMENTS,
    PERMISSIONS.CREATE_STOCK_MOVEMENT,
    PERMISSIONS.VIEW_STOCK_ALERTS,

    // Ventes
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.VIEW_ALL_SALES,
    PERMISSIONS.VIEW_OWN_SALES,
    PERMISSIONS.CANCEL_SALE,
    PERMISSIONS.REFUND_SALE,
    PERMISSIONS.PRINT_TICKET,

    // Clients
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_CLIENT,
    PERMISSIONS.UPDATE_CLIENT,
    PERMISSIONS.DELETE_CLIENT,
    PERMISSIONS.VIEW_CLIENT_DEBTS,
    PERMISSIONS.MANAGE_CLIENT_DEBTS,

    // Système
    PERMISSIONS.VIEW_SYSTEM_LOGS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.UPDATE_SETTINGS,

    // Sauvegarde
    PERMISSIONS.BACKUP_DATA,
    PERMISSIONS.RESTORE_DATA,
    PERMISSIONS.EXPORT_DATA,

    // Rapports
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
  ],

  CAISSIER: [
    // Général
    PERMISSIONS.VIEW_DASHBOARD,

    // Produits
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCT_STOCK,

    // Stock
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.VIEW_STOCK_MOVEMENTS,
    PERMISSIONS.VIEW_STOCK_ALERTS,

    // Ventes
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.VIEW_OWN_SALES,
    PERMISSIONS.PRINT_TICKET,

    // Clients
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_CLIENT,
    PERMISSIONS.UPDATE_CLIENT,
    PERMISSIONS.VIEW_CLIENT_DEBTS,

    // Système
    PERMISSIONS.VIEW_SETTINGS,
  ],

  MAGASINIER: [
    // Général
    PERMISSIONS.VIEW_DASHBOARD,

    // Produits
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCT_STOCK,

    // Stock
    PERMISSIONS.MANAGE_STOCK,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.ADJUST_STOCK,
    PERMISSIONS.VIEW_STOCK_MOVEMENTS,
    PERMISSIONS.CREATE_STOCK_MOVEMENT,
    PERMISSIONS.VIEW_STOCK_ALERTS,

    // Système
    PERMISSIONS.VIEW_SETTINGS,
  ],
};

// ============================================
// 📂 GROUPES DE PERMISSIONS
// ============================================

/**
 * Groupes de permissions pour une meilleure organisation
 */
export const PERMISSION_GROUPS = {
  DASHBOARD: {
    label: "Tableau de bord",
    icon: "home",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.VIEW_REPORTS,
    ],
  },
  USERS: {
    label: "Utilisateurs",
    icon: "people",
    permissions: [
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.CREATE_USER,
      PERMISSIONS.UPDATE_USER,
      PERMISSIONS.DELETE_USER,
      PERMISSIONS.ASSIGN_ROLE,
    ],
  },
  PRODUCTS: {
    label: "Produits",
    icon: "cube",
    permissions: [
      PERMISSIONS.MANAGE_PRODUCTS,
      PERMISSIONS.VIEW_PRODUCTS,
      PERMISSIONS.CREATE_PRODUCT,
      PERMISSIONS.UPDATE_PRODUCT,
      PERMISSIONS.DELETE_PRODUCT,
      PERMISSIONS.VIEW_PRODUCT_STOCK,
    ],
  },
  STOCK: {
    label: "Stock",
    icon: "archive",
    permissions: [
      PERMISSIONS.MANAGE_STOCK,
      PERMISSIONS.VIEW_STOCK,
      PERMISSIONS.ADJUST_STOCK,
      PERMISSIONS.VIEW_STOCK_MOVEMENTS,
      PERMISSIONS.CREATE_STOCK_MOVEMENT,
      PERMISSIONS.VIEW_STOCK_ALERTS,
    ],
  },
  SALES: {
    label: "Ventes",
    icon: "cash",
    permissions: [
      PERMISSIONS.CREATE_SALES,
      PERMISSIONS.VIEW_SALES,
      PERMISSIONS.VIEW_ALL_SALES,
      PERMISSIONS.VIEW_OWN_SALES,
      PERMISSIONS.CANCEL_SALE,
      PERMISSIONS.REFUND_SALE,
      PERMISSIONS.PRINT_TICKET,
    ],
  },
  CLIENTS: {
    label: "Clients",
    icon: "people-circle",
    permissions: [
      PERMISSIONS.MANAGE_CLIENTS,
      PERMISSIONS.VIEW_CLIENTS,
      PERMISSIONS.CREATE_CLIENT,
      PERMISSIONS.UPDATE_CLIENT,
      PERMISSIONS.DELETE_CLIENT,
      PERMISSIONS.VIEW_CLIENT_DEBTS,
      PERMISSIONS.MANAGE_CLIENT_DEBTS,
    ],
  },
  MAGASINS: {
    label: "Magasins",
    icon: "business",
    permissions: [
      PERMISSIONS.MANAGE_MAGASINS,
      PERMISSIONS.VIEW_MAGASINS,
      PERMISSIONS.CREATE_MAGASIN,
      PERMISSIONS.UPDATE_MAGASIN,
      PERMISSIONS.DELETE_MAGASIN,
    ],
  },
  SYSTEM: {
    label: "Système",
    icon: "settings",
    permissions: [
      PERMISSIONS.MANAGE_SYSTEM,
      PERMISSIONS.VIEW_SYSTEM_LOGS,
      PERMISSIONS.VIEW_AUDIT_LOGS,
      PERMISSIONS.MANAGE_SETTINGS,
      PERMISSIONS.VIEW_SETTINGS,
      PERMISSIONS.UPDATE_SETTINGS,
    ],
  },
  LICENCE: {
    label: "Licence",
    icon: "key",
    permissions: [
      PERMISSIONS.MANAGE_LICENCES,
      PERMISSIONS.VIEW_LICENCES,
      PERMISSIONS.ACTIVATE_LICENCE,
      PERMISSIONS.REVOKE_LICENCE,
    ],
  },
  BACKUP: {
    label: "Sauvegarde",
    icon: "cloud",
    permissions: [
      PERMISSIONS.BACKUP_DATA,
      PERMISSIONS.RESTORE_DATA,
      PERMISSIONS.EXPORT_DATA,
      PERMISSIONS.IMPORT_DATA,
    ],
  },
  REPORTS: {
    label: "Rapports",
    icon: "document-text",
    permissions: [
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.EXPORT_REPORTS,
      PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    ],
  },
} as const; // ============================================
// 🔍 FONCTIONS DE PERMISSIONS
// ============================================

/**
 * Vérifie si un rôle a une permission spécifique
 */
export const hasPermission = (
  role: UserRole | null | undefined,
  permission: string,
  permissionsMap: Record<UserRole, string[]> = ROLE_PERMISSIONS,
): boolean => {
  if (!role) return false;
  const rolePermissions = permissionsMap[role] || [];
  return rolePermissions.includes("*") || rolePermissions.includes(permission);
};

/**
 * Vérifie si un utilisateur a une permission
 */
export const userHasPermission = (
  user: { role: UserRole } | null | undefined,
  permission: string,
): boolean => {
  if (!user) return false;
  return hasPermission(user.role, permission);
};

/**
 * Vérifie si un utilisateur a plusieurs permissions (AND)
 */
export const userHasAllPermissions = (
  user: { role: UserRole } | null | undefined,
  permissions: string[],
): boolean => {
  if (!user) return false;
  return permissions.every((p) => hasPermission(user.role, p));
};

/**
 * Vérifie si un utilisateur a au moins une permission (OR)
 */
export const userHasAnyPermission = (
  user: { role: UserRole } | null | undefined,
  permissions: string[],
): boolean => {
  if (!user) return false;
  return permissions.some((p) => hasPermission(user.role, p));
};

/**
 * Récupère toutes les permissions d'un rôle
 */
export const getRolePermissions = (role: UserRole): string[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Récupère les permissions d'un utilisateur
 */
export const getUserPermissions = (
  user: { role: UserRole } | null | undefined,
): string[] => {
  if (!user) return [];
  return getRolePermissions(user.role);
};

/**
 * Vérifie si un rôle peut accéder à une ressource
 */
export const canAccessResource = (
  userRole: UserRole | null | undefined,
  resource: string,
  action: "create" | "read" | "update" | "delete" | "manage",
): boolean => {
  const permission = `${action}_${resource}`;
  return hasPermission(userRole, permission);
};

/**
 * Vérifie si un utilisateur est un administrateur
 */
export const isAdmin = (
  user: { role: UserRole } | null | undefined,
): boolean => {
  return user?.role === "ADMIN";
};

/**
 * Vérifie si un utilisateur est un gérant
 */
export const isGerant = (
  user: { role: UserRole } | null | undefined,
): boolean => {
  return user?.role === "GERANT";
};

/**
 * Vérifie si un utilisateur est un caissier
 */
export const isCaissier = (
  user: { role: UserRole } | null | undefined,
): boolean => {
  return user?.role === "CAISSIER";
};

/**
 * Vérifie si un utilisateur est un magasinier
 */
export const isMagasinier = (
  user: { role: UserRole } | null | undefined,
): boolean => {
  return user?.role === "MAGASINIER";
};

/**
 * Vérifie si un utilisateur a un rôle de direction (Admin ou Gérant)
 */
export const isManagement = (
  user: { role: UserRole } | null | undefined,
): boolean => {
  if (!user) return false;
  return user.role === "ADMIN" || user.role === "GERANT";
};

/**
 * Vérifie si un utilisateur a un rôle de vente (Caissier)
 */
export const isSales = (
  user: { role: UserRole } | null | undefined,
): boolean => {
  if (!user) return false;
  return user.role === "CAISSIER";
};

/**
 * Vérifie si un utilisateur a un rôle de stock (Magasinier)
 */
export const isStock = (
  user: { role: UserRole } | null | undefined,
): boolean => {
  if (!user) return false;
  return user.role === "MAGASINIER";
}; // ============================================
// ⚖️ FONCTIONS DE COMPARAISON
// ============================================

/**
 * Compare deux rôles (retourne true si role1 >= role2 en termes de privilèges)
 */
export const hasHigherOrEqualRole = (
  role1: UserRole | null | undefined,
  role2: UserRole | null | undefined,
): boolean => {
  if (!role1 || !role2) return false;
  const hierarchy = ROLE_HIERARCHY[role1] || [];
  return hierarchy.includes(role2);
};

/**
 * Vérifie si un utilisateur peut gérer un autre utilisateur
 */
export const canManageUser = (
  currentUser: { role: UserRole } | null | undefined,
  targetUser: { role: UserRole } | null | undefined,
): boolean => {
  if (!currentUser || !targetUser) return false;
  // Admin peut gérer tout le monde, Gérant peut gérer Caissier et Magasinier
  if (currentUser.role === "ADMIN") return true;
  if (currentUser.role === "GERANT") {
    return targetUser.role === "CAISSIER" || targetUser.role === "MAGASINIER";
  }
  return false;
};

/**
 * Vérifie si un utilisateur peut voir les données d'un autre utilisateur
 */
export const canViewUserData = (
  currentUser: { role: UserRole; id: number } | null | undefined,
  targetUserId: number,
): boolean => {
  if (!currentUser) return false;
  // Admin peut voir tout le monde, Gérant peut voir tout le monde,
  // Caissier et Magasinier ne peuvent voir que leurs propres données
  if (currentUser.role === "ADMIN" || currentUser.role === "GERANT")
    return true;
  return currentUser.id === targetUserId;
};

/**
 * Récupère le niveau de priorité d'un rôle
 */
export const getRolePriority = (role: UserRole): number => {
  return ROLE_PRIORITY[role] || 0;
};

/**
 * Compare deux utilisateurs par leur rôle
 */
export const compareRoles = (
  user1: { role: UserRole } | null | undefined,
  user2: { role: UserRole } | null | undefined,
): number => {
  if (!user1 || !user2) return 0;
  return getRolePriority(user1.role) - getRolePriority(user2.role);
}; // ============================================
// 🔎 FONCTIONS DE FILTRAGE
// ============================================

/**
 * Filtre une liste d'éléments par permission
 */
export const filterByPermission = <T extends { id: number | string }>(
  items: T[],
  user: { role: UserRole } | null | undefined,
  permission: string,
): T[] => {
  if (hasPermission(user?.role, permission)) {
    return items;
  }
  // Si l'utilisateur n'a pas la permission, retourner un tableau vide ou filtrer
  return [];
};

/**
 * Filtre une liste d'utilisateurs par rôle
 */
export const filterUsersByRole = (
  users: { role: UserRole }[],
  role: UserRole | UserRole[],
): { role: UserRole }[] => {
  const roles = Array.isArray(role) ? role : [role];
  return users.filter((user) => roles.includes(user.role));
};

/**
 * Récupère les utilisateurs qu'un utilisateur peut gérer
 */
export const getManageableUsers = (
  currentUser: { role: UserRole } | null | undefined,
  allUsers: { role: UserRole }[],
): { role: UserRole }[] => {
  if (!currentUser) return [];
  if (currentUser.role === "ADMIN") return allUsers;
  if (currentUser.role === "GERANT") {
    return allUsers.filter(
      (user) => user.role === "CAISSIER" || user.role === "MAGASINIER",
    );
  }
  return [];
};

/**
 * Vérifie si un utilisateur a accès à un module
 */
export const hasModuleAccess = (
  user: { role: UserRole } | null | undefined,
  module: string,
): boolean => {
  const modulePermissions: Record<string, string[]> = {
    dashboard: [PERMISSIONS.VIEW_DASHBOARD],
    analytics: [PERMISSIONS.VIEW_ANALYTICS],
    reports: [PERMISSIONS.VIEW_REPORTS],
    users: [PERMISSIONS.VIEW_USERS, PERMISSIONS.MANAGE_USERS],
    products: [PERMISSIONS.VIEW_PRODUCTS, PERMISSIONS.MANAGE_PRODUCTS],
    stock: [PERMISSIONS.VIEW_STOCK, PERMISSIONS.MANAGE_STOCK],
    sales: [PERMISSIONS.VIEW_SALES, PERMISSIONS.CREATE_SALES],
    clients: [PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.MANAGE_CLIENTS],
    settings: [PERMISSIONS.VIEW_SETTINGS, PERMISSIONS.MANAGE_SETTINGS],
    licence: [PERMISSIONS.VIEW_LICENCES, PERMISSIONS.MANAGE_LICENCES],
    backup: [PERMISSIONS.BACKUP_DATA, PERMISSIONS.RESTORE_DATA],
  };

  const permissions = modulePermissions[module] || [];
  return userHasAnyPermission(user, permissions);
};

// ============================================
// 📦 EXPORT PRINCIPAL
// ============================================

export default {
  // Permissions
  PERMISSIONS,

  // Rôles
  UserRole,
  ROLE_LABELS,
  ROLE_ICONS,
  ROLE_COLORS,
  ROLE_PRIORITY,
  ROLE_DESCRIPTIONS,
  ROLE_HIERARCHY,

  // Matrice
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,

  // Fonctions de permissions
  hasPermission,
  userHasPermission,
  userHasAllPermissions,
  userHasAnyPermission,
  getRolePermissions,
  getUserPermissions,
  canAccessResource,

  // Fonctions de rôle
  isAdmin,
  isGerant,
  isCaissier,
  isMagasinier,
  isManagement,
  isSales,
  isStock,

  // Fonctions de comparaison
  hasHigherOrEqualRole,
  canManageUser,
  canViewUserData,
  getRolePriority,
  compareRoles,

  // Fonctions de filtrage
  filterByPermission,
  filterUsersByRole,
  getManageableUsers,
  hasModuleAccess,
};
