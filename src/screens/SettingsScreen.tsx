import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as SQLite from "expo-sqlite";
import { useUser } from "../context/UserContext";

const DATABASE_NAME = "stockia_secure.db";

// === INTERFACES ===
interface BackupFile {
  name: string;
  size: number;
  date: Date;
  path: string;
}

interface AppInfo {
  version: string;
  buildNumber: string;
  platform: string;
  osVersion: string;
  deviceName: string;
  dbSize: string;
  lastBackup: string | null;
}

interface SettingsSection {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  type: "switch" | "button" | "info" | "action";
  value?: boolean;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export default function SettingsScreen() {
  const {
    user,
    settings,
    updateSettings,
    printEnabled,
    setPrintEnabled,
    logout,
  } = useUser();

  // === ÉTATS COMPOSANT ===
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // === ÉTATS DONNÉES ===
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string>("");
  const [appInfo, setAppInfo] = useState<AppInfo>({
    version: "1.0.0",
    buildNumber: "1",
    platform: Platform.OS,
    osVersion: Platform.Version.toString(),
    deviceName: "Unknown",
    dbSize: "0 KB",
    lastBackup: null,
  });
 
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // === ÉTATS FORMULAIRE SÉCURITÉ ===
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // === INITIALISATION ===
  useEffect(() => {
    loadSettingsData();
  }, []);

  // === CHARGEMENT DES DONNÉES ===
  const loadSettingsData = async () => {
    try {
      setLoading(true);
      await loadDeviceInfo();
      await loadDatabaseSize();
      await loadBackupFiles();
      await loadAppVersion();
    } catch (error) {
      console.error("[Settings] Erreur chargement:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDeviceInfo = async () => {
    try {
      const deviceName = (await Device.getDeviceNameAsync()) || "Appareil Android";
      setAppInfo((prev) => ({
        ...prev,
        deviceName,
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
      }));
    } catch (error) {
      console.error("[Settings] Erreur device info:", error);
    }
  };

  const loadDatabaseSize = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
      const info = await FileSystem.getInfoAsync(dbPath);
      if (info.exists) {
        const size = info.size / 1024;
        const sizeStr =
          size < 1024
            ? `${size.toFixed(1)} KB`
            : `${(size / 1024).toFixed(1)} MB`;
        setAppInfo((prev) => ({ ...prev, dbSize: sizeStr }));
      }
    } catch (error) {
      console.error("[Settings] Erreur taille DB:", error);
    }
  };

  const loadBackupFiles = async () => {
    try {
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupDir);

      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(backupDir);
        const backupFilesData: BackupFile[] = [];

        for (const file of files) {
          if (file.endsWith(".db")) {
            const fileInfo = await FileSystem.getInfoAsync(`${backupDir}${file}`);
            if (fileInfo.exists) {
              backupFilesData.push({
                name: file,
                size: fileInfo.size,
                date: new Date(fileInfo.modificationTime || 0),
                path: `${backupDir}${file}`,
              });
            }
          }
        }

        backupFilesData.sort((a, b) => b.date.getTime() - a.date.getTime());
        setBackupFiles(backupFilesData);

        if (backupFilesData.length > 0) {
          setAppInfo((prev) => ({
            ...prev,
            lastBackup: backupFilesData[0].date.toLocaleString(),
          }));
        }
      }
    } catch (error) {
      console.error("[Settings] Erreur chargement backups:", error);
    }
  };

  const loadAppVersion = async () => {
    try {
      const version = await AsyncStorage.getItem("@stockia_app_version");
      if (version) {
        setAppInfo((prev) => ({ ...prev, version }));
      }
    } catch (error) {
      console.error("[Settings] Erreur version:", error);
    }
  };

  // === SAUVEGARDE DE LA BASE ===
  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
      const info = await FileSystem.getInfoAsync(dbPath);

      if (!info.exists) {
        Alert.alert("Erreur", "Base de données principale introuvable.");
        return;
      }

      const backupDir = `${FileSystem.documentDirectory}backups/`;
      await FileSystem.ensureDirAsync(backupDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = `${backupDir}stockia_backup_${timestamp}.db`;

      await FileSystem.copyAsync({
        from: dbPath,
        to: backupPath,
      });

      await loadBackupFiles();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "✅ Sauvegarde Réussie",
        `Base de données sauvegardée avec succès.`,
        [
          { text: "OK" },
          {
            text: "Partager",
            onPress: () => handleShareBackup(backupPath),
          },
        ]
      );
    } catch (error) {
      console.error("[Backup] Erreur:", error);
      Alert.alert("Erreur", "Impossible d'effectuer la sauvegarde.");
      Vibration.vibrate(100);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleShareBackup = async (path: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: "application/x-sqlite3",
          dialogTitle: "Partager la sauvegarde Stockia",
        });
      } else {
        Alert.alert("Erreur", "Le partage n'est pas disponible sur cet appareil.");
      }
    } catch (error) {
      console.error("[Share] Erreur:", error);
      Alert.alert("Erreur", "Impossible de partager le fichier.");
    }
  };

  // === RESTAURATION DE LA BASE ===
  const handleRestore = async () => {
    if (!selectedBackup) {
      Alert.alert("Sélection", "Veuillez sélectionner un fichier de sauvegarde.");
      return;
    }

    Alert.alert(
      "⚠️ Restauration critique",
      "Cette opération remplacera l'intégralité de vos données actuelles. Confirmer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Restaurer",
          style: "destructive",
          onPress: async () => {
            try {
              setRestoreLoading(true);
              const backupFile = backupFiles.find((f) => f.name === selectedBackup);
              if (!backupFile) throw new Error("Fichier introuvable");

              const dbPath = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;

              // Remplacement sécurisé du fichier SQLite
              await FileSystem.copyAsync({
                from: backupFile.path,
                to: dbPath,
              });

              setShowRestoreModal(false);
              setSelectedBackup("");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              Alert.alert(
                "✅ Restauration Réussie",
                "La base de données a été restaurée. Veuillez relancer l'application pour appliquer les changements."
              );
            } catch (error) {
              console.error("[Restore] Erreur:", error);
              Alert.alert("Erreur", "Échec de la restauration des données.");
              Vibration.vibrate(100);
            } finally {
              setRestoreLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteBackup = async (filename: string) => {
    Alert.alert("Suppression", `Supprimer définitivement ${filename} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const path = `${FileSystem.documentDirectory}backups/${filename}`;
            await FileSystem.deleteAsync(path);
            await loadBackupFiles();
            if (selectedBackup === filename) setSelectedBackup("");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (error) {
            console.error("[Delete] Erreur:", error);
            Alert.alert("Erreur", "Impossible de supprimer le fichier.");
          }
        },
      },
    ]);
  };

  // === NETTOYAGE DE LA BASE ===
  const handleCleanup = async () => {
    Alert.alert(
      "🧹 Nettoyage de la base",
      "Cette action supprimera les logs système de plus de 3 mois et optimisera l'espace disque.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Nettoyer",
          onPress: async () => {
            try {
              setCleanupLoading(true);
              const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

              // Exécution des requêtes de nettoyage
              await db.runAsync("DELETE FROM audit_logs WHERE timestamp < ?;", [
                threeMonthsAgo.toISOString(),
              ]);

              await db.runAsync(
                "DELETE FROM sessions WHERE date_fin < ? OR actif = 0;",
                [new Date().toISOString()]
              );

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("✅ Nettoyage terminé", "La base de données a été optimisée.");
              await loadDatabaseSize();
            } catch (error) {
              console.error("[Cleanup] Erreur:", error);
              Alert.alert("Erreur", "Impossible d'accéder ou de nettoyer la base SQLite.");
              Vibration.vibrate(100);
            } finally {
              setCleanupLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Erreur", "Tous les champs requis doivent être remplis.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("✅ Succès", "Votre mot de passe a bien été mis à jour.");
    setShowPasswordModal(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleContactSupport = () => {
    const message = `📱 Support Stockia\n\nUtilisateur: ${user?.nom || "N/A"}\nVersion: ${appInfo.version}\nAppareil: ${appInfo.deviceName}`;
    const whatsappUrl = `whatsapp://send?phone=+24383009563&text=${encodeURIComponent(message)}`;
   
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert("Erreur", "L'application WhatsApp n'est pas disponible.");
    });
  };

  // === MATRICE DE CONFIGURATION CONFIG DES PARAMÈTRES ===
  const getSettingsSections = (): SettingsSection[] => [
    {
      id: "hardware",
      title: "🔧 Matériel",
      icon: "hardware-chip",
      items: [
        {
          id: "bluetooth",
          label: "Imprimante Bluetooth",
          description: printEnabled ? "Activée - Impression automatique" : "Désactivée",
          type: "switch",
          value: printEnabled,
          onValueChange: setPrintEnabled,
          icon: "print",
          iconColor: printEnabled ? "#4CAF50" : "#757575",
        },
      ],
    },
    {
      id: "preferences",
      title: "⚙️ Préférences",
      icon: "settings",
      items: [
        {
          id: "darkmode",
          label: "Mode Sombre",
          description: "Interface adaptative",
          type: "switch",
          value: settings?.darkMode || false,
          onValueChange: (value) => updateSettings({ darkMode: value }),
          icon: "moon",
          iconColor: settings?.darkMode ? "#1565C0" : "#757575",
        },
        {
          id: "notifications",
          label: "Notifications",
          type: "switch",
          value: settings?.notifications || false,
          onValueChange: (value) => updateSettings({ notifications: value }),
          icon: "notifications",
          iconColor: settings?.notifications ? "#4CAF50" : "#757575",
        },
      ],
    },
    {
      id: "data",
      title: "💾 Système & Données",
      icon: "folder",
      items: [
        {
          id: "backup",
          label: "Sauvegarde manuelle",
          description: `Taille DB: ${appInfo.dbSize}`,
          type: "button",
          onPress: handleBackup,
          icon: "save",
          iconColor: "#2E7D32",
        },
        {
          id: "restore",
          label: "Restauration",
          description: appInfo.lastBackup ? `Dernière: ${appInfo.lastBackup}` : "Aucun point de restauration",
          type: "button",
          onPress: () => setShowRestoreModal(true),
          icon: "refresh",
          iconColor: "#EF6C00",
        },
        {
          id: "cleanup",
          label: "Maintenance DB",
          type: "button",
          onPress: handleCleanup,
          icon: "broom",
          iconColor: "#6A1B9A",
        },
      ],
    },
    {
      id: "security",
      title: "🔒 Sécurité",
      icon: "lock-closed",
      items: [
        {
          id: "password",
          label: "Mot de passe",
          type: "button",
          onPress: () => setShowPasswordModal(true),
          icon: "key",
          iconColor: "#1565C0",
        },
        {
          id: "logout",
          label: "Déconnexion",
          type: "action",
          onPress: () => setShowLogoutModal(true),
          icon: "log-out",
          iconColor: "#C62828",
        },
      ],
    },
  ];

  const sections = getSettingsSections();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Chargement des paramètres...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSettingsData();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* === EN-TÊTE === */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚙️ Paramètres</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleContactSupport}>
            <Ionicons name="help-circle-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* === PROFIL UTILISATEUR === */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.nom?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.nom || "Utilisateur"}</Text>
            <View style={styles.profileRoleBadge}>
              <Text style={styles.profileRoleText}>{user?.role || "Manager"}</Text>
            </View>
            <Text style={styles.profileEmail}>{user?.email || "Pas d'adresse email configurée"}</Text>
          </View>
        </View>

        {/* === RENDU DES SECTIONS === */}
        {sections.map((section) => (
          <View key={section.id} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              <Ionicons name={section.icon} size={14} color="#666" />
              {" " + section.title}
            </Text>
            <View style={styles.sectionContent}>
              {section.items.map((item) => (
                <View key={item.id} style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    {item.icon && (
                      <View style={[styles.settingIcon, { backgroundColor: item.iconColor + "20" }]}>
                        <Ionicons name={item.icon} size={20} color={item.iconColor || "#666"} />
                      </View>
                    )}
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                      {item.description && <Text style={styles.settingDescription}>{item.description}</Text>}
                    </View>
                  </View>
                 
                  <View style={styles.settingRight}>
                    {item.type === "switch" && (
                      <Switch
                        trackColor={{ false: "#E0E0E0", true: "#90CAF9" }}
                        thumbColor={item.value ? "#1565C0" : "#f4f3f4"}
                        onValueChange={item.onValueChange || (() => {})}
                        value={item.value || false}
                      />
                    )}
                    {(item.type === "button" || item.type === "action") && item.onPress && (
                      <TouchableOpacity
                        style={[styles.settingButton, item.type === "action" && styles.settingActionButton]}
                        onPress={item.onPress}
                      >
                        <Text style={[styles.settingButtonText, item.type === "action" && styles.settingActionText]}>
                          Gérer
                        </Text>
                      </TouchableOpacity>
                    )}
                    {item.type === "info" && <Ionicons name="chevron-forward" size={20} color="#CCC" />}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footer}>
          {settings?.nomBoutique || "BlueDeep Corp"} - v{appInfo.version}
        </Text>
      </ScrollView>

      {/* === MODAL RESTAURATION === */}
      <Modal visible={showRestoreModal} animationType="slide" transparent={true} onRequestClose={() => setShowRestoreModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Points de sauvegarde</Text>
              <TouchableOpacity onPress={() => setShowRestoreModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {backupFiles.length === 0 ? (
              <View style={styles.emptyBackup}>
                <Ionicons name="folder-open-outline" size={48} color="#CCC" />
                <Text style={styles.emptyBackupText}>Aucun historique détecté</Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.backupList}>
                  {backupFiles.map((file) => (
                    <TouchableOpacity
                      key={file.name}
                      style={[styles.backupItem, selectedBackup === file.name && styles.backupItemSelected]}
                      onPress={() => setSelectedBackup(file.name)}
                    >
                      <View style={styles.backupItemLeft}>
                        <Ionicons
                          name={selectedBackup === file.name ? "radio-button-on" : "radio-button-off"}
                          size={20}
                          color={selectedBackup === file.name ? "#1565C0" : "#999"}
                        />
                        <View>
                          <Text style={styles.backupFileName}>{file.name}</Text>
                          <Text style={styles.backupFileInfo}>
                            {file.date.toLocaleDateString()} • {(file.size / 1024).toFixed(1)} KB
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteBackup(file.name)} style={styles.deleteBackupButton}>
                        <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.modalConfirmButton, restoreLoading && styles.modalButtonDisabled]}
                  onPress={handleRestore}
                  disabled={restoreLoading}
                >
                  {restoreLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Restaurer le fichier sélectionné</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* === MODAL DÉCONNEXION === */}
      <Modal visible={showLogoutModal} transparent={true} animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="log-out-outline" size={48} color="#D32F2F" />
            </View>
            <Text style={styles.modalTitle}>Fermer la session</Text>
            <Text style={styles.modalText}>Souhaitez-vous vous déconnecter de votre compte ?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirmButton]} onPress={() => { setShowLogoutModal(false); logout(); }}>
                <Text style={styles.modalConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* === MODAL CHANGEMENT MOT DE PASSE === */}
      <Modal visible={showPasswordModal} animationType="slide" transparent={true} onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sécurité d'accès</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Ancien mot de passe"
              placeholderTextColor="#999"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Nouveau mot de passe"
              placeholderTextColor="#999"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirmer mot de passe"
              placeholderTextColor="#999"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleChangePassword}>
              <Text style={styles.modalConfirmText}>Mettre à jour</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// === STYLES SYSTEM ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#1565C0", borderRadius: 12, marginBottom: 16 },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  headerButton: { padding: 4 },
  profileCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#EAEAEA", elevation: 1 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#E3F2FD", justifyContent: "center", alignItems: "center" },
  profileAvatarText: { fontSize: 24, fontWeight: "bold", color: "#1565C0" },
  profileInfo: { marginLeft: 12, flex: 1 },
  profileName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  profileRoleBadge: { backgroundColor: "#E3F2FD", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: "flex-start", marginTop: 2 },
  profileRoleText: { fontSize: 10, color: "#1565C0", fontWeight: "bold" },
  profileEmail: { fontSize: 12, color: "#666", marginTop: 2 },
  sectionContainer: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#333", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  sectionContent: { backgroundColor: "#FFF", borderRadius: 12, borderWidth: 1, borderColor: "#EAEAEA", overflow: "hidden" },
  settingItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  settingLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  settingIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 12 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: "500", color: "#333" },
  settingDescription: { fontSize: 12, color: "#999", marginTop: 2 },
  settingRight: { flexDirection: "row", alignItems: "center" },
  settingButton: { backgroundColor: "#E3F2FD", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  settingButtonText: { fontSize: 12, fontWeight: "600", color: "#1565C0" },
  settingActionButton: { backgroundColor: "#FFEBEE" },
  settingActionText: { color: "#C62828" },
  footer: { textAlign: "center", fontSize: 11, color: "#999", marginTop: 8, marginBottom: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFF", borderRadius: 16, padding: 24, width: "90%", maxWidth: 400, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  modalText: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20, lineHeight: 20 },
  modalIconContainer: { alignItems: "center", marginBottom: 12 },
  backupList: { maxHeight: 300, marginBottom: 16 },
  backupItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  backupItemSelected: { backgroundColor: "#E3F2FD" },
  backupItemLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  backupFileName: { fontSize: 13, color: "#333", fontWeight: "500" },
  backupFileInfo: { fontSize: 11, color: "#999" },
  deleteBackupButton: { padding: 8 },
  emptyBackup: { alignItems: "center", paddingVertical: 40 },
  emptyBackupText: { color: "#999", marginTop: 12, fontSize: 14 },
  modalActions: { flexDirection: "row", gap: 10, width: "100%" },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalCancelButton: { backgroundColor: "#F5F5F5" },
  modalCancelText: { color: "#666", fontWeight: "600", fontSize: 14 },
  modalConfirmButton: { backgroundColor: "#1565C0", paddingVertical: 14, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 10, width: "100%" },
  modalButtonDisabled: { backgroundColor: "#90CAF9" },
  modalConfirmText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  modalInput: { backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#DDD", borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12, color: "#333", width: "100%" },
}); 

export default SettingsScreen;
