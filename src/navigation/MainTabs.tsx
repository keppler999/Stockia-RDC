// ============================================
// 📁 NAVIGATION - MAINTABS
// Version: 3.5.0
// Description: Menu d'onglets principal avec contrôle d'accès RBAC et optimisation du header
// ============================================

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useCallback, useMemo, useState } from "react";
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from "react-native";
import { useUser } from "../context/UserContext";
import { AuthService } from "../services/AuthService";

// === IMPORTS DES ÉCRANS ===
import AnalyticsScreen from "../screens/AnalyticsScreen";
import CaisseScreen from "../screens/CaisseScreen";
import DashboardScreen from "../screens/DashboardScreen";
import SettingsScreen from "../screens/SettingsScreen";
import StockScreen from "../screens/StockScreen";

// === TYPES ET PARAMÈTRES ===
export type MainTabParamList = {
  Dashboard: undefined;
  Caisse: undefined;
  Stock: undefined;
  Analytics: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type UserRole = "ADMIN" | "GERANT" | "CAISSIER" | "MAGASINIER";

interface TabItem {
  key: keyof MainTabParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  component: React.ComponentType<any>;
}

export function MainTabs() {
  const { user, logout } = useUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const role: UserRole = (user?.role as UserRole) || "CAISSIER";

  // === ARCHITECTURE DYNAMIQUE DES ONGLETS (RBAC) ===
  const tabs = useMemo((): TabItem[] => {
    const list: TabItem[] = [
      {
        key: "Dashboard",
        label: "Accueil",
        icon: "home-outline",
        activeIcon: "home",
        component: DashboardScreen,
      }
    ];

    // Caisse (Admin, Gérant, Caissier)
    if (["ADMIN", "GERANT", "CAISSIER"].includes(role)) {
      list.push({
        key: "Caisse",
        label: "Caisse",
        icon: "cash-outline",
        activeIcon: "cash",
        component: CaisseScreen,
      });
    }

    // Stock (Admin, Gérant, Magasinier)
    if (["ADMIN", "GERANT", "MAGASINIER"].includes(role)) {
      list.push({
        key: "Stock",
        label: "Stock",
        icon: "cube-outline",
        activeIcon: "cube",
        component: StockScreen,
      });
    }

    // Analytics (Admin, Gérant uniquement)
    if (["ADMIN", "GERANT"].includes(role)) {
      list.push({
        key: "Analytics",
        label: "Analyses",
        icon: "analytics-outline",
        activeIcon: "analytics",
        component: AnalyticsScreen,
      });
    }

    // Toujours disponible
    list.push({
      key: "Settings",
      label: "Paramètres",
      icon: "settings-outline",
      activeIcon: "settings",
      component: SettingsScreen,
    });

    return list;
  }, [role]);

  // === STRATÉGIE DE DÉCONNEXION SYNCHRONE/ASYNCHRONISATION ===
  const handleLogout = useCallback(async () => {
    try {
      Vibration.vibrate(50);
      await AuthService.logout();
      await AuthService.logAction(user?.id || 0, "LOGOUT", "Déconnexion volontaire");
    } catch (error) {
      console.error("[MainTabs] Erreur lors de la déconnexion d'audit:", error);
    } finally {
      setShowLogoutModal(false);
      logout(); // Reset global de l'état contextuel
    }
  }, [user?.id, logout]);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const tab = tabs.find((t) => t.key === route.name);
            const iconName = focused ? tab?.activeIcon : tab?.icon;
            return <Ionicons name={iconName || "alert-circle"} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#1565C0",
          tabBarInactiveTintColor: "#757575",
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: "#FFFFFF",
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerLogoutButton}
              onPress={() => setShowLogoutModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>
                  {user?.nom?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
              <View>
                <Text style={styles.headerUserName} numberOfLines={1}>
                  {user?.nom || "Utilisateur"}
                </Text>
                <View style={styles.headerRoleBadge}>
                  <Text style={styles.headerRoleText}>{role}</Text>
                </View>
              </View>
            </View>
          ),
        })}
      >
        {tabs.map((tab) => (
          <Tab.Screen
            key={tab.key}
            name={tab.key}
            component={tab.component}
            options={{ title: tab.label }}
          />
        ))}
      </Tab.Navigator>

      {/* COMPOSANT DE MODAL DE CONFIRMATION DE SORTIE */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="log-out-outline" size={56} color="#D32F2F" />
            </View>
            <Text style={styles.modalTitle}>Déconnexion</Text>
            <Text style={styles.modalText}>
              Êtes-vous sûr de vouloir vous déconnecter de votre espace Stockia ?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>Déconnecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    height: Platform.OS === "ios" ? 85 : 65,
    paddingBottom: Platform.OS === "ios" ? 25 : 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  header: {
    backgroundColor: "#1565C0",
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    display: "none", // Masqué pour mettre en avant l'identité profil à gauche
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    gap: 10,
    width: "70%",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  headerUserName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  headerRoleBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  headerRoleText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  headerLogoutButton: {
    marginRight: 16,
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    width: "85%",
    maxWidth: 340,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F5F5F5",
  },
  modalCancelText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 15,
  },
  modalConfirmButton: {
    backgroundColor: "#D32F2F",
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default MainTabs;