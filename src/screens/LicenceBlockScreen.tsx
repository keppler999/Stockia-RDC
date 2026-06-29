import { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import * as Clipboard from "expo-clipboard"; // Corrigé pour utiliser la version Expo standard
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Haptics from "expo-haptics";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions, // Ajouté
    Linking,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const DATABASE_NAME = "stockia_secure.db";
const { width, height } = Dimensions.get("window");

// === INTERFACES ===
interface LicenceInfo {
  statut: "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING" | "DEMO";
  dateActivation?: string;
  dateExpiration?: string;
  joursRestants?: number;
  nomTitulaire?: string;
  emailTitulaire?: string;
  versionLicence?: string;
  typeLicence?: "STANDARD" | "PREMIUM" | "ENTERPRISE";
}

interface DeviceInfo {
  fingerprint: string;
  model: string;
  manufacturer: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
}

// === CONSTANTES ===
const WHATSAPP_NUMBER = "+24383009563";
const SUPPORT_EMAIL = "support@spiraleagence.com";
const COMPANY_NAME = "Spirale Agence";

// Helper simple pour remplacer Buffer.from().toString('base64') en React Native standard
const boa = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let block = 0, charCode, i = 0, map = chars; str.charAt(i | 0) || (map = '=', i % 1); output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = str.charCodeAt(i += 3 / 4);
    if (charCode > 255) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }
    block = block << 8 | charCode;
  }
  return output;
};

