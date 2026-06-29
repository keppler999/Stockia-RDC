import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard"; // Remplacé par expo-clipboard qui fonctionne nativement avec Expo sans config externe complexe
import * as Haptics from "expo-haptics";
import * as SQLite from "expo-sqlite";
import { useUser } from "../context/UserContext";

const DATABASE_NAME = "stockia_secure.db";
const { width } = Dimensions.get("window");

// === INTERFACES ===
interface User {
  id: number;
  nom: string;
  username: string;
  role: "ADMIN" | "GERANT" | "CAISSIER" | "MAGASINIER";
  email?: string;
  actif: number;
  derniere_connexion?: string;
  created_at: string;
  magasin_id?: number;
  magasin_nom?: string;
}

interface UserFormData {
  nom: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: User["role"];
  email: string;
  actif: boolean;
  magasin_id: string;
}

interface RoleConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
}

interface ActivityLog {
  action: string;
  details?: string;
  timestamp: string;
}

// === CONFIGURATION DES RÔLES ===
const ROLE_CONFIG: Record<User["role"], RoleConfig> = {
  ADMIN: {
    label: "Administrateur",
    icon: "shield-checkmark",
    color: "#C62828",
    description: "Accès complet à toutes les fonctionnalités",
  },
  GERANT: {
    label: "Gérant",
    icon: "business",
    color: "#1565C0",
    description: "Gestion des opérations, rapports et stock",
  },
  CAISSIER: {
    label: "Caissier",
    icon: "cash",
    color: "#2E7D32",
    description: "Gestion des ventes et des clients",
  },
  MAGASINIER: {
    label: "Magasinier",
    icon: "cube",
    color: "#EF6C00",
    description: "Gestion du stock et des approvisionnements",
  },
};

const ROLES: User["role"][] = ["ADMIN", "GERANT", "CAISSIER", "MAGASINIER"];
const DEFAULT_PASSWORD = "Stockia@2024";

