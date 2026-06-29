import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing"; // Ajout de l'import manquant
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
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useUser } from "../context/UserContext";

const DATABASE_NAME = "stockia_secure.db";

// === INTERFACES ===
interface Product {
  id: number;
  code_barre: string;
  nom: string;
  categorie: string;
  sous_categorie?: string;
  prix_achat: number;
  prix_view: number;
  prix_promo?: number;
  stock_actuel: number;
  stock_minimum: number;
  stock_securite?: number;
  unite_mesure?: string;
  poids?: number;
  emplacement?: string;
  actif: number;
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  nom: string;
  categorie: string;
  sous_categorie: string;
  code_barre: string;
  prix_achat: string;
  prix_view: string;
  prix_promo: string;
  stock_actuel: string;
  stock_minimum: string;
  stock_securite: string;
  unite_mesure: string;
  poids: string;
  emplacement: string;
  actif: boolean;
}

interface Category {
  nom: string;
  count: number;
}

// === CONSTANTES ===
const PREDEFINED_CATEGORIES = [
  "Alimentation", "Boissons", "Snacks", "Hygiène", "Beauté",
  "Pharmacie", "Ménage", "Électroménager", "Vêtements", "Accessoires", "Autres",
];

const UNITES_MESURE = [
  "unité", "kg", "g", "L", "mL", "pièce", "paquet", "boîte", "sac", "bouteille", "carton",
];

