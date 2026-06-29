// ============================================
// 📁 NAVIGATION - CENTRALIZED TYPES
// Version: 4.1.0
// Description: Contrat d'interface et typage strict des paramètres de navigation de Stockia
// ============================================

import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";

// === INCLUSIONS / LIENS DE CONTEXTE UTILS ===
import { UserRole } from "../utils/permissions";
export type { UserSession } from "../context/UserContext";
export type { UserRole };

// === ROOT PARAMS MATRIX ===
export type RootStackParamList = {
  Login: undefined;
  LicenceBlock: undefined;
  MainTabs: undefined;
  Dashboard: undefined;
  Caisse: undefined;
  Stock: undefined;
  Analytics: undefined;
  Settings: undefined;
  ProductManagement: {
    productId?: number;
    mode?: "view" | "edit" | "create";
  };
  ClientManagement: {
    clientId?: number;
    mode?: "view" | "edit" | "create";
  };
  UserManagement: {
    userId?: number;
    mode?: "view" | "edit" | "create";
  };
  Reports: {
    type?: "sales" | "stock" | "financial" | "products";
    period?: "day" | "week" | "month" | "year" | "custom";
    startDate?: string;
    endDate?: string;
  };
  InventoryAdjustment: {
    productId: number;
    type?: "add" | "remove" | "correct";
  };
  SaleDetail: { saleId: number };
  ProductDetail: { productId: number };
  ClientDetail: { clientId: number };
  Notifications: undefined;
  Search: {
    query?: string;
    type?: "products" | "clients" | "sales";
  };
};

// === SUB-STACKS PARAM MATRIX ===
export type MainTabParamList = {
  Dashboard: undefined;
  Caisse: undefined;
  Stock: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: { email: string };
};

export type ProductStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: number };
  ProductCreate: undefined;
  ProductEdit: { productId: number };
  ProductStockAdjust: { productId: number };
};

export type ClientStackParamList = {
  ClientList: undefined;
  ClientDetail: { clientId: number };
  ClientCreate: undefined;
  ClientEdit: { clientId: number };
  ClientDebts: { clientId: number };
};

export type SaleStackParamList = {
  SaleList: undefined;
  SaleDetail: { saleId: number };
  SaleCreate: undefined;
  SalePrint: { saleId: number };
};

export type ReportStackParamList = {
  ReportList: undefined;
  SalesReport: {
    period?: "day" | "week" | "month" | "year";
    startDate?: string;
    endDate?: string;
  };
  StockReport: { type?: "all" | "alerts" | "movements" };
  FinancialReport: { period?: "month" | "quarter" | "year" };
};

// === EXPORTS DES PROPULSIONS SÉCURISÉES DE NAVIGATION ===
export type RootStackNavigationProp<T extends keyof RootStackParamList> = 
  NativeStackNavigationProp<RootStackParamList, T>;

export type RootStackRouteProp<T extends keyof RootStackParamList> = 
  RouteProp<RootStackParamList, T>;

export type MainTabNavigationProp<T extends keyof MainTabParamList> = 
  BottomTabNavigationProp<MainTabParamList, T>;

export type MainTabRouteProp<T extends keyof MainTabParamList> = 
  RouteProp<MainTabParamList, T>;

export type AuthStackNavigationProp<T extends keyof AuthStackParamList> = 
  NativeStackNavigationProp<AuthStackParamList, T>;

export type AuthStackRouteProp<T extends keyof AuthStackParamList> = 
  RouteProp<AuthStackParamList, T>;

// === INTEGRATED COMPONENT SCREEN INTERFACES ===
export interface LoginScreenProps {
  navigation: RootStackNavigationProp<"Login">;
  route: RootStackRouteProp<"Login">;
}

export interface DashboardScreenProps {
  navigation: MainTabNavigationProp<"Dashboard">;
  route: MainTabRouteProp<"Dashboard">;
}

export interface CaisseScreenProps {
  navigation: MainTabNavigationProp<"Caisse">;
  route: MainTabRouteProp<"Caisse">;
}