export default function UserManagementScreen() {
  const { user } = useUser();

  // === ÉTATS ===
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("Tous");
  const [magasins, setMagasins] = useState<{ id: number; nom: string }[]>([]);

  // === ÉTATS MODAL ===
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    nom: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "CAISSIER",
    email: "",
    actif: true,
    magasin_id: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // === ÉTATS MODAL DÉTAILS ===
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivities, setUserActivities] = useState<ActivityLog[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // === CHARGEMENT DES UTILISATEURS ===
  const loadUsers = async () => {
    try {
      setLoading(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const results = await db.getAllAsync<User>(
        `SELECT u.*, m.nom as magasin_nom
         FROM utilisateurs u
         LEFT JOIN magasins m ON u.magasin_id = m.id
         ORDER BY u.nom ASC;`
      );
      setUsers(results || []);
      setFilteredUsers(results || []);
    } catch (error) {
      console.error("[UserManagement] Erreur chargement:", error);
      Alert.alert("Erreur", "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // === CHARGEMENT DES MAGASINS ===
  const loadMagasins = async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const results = await db.getAllAsync<{ id: number; nom: string }>(
        "SELECT id, nom FROM magasins WHERE actif = 1 ORDER BY nom ASC;"
      );
      setMagasins(results || []);
    } catch (error) {
      console.error("[UserManagement] Erreur magasins:", error);
    }
  };

  // === INITIALISATION ===
  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadUsers();
      loadMagasins();
    }
  }, [user]);

  // === FILTRAGE ===
  useEffect(() => {
    let filtered = [...users];

    if (filterRole !== "Tous") {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (u) =>
          u.nom.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          (u.email && u.email.toLowerCase().includes(query))
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, filterRole, users]);

  // Sécurité : seul Admin peut accéder
  if (user?.role !== "ADMIN") {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed" size={64} color="#C62828" />
        <Text style={styles.unauthorizedTitle}>Accès Refusé</Text>
        <Text style={styles.unauthorizedText}>
          Cette section est réservée aux administrateurs.
        </Text>
      </View>
    );
  }

  // === RAFRAÎCHISSEMENT ===
  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
    loadMagasins();
  };

  // === OUVERTURE MODAL ===
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      nom: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "CAISSIER",
      email: "",
      actif: true,
      magasin_id: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setModalVisible(true);
  };

  const openEditModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setFormData({
      nom: targetUser.nom,
      username: targetUser.username,
      password: "",
      confirmPassword: "",
      role: targetUser.role,
      email: targetUser.email || "",
      actif: targetUser.actif === 1,
      magasin_id: targetUser.magasin_id?.toString() || "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setModalVisible(true);
  };

  // === CHARGEMENT DES ACTIVITÉS ===
  const loadUserActivities = async (userId: number) => {
    try {
      setActivitiesLoading(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const results = await db.getAllAsync<ActivityLog>(
        `SELECT action, details, timestamp
         FROM audit_logs
         WHERE utilisateur_id = ?
         ORDER BY timestamp DESC
         LIMIT 20;`,
        [userId]
      );
      setUserActivities(results || []);
    } catch (error) {
      console.error("[UserManagement] Erreur activités:", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const openDetailModal = (targetUser: User) => {
    setSelectedUser(targetUser);
    setShowDetailModal(true);
    loadUserActivities(targetUser.id);
  };

  // === SAUVEGARDE ===
  const handleSaveUser = async () => {
    if (!formData.nom.trim() || !formData.username.trim() || !formData.role) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires (*).");
      return;
    }

    if (!editingUser) {
      if (!formData.password || formData.password.length < 6) {
        Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
        return;
      }
    }

    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      if (editingUser) {
        let query = "UPDATE utilisateurs SET nom = ?, username = ?, role = ?, email = ?, magasin_id = ?, actif = ?";
        const values: any[] = [
          formData.nom.trim(),
          formData.username.trim(),
          formData.role,
          formData.email.trim() || null,
          formData.magasin_id ? parseInt(formData.magasin_id) : null,
          formData.actif ? 1 : 0,
        ];

        if (formData.password) {
          query += ", password = ?";
          values.push(formData.password);
        }

        query += " WHERE id = ?;";
        values.push(editingUser.id);

        await db.runAsync(query, values);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Succès", "Utilisateur mis à jour avec succès.");
      } else {
        await db.runAsync(
          `INSERT INTO utilisateurs (nom, username, password, role, email, magasin_id, actif, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            formData.nom.trim(),
            formData.username.trim(),
            formData.password || DEFAULT_PASSWORD,
            formData.role,
            formData.email.trim() || null,
            formData.magasin_id ? parseInt(formData.magasin_id) : null,
            formData.actif ? 1 : 0,
            new Date().toISOString(),
          ]
        );

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Succès", `Utilisateur créé.\nMot de passe: ${formData.password || DEFAULT_PASSWORD}`);
      }

      setModalVisible(false);
      loadUsers();
    } catch (error) {
      console.error("[UserManagement] Erreur sauvegarde:", error);
      Alert.alert("Erreur", "Impossible d'enregistrer l'utilisateur.");
    }
  };

  // === SUPPRESSION ===
  const handleDeleteUser = (targetUser: User) => {
    if (targetUser.id === 1) {
      Alert.alert("Action interdite", "L'administrateur principal ne peut pas être supprimé.");
      return;
    }

    Alert.alert(
      "Supprimer l'utilisateur",
      `Voulez-vous vraiment supprimer "${targetUser.nom}" ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
              await db.runAsync("DELETE FROM utilisateurs WHERE id = ?;", [targetUser.id]);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Succès", "Utilisateur supprimé.");
              loadUsers();
            } catch (error) {
              console.error("[UserManagement] Erreur suppression:", error);
              Alert.alert("Erreur", "Impossible de supprimer l'utilisateur.");
            }
          },
        },
      ]
    );
  };

  // === RÉINITIALISATION DU MOT DE PASSE ===
  const handleResetPassword = (targetUser: User) => {
    Alert.alert(
      "Réinitialiser le mot de passe",
      `Voulez-vous réinitialiser le mot de passe de "${targetUser.nom}" ?\n\nLe nouveau mot de passe sera: ${DEFAULT_PASSWORD}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          onPress: async () => {
            try {
              const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
              await db.runAsync("UPDATE utilisateurs SET password = ? WHERE id = ?;", [DEFAULT_PASSWORD, targetUser.id]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Succès", `Mot de passe réinitialisé à: ${DEFAULT_PASSWORD}`);
            } catch (error) {
              console.error("[UserManagement] Erreur reset:", error);
              Alert.alert("Erreur", "Impossible de réinitialiser le mot de passe.");
            }
          },
        },
      ]
    );
  };

  // === COPIER LE MOT DE PASSE ===
  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Copié", "Copié dans le presse-papiers.");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* EN-TÊTE */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>👤 Gestion des Utilisateurs</Text>
          <Text style={styles.count}>{filteredUsers.length} utilisateurs</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filterRole === "Tous" && styles.filterChipActive]}
            onPress={() => setFilterRole("Tous")}
          >
            <Text style={[styles.filterChipText, filterRole === "Tous" && styles.filterChipTextActive]}>Tous</Text>
          </TouchableOpacity>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.filterChip, filterRole === role && styles.filterChipActive]}
              onPress={() => setFilterRole(role)}
            >
              <Text style={[styles.filterChipText, filterRole === role && styles.filterChipTextActive]}>
                {ROLE_CONFIG[role].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTE */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const roleConfig = ROLE_CONFIG[item.role];
          return (
            <TouchableOpacity style={styles.userCard} onPress={() => openDetailModal(item)} activeOpacity={0.7}>
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <View style={styles.userNameContainer}>
                    <View style={[styles.roleIndicator, { backgroundColor: roleConfig.color }]} />
                    <Text style={styles.userName}>{item.nom}</Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: roleConfig.color + "20" }]}>
                    <Ionicons name={roleConfig.icon} size={14} color={roleConfig.color} />
                    <Text style={[styles.roleBadgeText, { color: roleConfig.color }]}>{roleConfig.label}</Text>
                  </View>
                </View>

                <Text style={styles.userDetail}>
                  <Ionicons name="person-outline" size={14} color="#666" /> @{item.username}
                </Text>
                {item.email && (
                  <Text style={styles.userDetail}>
                    <Ionicons name="mail-outline" size={14} color="#666" /> {item.email}
                  </Text>
                )}
                {item.magasin_nom && (
                  <Text style={styles.userDetail}>
                    <Ionicons name="business-outline" size={14} color="#666" /> {item.magasin_nom}
                  </Text>
                )}

                <View style={styles.userFooter}>
                  <View style={[styles.statusBadge, item.actif === 1 ? styles.statusActive : styles.statusInactive]}>
                    <Text style={styles.statusText}>{item.actif === 1 ? "Actif" : "Inactif"}</Text>
                  </View>
                  {item.derniere_connexion && (
                    <Text style={styles.lastLogin}>
                      Déc: {new Date(item.derniere_connexion).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.userActions}>
                <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => openEditModal(item)}>
                  <Ionicons name="create-outline" size={18} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={() => handleResetPassword(item)}>
                  <Ionicons name="key-outline" size={18} color="#FFF" />
                </TouchableOpacity>

                {item.id !== 1 && (
                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteUser(item)}>
                    <Ionicons name="trash-outline" size={18} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* BOUTON AJOUT (FAB) */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      {/* MODAL ENREGISTREMENT / MODIFICATION */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nom complet *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Jean Mbuyi"
              value={formData.nom}
              onChangeText={(text) => setFormData({ ...formData, nom: text })}
            />

            <Text style={styles.inputLabel}>Nom d'utilisateur *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: jeanm"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text.toLowerCase() })}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: jean@email.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Rôle *</Text>
            <View style={styles.roleSelector}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleOption, formData.role === role && styles.roleOptionActive]}
                  onPress={() => setFormData({ ...formData, role })}
                >
                  <Ionicons
                    name={ROLE_CONFIG[role].icon}
                    size={20}
                    color={formData.role === role ? "#FFF" : ROLE_CONFIG[role].color}
                  />
                  <Text style={[styles.roleOptionText, formData.role === role && styles.roleOptionTextActive]}>
                    {ROLE_CONFIG[role].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Mot de passe {editingUser ? "(laisser vide pour conserver)" : "*"}</Text>
            <View style={styles.passwordFieldWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={editingUser ? "Nouveau mot de passe..." : "Mot de passe"}
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {!editingUser && (
              <>
                <Text style={styles.inputLabel}>Confirmer le mot de passe *</Text>
                <View style={styles.passwordFieldWrapper}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Confirmer le mot de passe"
                    secureTextEntry={!showConfirmPassword}
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {magasins.length > 0 && (
              <>
                <Text style={styles.inputLabel}>Magasin</Text>
                <View style={styles.magasinSelector}>
                  <TouchableOpacity
                    style={[styles.magasinOption, !formData.magasin_id && styles.magasinOptionActive]}
                    onPress={() => setFormData({ ...formData, magasin_id: "" })}
                  >
                    <Text style={[styles.magasinOptionText, !formData.magasin_id && styles.magasinOptionTextActive]}>Aucun</Text>
                  </TouchableOpacity>
                  {magasins.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.magasinOption, formData.magasin_id === m.id.toString() && styles.magasinOptionActive]}
                      onPress={() => setFormData({ ...formData, magasin_id: m.id.toString() })}
                    >
                      <Text style={[styles.magasinOptionText, formData.magasin_id === m.id.toString() && styles.magasinOptionTextActive]}>
                        {m.nom}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Compte actif</Text>
              <Switch
                trackColor={{ false: "#E0E0E0", true: "#90CAF9" }}
                thumbColor={formData.actif ? "#1565C0" : "#f4f3f4"}
                onValueChange={(value) => setFormData({ ...formData, actif: value })}
                value={formData.actif}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveUser}>
              <Text style={styles.saveButtonText}>{editingUser ? "Mettre à jour" : "Créer l'utilisateur"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL DÉTAILS */}
      <Modal visible={showDetailModal} animationType="slide" transparent={true} onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detailModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails de l'utilisateur</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.detailContent}>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailAvatarText}>{selectedUser.nom.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.detailName}>{selectedUser.nom}</Text>
                <View style={[styles.detailRoleBadge, { backgroundColor: ROLE_CONFIG[selectedUser.role].color + "20" }]}>
                  <Ionicons name={ROLE_CONFIG[selectedUser.role].icon} size={16} color={ROLE_CONFIG[selectedUser.role].color} />
                  <Text style={[styles.detailRoleText, { color: ROLE_CONFIG[selectedUser.role].color }]}>
                    {ROLE_CONFIG[selectedUser.role].label}
                  </Text>
                </View>

                <View style={styles.detailInfo}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nom d'utilisateur</Text>
                    <Text style={styles.detailValue}>@{selectedUser.username}</Text>
                  </View>
                  {selectedUser.email && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Email</Text>
                      <Text style={styles.detailValue}>{selectedUser.email}</Text>
                    </View>
                  )}
                  {selectedUser.magasin_nom && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Magasin</Text>
                      <Text style={styles.detailValue}>{selectedUser.magasin_nom}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Statut</Text>
                    <Text style={[styles.detailValue, selectedUser.actif === 1 ? styles.statusActiveText : styles.statusInactiveText]}>
                      {selectedUser.actif === 1 ? "Actif" : "Inactif"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date d'inscription</Text>
                    <Text style={styles.detailValue}>{new Date(selectedUser.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>

                <Text style={styles.detailActivitiesTitle}>📋 Activités récentes</Text>
                {activitiesLoading ? (
                  <ActivityIndicator size="small" color="#1565C0" style={styles.detailLoader} />
                ) : userActivities.length === 0 ? (
                  <Text style={styles.detailEmpty}>Aucune activité récente</Text>
                ) : (
                  <FlatList
                    data={userActivities}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                      <View style={styles.activityItem}>
                        <Text style={styles.activityAction}>{item.action}</Text>
                        <Text style={styles.activityDetail}>{item.details || "—"}</Text>
                        <Text style={styles.activityDate}>{new Date(item.timestamp).toLocaleString()}</Text>
                      </View>
                    )}
                    style={styles.activityList}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 14 },
  unauthorizedContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#F8F9FA" },
  unauthorizedTitle: { fontSize: 22, fontWeight: "bold", color: "#333", marginTop: 16 },
  unauthorizedText: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 8 },
  header: { padding: 16, backgroundColor: "#1565C0", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  count: { color: "#FFF", fontSize: 13, opacity: 0.8, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#333" },
  filterScroll: { flexDirection: "row" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", marginRight: 8 },
  filterChipActive: { backgroundColor: "#FFF" },
  filterChipText: { color: "#FFF", fontSize: 12, fontWeight: "500" },
  filterChipTextActive: { color: "#1565C0" },
  listContent: { paddingHorizontal: 12, paddingBottom: 80 },
  userCard: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#FFF", padding: 14, marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: "#EAEAEA", elevation: 2 },
  userInfo: { flex: 1 },
  userHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  userNameContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  roleIndicator: { width: 4, height: 20, borderRadius: 2, marginRight: 8 },
  userName: { fontSize: 16, fontWeight: "bold", color: "#333", flex: 1 },
  roleBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, gap: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: "bold" },
  userDetail: { fontSize: 13, color: "#666", marginTop: 2 },
  userFooter: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusActive: { backgroundColor: "#E8F5E9" },
  statusInactive: { backgroundColor: "#FFEBEE" },
  statusText: { fontSize: 10, fontWeight: "bold", color: "#333" },
  lastLogin: { fontSize: 10, color: "#999" },
  userActions: { flexDirection: "column", gap: 6, justifyContent: "center", paddingLeft: 10 },
  actionButton: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  editButton: { backgroundColor: "#1565C0" },
  resetButton: { backgroundColor: "#EF6C00" },
  deleteButton: { backgroundColor: "#C62828" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, color: "#999", marginTop: 12, fontWeight: "500" },
  fab: { position: "absolute", bottom: 24, right: 24, backgroundColor: "#1565C0", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "90%" },
  detailModalContent: { maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#DDD", borderRadius: 8, padding: 10, fontSize: 14, color: "#333" },
  passwordFieldWrapper: { flexDirection: "row", alignItems: "center", position: "relative" },
  eyeButton: { position: "absolute", right: 12, height: "100%", justifyContent: "center" },
  roleSelector: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  roleOption: { flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#DDD", backgroundColor: "#F5F5F5" },
  roleOptionActive: { backgroundColor: "#1565C0", borderColor: "#1565C0" },
  roleOptionText: { fontSize: 13, color: "#666", fontWeight: "500" },
  roleOptionTextActive: { color: "#FFF" },
  magasinSelector: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  magasinOption: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#DDD" },
  magasinOptionActive: { backgroundColor: "#1565C0", borderColor: "#1565C0" },
  magasinOptionText: { fontSize: 13, color: "#666" },
  magasinOptionTextActive: { color: "#FFF" },
  switchContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingVertical: 8 },
  switchLabel: { fontSize: 14, fontWeight: "500", color: "#555" },
  saveButton: { backgroundColor: "#1565C0", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 16, marginBottom: 10 },
  saveButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  detailContent: { alignItems: "center" },
  detailAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E3F2FD", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  detailAvatarText: { fontSize: 36, fontWeight: "bold", color: "#1565C0" },
  detailName: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 4 },
  detailRoleBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, gap: 6 },
  detailRoleText: { fontSize: 13, fontWeight: "600" },
  detailInfo: { width: "100%", marginTop: 16, padding: 12, backgroundColor: "#F8F9FA", borderRadius: 8 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#EEEEEE" },
  detailLabel: { fontSize: 13, color: "#666" },
  detailValue: { fontSize: 13, fontWeight: "500", color: "#333" },
  statusActiveText: { color: "#2E7D32" },
  statusInactiveText: { color: "#C62828" },
  detailActivitiesTitle: { fontSize: 15, fontWeight: "bold", color: "#333", marginTop: 16, marginBottom: 8, alignSelf: "flex-start" },
  detailLoader: { paddingVertical: 20 },
  detailEmpty: { fontSize: 13, color: "#999", paddingVertical: 10 },
  activityList: { width: "100%", maxHeight: 150 },
  activityItem: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  activityAction: { fontSize: 13, fontWeight: "600", color: "#333" },
  activityDetail: { fontSize: 12, color: "#666" },
  activityDate: { fontSize: 10, color: "#999", marginTop: 2 },
}); 

export default UserManagementScreen;