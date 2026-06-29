import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SQLite from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

// === INTERFACES ===
interface Product {
  id: number;
  nom: string;
  code_barre: string;
  categorie: string;
  stock_actuel: number;
  stock_minimum: number;
  prix_achat: number;
  prix_view: number;
  unite_mesure: string;
}

interface AdjustmentHistory {
  id: number;
  produit_id: number;
  produit_nom: string;
  type_mouvement: "AJUSTEMENT";
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  date_mouvement: string;
  commentaire: string;
  utilisateur_nom: string;
}

interface AdjustmentForm {
  productId: number | null;
  quantity: string;
  reason: string;
  type: "add" | "remove" | "correct";
  newStock: string;
}

// === CONSTANTES ===
const ADJUSTMENT_REASONS = [
  "Inventaire physique",
  "Erreur de saisie",
  "Perte / Casse",
  "Retour fournisseur",
  "Réapprovisionnement",
  "Correction manuelle",
  "Échantillon",
  "Don",
  "Autre",
];

export default function InventoryAdjustmentScreen() {
  const { user } = useUser();
  const isAdminOuGerant = user?.role === "ADMIN" || user?.role === "GERANT";

  // === ÉTATS ===
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<AdjustmentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [devise, setDevise] = useState("USD");

  // === ÉTATS MODAL ===
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentForm>({
    productId: null,
    quantity: "",
    reason: "",
    type: "add",
    newStock: "",
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProductHistory, setSelectedProductHistory] = useState<Product | null>(null);

  // === INITIALISATION ===
  useEffect(() => {
    if (isAdminOuGerant) {
      loadProducts();
      loadCurrency();
      loadHistory();
    }
  }, [isAdminOuGerant]);

  // === CHARGEMENT ===
  const loadProducts = async () => {
    try {
      setLoading(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      const results = await db.getAllAsync<Product>(
        `SELECT id, nom, code_barre, categorie,
                stock_actuel, stock_minimum, prix_achat, prix_view, unite_mesure
         FROM produits
         WHERE actif = 1
         ORDER BY nom ASC;`
      );
      setProducts(results || []);
      setFilteredProducts(results || []);
    } catch (error) {
      console.error("[InventoryAdjustment] Erreur chargement:", error);
      Alert.alert("Erreur", "Impossible de charger les produits.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCurrency = async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const result = await db.getFirstAsync<{ valeur: string }>(
        "SELECT valeur FROM parametres_systeme WHERE cle = 'devise_symbole';"
      );
      if (result) setDevise(result.valeur);
    } catch (error) {
      console.error("[InventoryAdjustment] Erreur devise:", error);
    }
  };

  const loadHistory = async (productId?: number) => {
    try {
      setHistoryLoading(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      const query = productId
        ? `SELECT a.*, p.nom as produit_nom, u.nom as utilisateur_nom
           FROM mouvements_stock a
           JOIN produits p ON a.produit_id = p.id
           JOIN utilisateurs u ON a.utilisateur_id = u.id
           WHERE a.type_mouvement = 'AJUSTEMENT' AND a.produit_id = ?
           ORDER BY a.date_mouvement DESC
           LIMIT 20;`
        : `SELECT a.*, p.nom as produit_nom, u.nom as utilisateur_nom
           FROM mouvements_stock a
           JOIN produits p ON a.produit_id = p.id
           JOIN utilisateurs u ON a.utilisateur_id = u.id
           WHERE a.type_mouvement = 'AJUSTEMENT'
           ORDER BY a.date_mouvement DESC
           LIMIT 20;`;

      const results = productId
        ? await db.getAllAsync<AdjustmentHistory>(query, [productId])
        : await db.getAllAsync<AdjustmentHistory>(query);

      setHistory(results || []);
    } catch (error) {
      console.error("[InventoryAdjustment] Erreur historique:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // === FILTRAGE ===
  useEffect(() => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(query) ||
        (p.code_barre && p.code_barre.includes(query))
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // === RAFRAÎCHISSEMENT ===
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
    loadHistory();
  }, []);

  // === OUVERTURE MODAL ===
  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentForm({
      productId: product.id,
      quantity: "",
      reason: "",
      type: "add",
      newStock: product.stock_actuel.toString(),
    });
    setShowAdjustModal(true);
  };

  const openHistoryModal = (product: Product) => {
    setSelectedProductHistory(product);
    loadHistory(product.id);
    setShowHistoryModal(true);
  };

  // === CALCUL DU NOUVEAU STOCK ===
  const calculateNewStock = () => {
    if (!selectedProduct) return 0;

    const qty = parseInt(adjustmentForm.quantity, 10) || 0;
    const currentStock = selectedProduct.stock_actuel;

    switch (adjustmentForm.type) {
      case "add":
        return currentStock + qty;
      case "remove":
        return currentStock - qty;
      case "correct":
        return parseInt(adjustmentForm.newStock, 10) ?? currentStock;
      default:
        return currentStock;
    }
  };

  // === SAUVEGARDE ===
  const handleAdjustment = async () => {
    if (!selectedProduct) return;

    if (adjustmentForm.type !== "correct" && !adjustmentForm.quantity) {
      Alert.alert("Erreur", "Veuillez entrer une quantité.");
      return;
    }

    if (adjustmentForm.type === "correct" && !adjustmentForm.newStock) {
      Alert.alert("Erreur", "Veuillez entrer le nouveau stock.");
      return;
    }

    if (!adjustmentForm.reason) {
      Alert.alert("Erreur", "Veuillez indiquer une raison.");
      return;
    }

    const qty = parseInt(adjustmentForm.quantity, 10) || 0;
    const currentStock = selectedProduct.stock_actuel;
    let newStock = currentStock;

    switch (adjustmentForm.type) {
      case "add":
        newStock = currentStock + qty;
        break;
      case "remove":
        if (qty > currentStock) {
          Alert.alert("Erreur", `Stock insuffisant. Disponible: ${currentStock}`);
          return;
        }
        newStock = currentStock - qty;
        break;
      case "correct":
        newStock = parseInt(adjustmentForm.newStock, 10) ?? currentStock;
        if (newStock < 0) {
          Alert.alert("Erreur", "Le stock ne peut pas être négatif.");
          return;
        }
        break;
    }

    const quantityChange = newStock - currentStock;

    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const now = new Date().toISOString();

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "UPDATE produits SET stock_actuel = ? WHERE id = ?;",
          [newStock, selectedProduct.id]
        );

        await db.runAsync(
          `INSERT INTO mouvements_stock (
             produit_id, type_mouvement, quantite,
             stock_avant, stock_apres, date_mouvement,
             commentaire, utilisateur_id
           ) VALUES (?, 'AJUSTEMENT', ?, ?, ?, ?, ?, ?);`,
          [
            selectedProduct.id,
            quantityChange,
            currentStock,
            newStock,
            now,
            `Ajustement: ${adjustmentForm.reason}`,
            user?.id || null,
          ]
        );
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "✅ Succès",
        `Stock ajusté avec succès.\n${selectedProduct.nom}: ${currentStock} → ${newStock}`
      );

      setShowAdjustModal(false);
      loadProducts();
      loadHistory();
    } catch (error) {
      console.error("[InventoryAdjustment] Erreur ajustement:", error);
      Alert.alert("Erreur", "Impossible d'effectuer l'ajustement.");
    }
  };

  // === AFFICHER L'APERÇU ===
  const renderPreview = () => {
    if (!selectedProduct) return null;

    const currentStock = selectedProduct.stock_actuel;
    const newStock = calculateNewStock();
    const difference = newStock - currentStock;

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>📊 Aperçu</Text>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Stock actuel</Text>
          <Text style={styles.previewValue}>
            {currentStock} {selectedProduct.unite_mesure || "u"}
          </Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Nouveau stock</Text>
          <Text style={[styles.previewValue, styles.previewHighlight]}>
            {newStock} {selectedProduct.unite_mesure || "u"}
          </Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Différence</Text>
          <Text style={[
            styles.previewValue,
            difference > 0 ? styles.positive : difference < 0 ? styles.negative : styles.neutral,
          ]}>
            {difference > 0 ? "+" : ""}{difference}
          </Text>
        </View>
      </View>
    );
  };

  // === SÉCURITÉ ACCÈS ===
  if (!isAdminOuGerant) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed" size={64} color="#C62828" />
        <Text style={styles.unauthorizedTitle}>Accès Refusé</Text>
        <Text style={styles.unauthorizedText}>
          Cette section est réservée à la direction.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Chargement des produits...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* EN-TÊTE */}
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Ajustement de Stock</Text>
          <Text style={styles.subtitle}>
            Corrigez et ajustez les quantités en stock
          </Text>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un produit..."
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
        </View>

        {/* STATISTIQUES RAPIDES */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Produits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {products.reduce((sum, p) => sum + p.stock_actuel, 0)}
            </Text>
            <Text style={styles.statLabel}>Total stock</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => loadHistory()}>
            <Text style={styles.statValue}>{history.length}</Text>
            <Text style={styles.statLabel}>Ajustements</Text>
          </TouchableOpacity>
        </View>

        {/* LISTE DES PRODUITS */}
        <View style={styles.productList}>
          <Text style={styles.sectionTitle}>📋 Sélectionnez un produit</Text>
          {filteredProducts.map((product) => {
            const isLowStock = product.stock_actuel <= product.stock_minimum;
            const isOutOfStock = product.stock_actuel <= 0;

            return (
              <View key={product.id} style={styles.productCard}>
                <TouchableOpacity
                  style={styles.productInfo}
                  onPress={() => openAdjustModal(product)}
                  activeOpacity={0.7}
                >
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{product.nom}</Text>
                    <View style={[
                      styles.stockBadge,
                      isOutOfStock ? styles.stockBadgeDanger :
                      isLowStock ? styles.stockBadgeWarning :
                      styles.stockBadgeSuccess,
                    ]}>
                      <Text style={styles.stockBadgeText}>
                        {isOutOfStock ? "Rupture" :
                         isLowStock ? "Alerte" :
                         `${product.stock_actuel} ${product.unite_mesure || "u"}`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.productCategory}>{product.categorie}</Text>
                  {product.code_barre && (
                    <Text style={styles.productBarcode}>{product.code_barre}</Text>
                  )}
                  <Text style={styles.productPrice}>
                    {product.prix_view.toFixed(2)} {devise}
                  </Text>
                </TouchableOpacity>

                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.adjustButton]}
                    onPress={() => openAdjustModal(product)}
                  >
                    <Ionicons name="construct-outline" size={18} color="#FFF" />
                    <Text style={styles.actionButtonText}>Ajuster</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.historyButton]}
                    onPress={() => openHistoryModal(product)}
                  >
                    <Ionicons name="time-outline" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* MODAL AJUSTEMENT */}
      <Modal
        visible={showAdjustModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔧 Ajustement</Text>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <>
                <Text style={styles.modalProductName}>{selectedProduct.nom}</Text>
                <Text style={styles.modalProductInfo}>
                  Stock actuel: {selectedProduct.stock_actuel} {selectedProduct.unite_mesure || "u"}
                </Text>

                <Text style={styles.inputLabel}>Type d'ajustement</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeOption, adjustmentForm.type === "add" && styles.typeOptionActive]}
                    onPress={() => setAdjustmentForm({ ...adjustmentForm, type: "add" })}
                  >
                    <Ionicons name="add-circle" size={20} color={adjustmentForm.type === "add" ? "#FFF" : "#2E7D32"} />
                    <Text style={[styles.typeOptionText, adjustmentForm.type === "add" && styles.typeOptionTextActive]}>
                      Ajouter
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeOption, adjustmentForm.type === "remove" && styles.typeOptionActive]}
                    onPress={() => setAdjustmentForm({ ...adjustmentForm, type: "remove" })}
                  >
                    <Ionicons name="remove-circle" size={20} color={adjustmentForm.type === "remove" ? "#FFF" : "#C62828"} />
                    <Text style={[styles.typeOptionText, adjustmentForm.type === "remove" && styles.typeOptionTextActive]}>
                      Retirer
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeOption, adjustmentForm.type === "correct" && styles.typeOptionActive]}
                    onPress={() => setAdjustmentForm({ ...adjustmentForm, type: "correct" })}
                  >
                    <Ionicons name="sync" size={20} color={adjustmentForm.type === "correct" ? "#FFF" : "#1565C0"} />
                    <Text style={[styles.typeOptionText, adjustmentForm.type === "correct" && styles.typeOptionTextActive]}>
                      Corriger
                    </Text>
                  </TouchableOpacity>
                </View>

                {adjustmentForm.type !== "correct" ? (
                  <View>
                    <Text style={styles.inputLabel}>Quantité</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Entrez la quantité"
                      keyboardType="numeric"
                      value={adjustmentForm.quantity}
                      onChangeText={(text) => setAdjustmentForm({ ...adjustmentForm, quantity: text })}
                    />
                  </View>
                ) : (
                  <View>
                    <Text style={styles.inputLabel}>Nouveau stock</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Entrez le nouveau stock"
                      keyboardType="numeric"
                      value={adjustmentForm.newStock}
                      onChangeText={(text) => setAdjustmentForm({ ...adjustmentForm, newStock: text })}
                    />
                  </View>
                )}

                <Text style={styles.inputLabel}>Raison</Text>
                <View style={styles.reasonSelector}>
                  {ADJUSTMENT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonOption,
                        adjustmentForm.reason === reason && styles.reasonOptionActive,
                      ]}
                      onPress={() => setAdjustmentForm({ ...adjustmentForm, reason })}
                    >
                      <Text style={[
                        styles.reasonOptionText,
                        adjustmentForm.reason === reason && styles.reasonOptionTextActive,
                      ]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {renderPreview()}

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAdjustment}
                >
                  <Text style={styles.saveButtonText}>Confirmer l'ajustement</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL HISTORIQUE */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.historyModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Historique des ajustements</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedProductHistory && (
              <Text style={styles.historyProductName}>
                {selectedProductHistory.nom}
              </Text>
            )}

            {historyLoading ? (
              <ActivityIndicator size="large" color="#1565C0" style={styles.historyLoader} />
            ) : history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="time-outline" size={48} color="#CCC" />
                <Text style={styles.emptyHistoryText}>Aucun ajustement</Text>
              </View>
            ) : (
              <FlatList
                data={history}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.historyItem}>
                    <View style={styles.historyLeft}>
                      <View style={[
                        styles.historyIcon,
                        item.quantite > 0 ? styles.historyIconPositive : styles.historyIconNegative,
                      ]}>
                        <Ionicons
                          name={item.quantite > 0 ? "arrow-up" : "arrow-down"}
                          size={16}
                          color={item.quantite > 0 ? "#2E7D32" : "#C62828"}
                        />
                      </View>
                      <View>
                        <Text style={styles.historyProduct}>{item.produit_nom}</Text>
                        <Text style={styles.historyReason}>{item.commentaire}</Text>
                        <Text style={styles.historyDate}>
                          {new Date(item.date_mouvement).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={[
                        styles.historyQuantity,
                        item.quantite > 0 ? styles.positive : styles.negative,
                      ]}>
                        {item.quantite > 0 ? "+" : ""}{item.quantite}
                      </Text>
                      <Text style={styles.historyStock}>
                        {item.stock_avant} → {item.stock_apres}
                      </Text>
                      <Text style={styles.historyUser}>
                        {item.utilisateur_nom || "Système"}
                      </Text>
                    </View>
                  </View>
                )}
                style={styles.historyList}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8F9FA",
  },
  unauthorizedTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  unauthorizedText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  header: {
    padding: 16,
    backgroundColor: "#1565C0",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#FFF",
    fontSize: 13,
    opacity: 0.8,
    marginTop: 2,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    margin: 16,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1565C0",
  },
  statLabel: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
  },
  productList: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    elevation: 1,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stockBadgeSuccess: {
    backgroundColor: "#E8F5E9",
  },
  stockBadgeWarning: {
    backgroundColor: "#FFF3E0",
  },
  stockBadgeDanger: {
    backgroundColor: "#FFEBEE",
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
  },
  productCategory: {
    fontSize: 12,
    color: "#777",
    marginBottom: 2,
  },
  productBarcode: {
    fontSize: 11,
    color: "#999",
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1565C0",
  },
  productActions: {
    flexDirection: "column",
    gap: 6,
    justifyContent: "center",
    paddingLeft: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
    minWidth: 70,
  },
  adjustButton: {
    backgroundColor: "#1565C0",
  },
  historyButton: {
    backgroundColor: "#6A1B9A",
    minWidth: 36,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  historyModalContent: {
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1565C0",
    marginBottom: 4,
  },
  modalProductInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#333",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#F5F5F5",
  },
  typeOptionActive: {
    backgroundColor: "#1565C0",
    borderColor: "#1565C0",
  },
  typeOptionText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  typeOptionTextActive: {
    color: "#FFF",
  },
  reasonSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  reasonOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  reasonOptionActive: {
    backgroundColor: "#1565C0",
    borderColor: "#1565C0",
  },
  reasonOptionText: {
    fontSize: 11,
    color: "#666",
  },
  reasonOptionTextActive: {
    color: "#FFF",
  },
  previewContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  previewLabel: {
    fontSize: 13,
    color: "#666",
  },
  previewValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  previewHighlight: {
    fontWeight: "bold",
    color: "#1565C0",
  },
  positive: {
    color: "#2E7D32",
  },
  negative: {
    color: "#C62828",
  },
  neutral: {
    color: "#757575",
  },
  saveButton: {
    backgroundColor: "#1565C0",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  historyProductName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 12,
  },
  historyLoader: {
    paddingVertical: 20,
  },
  historyList: {
    maxHeight: 400,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  historyIconPositive: {
    backgroundColor: "#E8F5E9",
  },
  historyIconNegative: {
    backgroundColor: "#FFEBEE",
  },
  historyProduct: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  historyReason: {
    fontSize: 11,
    color: "#666",
  },
  historyDate: {
    fontSize: 10,
    color: "#999",
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyQuantity: {
    fontSize: 16,
    fontWeight: "bold",
  },
  historyStock: {
    fontSize: 11,
    color: "#999",
  },
  historyUser: {
    fontSize: 10,
    color: "#999",
  },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
}); 

export default InventoryAdjustmentScreen;