import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { UserProvider, useUser } from "./context/UserContext";

// === IMPORT DES ÉCRANS ===
import AnalyticsScreen from "./screens/AnalyticsScreen";
import CaisseScreen from "./screens/CaisseScreen";
import DashboardScreen from "./screens/DashboardScreen";
import LicenceBlockScreen from "./screens/LicenceBlockScreen";
import LoginScreen from "./screens/LoginScreen";
import SettingsScreen from "./screens/SettingsScreen";
import StockScreen from "./screens/StockScreen";

// === CONSTANTES ===
const { width, height } = Dimensions.get("window");
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// === TYPES DE NAVIGATION ===
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  LicenceBlock: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Caisse: undefined;
  Stock: undefined;
  Analytics: undefined;
  Settings: undefined;
};

// === CONFIGURATION DES NOTIFICATIONS ===
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
}); // === ÉCRAN DE CHARGEMENT ===
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingLogo}>
        <Ionicons name="cube" size={64} color="#1565C0" />
      </View>
      <Text style={styles.loadingTitle}>STOCKIA</Text>
      <Text style={styles.loadingSubtitle}>
        Gestion Commerciale Intelligente
      </Text>
      <View style={styles.loadingProgressContainer}>
        <View style={styles.loadingProgressBar}>
          <Animated.View
            style={[
              styles.loadingProgressFill,
              {
                width: new Animated.Value(100),
              },
            ]}
          />
        </View>
      </View>
      <Text style={styles.loadingVersion}>v2.1.0</Text>
    </View>
  );
}

// === HOOK DE PROTECTION DES ROUTES ===
function withAuthProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRoles: string[] = [],
): React.ComponentType<P> {
  return function ProtectedRoute(props: P) {
    const { user, blocked, isLoading } = useUser();

    if (isLoading) {
      return <LoadingScreen />;
    }

    if (blocked) {
      return <LicenceBlockScreen />;
    }

    if (!user) {
      return <LoginScreen />;
    }

    // Vérifier les rôles requis
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return (
        <View style={styles.unauthorizedContainer}>
          <Ionicons name="lock-closed" size={64} color="#F44336" />
          <Text style={styles.unauthorizedTitle}>Accès Refusé</Text>
          <Text style={styles.unauthorizedText}>
            Vous n'avez pas les permissions nécessaires pour accéder à cette
            page.
          </Text>
          <Text style={styles.unauthorizedRole}>
            Rôle requis: {requiredRoles.join(" ou ")}
          </Text>
        </View>
      );
    }

    return <WrappedComponent {...props} />;
  };
} // === NAVIGATEUR PRINCIPAL (ONGLETS) ===
function MainTabsNavigator() {
  const { user, logout } = useUser();
  const role = user?.role || "CAISSIER";

  // === CONFIGURATION DES ONGLETS SELON LE RÔLE ===
  const getTabs = () => {
    const tabs = [];

    // Dashboard - visible pour tous
    tabs.push({
      name: "Dashboard",
      component: DashboardScreen,
      icon: "home",
      label: "Accueil",
    });

    // Caisse - visible pour Admin, Gérant et Caissier
    if (role === "ADMIN" || role === "GERANT" || role === "CAISSIER") {
      tabs.push({
        name: "Caisse",
        component: CaisseScreen,
        icon: "cash",
        label: "Caisse",
      });
    }

    // Stock - visible pour Admin, Gérant et Magasinier
    if (role === "ADMIN" || role === "GERANT" || role === "MAGASINIER") {
      tabs.push({
        name: "Stock",
        component: StockScreen,
        icon: "cube",
        label: "Stock",
      });
    }

    // Analytics - visible uniquement Admin et Gérant
    if (role === "ADMIN" || role === "GERANT") {
      tabs.push({
        name: "Analytics",
        component: AnalyticsScreen,
        icon: "analytics",
        label: "Analyses",
      });
    }

    // Settings - visible pour tous
    tabs.push({
      name: "Settings",
      component: SettingsScreen,
      icon: "settings",
      label: "Paramètres",
    });

    return tabs;
  };

  const tabs = getTabs();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const tab = tabs.find((t) => t.name === route.name);
          const iconName = tab?.icon || "apps";
          return (
            <Ionicons
              name={focused ? iconName : (`${iconName}-outline` as any)}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: "#1565C0",
        tabBarInactiveTintColor: "#757575",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: "#FFFFFF",
        headerRight: () => (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                "Déconnexion",
                "Êtes-vous sûr de vouloir vous déconnecter ?",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Déconnecter",
                    style: "destructive",
                    onPress: logout,
                  },
                ],
              );
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        headerLeft: () => (
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {user?.nom?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <View>
              <Text style={styles.headerUserName}>
                {user?.nom || "Utilisateur"}
              </Text>
              <View style={styles.headerRoleBadge}>
                <Text style={styles.headerRoleText}>
                  {user?.role || "Invité"}
                </Text>
              </View>
            </View>
          </View>
        ),
      })}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name as keyof MainTabParamList}
          component={tab.component}
          options={{
            title: tab.label,
          }}
        />
      ))}
    </Tab.Navigator>
  );
} // === STACK NAVIGATOR PRINCIPAL ===
function AppStack() {
  const { user, blocked, isLoading } = useUser();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      {blocked ? (
        <Stack.Screen name="LicenceBlock" component={LicenceBlockScreen} />
      ) : !user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
      )}
    </Stack.Navigator>
  );
}

