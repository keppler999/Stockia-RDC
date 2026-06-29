// ============================================
// 🧭 TYPES DE BASE DE LA NAVIGATION
// ============================================

import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

/**
 * Paramètres du stack navigator principal
 */
export type RootStackParamList = {
  /** Écran de connexion */
  Login: undefined;
  /** Écran de licence bloquée */
  LicenceBlock: undefined;
  /** Écran principal avec les onglets */
  MainTabs: undefined;
  /** Écran de tableau de bord */
  Dashboard: undefined;
  /** Écran de caisse */
  Caisse: undefined;
  /** Écran de gestion de stock */
  Stock: undefined;
  /** Écran d'analytique */
  Analytics: undefined;
  /** Écran des paramètres */
  Settings: undefined;
  /** Écran de gestion des produits */
  ProductManagement: {
    productId?: number;
    mode?: "view" | "edit" | "create";
  };
  /** Écran de gestion des clients */
  ClientManagement: {
    clientId?: number;
    mode?: "view" | "edit" | "create";
  };
  /** Écran de gestion des utilisateurs */
  UserManagement: {
    userId?: number;
    mode?: "view" | "edit" | "create";
  };
  /** Écran des rapports */
  Reports: {
    type?: "sales" | "stock" | "financial" | "clients";
    period?: "day" | "week" | "month" | "year" | "custom";
    startDate?: string;
    endDate?: string;
  };
  /** Écran d'ajustement de stock */
  InventoryAdjustment: {
    productId: number;
    type?: "add" | "remove" | "correct";
  };
  /** Écran de détails de vente */
  SaleDetail: {
    saleId: number;
  };
  /** Écran de détails de produit */
  ProductDetail: {
    productId: number;
  };
  /** Écran de détails de client */
  ClientDetail: {
    clientId: number;
  };
  /** Écran des notifications */
  Notifications: undefined;
  /** Écran de recherche */
  Search: {
    query?: string;
    type?: "products" | "clients" | "sales";
  };
};

/**
 * Paramètres du bottom tab navigator
 */
export type MainTabParamList = {
  /** Onglet Accueil */
  Dashboard: undefined;
  /** Onglet Caisse */
  Caisse: undefined;
  /** Onglet Stock */
  Stock: undefined;
  /** Onglet Analytics */
  Analytics: undefined;
  /** Onglet Paramètres */
  Settings: undefined;
};

/**
 * Paramètres du stack navigator d'authentification
 */
export type AuthStackParamList = {
  /** Écran de connexion */
  Login: undefined;
  /** Écran d'inscription */
  Register: undefined;
  /** Écran de récupération de mot de passe */
  ForgotPassword: undefined;
  /** Écran de réinitialisation de mot de passe */
  ResetPassword: {
    token: string;
  };
  /** Écran de vérification d'email */
  VerifyEmail: {
    email: string;
  };
};

/**
 * Paramètres du stack navigator des produits
 */
export type ProductStackParamList = {
  /** Liste des produits */
  ProductList: undefined;
  /** Détails d'un produit */
  ProductDetail: {
    productId: number;
  };
  /** Création d'un produit */
  ProductCreate: undefined;
  /** Modification d'un produit */
  ProductEdit: {
    productId: number;
  };
  /** Ajustement de stock */
  ProductStockAdjust: {
    productId: number;
  };
};

/**
 * Paramètres du stack navigator des clients
 */
export type ClientStackParamList = {
  /** Liste des clients */
  ClientList: undefined;
  /** Détails d'un client */
  ClientDetail: {
    clientId: number;
  };
  /** Création d'un client */
  ClientCreate: undefined;
  /** Modification d'un client */
  ClientEdit: {
    clientId: number;
  };
  /** Dettes d'un client */
  ClientDebts: {
    clientId: number;
  };
};

/**
 * Paramètres du stack navigator des ventes
 */
export type SaleStackParamList = {
  /** Liste des ventes */
  SaleList: undefined;
  /** Détails d'une vente */
  SaleDetail: {
    saleId: number;
  };
  /** Création d'une vente */
  SaleCreate: undefined;
  /** Impression d'un ticket */
  SalePrint: {
    saleId: number;
  };
};

/**
 * Paramètres du stack navigator des rapports
 */
export type ReportStackParamList = {
  /** Liste des rapports */
  ReportList: undefined;
  /** Rapport de ventes */
  SalesReport: {
    period?: "day" | "week" | "month" | "year";
    startDate?: string;
    endDate?: string;
  };
  /** Rapport de stock */
  StockReport: {
    type?: "all" | "alerts" | "movements";
  };
  /** Rapport financier */
  FinancialReport: {
    period?: "month" | "quarter" | "year";
  };
}; // ============================================
// 🧭 TYPES DE NAVIGATION PAR COMPOSANT
// ============================================

/**
 * Type pour les props de navigation du stack principal
 */
export type RootStackNavigationProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

/**
 * Type pour les props de route du stack principal
 */
export type RootStackRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

/**
 * Type pour les props de navigation du bottom tab
 */
export type MainTabNavigationProp<T extends keyof MainTabParamList> =
  BottomTabNavigationProp<MainTabParamList, T>;