export default function LicenceBlockScreen() {
  // === ÉTATS ===
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [licenceInfo, setLicenceInfo] = useState<LicenceInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // === ANIMATIONS ===
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // === FONCTIONS LOGIQUE DE COMPOSANT (Déplacées ici pour avoir accès aux states) ===

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const getDeviceInfo = async (): Promise<DeviceInfo> => {
    try {
      const deviceId =
        (await Application.getIosIdForVendorAsync()) ||
        (await Application.getAndroidId()) ||
        "unknown";

      const modelName = Device.modelName || "Unknown";
      const manufacturer = Device.manufacturer || "Unknown";
      const osVersion = Device.osVersion || "Unknown";
      const appVersion = Constants.expoConfig?.version || "1.0.0";
      const buildNumber =
        Constants.expoConfig?.android?.versionCode?.toString() ||
        Constants.expoConfig?.ios?.buildNumber ||
        "1";

      const rawFingerprint = `${deviceId}-${modelName}-${osVersion}-${manufacturer}`;
      // Utilisation du helper d'encodage JS pur à la place de Buffer
      const encoded = boa(rawFingerprint).substring(0, 16);
      const fingerprint = `STK-${encoded.toUpperCase()}`;

      return {
        fingerprint,
        model: modelName,
        manufacturer,
        osVersion,
        appVersion,
        buildNumber,
      };
    } catch (error) {
      console.warn("[LicenceBlock] Utilisation d'un fingerprint de secours");
      return {
        fingerprint: `STK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        model: "Unknown",
        manufacturer: "Unknown",
        osVersion: "Unknown",
        appVersion: "1.0.0",
        buildNumber: "1",
      };
    }
  };

  const checkLicenceStatus = async (fingerprint: string): Promise<LicenceInfo> => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      const licence = await db.getFirstAsync<{
        cle_licence: string;
        device_fingerprint: string;
        date_activation: string;
        date_expiration: string;
        statut: string;
        type_licence: string;
        nom_titulaire?: string;
        email_titulaire?: string;
      }>(
        "SELECT * FROM licences WHERE device_fingerprint = ? OR device_fingerprint = 'DEMO';",
        [fingerprint]
      );

      if (!licence) {
        const now = new Date();
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + 15);

        return {
          statut: "DEMO",
          dateActivation: now.toISOString(),
          dateExpiration: expiryDate.toISOString(),
          joursRestants: 15,
          nomTitulaire: "Utilisateur Démo",
          emailTitulaire: "demo@stockia.com",
          versionLicence: "V2.1.0-DEMO",
          typeLicence: "STANDARD",
        };
      }

      const now = new Date();
      const expiration = new Date(licence.date_expiration);
      const joursRestants = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const info: LicenceInfo = {
        statut: licence.statut as LicenceInfo["statut"],
        dateActivation: licence.date_activation,
        dateExpiration: licence.date_expiration,
        joursRestants: joursRestants > 0 ? joursRestants : 0,
        nomTitulaire: licence.nom_titulaire,
        emailTitulaire: licence.email_titulaire,
        versionLicence: `V2.1.0-${licence.type_licence || "STANDARD"}`,
        typeLicence: (licence.type_licence as LicenceInfo["typeLicence"]) || "STANDARD",
      };

      if (joursRestants <= 0 && licence.statut === "ACTIVE") {
        await db.runAsync(
          "UPDATE licences SET statut = 'EXPIRED' WHERE device_fingerprint = ?;",
          [fingerprint]
        );
        info.statut = "EXPIRED";
      }

      return info;
    } catch (error) {
      console.error("[LicenceBlock] Erreur vérification:", error);
      return {
        statut: "PENDING",
        joursRestants: 0,
        versionLicence: "V2.1.0",
        typeLicence: "STANDARD",
      };
    }
  };

  const initializeLicenceCheck = async () => {
    try {
      setLoading(true);

      const device = await getDeviceInfo();
      setDeviceInfo(device);

      const licence = await checkLicenceStatus(device.fingerprint);
      setLicenceInfo(licence);

      if (licence.statut === "EXPIRED" || licence.statut === "REVOKED") {
        startCountdown();
      }

      setRetryCount((prev) => prev + 1);
    } catch (error) {
      console.error("[LicenceBlock] Erreur initialisation:", error);
      Alert.alert(
        "Erreur de vérification",
        "Impossible de vérifier l'état de la licence."
      );
    } finally {
      setLoading(false);
    }
  };

  // === INITIALISATION EFFETS ===
  useEffect(() => {
    initializeLicenceCheck();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // === GESTIONNAIRES D'ÉVÉNEMENTS ===
  const handleCopyToClipboard = async () => {
    const message =
      `=== STOCKIA LICENCE INFO ===\n` +
      `ID Appareil: ${deviceInfo?.fingerprint || "N/A"}\n` +
      `Statut: ${licenceInfo?.statut || "INCONNU"}\n` +
      `Titulaire: ${licenceInfo?.nomTitulaire || "N/A"}\n` +
      `Expiration: ${licenceInfo?.dateExpiration ? new Date(licenceInfo.dateExpiration).toLocaleDateString() : "N/A"}\n` +
      `Version: ${licenceInfo?.versionLicence || "N/A"}\n` +
      `Type: ${licenceInfo?.typeLicence || "N/A"}\n` +
      `================================`;

    await Clipboard.setStringAsync(message);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("✅ Copié !", "Les informations ont été copiées dans le presse-papiers.");
  };

  const handleContactSupport = async () => {
    const message =
      `🔐 DEMANDE DE RÉACTIVATION STOCKIA\n\n` +
      `ID Appareil: ${deviceInfo?.fingerprint || "N/A"}\n` +
      `Statut Licence: ${licenceInfo?.statut || "INCONNU"}\n` +
      `Titulaire: ${licenceInfo?.nomTitulaire || "Non renseigné"}\n` +
      `Appareil: ${deviceInfo?.model || "N/A"}\n` +
      `Version: ${deviceInfo?.appVersion || "N/A"}\n` +
      `Date: ${new Date().toLocaleString()}\n\n` +
      `Veuillez procéder à la réactivation de ma licence.`;

    const whatsappUrl = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        const emailUrl = `mailto:${SUPPORT_EMAIL}?subject=Demande de réactivation licence Stockia&body=${encodeURIComponent(message)}`;
        const emailSupported = await Linking.canOpenURL(emailUrl);
        if (emailSupported) {
          await Linking.openURL(emailUrl);
        } else {
          Alert.alert(
            "Contactez le support",
            `Veuillez contacter ${COMPANY_NAME}:\n📱 WhatsApp: ${WHATSAPP_NUMBER}\n📧 Email: ${SUPPORT_EMAIL}`,
            [
              { text: "Copier le message", onPress: handleCopyToClipboard },
              { text: "OK" },
            ]
          );
        }
      }
    } catch (error) {
      console.error("[LicenceBlock] Erreur de contact:", error);
      Alert.alert("Erreur", "Impossible d'ouvrir l'application de contact.");
    }
  };

  const handleShareInfo = async () => {
    try {
      const message =
        `🔐 Stockia Licence Info\n\n` +
        `ID: ${deviceInfo?.fingerprint || "N/A"}\n` +
        `Statut: ${licenceInfo?.statut || "N/A"}\n` +
        `Titulaire: ${licenceInfo?.nomTitulaire || "N/A"}\n` +
        `Version: ${deviceInfo?.appVersion || "N/A"}`;

      await Share.share({
        message: message,
        title: "Informations Licence Stockia",
      });
    } catch (error) {
      console.error("[LicenceBlock] Erreur de partage:", error);
    }
  };

  const handleRetry = async () => {
    if (countdown > 0) {
      Alert.alert("Attendez", `Veuillez patienter ${countdown} secondes avant de réessayer.`);
      return;
    }
    await initializeLicenceCheck();
  };

  const handleActivate = async () => {
    if (!activationCode.trim() || activationCode.length < 8) {
      Alert.alert("Erreur", "Veuillez entrer un code d'activation valide.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setActivating(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      const licence = await db.getFirstAsync<{ id: number; cle_licence: string }>(
        "SELECT id, cle_licence FROM licences WHERE cle_licence = ? AND statut IN ('PENDING', 'EXPIRED');",
        [activationCode.trim()]
      );

      if (!licence) {
        Alert.alert("Erreur", "Code d'activation invalide ou déjà utilisé.");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setActivating(false);
        return;
      }

      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      await db.runAsync(
        `UPDATE licences
         SET device_fingerprint = ?,
             date_activation = ?,
             date_expiration = ?,
             statut = 'ACTIVE',
             derniere_utilisation = ?
         WHERE id = ?;`,
        [
          deviceInfo?.fingerprint || "unknown",
          new Date().toISOString(),
          expiryDate.toISOString(),
          new Date().toISOString(),
          licence.id,
        ]
      );

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowActivationModal(false);
      setShowSuccessModal(true);

      setTimeout(async () => {
        await initializeLicenceCheck();
        setShowSuccessModal(false);
      }, 3000);
    } catch (error) {
      console.error("[LicenceBlock] Erreur activation:", error);
      Alert.alert("Erreur", "Impossible d'activer la licence.");
    } finally {
      setActivating(false);
      setActivationCode("");
    }
  };

  // === RENDU HELPERS ===
  const getStatusIcon = () => {
    switch (licenceInfo?.statut) {
      case "ACTIVE":
        return { icon: "checkmark-circle", color: "#4CAF50" };
      case "DEMO":
        return { icon: "time-outline", color: "#FF9800" };
      case "EXPIRED":
        return { icon: "alert-circle", color: "#F44336" };
      case "REVOKED":
        return { icon: "close-circle", color: "#F44336" };
      default:
        return { icon: "help-circle", color: "#FF9800" };
    }
  };

  const getStatusText = () => {
    switch (licenceInfo?.statut) {
      case "ACTIVE":
        return "Licence Active ✅";
      case "DEMO":
        return "Mode Démo ⏳";
      case "EXPIRED":
        return "Licence Expirée ❌";
      case "REVOKED":
        return "Licence Révoquée 🚫";
      default:
        return "État Inconnu ❓";
    }
  };

  const getStatusDescription = () => {
    switch (licenceInfo?.statut) {
      case "ACTIVE":
        return `Votre licence est active et valide jusqu'au ${new Date(licenceInfo.dateExpiration || "").toLocaleDateString()}`;
      case "DEMO":
        return `Période d'essai: ${licenceInfo.joursRestants} jours restants`;
      case "EXPIRED":
        return "Votre licence a expiré. Contactez le support pour la renouveler.";
      case "REVOKED":
        return "Cette licence a été révoquée. Contactez le support.";
      default:
        return "Veuillez contacter le support pour activer votre licence.";
    }
  };

  const statusIcon = getStatusIcon();
  const isBlocked = licenceInfo?.statut === "EXPIRED" || licenceInfo?.statut === "REVOKED";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Vérification de la licence...</Text>
        <Text style={styles.loadingSubtext}>Veuillez patienter</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isBlocked ? "#D32F2F" : "#1565C0" }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          {/* ICÔNE D'ALERTE */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: statusIcon.color + "20",
                transform: [{ scale: isBlocked ? pulseAnim : 1 }],
              },
            ]}
          >
            <Ionicons name={statusIcon.icon as any} size={64} color={statusIcon.color} />
          </Animated.View>

          {/* TITRE */}
          <Text style={[styles.title, { color: statusIcon.color }]}>{getStatusText()}</Text>

          {/* DESCRIPTION */}
          <Text style={styles.message}>{getStatusDescription()}</Text>

          {/* COMPTE À REBOURS POUR BLOCAGE */}
          {isBlocked && countdown > 0 && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>Prochaine tentative dans</Text>
              <Text style={styles.countdownValue}>
                {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
              </Text>
            </View>
          )}

          {/* BOUTON DÉTAILS */}
          <TouchableOpacity style={styles.detailsToggle} onPress={() => setShowDetails(!showDetails)}>
            <Text style={styles.detailsToggleText}>
              {showDetails ? "Masquer les détails" : "Voir les détails de la licence"}
            </Text>
            <Ionicons name={showDetails ? "chevron-up" : "chevron-down"} size={20} color="#1565C0" />
          </TouchableOpacity>

          {showDetails && (
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ID Appareil</Text>
                <Text style={styles.detailValue}>{deviceInfo?.fingerprint || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Appareil</Text>
                <Text style={styles.detailValue}>{deviceInfo?.model || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Version</Text>
                <Text style={styles.detailValue}>{deviceInfo?.appVersion || "N/A"}</Text>
              </View>
              {licenceInfo?.nomTitulaire && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Titulaire</Text>
                  <Text style={styles.detailValue}>{licenceInfo.nomTitulaire}</Text>
                </View>
              )}
              {licenceInfo?.emailTitulaire && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{licenceInfo.emailTitulaire}</Text>
                </View>
              )}
              {licenceInfo?.dateActivation && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Activée le</Text>
                  <Text style={styles.detailValue}>
                    {new Date(licenceInfo.dateActivation).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {licenceInfo?.dateExpiration && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expire le</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      (licenceInfo.statut === "EXPIRED" || licenceInfo.statut === "REVOKED") &&
                        styles.warningText,
                    ]}
                  >
                    {new Date(licenceInfo.dateExpiration).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {licenceInfo?.joursRestants !== undefined && licenceInfo.joursRestants > 0 && (
                <View style={[styles.detailRow, styles.daysRow]}>
                  <Text style={styles.detailLabel}>Jours restants</Text>
                  <Text style={[styles.detailValue, styles.daysText]}>
                    {licenceInfo.joursRestants} jours
                  </Text>
                </View>
              )}
              {licenceInfo?.typeLicence && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type de licence</Text>
                  <Text style={[styles.detailValue, styles.licenceTypeText]}>
                    {licenceInfo.typeLicence}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* BOUTONS D'ACTION */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyToClipboard}>
              <Ionicons name="copy-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Copier ID</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} onPress={handleShareInfo}>
              <Ionicons name="share-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Partager</Text>
            </TouchableOpacity>
          </View>

          {/* CONTACT SUPPORT */}
          <TouchableOpacity style={styles.whatsappButton} onPress={handleContactSupport}>
            <Ionicons name="logo-whatsapp" size={24} color="#FFF" />
            <Text style={styles.whatsappButtonText}>Contacter {COMPANY_NAME}</Text>
          </TouchableOpacity>

          {/* RÉESSAYER */}
          {isBlocked && retryCount < 3 && (
            <TouchableOpacity
              style={[styles.retryButton, countdown > 0 && styles.retryButtonDisabled]}
              onPress={handleRetry}
              disabled={countdown > 0}
            >
              <Ionicons name="refresh-outline" size={20} color="#1565C0" />
              <Text style={styles.retryButtonText}>
                {countdown > 0 ? `Réessayer dans ${countdown}s` : "Vérifier à nouveau"}
              </Text>
            </TouchableOpacity>
          )}

          {/* BOUTON D'ACTIVATION */}
          {isBlocked && (
            <TouchableOpacity style={styles.activateButton} onPress={() => setShowActivationModal(true)}>
              <Ionicons name="key-outline" size={20} color="#FFF" />
              <Text style={styles.activateButtonText}>Activer ma licence</Text>
            </TouchableOpacity>
          )}

          {/* FOOTER */}
          <View>
            <Text style={styles.versionText}>
              Stockia v{deviceInfo?.appVersion || "1.0"} — Propulsé par {COMPANY_NAME}
            </Text>
            <Text style={styles.copyrightText}>
              © {new Date().getFullYear()} {COMPANY_NAME}. Tous droits réservés.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* MODAL D'ACTIVATION */}
      <Modal
        visible={showActivationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActivationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔑 Activation de licence</Text>
              <TouchableOpacity onPress={() => setShowActivationModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>
              Entrez votre code d'activation reçu par email ou WhatsApp.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Code d'activation"
              placeholderTextColor="#999"
              value={activationCode}
              onChangeText={setActivationCode}
              autoCapitalize="characters"
              maxLength={20}
            />

            <TouchableOpacity
              style={[styles.modalConfirmButton, activating && styles.modalButtonDisabled]}
              onPress={handleActivate}
              disabled={activating}
            >
              {activating ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.modalConfirmText}>Activer</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalContactButton} onPress={handleContactSupport}>
              <Text style={styles.modalContactText}>
                Vous n'avez pas de code ? Contactez le support
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL SUCCÈS */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.successModal]}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>✅ Licence activée !</Text>
            <Text style={styles.successText}>
              Votre licence a été activée avec succès. L'application va redémarrer.
            </Text>
            <View style={styles.successLoader}>
              <ActivityIndicator size="large" color="#1565C0" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    fontSize: 16,
    color: "#1565C0",
    marginTop: 16,
    fontWeight: "500",
  },
  loadingSubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  countdownContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  countdownLabel: {
    fontSize: 12,
    color: "#999",
  },
  countdownValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#D32F2F",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 4,
  },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  detailsToggleText: {
    fontSize: 14,
    color: "#1565C0",
    fontWeight: "500",
    marginRight: 8,
  },
  detailsContainer: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  daysRow: {
    borderBottomWidth: 0,
  },
  daysText: {
    color: "#1565C0",
    fontSize: 15,
    fontWeight: "bold",
  },
  warningText: {
    color: "#D32F2F",
  },
  licenceTypeText: {
    color: "#6A1B9A",
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
    marginBottom: 12,
  },
  copyButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1565C0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#6A1B9A",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  whatsappButton: {
    flexDirection: "row",
    backgroundColor: "#25D366",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },
  whatsappButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  retryButton: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  retryButtonDisabled: {
    opacity: 0.5,
  },
  retryButtonText: {
    fontSize: 14,
    color: "#1565C0",
    fontWeight: "500",
  },
  activateButton: {
    flexDirection: "row",
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
  },
  activateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  versionText: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
  },
  copyrightText: {
    fontSize: 10,
    color: "#CCC",
    textAlign: "center",
    marginTop: 4,
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
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 2,
    color: "#333",
  },
  modalConfirmButton: {
    backgroundColor: "#1565C0",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  modalButtonDisabled: {
    backgroundColor: "#90CAF9",
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  modalContactButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  modalContactText: {
    fontSize: 13,
    color: "#1565C0",
    fontWeight: "500",
  },
  successModal: {
    alignItems: "center",
    paddingVertical: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  successLoader: {
    paddingVertical: 8,
  },
});

export default LicenceBlockScreen;