export interface StockScreenProps {
  navigation: MainTabNavigationProp<"Stock">;
  route: MainTabRouteProp<"Stock">;
}

export interface AnalyticsScreenProps {
  navigation: MainTabNavigationProp<"Analytics">;
  route: MainTabRouteProp<"Analytics">;
}

export interface SettingsScreenProps {
  navigation: MainTabNavigationProp<"Settings">;
  route: MainTabRouteProp<"Settings">;
}

export interface ProductManagementScreenProps {
  navigation: RootStackNavigationProp<"ProductManagement">;
  route: RootStackRouteProp<"ProductManagement">;
}

export interface ClientManagementScreenProps {
  navigation: RootStackNavigationProp<"ClientManagement">;
  route: RootStackRouteProp<"ClientManagement">;
}

export interface UserManagementScreenProps {
  navigation: RootStackNavigationProp<"UserManagement">;
  route: RootStackRouteProp<"UserManagement">;
}

export interface ReportsScreenProps {
  navigation: RootStackNavigationProp<"Reports">;
  route: RootStackRouteProp<"Reports">;
}

export interface InventoryAdjustmentScreenProps {
  navigation: RootStackNavigationProp<"InventoryAdjustment">;
  route: RootStackRouteProp<"InventoryAdjustment">;
}

// === ABSTRACTION ET CRÉATION DU DESIGN PATTERN HELPERS ===
export type NavigationParams = {
  [key: string]: any;
};

export interface NavigationHelpers {
  navigate: <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T]
  ) => void;
  goBack: () => void;
  reset: (options: {
    index: number;
    routes: { name: keyof RootStackParamList; params?: any }[];
  }) => void;
  replace: <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T]
  ) => void;
  navigateAndReset: <T extends keyof RootStackParamList>(
    screen: T,
    params?: RootStackParamList[T]
  ) => void;
}

export type ScreenWithNavigation<T = {}> = T & {
  navigation: NavigationHelpers;
  route: {
    params?: NavigationParams;
    key: string;
    name: string;
  };
};

export interface ScreenOptions {
  title?: string;
  headerShown?: boolean;
  headerBackVisible?: boolean;
  headerBackTitle?: string;
  headerStyle?: { backgroundColor?: string };
  headerTitleStyle?: { color?: string; fontSize?: number; fontWeight?: string };
  headerRight?: () => React.ReactNode;
  headerLeft?: () => React.ReactNode;
  presentation?: "card" | "modal" | "transparentModal";
  animation?: "default" | "fade" | "flip" | "none" | "slide_from_right" | "slide_from_bottom";
}

export interface ProtectedRouteProps {
  requiredRoles?: UserRole[];
  redirectTo?: keyof RootStackParamList;
  redirectToUnauthorized?: keyof RootStackParamList;
}

export type RouteWithParams<T extends keyof RootStackParamList> = {
  route: T;
  params: RootStackParamList[T];
};

export interface NavigationContextType {
  navigation: NavigationHelpers;
  currentRoute: {
    name: keyof RootStackParamList;
    params?: NavigationParams;
  };
  history: string[];
  isAuthenticated: boolean;
}

// === ENGINE STRUCT TYPES ===
  export type UseNavigation = () => NavigationHelpers;
  export type UseRoute = <T extends keyof RootStackParamList>() => {
  params: RootStackParamList[T];
  key: string;
  name: T;
};

export type UseFocusEffect = (effect: () => void | (() => void)) => void;
export type UseIsFocused = () => boolean;

export type NavigationEvent = 
  | "focus"
  | "blur"
  | "state"
  | "beforeRemove"
  | "transitionStart"
  | "transitionEnd";

export type NavigationEventListener = (event: NavigationEventData) => void;

export interface NavigationEventData {
  type: NavigationEvent;
  target: string;
  data?: any;
}

export interface TransitionOptions {
  duration?: number;
  easing?: (value: number) => number;
  delay?: number;
}

export interface ResetNavigationOptions {
  routes: { name: keyof RootStackParamList; params?: NavigationParams }[];
  index?: number;
}

export interface DeepLinkOptions {
  url: string;
  params?: NavigationParams;
} 