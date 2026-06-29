// ============================================
// 📁 NAVIGATION - APPSTACK
// Version: 3.3.0
// Description: Routeur racine synchronisé avec le cycle d'initialisation, licence et push-tokens
// ============================================

import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    View
} from "react-native";

// === CONTEXTE ===
import { useUser } from "../context/UserContext";
import { dbService } from "../services/DatabaseService";

// === NAVIGATION ARCHITECTURE ===
import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";

// === ÉCRANS ===
import LicenceBlockScreen from "../screens/LicenceBlockScreen";

// === TYPES ===
export type AppStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  LicenceBlock: undefined;
  Splash: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

interface AppStackProps {
  /** Fonction de callback déclenchée après l'authentification */
  onAuthSuccess?: () => void;
}

// === ÉCRAN DE SPLASH INTERNE ===
const SplashScreenComponent = () => {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.splashLogo}>
        <Ionicons name="cube" size={80} color="#1565C0" />
      </View>
      <Text style={styles.splashTitle}>STOCKIA</Text>
      <Text style={styles.splashSubtitle}>Gestion Commerciale Intelligente</Text>
      <View style={styles.splashLoader}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
      <Text style={styles.splashVersion}>v2.1.0</Text>
    </View>
  );
};

// === COMPOSANT DE GESTION DES NOTIFICATIONS ===
const NotificationHandler = () => {
  useEffect(() => {
    // Écouter les notifications reçues au premier plan
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[NotificationHandler] Notification reçue:", notification);
    });

    // Écouter l'interaction de l'utilisateur avec la notification (clic)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("[NotificationHandler] Interaction enregistrée:", response);
      const data = response.notification.request.content.data;
      if (data?.screen) {
        console.log("[NotificationHandler] Redirection demandée vers l'écran :", data.screen);
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return null;
};

export function AppStack({ onAuthSuccess }: AppStackProps) {
  const { user, blocked, checkSession } = useUser();
  const [appIsReady, setAppIsReady] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [, setNotificationToken] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);

  // === CONFIGURATION SERVICE NOTIFICATIONS PUSH ===
  const registerForPushNotifications = useCallback(async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1565C0",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("[AppStack] Permissions de notifications rejetées.");
        return;
      }

      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: "stockia-project-id", // Remplacer par l'ID réel présent dans app.json
        });
        if (isMountedRef.current) {
          setNotificationToken(token.data);
          console.log("[AppStack] Token de push généré :", token.data);
        }
      } catch (error) {
        console.error("[AppStack] Impossible de récupérer le token push :", error);
      }
    }
  }, []);

  // === INITIATE ENGINE ===
  const initializeApp = useCallback(async () => {
    try {
      await SplashScreen.preventAutoHideAsync();

      // Initialisation de la base SQLite locale
      await dbService.initialize();
      if (isMountedRef.current) setDbInitialized(true);

      // Validation de la session
      await checkSession();
      
      // Configuration réseau pour les notifications distantes
      await registerForPushNotifications();

      // Pause UX artificielle pour éviter l'effet clignotement
      await new Promise((resolve) => setTimeout(resolve, 1500));

    } catch (error) {
      console.error("[AppStack] Erreur critique d'initialisation de l'application:", error);
      Alert.alert(
        "Erreur technique",
        "Impossible de charger les fichiers de configuration locale.",
        [{ text: "Réessayer", onPress: () => initializeApp() }]
      );
    } finally {
      if (isMountedRef.current) {
        setAppIsReady(true);
      }
      await SplashScreen.hideAsync();
    }
  }, [checkSession, registerForPushNotifications]);

  useEffect(() => {
    isMountedRef.current = true;
    initializeApp();
    return () => {
      isMountedRef.current = false;
    };
  }, [initializeApp]);

  if (!appIsReady || !dbInitialized) {
    return <SplashScreenComponent />;
  }

  // === CALCUL ROUTE INITIALE DIRECTE ===
  const getInitialRoute = (): keyof AppStackParamList => {
    if (blocked) return "LicenceBlock";
    if (user) return "MainTabs";
    return "Auth";
  };

  const initialRouteName = getInitialRoute();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      >
        {blocked ? (
          // Sécurité absolue : Blocage total des autres routes si la licence est révoquée
          <Stack.Screen 
            name="LicenceBlock" 
            component={LicenceBlockScreen} 
            options={{ animation: "fade" }}
          />
        ) : (
          <>
            {/* STACK AUTHENTIFICATION */}
            <Stack.Screen name="Auth" options={{ animation: "fade" }}>
              {(props) => <AuthStack {...props} onAuthSuccess={onAuthSuccess} />}
            </Stack.Screen>

            {/* INTERFACE PRINCIPALE */}
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs} 
              options={{ animation: "fade" }}
            />
          </>
        )}
      </Stack.Navigator>

      {/* Traitement asynchrone des charges utiles de notifications */}
      <NotificationHandler />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  splashLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1565C0",
    letterSpacing: 3,
  },
  splashSubtitle: {
    fontSize: 14,
    color: "#78909C",
    marginTop: 4,
  },
  splashLoader: {
    marginTop: 32,
  },
  splashVersion: {
    fontSize: 12,
    color: "#B0BEC5",
    position: "absolute",
    bottom: 40,
  }
});

export default AppStack;