/**
 * Type pour les props de route du bottom tab
 */
export type MainTabRouteProp<T extends keyof MainTabParamList> = RouteProp<
  MainTabParamList,
  T
>;

/**
 * Type pour les props de navigation du stack d'authentification
 */
export type AuthStackNavigationProp<T extends keyof AuthStackParamList> =
  NativeStackNavigationProp<AuthStackParamList, T>;

/**
 * Type pour les props de route du stack d'authentification
 */
export type AuthStackRouteProp<T extends keyof AuthStackParamList> = RouteProp<
  AuthStackParamList,
  T
>;

// ============================================
// 🎯 PROPS DES ÉCRANS
// ============================================

/**
 * Props pour l'écran de connexion
 */
export interface LoginScreenProps {
  navigation: RootStackNavigationProp<"Login">;
  route: RootStackRouteProp<"Login">;
}

/**
 * Props pour l'écran de tableau de bord
 */
export interface DashboardScreenProps {
  navigation: MainTabNavigationProp<"Dashboard">;
  route: MainTabRouteProp<"Dashboard">;
}

/**
 * Props pour l'écran de caisse
 */
export interface CaisseScreenProps {
  navigation: MainTabNavigationProp<"Caisse">;
  route: MainTabRouteProp<"Caisse">;
}

/**
 * Props pour l'écran de stock
 */
export interface StockScreenProps {
  navigation: MainTabNavigationProp<"Stock">;
  route: MainTabRouteProp<"Stock">;
}

/**
 * Props pour l'écran d'analytique
 */
export interface AnalyticsScreenProps {
  navigation: MainTabNavigationProp<"Analytics">;
  route: MainTabRouteProp<"Analytics">;
}

/**
 * Props pour l'écran des paramètres
 */
export interface SettingsScreenProps {
  navigation: MainTabNavigationProp<"Settings">;
  route: MainTabRouteProp<"Settings">;
}

/**
 * Props pour l'écran de gestion des produits
 */
export interface ProductManagementScreenProps {
  navigation: RootStackNavigationProp<"ProductManagement">;
  route: RootStackRouteProp<"ProductManagement">;
}

/**
 * Props pour l'écran de gestion des clients
 */
export interface ClientManagementScreenProps {
  navigation: RootStackNavigationProp<"ClientManagement">;
  route: RootStackRouteProp<"ClientManagement">;
}

/**
 * Props pour l'écran de gestion des utilisateurs
 */
export interface UserManagementScreenProps {
  navigation: RootStackNavigationProp<"UserManagement">;
  route: RootStackRouteProp<"UserManagement">;
}

/**
 * Props pour l'écran des rapports
 */
export interface ReportsScreenProps {
  navigation: RootStackNavigationProp<"Reports">;
  route: RootStackRouteProp<"Reports">;
}

/**
 * Props pour l'écran d'ajustement de stock
 */
export interface InventoryAdjustmentScreenProps {
  navigation: RootStackNavigationProp<"InventoryAdjustment">;
  route: RootStackRouteProp<"InventoryAdjustment">;
} // ============================================
// 🧭 TYPES DE NAVIGATION ET UTILITAIRES
// ============================================

/**
 * Type pour les paramètres de navigation génériques
 */
export type NavigationParams = {
  [key: string]: any;
};

/**
 * Type pour les fonctions de navigation
 */
export interface NavigationHelpers {
  /** Naviguer vers un écran */
  navigate: <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T],
  ) => void;

  /** Revenir en arrière */
  goBack: () => void;

  /** Réinitialiser la navigation */
  reset: (options: {
    index: number;
    routes: { name: keyof RootStackParamList; params?: any }[];
  }) => void;

  /** Remplacer l'écran actuel */
  replace: <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T],
  ) => void;

  /** Naviguer vers un écran et vider la pile */
  navigateAndReset: <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T],
  ) => void;
}

/**
 * Type pour les écrans avec navigation
 */
export type ScreenWithNavigation<T = {}> = T & {
  navigation: NavigationHelpers;
  route: {
    params?: NavigationParams;
    key: string;
    name: string;
  };
};

/**
 * Type pour les options d'écran
 */
export interface ScreenOptions {
  /** Titre de l'écran */
  title?: string;
  /** Afficher le header */
  headerShown?: boolean;
  /** Afficher le retour en arrière */
  headerBackVisible?: boolean;
  /** Titre du retour en arrière */
  headerBackTitle?: string;
  /** Couleur du header */
  headerStyle?: {
    backgroundColor?: string;
  };
  /** Titre du header */
  headerTitleStyle?: {
    color?: string;
    fontSize?: number;
    fontWeight?: string;
  };
  /** Action à droite du header */
  headerRight?: () => React.ReactNode;
  /** Action à gauche du header */
  headerLeft?: () => React.ReactNode;
  /** Mode de présentation */
  presentation?: "card" | "modal" | "transparentModal";
  /** Animation de transition */
  animation?:
    | "default"
    | "fade"
    | "flip"
    | "none"
    | "slide_from_right"
    | "slide_from_bottom";
}

