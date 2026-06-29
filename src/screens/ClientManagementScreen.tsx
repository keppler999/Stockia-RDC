import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SQLite from "expo-sqlite";
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
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useUser } from "../context/UserContext";

const DATABASE_NAME = "stockia_secure.db";
const { width } = Dimensions.get("window");

// === INTERFACES ===
interface Client {
  id: number;
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  points_fidelite: number;
  total_achats: number;
  nombre_ventes?: number;
  date_inscription: string;
  derniere_visite?: string;
  actif: number;
}

interface ClientDebt {
  id: number;
  client_id: number;
  vente_id: number;
  facture_numero: string;
  montant_initial: number;
  montant_restant: number;
  statut: "EN_COURS" | "SOLDE" | "IMPAYEE";
  date_creation: string;
  date_solde?: string;
  notes?: string;
}

interface ClientWithStats extends Client {
  nombre_ventes: number;
  total_dettes: number;
  derniere_visite_formatted: string;
}

interface ClientFormData {
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  points_fidelite: string;
}

export default function ClientManagementScreen() {
  const { user } = useUser();
  const isAdminOuGerant = user?.role === "ADMIN" || user?.role === "GERANT";

  // === ÉTATS ===
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "with_debts" | "active">("all");
  const [devise, setDevise] = useState("USD");

  // === ÉTATS MODAL ===
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    nom: "",
    telephone: "",
    email: "",
    adresse: "",
    points_fidelite: "0",
  });

  // === ÉTATS DETTES ===
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [clientDebts, setClientDebts] = useState<ClientDebt[]>([]);
  const [debtLoading, setDebtLoading] = useState(false);

  // === ÉTAT PAIEMENT ALTERNATIF À ALERT.PROMPT (Fix Android) ===
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<ClientDebt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  // === ÉTATS POINTS ===
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState("");

  // === INITIALISATION ===
  useEffect(() => {
    loadClients();
    loadCurrency();
  }, []);

  // === CHARGEMENT DES CLIENTS ===
  const loadClients = async () => {
    try {
      setLoading(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      const results = await db.getAllAsync<ClientWithStats>(
        `SELECT c.*,
                COUNT(v.id) as nombre_ventes,
                COALESCE(SUM(d.montant_restant), 0) as total_dettes,
                strftime('%d/%m/%Y', c.derniere_visite) as derniere_visite_formatted
         FROM clients c
         LEFT JOIN ventes v ON c.id = v.client_id AND v.statut = 'COMPLETEE'
         LEFT JOIN dettes d ON c.id = d.client_id AND d.statut = 'EN_COURS'
         WHERE c.actif = 1
         GROUP BY c.id
         ORDER BY c.nom ASC;`
      );
      setClients(results || []);
      setFilteredClients(results || []);
    } catch (error) {
      console.error("[ClientManagement] Erreur chargement:", error);
      Alert.alert("Erreur", "Impossible de charger les clients.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // === CHARGEMENT DE LA DEVISE ===
  const loadCurrency = async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const result = await db.getFirstAsync<{ valeur: string }>(
        "SELECT valeur FROM parametres_systeme WHERE cle = 'devise_symbole';"
      );
      if (result) setDevise(result.valeur);
    } catch (error) {
      console.error("[ClientManagement] Erreur devise:", error);
    }
  };

  // === FILTRAGE ===
  useEffect(() => {
    let filtered = [...clients];

    if (filterType === "with_debts") {
      filtered = filtered.filter(c => c.total_dettes > 0);
    } else if (filterType === "active") {
      filtered = filtered.filter(c => {
        if (!c.derniere_visite) return false;
        const lastVisit = new Date(c.derniere_visite.replace(" ", "T"));
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastVisit >= thirtyDaysAgo;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c =>
        c.nom.toLowerCase().includes(query) ||
        (c.telephone && c.telephone.includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query))
      );
    }

    setFilteredClients(filtered);
  }, [searchQuery, filterType, clients]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadClients();
  }, []);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      nom: "",
      telephone: "",
      email: "",
      adresse: "",
      points_fidelite: "0",
    });
    setModalVisible(true);
  };

  const openEditModal = (client: ClientWithStats) => {
    setEditingClient(client);
    setFormData({
      nom: client.nom,
      telephone: client.telephone || "",
      email: client.email || "",
      adresse: client.adresse || "",
      points_fidelite: client.points_fidelite.toString(),
    });
    setModalVisible(true);
  };

  // === SAUVEGARDE ===
  const handleSaveClient = async () => {
    if (!formData.nom.trim()) {
      Alert.alert("Erreur", "Le nom du client est requis.");
      return;
    }

    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const now = new Date().toISOString();

      if (editingClient) {
        await db.runAsync(
          `UPDATE clients SET
            nom = ?, telephone = ?, email = ?, adresse = ?,
            points_fidelite = ?, updated_at = ?
           WHERE id = ?;`,
          [
            formData.nom.trim(),
            formData.telephone.trim() || null,
            formData.email.trim() || null,
            formData.adresse.trim() || null,
            parseInt(formData.points_fidelite) || 0,
            now,
            editingClient.id,
          ]
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Succès", "Client mis à jour avec succès.");
      } else {
        await db.runAsync(
          `INSERT INTO clients (
            nom, telephone, email, adresse, points_fidelite,
            total_achats, date_inscription, actif
          ) VALUES (?, ?, ?, ?, ?, 0, ?, 1);`,
          [
            formData.nom.trim(),
            formData.telephone.trim() || null,
            formData.email.trim() || null,
            formData.adresse.trim() || null,
            parseInt(formData.points_fidelite) || 0,
            now,
          ]
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Succès", "Client créé avec succès.");
      }

      setModalVisible(false);
      loadClients();
    } catch (error) {
      console.error("[ClientManagement] Erreur sauvegarde:", error);
      Alert.alert("Erreur", "Impossible d'enregistrer le client.");
    }
  };

  // === SUPPRESSION ===
  const handleDeleteClient = (client: ClientWithStats) => {
    Alert.alert(
      "Supprimer le client",
      `Voulez-vous vraiment supprimer "${client.nom}" ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
              await db.runAsync("UPDATE clients SET actif = 0 WHERE id = ?;", [client.id]);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert("Succès", "Client supprimé.");
              loadClients();
            } catch (error) {
              console.error("[ClientManagement] Erreur suppression:", error);
              Alert.alert("Erreur", "Impossible de supprimer le client.");
            }
          },
        },
      ]
    );
  };

  // === CHARGEMENT DES DETTES ===
  const loadClientDebts = async (clientId: number) => {
    try {
      setDebtLoading(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const results = await db.getAllAsync<ClientDebt>(
        `SELECT d.*, v.facture_numero
         FROM dettes d
         JOIN ventes v ON d.vente_id = v.id
         WHERE d.client_id = ?
         ORDER BY d.date_creation DESC;`,
        [clientId]
      );
      setClientDebts(results || []);
    } catch (error) {
      console.error("[ClientManagement] Erreur dettes:", error);
      Alert.alert("Erreur", "Impossible de charger les dettes.");
    } finally {
      setDebtLoading(false);
    }
  };

  const showClientDebts = (client: ClientWithStats) => {
    setSelectedClient(client);
    loadClientDebts(client.id);
    setShowDebtModal(true);
  };

  // === ENREGISTRER UN PAIEMENT (Interface stable Cross-Platform) ===
  const processDebtPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!selectedDebt || !selectedClient || isNaN(amount) || amount <= 0) {
      Alert.alert("Erreur", "Veuillez saisir un montant valide.");
      return;
    }
    if (amount > selectedDebt.montant_restant) {
      Alert.alert("Erreur", "Le montant dépasse la dette restante.");
      return;
    }

    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const newRestant = selectedDebt.montant_restant - amount;
      const newStatut = newRestant <= 0 ? "SOLDE" : "EN_COURS";

      await db.runAsync(
        `UPDATE dettes SET montant_restant = ?, statut = ?, date_solde = ? WHERE id = ?;`,
        [newRestant, newStatut, newStatut === "SOLDE" ? new Date().toISOString() : null, selectedDebt.id]
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", `Paiement enregistré.`);
     
      setShowPaymentModal(false);
      setPaymentAmount("");
      loadClientDebts(selectedClient.id);
      loadClients();
    } catch (error) {
      console.error("[ClientManagement] Erreur paiement:", error);
      Alert.alert("Erreur", "Impossible de valider le paiement.");
    }
  };

  // === AJOUTER DES POINTS ===
  const handleAddPoints = async () => {
    const points = parseInt(pointsToAdd);
    if (!selectedClient || isNaN(points) || points <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un nombre de points valide.");
      return;
    }

    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const newPoints = selectedClient.points_fidelite + points;

      await db.runAsync(
        "UPDATE clients SET points_fidelite = ? WHERE id = ?;",
        [newPoints, selectedClient.id]
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", `${points} points ajoutés.`);
      setShowPointsModal(false);
      setPointsToAdd("");
      loadClients();
    } catch (error) {
      console.error("[ClientManagement] Erreur points:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Chargement des clients...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* EN-TÊTE */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>👥 Gestion des Clients</Text>
          <Text style={styles.count}>{filteredClients.length} clients</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
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

        <View style={styles.filterContainer}>
          {(["all", "with_debts", "active"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, filterType === type && styles.filterChipActive]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
                {type === "all" ? "Tous" : type === "with_debts" ? "Avec dettes" : "Actifs (30j)"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* LISTE */}
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.clientCard}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
          >
            <View style={styles.clientInfo}>
              <View style={styles.clientHeader}>
                <Text style={styles.clientName}>{item.nom}</Text>
                <View style={styles.pointsBadge}>
                  <Ionicons name="star" size={14} color="#F57C00" />
                  <Text style={styles.pointsText}>{item.points_fidelite}</Text>
                </View>
              </View>

              {item.telephone && (
                <Text style={styles.clientDetail}>
                  <Ionicons name="call-outline" size={14} color="#666" /> {item.telephone}
                </Text>
              )}

              <View style={styles.clientStats}>
                <Text style={styles.clientStat}>🛒 {item.nombre_ventes || 0} ventes</Text>
                <Text style={styles.clientStat}>💰 {item.total_achats.toFixed(2)} {devise}</Text>
                {item.total_dettes > 0 && (
                  <Text style={[styles.clientStat, styles.debtText]}>⚠️ {item.total_dettes.toFixed(2)} {devise}</Text>
                )}
              </View>
            </View>

            <View style={styles.clientActions}>
              <TouchableOpacity style={[styles.actionButton, styles.debtButton]} onPress={() => showClientDebts(item)}>
                <Ionicons name="card-outline" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.pointsButton]} onPress={() => { setSelectedClient(item); setShowPointsModal(true); }}>
                <Ionicons name="star-outline" size={20} color="#FFF" />
              </TouchableOpacity>
              {isAdminOuGerant && (
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteClient(item)}>
                  <Ionicons name="trash-outline" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />

      {/* FAB AJOUT */}
      {isAdminOuGerant && (
        <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* MODAL AJOUT / ÉDITION CLIENT */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingClient ? "Modifier le client" : "Nouveau client"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Nom complet *</Text>
            <TextInput style={styles.input} placeholder="Ex: Jean Mbuyi" value={formData.nom} onChangeText={(text) => setFormData({ ...formData, nom: text })} />
            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" placeholder="Ex: +243 812..." value={formData.telephone} onChangeText={(text) => setFormData({ ...formData, telephone: text })} />
            <Text style={styles.inputLabel}>Points de fidélité</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={formData.points_fidelite} onChangeText={(text) => setFormData({ ...formData, points_fidelite: text })} />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveClient}>
              <Text style={styles.saveButtonText}>{editingClient ? "Mettre à jour" : "Créer le client"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL LISTE DES DETTES */}
      <Modal visible={showDebtModal} animationType="slide" transparent={true} onRequestClose={() => setShowDebtModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.debtModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💳 Dettes - {selectedClient?.nom}</Text>
              <TouchableOpacity onPress={() => setShowDebtModal(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <Text style={styles.debtTotal}>Total: {selectedClient?.total_dettes.toFixed(2)} {devise}</Text>
            {debtLoading ? (
              <ActivityIndicator size="large" color="#1565C0" />
            ) : (
              <FlatList
                data={clientDebts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.debtItem}>
                    <View style={styles.debtInfo}>
                      <Text style={styles.debtFacture}>Facture: {item.facture_numero}</Text>
                      <Text style={styles.debtRestant}>{item.montant_restant.toFixed(2)} {devise}</Text>
                    </View>
                    {item.statut === "EN_COURS" && (
                      <TouchableOpacity style={styles.payButton} onPress={() => { setSelectedDebt(item); setShowPaymentModal(true); }}>
                        <Text style={styles.payButtonText}>Payer</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DE SAISIE DE PAIEMENT (Alternative sécurisée à Alert.prompt) */}
      <Modal visible={showPaymentModal} animationType="fade" transparent={true} onRequestClose={() => setShowPaymentModal(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.pointsModalContent}>
            <Text style={styles.modalTitle}>Saisir le paiement</Text>
            <Text style={styles.pointsInfo}>Facture : {selectedDebt?.facture_numero}</Text>
            <Text style={styles.pointsCurrent}>Dette restante : {selectedDebt?.montant_restant.toFixed(2)} {devise}</Text>
            <TextInput
              style={styles.pointsInput}
              keyboardType="numeric"
              placeholder="Montant à verser"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={[styles.saveButton, { flex: 1, backgroundColor: "#666" }]} onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.saveButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { flex: 1, backgroundColor: "#2E7D32" }]} onPress={processDebtPayment}>
                <Text style={styles.saveButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CONFIGURATION POINTS */}
      <Modal visible={showPointsModal} animationType="fade" transparent={true} onRequestClose={() => setShowPointsModal(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.pointsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⭐ Ajouter des points</Text>
              <TouchableOpacity onPress={() => setShowPointsModal(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <Text style={styles.pointsCurrent}>Points actuels: {selectedClient?.points_fidelite || 0}</Text>
            <TextInput style={styles.pointsInput} keyboardType="numeric" placeholder="Ex: 50" value={pointsToAdd} onChangeText={setPointsToAdd} />
            <TouchableOpacity style={styles.pointsAddButton} onPress={handleAddPoints}>
              <Text style={styles.pointsAddButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// === STYLES ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 14 },
  header: { padding: 16, backgroundColor: "#1565C0", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  count: { color: "#FFF", fontSize: 13, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#333" },
  filterContainer: { flexDirection: "row", gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)" },
  filterChipActive: { backgroundColor: "#FFF" },
  filterChipText: { color: "#FFF", fontSize: 12, fontWeight: "500" },
  filterChipTextActive: { color: "#1565C0" },
  listContent: { paddingHorizontal: 12, paddingBottom: 80 },
  clientCard: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#FFF", padding: 14, marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: "#EAEAEA", elevation: 2 },
  clientInfo: { flex: 1 },
  clientHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  clientName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  pointsBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF8E1", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  pointsText: { fontSize: 12, fontWeight: "bold", color: "#F57C00" },
  clientDetail: { fontSize: 13, color: "#666", marginTop: 2 },
  clientStats: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  clientStat: { fontSize: 12, color: "#555", backgroundColor: "#F5F5F5", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  debtText: { color: "#C62828", backgroundColor: "#FFEBEE" },
  clientActions: { flexDirection: "column", gap: 6, justifyContent: "center", paddingLeft: 10 },
  actionButton: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  debtButton: { backgroundColor: "#EF6C00" },
  pointsButton: { backgroundColor: "#F57C00" },
  deleteButton: { backgroundColor: "#C62828" },
  fab: { position: "absolute", bottom: 24, right: 24, backgroundColor: "#1565C0", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalOverlayCenter: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "90%" },
  debtModalContent: { maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#DDD", borderRadius: 8, padding: 10, fontSize: 14, color: "#333" },
  saveButton: { backgroundColor: "#1565C0", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 20 },
  saveButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  debtTotal: { fontSize: 16, fontWeight: "bold", color: "#1565C0", textAlign: "center", marginBottom: 12 },
  debtItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  debtInfo: { flex: 1 },
  debtFacture: { fontSize: 14, fontWeight: "500", color: "#333" },
  debtRestant: { fontSize: 16, fontWeight: "bold", color: "#C62828" },
  payButton: { backgroundColor: "#2E7D32", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  payButtonText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  pointsModalContent: { backgroundColor: "#FFF", borderRadius: 16, padding: 24, width: width * 0.85, maxWidth: 400 },
  pointsInfo: { fontSize: 14, color: "#666", marginBottom: 4 },
  pointsCurrent: { fontSize: 16, fontWeight: "bold", color: "#F57C00", marginBottom: 12 },
  pointsInput: { backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#DDD", borderRadius: 8, padding: 12, fontSize: 16, textAlign: "center", marginBottom: 16 },
  pointsAddButton: { backgroundColor: "#F57C00", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  pointsAddButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
}); 

export default ClientManagementScreen;
