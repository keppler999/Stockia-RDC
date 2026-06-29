import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SQLite from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
interface Produit {
  id: number;
  code_barre: string;
  nom: string;
  categorie: string;
  prix_achat: number;
  prix_view: number;
  stock_actuel: number;
  stock_minimum: number;
  stock_securite?: number;
  unite_mesure?: string;
  emplacement?: string;
  actif: number;
}

interface MouvementStock {
  id: number;
  produit_id: number;
  type_mouvement:
    | "VENTE"
    | "APPROVISIONNEMENT"
    | "PERTE"
    | "RETOUR"
    | "AJUSTEMENT";
  quantite: number;
  stock_avant: number;
  stock_apres: number;
  date_mouvement: string;
  commentaire: string;
  utilisateur?: string;
}

interface CategorieStats {
  nom: string;
  total: number;
  count: number;
}

interface AlerteStock {
  id: number;
  nom: string;
  stock_actuel: number;
  stock_minimum: number;
  categorie: string;
}

export default function StockScreen() {
  const { user } = useUser();
  const isMagasinier = user?.role === "MAGASINIER";
  const isAdminOuGerant = user?.role === "ADMIN" || user?.role === "GERANT";

  // === ÉTATS PRINCIPAUX ===
  const [produits, setProduits] = useState<Produit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [devise, setDevise] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategorie, setSelectedCategorie] = useState<string>("Toutes");

  // === ÉTATS MODAL APPROVISIONNEMENT ===
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [quantiteEntree, setQuantiteEntree] = useState("");
  const [prixAchat, setPrixAchat] = useState("");
  const [dateExpiration, setDateExpiration] = useState("");
  const [numeroLot, setNumeroLot] = useState("");
  const [commentaire, setCommentaire] = useState("");

  // === ÉTATS MODAL AJUSTEMENT ===
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [ajustementQuantite, setAjustementQuantite] = useState("");
  const [ajustementType, setAjustementType] = useState<"ajout" | "retrait">("ajout");
  const [ajustementRaison, setAjustementRaison] = useState("");

  // === ÉTATS HISTORIQUE ===
  const [showMouvements, setShowMouvements] = useState(false);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [mouvementsLoading, setMouvementsLoading] = useState(false);

  // === ÉTATS STATISTIQUES ===
  const [categoriesStats, setCategoriesStats] = useState<CategorieStats[]>([]);
  const [alertesStock, setAlertesStock] = useState<AlerteStock[]>([]);
  const [totalProduits, setTotalProduits] = useState(0);
  const [totalValeurStock, setTotalValeurStock] = useState(0);

  // === ÉTATS TRI ===
  const [sortBy, setSortBy] = useState<"nom" | "stock" | "prix">("nom");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // === ANIMATION ===
  const [fadeAnim] = useState(new Animated.Value(0));

  // === INITIALISATION ===
  useEffect(() => {
    loadStockData();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // === RAFRAÎCHISSEMENT ===
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStockData();
  }, []);

  // === CHARGEMENT DES DONNÉES ===
  const loadStockData = async () => {
    try {
      setLoading(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      // 1. Devise
      const paramDevise = await db.getFirstAsync<{ valeur: string }>(
        "SELECT valeur FROM parametres_systeme WHERE cle = 'devise_symbole';",
      );
      if (paramDevise) setDevise(paramDevise.valeur);

      // 2. Produits
      const allProducts = await db.getAllAsync<Produit>(
        `SELECT id, code_barre, nom, categorie, prix_achat, prix_view,
               stock_actuel, stock_minimum, stock_securite, unite_mesure,
               emplacement, actif
        FROM produits
        ORDER BY nom ASC;`,
      );
      setProduits(allProducts || []);
      setTotalProduits(allProducts.length);

      // 3. Catégories
      const uniqueCategories = [
        "Toutes",
        ...new Set(allProducts.map((p) => p.categorie)),
      ];
      setCategories(uniqueCategories);

      // 4. Alertes stock
      const alertes = await db.getAllAsync<AlerteStock>(
        `SELECT id, nom, stock_actuel, stock_minimum, categorie
        FROM produits
        WHERE stock_actuel <= stock_minimum
        ORDER BY (stock_minimum - stock_actuel) DESC;`,
      );
      setAlertesStock(alertes || []);

      // 5. Statistiques par catégorie
      const stats = await db.getAllAsync<CategorieStats>(
        `SELECT categorie as nom,
               COUNT(*) as count,
               SUM(stock_actuel * prix_achat) as total
        FROM produits
        GROUP BY categorie;`,
      );
      setCategoriesStats(stats || []);

      // 6. Valeur totale du stock
      const valeurTotale = await db.getFirstAsync<{ total: number }>(
        "SELECT SUM(stock_actuel * prix_achat) as total FROM produits;",
      );
      setTotalValeurStock(valeurTotale?.total || 0);
    } catch (error) {
      console.error("[StockScreen] Erreur chargement:", error);
      Alert.alert("Erreur", "Impossible de charger les données du stock.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // === CHARGEMENT DE L'HISTORIQUE ===
  const loadMouvements = async (produitId: number) => {
    try {
      setMouvementsLoading(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      const results = await db.getAllAsync<MouvementStock>(
        `SELECT m.*, u.nom as utilisateur
        FROM mouvements_stock m
        LEFT JOIN utilisateurs u ON m.utilisateur_id = u.id
        WHERE m.produit_id = ?
        ORDER BY m.date_mouvement DESC
        LIMIT 30;`,
        [produitId],
      );
      setMouvements(results || []);
    } catch (error) {
      console.error("[StockScreen] Erreur chargement mouvements:", error);
      Alert.alert("Erreur", "Impossible de charger l'historique.");
    } finally {
      setMouvementsLoading(false);
    }
  };

  // === APPROVISIONNEMENT ===
  const handleApprovisionner = async () => {
    const qtyToAdd = parseInt(quantiteEntree);
    if (!selectedProduit || isNaN(qtyToAdd) || qtyToAdd <= 0) {
      Alert.alert(
        "Champs invalide",
        "Veuillez entrer une quantité positive valide.",
      );
      return;
    }

    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const dateMouvement = new Date().toISOString();

      await db.withTransactionAsync(async () => {
        const nouveauStock = selectedProduit.stock_actuel + qtyToAdd;

        // 1. Mise à jour du stock
        await db.runAsync(
          "UPDATE produits SET stock_actuel = ? WHERE id = ?;",
          [nouveauStock, selectedProduit.id],
        );

        // 2. Si prix d'achat modifié
        if (prixAchat && parseFloat(prixAchat) !== selectedProduit.prix_achat) {
          await db.runAsync(
            "UPDATE produits SET prix_achat = ? WHERE id = ?;",
            [parseFloat(prixAchat), selectedProduit.id],
          );
        }

        // 3. Historisation
        await db.runAsync(
          `INSERT INTO mouvements_stock (
          produit_id, type_mouvement, quantite,
          stock_avant, stock_apres, date_mouvement,
          commentaire, utilisateur_id
        ) VALUES (?, 'APPROVISIONNEMENT', ?, ?, ?, ?, ?, ?);`,
          [
            selectedProduit.id,
            qtyToAdd,
            selectedProduit.stock_actuel,
            nouveauStock,
            dateMouvement,
            commentaire || `Nouvel arrivage par ${user?.nom || 'Magasinier'}`,
            user?.id || null,
          ],
        );

        // 4. Gestion du lot
        if (numeroLot.trim()) {
          await db.runAsync(
            `INSERT INTO lots (produit_id, numero_lot, quantite, date_expiration)
            VALUES (?, ?, ?, ?);`,
            [
              selectedProduit.id,
              numeroLot.trim(),
              qtyToAdd,
              dateExpiration || null,
            ],
          );
        }
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "✅ Succès",
        `Le stock de "${selectedProduit.nom}" a été mis à jour.`,
      );

      resetApproModal();
      loadStockData();
    } catch (error) {
      console.error("[StockScreen] Erreur approvisionnement:", error);
      Alert.alert("Erreur", "Impossible d'enregistrer l'entrée de stock.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // === RÉINITIALISATION MODAL ===
  const resetApproModal = () => {
    setModalVisible(false);
    setQuantiteEntree("");
    setPrixAchat("");
    setDateExpiration("");
    setNumeroLot("");
    setCommentaire("");
    setSelectedProduit(null);
  };

  // === AJUSTEMENT DE STOCK ===
  const handleAjustement = async () => {
    const qty = parseInt(ajustementQuantite);
    if (!selectedProduit || isNaN(qty) || qty <= 0) {
      Alert.alert("Erreur", "Veuillez entrer une quantité valide.");
      return;
    }

    if (ajustementType === "retrait" && qty > selectedProduit.stock_actuel) {
      Alert.alert(
        "Erreur",
        `Stock insuffisant. Disponible: ${selectedProduit.stock_actuel}`,
      );
      return;
    }

    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const dateMouvement = new Date().toISOString();
      const nouveauStock =
        ajustementType === "ajout"
          ? selectedProduit.stock_actuel + qty
          : selectedProduit.stock_actuel - qty;

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "UPDATE produits SET stock_actuel = ? WHERE id = ?;",
          [nouveauStock, selectedProduit.id],
        );

        await db.runAsync(
          `INSERT INTO mouvements_stock (
          produit_id, type_mouvement, quantite,
          stock_avant, stock_apres, date_mouvement,
          commentaire, utilisateur_id
        ) VALUES (?, 'AJUSTEMENT', ?, ?, ?, ?, ?, ?);`,
          [
            selectedProduit.id,
            ajustementType === "ajout" ? qty : -qty,
            selectedProduit.stock_actuel,
            nouveauStock,
            dateMouvement,
            ajustementRaison ||
              `Ajustement ${ajustementType === "ajout" ? "+" : "-"} ${qty} par ${user?.nom || 'Système'}`,
            user?.id || null,
          ],
        );
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ Succès", `Stock ajusté avec succès.`);

      setAdjustModalVisible(false);
      setAjustementQuantite("");
      setAjustementRaison("");
      setSelectedProduit(null);
      loadStockData();
    } catch (error) {
      console.error("[StockScreen] Erreur ajustement:", error);
      Alert.alert("Erreur", "Impossible d'ajuster le stock.");
    }
  };

  // === FILTRAGE ET TRI ===
  const getFilteredProducts = () => {
    let filtered = produits.filter(
      (p) =>
        p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code_barre && p.code_barre.includes(searchQuery)),
    );

    if (selectedCategorie !== "Toutes") {
      filtered = filtered.filter((p) => p.categorie === selectedCategorie);
    }

    filtered.sort((a, b) => {
      let compare = 0;
      switch (sortBy) {
        case "nom":
          compare = a.nom.localeCompare(b.nom);
          break;
        case "stock":
          compare = a.stock_actuel - b.stock_actuel;
          break;
        case "prix":
          compare = a.prix_view - b.prix_view;
          break;
        default:
          compare = 0;
      }
      return sortOrder === "asc" ? compare : -compare;
    });

    return filtered;
  };

  // === STATUT DU STOCK ===
  const getStockStatus = (stock: number, minimum: number) => {
    if (stock <= 0)
      return { label: "RUPTURE", color: "#C62828", icon: "alert-circle" };
    if (stock <= minimum)
      return { label: "ALERTE", color: "#EF6C00", icon: "warning" };
    if (stock <= minimum * 2)
      return { label: "BAS", color: "#F57C00", icon: "arrow-down" };
    return { label: "OK", color: "#2E7D32", icon: "checkmark-circle" };
  };

  // === FORMATAGE ===
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  // === RENDU D'UN PRODUIT ===
  const renderProduitItem = ({ item }: { item: Produit }) => {
    const status = getStockStatus(item.stock_actuel, item.stock_minimum);
    const estEnAlerte = item.stock_actuel <= item.stock_minimum;

    return (
      <TouchableOpacity
        style={[styles.productCard, estEnAlerte && styles.cardAlert]}
        onPress={() => {
          setSelectedProduit(item);
          setShowMouvements(true);
          loadMouvements(item.id);
        }}
        onLongPress={() => {
          if (isAdminOuGerant || isMagasinier) {
            setSelectedProduit(item);
            setAdjustModalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{item.nom}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: status.color + "20" },
              ]}
            >
              <Ionicons
                name={status.icon as any}
                size={12}
                color={status.color}
              />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>

          <Text style={styles.productCategory}>
            <Ionicons name="folder-outline" size={12} color="#777" />{" "}
            {item.categorie}
          </Text>

          {item.code_barre && (
            <Text style={styles.productBarcode}>
              <Ionicons name="barcode-outline" size={12} color="#777" />{" "}
              {item.code_barre}
            </Text>
          )}

          <View style={styles.productPrices}>
            {!isMagasinier && (
              <Text style={styles.productPriceAchat}>
                Achat: {item.prix_achat.toFixed(2)} {devise}
              </Text>
            )}
            <Text style={styles.productPriceVente}>
              Vente: {item.prix_view.toFixed(2)} {devise}
            </Text>
            {!isMagasinier && item.prix_achat > 0 && (
              <Text style={styles.productMargin}>
                Marge:{" "}
                {(
                  ((item.prix_view - item.prix_achat) / item.prix_achat) *
                  100
                ).toFixed(0)}
                %
              </Text>
            )}
          </View>
        </View>

        <View style={styles.stockActionArea}>
          <View style={styles.stockContainer}>
            <Text
              style={[
                styles.stockValue,
                estEnAlerte ? styles.redText : styles.greenText,
              ]}
            >
              {item.stock_actuel}
            </Text>
            <Text style={styles.stockUnit}>u</Text>
          </View>
          <Text style={styles.stockMin}>Min: {item.stock_minimum}</Text>

          <TouchableOpacity
            style={styles.entryButton}
            onPress={() => {
              setSelectedProduit(item);
              setModalVisible(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={16} color="#FFF" />
            <Text style={styles.entryButtonText}>Appro</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // === RENDU D'UN MOUVEMENT ===
  const renderMouvementItem = ({ item }: { item: MouvementStock }) => {
    const isAppro = item.type_mouvement === "APPROVISIONNEMENT";
    const isVente = item.type_mouvement === "VENTE";

    return (
      <View style={styles.mouvementItem}>
        <View style={styles.mouvementLeft}>
          <View
            style={[
              styles.mouvementIcon,
              {
                backgroundColor: isAppro
                  ? "#E8F5E9"
                  : isVente
                    ? "#FFEBEE"
                    : "#FFF3E0",
              },
            ]}
          >
            <Ionicons
              name={
                isAppro
                  ? "arrow-down"
                  : isVente
                    ? "arrow-up"
                    : "swap-horizontal"
              }
              size={16}
              color={isAppro ? "#2E7D32" : isVente ? "#C62828" : "#EF6C00"}
            />
          </View>
          <View>
            <Text style={styles.mouvementType}>
              {item.type_mouvement}
              {item.utilisateur && ` (${item.utilisateur})`}
            </Text>
            <Text style={styles.mouvementDate}>
              {new Date(item.date_mouvement).toLocaleString()}
            </Text>
            {item.commentaire && (
              <Text style={styles.mouvementComment}>{item.commentaire}</Text>
            )}
          </View>
        </View>
        <View style={styles.mouvementRight}>
          <Text
            style={[
              styles.mouvementQuantite,
              isAppro
                ? styles.positive
                : isVente
                  ? styles.negative
                  : styles.neutral,
            ]}
          >
            {isAppro ? "+" : ""}
            {item.quantite}
          </Text>
          <Text style={styles.mouvementStock}>
            {item.stock_avant} → {item.stock_apres}
          </Text>
        </View>
      </View>
    );
  };

  const filteredData = getFilteredProducts();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Chargement du catalogue...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* === EN-TÊTE === */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>📦 Catalogue & Inventaire</Text>
            <View style={styles.headerStats}>
              <Text style={styles.productCount}>
                {filteredData.length} produits
              </Text>
              {alertesStock.length > 0 && (
                <View style={styles.alertBadge}>
                  <Ionicons name="alert" size={14} color="#C62828" />
                  <Text style={styles.alertBadgeText}>
                    {alertesStock.length}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom ou code-barre..."
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

          {/* Filtres */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  selectedCategorie === cat && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategorie(cat)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategorie === cat && styles.filterChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* === STATISTIQUES RAPIDES === */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(totalProduits)}</Text>
            <Text style={styles.statLabel}>Total produits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {totalValeurStock.toFixed(0)} {devise}
            </Text>
            <Text style={styles.statLabel}>Valeur stock</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statValue,
                alertesStock.length > 0 && styles.statValueDanger,
              ]}
            >
              {alertesStock.length}
            </Text>
            <Text style={styles.statLabel}>Alertes</Text>
          </View>
        </View>

        {/* === LISTE DES PRODUITS === */}
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduitItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>Aucun produit trouvé</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? "Essayez une autre recherche"
                  : "Ajoutez des produits dans le catalogue"}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />

        {/* === MODAL APPROVISIONNEMENT === */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>📦 Approvisionnement</Text>
                <TouchableOpacity onPress={resetApproModal}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>
                  Produit: {selectedProduit?.nom}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Stock actuel: {selectedProduit?.stock_actuel} unités
                </Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Quantité reçue *"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={quantiteEntree}
                  onChangeText={setQuantiteEntree}
                />

                <TextInput
                  style={styles.modalInput}
                  placeholder="Numéro de lot (optionnel)"
                  placeholderTextColor="#999"
                  value={numeroLot}
                  onChangeText={setNumeroLot}
                />

                <TextInput
                  style={styles.modalInput}
                  placeholder="Date d'expiration (YYYY-MM-DD)"
                  placeholderTextColor="#999"
                  value={dateExpiration}
                  onChangeText={setDateExpiration}
                />

                {!isMagasinier && (
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Prix d'achat (optionnel)"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={prixAchat}
                    onChangeText={setPrixAchat}
                  />
                )}

                <TextInput
                  style={styles.modalInput}
                  placeholder="Commentaire (optionnel)"
                  placeholderTextColor="#999"
                  value={commentaire}
                  onChangeText={setCommentaire}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={resetApproModal}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleApprovisionner}
                >
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                  <Text style={styles.confirmButtonText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* === MODAL AJUSTEMENT === */}
        <Modal visible={adjustModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔧 Ajustement de stock</Text>
                <TouchableOpacity onPress={() => { setAdjustModalVisible(false); setSelectedProduit(null); }}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Produit: {selectedProduit?.nom}
              </Text>
              <Text style={styles.modalSubtitle}>
                Stock actuel: {selectedProduit?.stock_actuel} unités
              </Text>

              <View style={styles.adjustTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.adjustTypeButton,
                    ajustementType === "ajout" && styles.adjustTypeActive,
                  ]}
                  onPress={() => setAjustementType("ajout")}
                >
                  <Ionicons
                    name="add-circle"
                    size={20}
                    color={ajustementType === "ajout" ? "#2E7D32" : "#666"}
                  />
                  <Text
                    style={[
                      styles.adjustTypeText,
                      ajustementType === "ajout" && styles.adjustTypeActiveText,
                    ]}
                  >
                    Ajouter
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.adjustTypeButton,
                    ajustementType === "retrait" && styles.adjustTypeActive,
                  ]}
                  onPress={() => setAjustementType("retrait")}
                >
                  <Ionicons
                    name="remove-circle"
                    size={20}
                    color={ajustementType === "retrait" ? "#C62828" : "#666"}
                  />
                  <Text
                    style={[
                      styles.adjustTypeText,
                      ajustementType === "retrait" &&
                        styles.adjustTypeActiveText,
                    ]}
                  >
                    Retirer
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Quantité"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={ajustementQuantite}
                onChangeText={setAjustementQuantite}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Raison de l'ajustement"
                placeholderTextColor="#999"
                value={ajustementRaison}
                onChangeText={setAjustementRaison}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => { setAdjustModalVisible(false); setSelectedProduit(null); }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleAjustement}
                >
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                  <Text style={styles.confirmButtonText}>Appliquer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* === MODAL HISTORIQUE === */}
        <Modal visible={showMouvements} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.mouvementModal]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  📋 Historique des mouvements
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowMouvements(false);
                    setMouvements([]);
                    setSelectedProduit(null);
                  }}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Produit: {selectedProduit?.nom}
              </Text>
              <Text style={styles.modalSubtitle}>
                Stock actuel: {selectedProduit?.stock_actuel} unités
              </Text>

              {mouvementsLoading ? (
                <ActivityIndicator
                  size="large"
                  color="#1565C0"
                  style={styles.mouvementLoader}
                />
              ) : mouvements.length === 0 ? (
                <View style={styles.emptyMouvement}>
                  <Ionicons name="time-outline" size={48} color="#CCC" />
                  <Text style={styles.emptyText}>Aucun mouvement</Text>
                </View>
              ) : (
                <FlatList
                  data={mouvements}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderMouvementItem}
                  style={styles.mouvementList}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>
        </Modal>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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

  // === EN-TÊTE ===
  header: {
    padding: 16,
    backgroundColor: "#1565C0",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  productCount: {
    color: "#FFF",
    fontSize: 13,
    opacity: 0.8,
  },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  alertBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },

  filtersScroll: {
    flexDirection: "row",
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#FFF",
  },
  filterChipText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#1565C0",
  },

  // === STATS BAR ===
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    margin: 16,
    marginTop: 12,
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
  statValueDanger: {
    color: "#C62828",
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

  // === LISTE ===
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },

  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 14,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardAlert: {
    borderColor: "#FFCDD2",
    backgroundColor: "#FFF5F5",
  },

  productInfo: { flex: 2, marginRight: 10 },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  productCategory: {
    fontSize: 12,
    color: "#777",
    marginBottom: 2,
  },
  productBarcode: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
  },
  productPrices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  productPriceAchat: {
    fontSize: 12,
    color: "#E65100",
  },
  productPriceVente: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1565C0",
  },
  productMargin: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "500",
  },

  stockActionArea: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  stockValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  stockUnit: {
    fontSize: 10,
    color: "#999",
  },
  stockMin: {
    fontSize: 10,
    color: "#999",
  },
  greenText: { color: "#2E7D32" },
  redText: { color: "#C62828" },

  entryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1565C0",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  entryButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 12,
    color: "#999",
    fontSize: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    textAlign: "center",
    color: "#CCC",
    fontSize: 13,
    marginTop: 4,
  },

  // === MODAL ===
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 16,
    width: "90%",
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
    color: "#1565C0",
  },
  modalBody: {
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 10,
    color: "#333",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#2E7D32",
  },
  confirmButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },

  // === AJUSTEMENT ===
  adjustTypeContainer: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 12,
  },
  adjustTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#F5F5F5",
  },
  adjustTypeActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#1565C0",
  },
  adjustTypeText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  adjustTypeActiveText: {
    color: "#1565C0",
  },

  // === MOUVEMENTS ===
  mouvementModal: {
    maxHeight: "80%",
  },
  mouvementLoader: {
    paddingVertical: 40,
  },
  mouvementList: {
    maxHeight: 400,
  },
  mouvementItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  mouvementLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  mouvementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  mouvementType: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  mouvementDate: {
    fontSize: 11,
    color: "#999",
  },
  mouvementComment: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
  },
  mouvementRight: {
    alignItems: "flex-end",
  },
  mouvementQuantite: {
    fontSize: 16,
    fontWeight: "bold",
  },
  positive: { color: "#2E7D32" },
  negative: { color: "#C62828" },
  neutral: { color: "#EF6C00" },
  mouvementStock: {
    fontSize: 11,
    color: "#999",
  },
  emptyMouvement: {
    alignItems: "center",
    paddingVertical: 40,
  },
}); 

export default StockScreen;