// ============================================
// 🎯 TYPES DE NAVIGATION SPÉCIFIQUES
// ============================================

/**
 * Type pour la navigation protégée (nécessite authentification)
 */
export type ProtectedRouteProps = {
  /** Rôles requis pour accéder à la route */
  requiredRoles?: UserRole[];
  /** Rediriger vers cette route si non authentifié */
  redirectTo?: keyof RootStackParamList;
  /** Rediriger vers cette route si rôle insuffisant */
  redirectToUnauthorized?: keyof RootStackParamList;
};

/**
 * Type pour les routes avec paramètres
 */
export type RouteWithParams<T extends keyof RootStackParamList> = {
  route: T;
  params: RootStackParamList[T];
};

/**
 * Type pour le contexte de navigation
 */
export interface NavigationContextType {
  /** Navigation actuelle */
  navigation: NavigationHelpers;
  /** Route actuelle */
  currentRoute: {
    name: keyof RootStackParamList;
    params?: NavigationParams;
  };
  /** Historique de navigation */
  history: string[];
  /** Est-ce que l'utilisateur est connecté */
  isAuthenticated: boolean;
}

// ============================================
// 🚦 TYPES DE NAVIGATION POUR LES HOOKS
// ============================================

/**
 * Type pour le hook useNavigation
 */
export type UseNavigation = () => NavigationHelpers;

/**
 * Type pour le hook useRoute
 */
export type UseRoute = <T extends keyof RootStackParamList>() => {
  params: RootStackParamList[T];
  key: string;
  name: T;
};

/**
 * Type pour le hook useFocusEffect
 */
export type UseFocusEffect = (effect: () => void | (() => void)) => void;

/**
 * Type pour le hook useIsFocused
 */
export type UseIsFocused = () => boolean; // ============================================
// 📡 ÉVÉNEMENTS DE NAVIGATION
// ============================================

/**
 * Événements de navigation
 */
export type NavigationEvent =
  | "focus"
  | "blur"
  | "state"
  | "beforeRemove"
  | "transitionStart"
  | "transitionEnd";

/**
 * Écouteur d'événement de navigation
 */
export type NavigationEventListener = (event: NavigationEventData) => void;

/**
 * Données d'événement de navigation
 */
export interface NavigationEventData {
  type: NavigationEvent;
  target: string;
  data?: any;
}

/**
 * Options de transition
 */
export interface TransitionOptions {
  /** Durée de la transition en ms */
  duration?: number;
  /** Fonction d'accélération */
  easing?: (value: number) => number;
  /** Délai avant le début */
  delay?: number;
}

// ============================================
// 🔄 TYPES DE RÉINITIALISATION
// ============================================

/**
 * Options de réinitialisation de navigation
 */
export interface ResetNavigationOptions {
  /** Routes de la nouvelle pile */
  routes: {
    name: keyof RootStackParamList;
    params?: NavigationParams;
  }[];
  /** Index de la route active */
  index?: number;
}

/**
 * Options de navigation profonde
 */
export interface DeepLinkOptions {
  /** URL du lien profond */
  url: string;
  /** Paramètres supplémentaires */
  params?: NavigationParams;
}

// ============================================
// 📦 EXPORT PRINCIPAL
// ============================================

export type {
    AnalyticsScreenProps, AuthStackNavigationProp, AuthStackParamList, AuthStackRouteProp, CaisseScreenProps, ClientManagementScreenProps, ClientStackParamList, DashboardScreenProps, DeepLinkOptions, InventoryAdjustmentScreenProps,
    // Props des écrans
    LoginScreenProps, MainTabNavigationProp, MainTabParamList, MainTabRouteProp, NavigationContextType,
    // Événements
    NavigationEvent, NavigationEventData, NavigationEventListener, NavigationHelpers,
    // Utilitaires
    NavigationParams, ProductManagementScreenProps, ProductStackParamList, ProtectedRouteProps, ReportsScreenProps, ReportStackParamList, ResetNavigationOptions,
    // Props de navigation
    RootStackNavigationProp,
    // Paramètres des navigateurs
    RootStackParamList, RootStackRouteProp, RouteWithParams, SaleStackParamList, ScreenOptions, ScreenWithNavigation, SettingsScreenProps, StockScreenProps, TransitionOptions, UseFocusEffect,
    UseIsFocused,
    // Hooks
    UseNavigation, UserManagementScreenProps, UseRoute
};

// Export par défaut
export default {
  // Stack navigators
  RootStackParamList,
  MainTabParamList,
  AuthStackParamList,
  ProductStackParamList,
  ClientStackParamList,
  SaleStackParamList,
  ReportStackParamList,

  // Navigation props
  RootStackNavigationProp,
  RootStackRouteProp,
  MainTabNavigationProp,
  MainTabRouteProp,

  // Screen props
  LoginScreenProps,
  DashboardScreenProps,
  CaisseScreenProps,
  StockScreenProps,
  AnalyticsScreenProps,
  SettingsScreenProps,
  ProductManagementScreenProps,
  ClientManagementScreenProps,
  UserManagementScreenProps,
  ReportsScreenProps,
  InventoryAdjustmentScreenProps,
};