// === COMPOSANT PRINCIPAL AVEC NAVIGATION ===
function AppContent() {
  const { isLoading } = useUser();
  const [appIsReady, setAppIsReady] = useState(false);

  // === INITIALISATION DE L'APPLICATION ===
  useEffect(() => {
    async function prepare() {
      try {
        // 1. Cacher le splash screen natif
        await SplashScreen.preventAutoHideAsync();

        // 2. Initialiser les notifications
        await registerForPushNotificationsAsync();

        // 3. Simuler un temps de chargement
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error("[App] Erreur d'initialisation:", error);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar backgroundColor="#1565C0" barStyle="light-content" />
      <AppStack />
    </NavigationContainer>
  );
}

// === INSCRIPTION AUX NOTIFICATIONS PUSH ===
async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1565C0",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("[Notifications] Permission non accordée");
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: "stockia-project-id",
      });
      console.log("[Notifications] Token:", token.data);
      return token.data;
    } catch (error) {
      console.error("[Notifications] Erreur token:", error);
    }
  } else {
    console.warn("[Notifications] Utilisation d'un émulateur");
  }
} // === POINT D'ENTRÉE PRINCIPAL ===
export default function App() {
  // État pour la gestion des erreurs globales
  const [error, setError] = useState<Error | null>(null);

  // Gestionnaire d'erreurs global
  useEffect(() => {
    const errorHandler = (error: Error) => {
      console.error("[App] Erreur globale:", error);
      setError(error);
    };

    // Capturer les erreurs non gérées
    const originalError = console.error;
    console.error = (...args) => {
      originalError(...args);
      if (args[0] instanceof Error) {
        errorHandler(args[0]);
      }
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // Affichage en cas d'erreur critique
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="bug" size={64} color="#D32F2F" />
        <Text style={styles.errorTitle}>Erreur Critique</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => {
            setError(null);
            // Redémarrer l'application
          }}
        >
          <Text style={styles.errorButtonText}>Redémarrer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
const styles = StyleSheet.create({
  // === STYLES DE CHARGEMENT ===
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  loadingLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1565C0",
    letterSpacing: 2,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: "#78909C",
    marginTop: 4,
    marginBottom: 24,
  },
  loadingProgressContainer: {
    width: "80%",
    maxWidth: 300,
    marginBottom: 16,
  },
  loadingProgressBar: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  loadingProgressFill: {
    height: "100%",
    backgroundColor: "#1565C0",
    borderRadius: 2,
  },
  loadingVersion: {
    fontSize: 12,
    color: "#B0BEC5",
  },

  // === STYLES DE LA BARRE DE NAVIGATION ===
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    height: 60,
    paddingBottom: 5,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
  },

  // === STYLES DE L'EN-TÊTE ===
  header: {
    backgroundColor: "#1565C0",
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    gap: 8,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  headerUserName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  headerRoleBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  headerRoleText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  logoutButton: {
    marginRight: 16,
    padding: 4,
  },

  // === STYLES D'ACCÈS NON AUTORISÉ ===
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  unauthorizedTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  unauthorizedText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
  unauthorizedRole: {
    fontSize: 14,
    color: "#1565C0",
    marginTop: 12,
    fontWeight: "500",
  },

  // === STYLES D'ERREUR ===
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#D32F2F",
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
  errorButton: {
    backgroundColor: "#1565C0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  errorButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
