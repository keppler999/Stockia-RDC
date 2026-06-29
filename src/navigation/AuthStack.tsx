// ============================================
// 📁 NAVIGATION - AUTHSTACK
// Version: 3.4.0
// Description: Sous-routeur d'authentification, gestion des placeholders d'accès et restauration
// ============================================

import { Ionicons } from "@expo/vector-icons";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useUser } from "../context/UserContext";

// === IMPORTS DES ÉCRANS REELS ===
import LicenceBlockScreen from "../screens/LicenceBlockScreen";
import LoginScreen from "../screens/LoginScreen";

// === TYPES DE PARAMÈTRES ===
export type AuthStackParamList = {
  Login: undefined;
  LicenceBlock: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: { email: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthStackProps {
  initialRoute?: keyof AuthStackParamList;
  onAuthSuccess?: () => void;
}

// === COMPOSANT DE CHARGEMENT DE SESSION ===
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingLogo}>
      <Ionicons name="cube" size={48} color="#1565C0" />
    </View>
    <ActivityIndicator size="large" color="#1565C0" />
    <Text style={styles.loadingText}>Chargement...</Text>
  </View>
);

// === COMPOSANTS ÉCRANS (Isolés pour éviter les fuites de re-render) ===

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, "Register">;
const RegisterScreen = ({ navigation }: RegisterScreenProps) => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="person-add" size={64} color="#1565C0" />
    <Text style={styles.placeholderTitle}>Inscription</Text>
    <Text style={styles.placeholderText}>
      Fonctionnalité d'inscription disponible prochainement.
    </Text>
    <TouchableOpacity
      style={styles.placeholderButton}
      onPress={() => navigation.goBack()}
    >
      <Text style={styles.placeholderButtonText}>Retour à la connexion</Text>
    </TouchableOpacity>
  </View>
);

type ForgotProps = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;
const ForgotPasswordScreen = ({ navigation }: AppScreenProps) => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="mail" size={64} color="#1565C0" />
    <Text style={styles.placeholderTitle}>Mot de passe oublié</Text>
    <Text style={styles.placeholderText}>
      Entrez votre email pour recevoir un lien de réinitialisation.
    </Text>
    <TouchableOpacity
      style={styles.placeholderButton}
      onPress={() => navigation.goBack()}
    >
      <Text style={styles.placeholderButtonText}>Retour à la connexion</Text>
    </TouchableOpacity>
  </View>
);

type ResetProps = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;
const ResetPasswordScreen = ({ route }: ResetProps) => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="key" size={64} color="#1565C0" />
    <Text style={styles.placeholderTitle}>Réinitialisation</Text>
    <Text style={styles.placeholderText}>
      Token: {route.params?.token || "N/A"}
    </Text>
    <TouchableOpacity
      style={styles.placeholderButton}
      onPress={() => Alert.alert("Info", "Fonctionnalité à venir")}
    >
      <Text style={styles.placeholderButtonText}>Réinitialiser le mot de passe</Text>
    </TouchableOpacity>
  </View>
);

type VerifyProps = NativeStackScreenProps<AuthStackParamList, "VerifyEmail">;
const VerifyEmailScreen = ({ route }: VerifyProps) => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="mail-open" size={64} color="#1565C0" />
    <Text style={styles.placeholderTitle}>Vérification email</Text>
    <Text style={styles.placeholderText}>
      Email: {route.params?.email || "N/A"}
    </Text>
    <TouchableOpacity
      style={styles.placeholderButton}
      onPress={() => Alert.alert("Info", "Fonctionnalité à venir")}
    >
      <Text style={styles.placeholderButtonText}>Vérifier</Text>
    </TouchableOpacity>
  </View>
);

type AppScreenProps = NativeStackScreenProps<AuthStackParamList>;

export function AuthStack({ initialRoute = "Login", onAuthSuccess }: AuthStackProps) {
  const { blocked, isLoading } = useUser();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Interception de sécurité immédiate au niveau de la racine Auth
  if (blocked) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="LicenceBlock" component={LicenceBlockScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: "#1565C0" },
        headerTitleStyle: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
        headerTintColor: "#FFFFFF",
        headerBackTitle: "Retour",
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      {/* ÉCRAN DE CONNEXION DE BASE */}
      <Stack.Screen name="Login" options={{ headerShown: false }}>
        {(props) => <LoginScreen {...props} onAuthSuccess={onAuthSuccess} />}
      </Stack.Screen>

      {/* ÉCRAN D'INSCRIPTION */}
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={({ navigation }) => ({
          title: "Inscription",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBackButton}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
          ),
        })}
      />

      {/* ÉCRAN MOT DE PASSE OUBLIÉ */}
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={({ navigation }) => ({
          title: "Récupération",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBackButton}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
          ),
        })}
      />

      {/* ÉCRAN DE RÉINITIALISATION VIA TOKEN PAR EMAIL */}
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={({ navigation }) => ({
          title: "Réinitialisation",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBackButton}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
          ),
        })}
      />

      {/* ÉCRAN VALIDATION OTP/EMAIL */}
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={({ navigation }) => ({
          title: "Validation Email",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBackButton}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  loadingLogo: {
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  placeholderButton: {
    backgroundColor: "#1565C0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  placeholderButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  headerBackButton: {
    padding: 4,
    marginLeft: 0,
  },
});

export default AuthStack;