export default function ProductManagementScreen() {
  const { user } = useUser();
  const isAdminOuGerant = user?.role === "ADMIN" || user?.role === "GERANT";

  // === ÉTATS ===
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");
  const [categories, setCategories] = useState<Category[]>([]);
  const [devise, setDevise] = useState("USD");

  // === ÉTATS MODAL ===
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    nom: "", categorie: "", sous_categorie: "", code_barre: "",
    prix_achat: "", prix_view: "", prix_promo: "", stock_actuel: "",
    stock_minimum: "5", stock_securite: "3", unite_mesure: "unité",
    poids: "", emplacement: "", actif: true,
  });

  // === INITIALISATION ===
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadCurrency();
  }, []);

  // === FILTRAGE ===
  useEffect(() => {
    let filtered = [...products];
    if (selectedCategory !== "Toutes") {
      filtered = filtered.filter(p => p.categorie === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(query) ||
        (p.code_barre && p.code_barre.includes(query))
      );
    }
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  // === CHARGEMENT DES DONNÉES ===
  const loadProducts = async () => {
    try {
      setLoading(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const results = await db.getAllAsync<Product>(`SELECT * FROM produits ORDER BY nom ASC;`);
      setProducts(results || []);
      setFilteredProducts(results || []);
    } catch (error) {
      console.error("[ProductManagement] Erreur chargement:", error);
      Alert.alert("Erreur", "Impossible de charger les produits.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCategories = async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const results = await db.getAllAsync<any>(
        `SELECT categorie as nom, COUNT(*) as count FROM produits GROUP BY categorie ORDER BY count DESC;`
      );
      setCategories(results || []);
    } catch (error) {
      console.error("[ProductManagement] Erreur catégories:", error);
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
      console.error("[ProductManagement] Erreur devise:", error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
    loadCategories();
  }, []);

  // === ACTIONS MODAL ===
  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      nom: "", categorie: "", sous_categorie: "", code_barre: "",
      prix_achat: "", prix_view: "", prix_promo: "", stock_actuel: "0",
      stock_minimum: "5", stock_securite: "3", unite_mesure: "unité",
      poids: "", emplacement: "", actif: true,
    });
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nom: product.nom,
      categorie: product.categorie,
      sous_categorie: product.sous_categorie || "",
      code_barre: product.code_barre || "",
      prix_achat: product.prix_achat.toString(),
      prix_view: product.prix_view.toString(),
      prix_promo: product.prix_promo?.toString() || "",
      stock_actuel: product.stock_actuel.toString(),
      stock_minimum: product.stock_minimum.toString(),
      stock_securite: product.stock_securite?.toString() || "3",
      unite_mesure: product.unite_mesure || "unité",
      poids: product.poids?.toString() || "",
      emplacement: product.emplacement || "",
      actif: product.actif === 1,
    });
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.nom.trim() || !formData.categorie.trim()) {
      Alert.alert("Erreur", "Le nom et la catégorie sont requis.");
      return;
    }
    if (!formData.prix_achat || parseFloat(formData.prix_achat) <= 0 || !formData.prix_view || parseFloat(formData.prix_view) <= 0) {
      Alert.alert("Erreur", "Les prix d'achat et de vente doivent être supérieurs à 0.");
      return;
    }

    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const now = new Date().toISOString();

      const productData = {
        nom: formData.nom.trim(),
        categorie: formData.categorie.trim(),
        sous_categorie: formData.sous_categorie.trim() || null,
        code_barre: formData.code_barre.trim() || null,
        prix_achat: parseFloat(formData.prix_achat),
        prix_view: parseFloat(formData.prix_view),
        prix_promo: formData.prix_promo ? parseFloat(formData.prix_promo) : null,
        stock_actuel: parseInt(formData.stock_actuel) || 0,
        stock_minimum: parseInt(formData.stock_minimum) || 5,
        stock_securite: parseInt(formData.stock_securite) || 3,
        unite_mesure: formData.unite_mesure || "unité",
        poids: formData.poids ? parseFloat(formData.poids) : null,
        emplacement: formData.emplacement.trim() || null,
        actif: formData.actif ? 1 : 0,
        updated_at: now,
      };

      if (editingProduct) {
        await db.runAsync(
          `UPDATE produits SET
            nom = ?, categorie = ?, sous_categorie = ?, code_barre = ?,
            prix_achat = ?, prix_view = ?, prix_promo = ?,
            stock_actuel = ?, stock_minimum = ?, stock_securite = ?,
            unite_mesure = ?, poids = ?, emplacement = ?, actif = ?, updated_at = ?
           WHERE id = ?;`,
          [
            productData.nom, productData.categorie, productData.sous_categorie, productData.code_barre,
            productData.prix_achat, productData.prix_view, productData.prix_promo,
            productData.stock_actuel, productData.stock_minimum, productData.stock_securite,
            productData.unite_mesure, productData.poids, productData.emplacement, productData.actif,
            productData.updated_at, editingProduct.id
          ]
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await db.runAsync(
          `INSERT INTO produits (
            nom, categorie, sous_categorie, code_barre, prix_achat, prix_view, prix_promo,
            stock_actuel, stock_minimum, stock_securite, unite_mesure, poids, emplacement, actif, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            productData.nom, productData.categorie, productData.sous_categorie, productData.code_barre,
            productData.prix_achat, productData.prix_view, productData.prix_promo,
            productData.stock_actuel, productData.stock_minimum, productData.stock_securite,
            productData.unite_mesure, productData.poids, productData.emplacement, productData.actif, now, now
          ]
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setModalVisible(false);
      loadProducts();
      loadCategories();
    } catch (error) {
      console.error("[ProductManagement] Erreur sauvegarde:", error);
      Alert.alert("Erreur", "Impossible d'enregistrer le produit.");
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      "Supprimer",
      `Voulez-vous supprimer "${product.nom}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
              await db.runAsync("DELETE FROM produits WHERE id = ?;", [product.id]);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              loadProducts();
              loadCategories();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le produit.");
            }
          },
        },
      ]
    );
  };

  const handleExportProducts = async () => {
    try {
      const exportData = products.map(p => ({
        nom: p.nom, categorie: p.categorie, code_barre: p.code_barre,
        prix_achat: p.prix_achat, prix_view: p.prix_view, stock_actuel: p.stock_actuel,
        stock_minimum: p.stock_minimum, unite_mesure: p.unite_mesure, emplacement: p.emplacement,
      }));

      const json = JSON.stringify(exportData, null, 2);
      const path = `${FileSystem.documentDirectory}produits_export_${new Date().toISOString().split('T')[0]}.json`;
      await FileSystem.writeAsStringAsync(path, json);

      Alert.alert("✅ Export réussi", "Fichier sauvegardé.", [
        { text: "OK" },
        { text: "Partager", onPress: () => Sharing.shareAsync(path) }
      ]);
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'exporter les produits.");
    }
  };

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
      {/* EN-TÊTE */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>📦 Gestion des Produits</Text>
          <TouchableOpacity onPress={handleExportProducts} style={{ marginRight: 10 }}>
            <Ionicons name="share-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.count}>{filteredProducts.length} u.</Text>
        </View>

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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === "Toutes" && styles.categoryChipActive]}
            onPress={() => setSelectedCategory("Toutes")}
          >
            <Text style={[styles.categoryChipText, selectedCategory === "Toutes" && styles.categoryChipTextActive]}>Toutes</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.nom}
              style={[styles.categoryChip, selectedCategory === cat.nom && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.nom)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat.nom && styles.categoryChipTextActive]}>
                {cat.nom} ({cat.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTE */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => openEditModal(item)} activeOpacity={0.7}>
            <View style={styles.productInfo}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{item.nom}</Text>
                <View style={[styles.statusBadge, item.actif === 1 ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>{item.actif === 1 ? "Actif" : "Inactif"}</Text>
                </View>
              </View>
              <Text style={styles.productCategory}>{item.categorie}</Text>
              {item.code_barre && <Text style={styles.productBarcode}>📷 {item.code_barre}</Text>}
              <View style={styles.productPrices}>
                <Text style={styles.productPriceAchat}>P.A: {item.prix_achat.toFixed(2)} {devise}</Text>
                <Text style={styles.productPriceVente}>P.V: {item.prix_view.toFixed(2)} {devise}</Text>
              </View>
              <Text style={styles.productStock}>
                Stock: {item.stock_actuel} {item.unite_mesure || 'unité'}
                {item.stock_actuel <= item.stock_minimum && ' ⚠️ Alerte'}
              </Text>
            </View>
            {isAdminOuGerant && (
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(item)}>
                <Ionicons name="trash-outline" size={20} color="#C62828" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />

      {/* FAB */}
      {isAdminOuGerant && (
        <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* MODAL FORMULAIRE COMPLET */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProduct ? "Modifier" : "Nouveau produit"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginBottom: 20 }}>
              <Text style={styles.inputLabel}>Nom du produit *</Text>
              <TextInput style={styles.input} placeholder="Ex: Sac de Riz 25kg" value={formData.nom} onChangeText={(text) => setFormData({ ...formData, nom: text })} />

              <Text style={styles.inputLabel}>Catégorie *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                {PREDEFINED_CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat} style={[styles.categoryOption, formData.categorie === cat && styles.categoryOptionActive]} onPress={() => setFormData({ ...formData, categorie: cat })}>
                    <Text style={[styles.categoryOptionText, formData.categorie === cat && styles.categoryOptionTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={styles.input} placeholder="Ou spécifier une catégorie..." value={formData.categorie} onChangeText={(text) => setFormData({ ...formData, categorie: text })} />

              <Text style={styles.inputLabel}>Prix d'achat * ({devise})</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="0.00" value={formData.prix_achat} onChangeText={(text) => setFormData({ ...formData, prix_achat: text })} />

              <Text style={styles.inputLabel}>Prix de vente * ({devise})</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="0.00" value={formData.prix_view} onChangeText={(text) => setFormData({ ...formData, prix_view: text })} />

              <Text style={styles.inputLabel}>Stock actuel</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={formData.stock_actuel} onChangeText={(text) => setFormData({ ...formData, stock_actuel: text })} />

              <Text style={styles.inputLabel}>Stock Minimum (Alerte)</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="5" value={formData.stock_minimum} onChangeText={(text) => setFormData({ ...formData, stock_minimum: text })} />

              <Text style={styles.inputLabel}>Code-barres</Text>
              <View style={styles.barcodeContainer}>
                <TextInput style={[styles.input, styles.barcodeInput]} placeholder="Code barres" value={formData.code_barre} onChangeText={(text) => setFormData({ ...formData, code_barre: text })} keyboardType="numeric" />
                <TouchableOpacity style={styles.barcodeButton} onPress={() => setFormData({ ...formData, code_barre: Math.floor(1000000000000 + Math.random() * 9000000000000).toString() })}>
                  <Ionicons name="barcode" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={[styles.switchContainer, { marginTop: 15 }]}>
                <Text style={styles.inputLabel}>Produit Actif</Text>
                <Switch value={formData.actif} onValueChange={(value) => setFormData({ ...formData, actif: value })} />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
              <Text style={styles.saveButtonText}>Enregistrer le produit</Text>
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
  count: { color: "#FFF", fontSize: 13, opacity: 0.8, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#333" },
  categoriesScroll: { flexDirection: "row" },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", marginRight: 8 },
  categoryChipActive: { backgroundColor: "#FFF" },
  categoryChipText: { color: "#FFF", fontSize: 12, fontWeight: "500" },
  categoryChipTextActive: { color: "#1565C0" },
  listContent: { paddingHorizontal: 12, paddingBottom: 90, paddingTop: 10 },
  productCard: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#FFF", padding: 14, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: "#EAEAEA", elevation: 2 },
  productInfo: { flex: 1 },
  productHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  productName: { fontSize: 15, fontWeight: "bold", color: "#333", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusActive: { backgroundColor: "#E8F5E9" },
  statusInactive: { backgroundColor: "#FFEBEE" },
  statusText: { fontSize: 10, fontWeight: "bold", color: "#333" },
  productCategory: { fontSize: 12, color: "#777", marginBottom: 2 },
  productBarcode: { fontSize: 11, color: "#999", marginBottom: 2 },
  productPrices: { flexDirection: "row", gap: 15, marginTop: 4 },
  productPriceAchat: { fontSize: 12, color: "#E65100" },
  productPriceVente: { fontSize: 13, fontWeight: "600", color: "#1565C0" },
  productStock: { fontSize: 12, color: "#666", marginTop: 4 },
  deleteButton: { padding: 8, justifyContent: "center" },
  fab: { position: "absolute", bottom: 24, right: 24, backgroundColor: "#1565C0", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalWrapper: { backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 4 },
  input: { backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#DDD", borderRadius: 8, padding: 10, fontSize: 14, color: "#333", marginBottom: 12 },
  categorySelector: { flexDirection: "row", marginBottom: 8 },
  categoryOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#F5F5F5", marginRight: 8, height: 30 },
  categoryOptionActive: { backgroundColor: "#1565C0" },
  categoryOptionText: { fontSize: 12, color: "#666" },
  categoryOptionTextActive: { color: "#FFF" },
  barcodeContainer: { flexDirection: "row", gap: 8 },
  barcodeInput: { flex: 1 },
  barcodeButton: { backgroundColor: "#1565C0", paddingHorizontal: 14, borderRadius: 8, justifyContent: "center", alignItems: "center", height: 43 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saveButton: { backgroundColor: "#1565C0", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 10 },
  saveButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 }
}); 

export default ProductManagementScreen;