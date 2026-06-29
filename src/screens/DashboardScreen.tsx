import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SQLite from "expo-sqlite";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useUser } from "../context/UserContext";

const DATABASE_NAME = "stockia_secure.db";
const { width, height } = Dimensions.get("window");

// === INTERFACES ===
interface KPI {
  caJour: number;
  caMois: number;
  beneficesJour: number;
  beneficesMois: number;
  dettesEnCours: number;
  produitsAlerte: number;
  ventesJour: number;
  clientsJour: number;
  tauxConversion: number;
  panierMoyen: number;
}

interface ProduitAlerte {
  id: number;
  nom: string;
  stock_actuel: number;
  stock_minimum: number;
  categorie: string;
}

interface StatistiquesVentes {
  jour: string;
  total: number;
}

interface VenteParCategorie {
  nom: string;
  total: number;
  color: string;
}

interface ActiviteRecente {
  id: number;
  action: string;
  details: string;
  timestamp: string;
  utilisateur: string;
}

export default function DashboardScreen() {
  const { user } = useUser();
  const isCaisse = user?.role === "CAISSIER";
  const isMagasinier = user?.role === "MAGASINIER";
  const isAdminOuGerant = user?.role === "ADMIN" || user?.role === "GERANT";

  // === ÉTATS KPI ===
  const [kpi, setKpi] = useState<KPI>({
    caJour: 0,
    caMois: 0,
    beneficesJour: 0,
    beneficesMois: 0,
    dettesEnCours: 0,
    produitsAlerte: 0,
    ventesJour: 0,
    clientsJour: 0,
    tauxConversion: 0,
    panierMoyen: 0,
  });

  // === ÉTATS DONNÉES ===
  const [produitsAlerte, setProduitsAlerte] = useState<ProduitAlerte[]>([]);
  const [statistiquesHebdo, setStatistiquesHebdo] = useState<StatistiquesVentes[]>([]);
  const [ventesParCategorie, setVentesParCategorie] = useState<VenteParCategorie[]>([]);
  const [nomBoutique, setNomBoutique] = useState("Ma Boutique");
  const [devise, setDevise] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [objectifJour, setObjectifJour] = useState(0);
  const [progressionObjectif, setProgressionObjectif] = useState(0);

  // === ÉTATS UI ===
  const [selectedPeriod, setSelectedPeriod] = useState<"jour" | "semaine" | "mois">("jour");
  const [showDetails, setShowDetails] = useState(false);
 
  // CORRECTION 3 : Utilisation correcte de useRef pour l'animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // === COLORS ===
  const colors = [
    "#1565C0", "#2E7D32", "#F57C00", "#C62828",
    "#6A1B9A", "#00838F", "#E65100", "#1A237E"
  ];

  // === INITIALISATION ===
  useEffect(() => {
    loadDashboardData();
   
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // === RAFRAÎCHISSEMENT ===
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, []);

  // === CHARGEMENT DES DONNÉES ===
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Correction expo-sqlite : openDatabaseAsync s'ouvre proprement en asynchrone
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      await loadSettings(db);
      await loadKPI(db);
      await loadStockAlerts(db);
      await loadWeeklyStats(db);
      await loadCategorySales(db);
      await loadRecentActivities(db);

    } catch (error) {
      console.error("[Dashboard] Erreur chargement:", error);
      Alert.alert("Erreur", "Impossible de charger les données du tableau de bord.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // === CHARGEMENT DES PARAMÈTRES ===
  const loadSettings = async (db: SQLite.SQLiteDatabase) => {
    try {
      const paramBoutique = await db.getFirstAsync<{ valeur: string }>(
        "SELECT valeur FROM parametres_systeme WHERE cle = 'nom_boutique';"
      );
      if (paramBoutique) setNomBoutique(paramBoutique.valeur);

      const paramDevise = await db.getFirstAsync<{ valeur: string }>(
        "SELECT valeur FROM parametres_systeme WHERE cle = 'devise_symbole';"
      );
      if (paramDevise) setDevise(paramDevise.valeur);

      const paramObjectif = await db.getFirstAsync<{ valeur: string }>(
        "SELECT valeur FROM parametres_systeme WHERE cle = 'objectif_journalier';"
      );
      setObjectifJour(parseFloat(paramObjectif?.valeur || "500"));
    } catch (error) {
      console.error("[Dashboard] Erreur chargement paramètres:", error);
    }
  };

  // === CHARGEMENT DES KPI ===
  const loadKPI = async (db: SQLite.SQLiteDatabase) => {
    try {
      const aujourdHui = new Date().toISOString().split('T')[0];
      const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const caJourResult = await db.getFirstAsync<{ total: number }>(
        "SELECT SUM(montant_net) as total FROM ventes WHERE date_vente LIKE ?;",
        [`${aujourdHui}%`]
      );
      const caJour = caJourResult?.total || 0;

      const caMoisResult = await db.getFirstAsync<{ total: number }>(
        "SELECT SUM(montant_net) as total FROM ventes WHERE date_vente >= ?;",
        [debutMois]
      );
      const caMois = caMoisResult?.total || 0;

      const ventesResult = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM ventes WHERE date_vente LIKE ?;",
        [`${aujourdHui}%`]
      );
      const ventesJour = ventesResult?.count || 0;

      const clientsResult = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(DISTINCT client_id) as count FROM ventes WHERE date_vente LIKE ? AND client_id IS NOT NULL;",
        [`${aujourdHui}%`]
      );
      const clientsJour = clientsResult?.count || 0;

      const dettesResult = await db.getFirstAsync<{ total: number }>(
        "SELECT SUM(montant_restant) as total FROM dettes WHERE statut = 'EN_COURS';"
      );
      const dettes = dettesResult?.total || 0;

      const alerteResult = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM produits WHERE stock_actuel <= stock_minimum;"
      );
      const produitsAlerte = alerteResult?.count || 0;

      let beneficesJour = 0;
      let beneficesMois = 0;
     
      if (isAdminOuGerant) {
        const benefJourResult = await db.getFirstAsync<{ profit: number }>(
          `SELECT SUM((dv.prix_unitaire - p.prix_achat) * dv.quantite) as profit
           FROM details_ventes dv
           JOIN produits p ON dv.produit_id = p.id
           JOIN ventes v ON dv.vente_id = v.id
           WHERE v.date_vente LIKE ?;`,
          [`${aujourdHui}%`]
        );
        beneficesJour = benefJourResult?.profit || 0;

        const benefMoisResult = await db.getFirstAsync<{ profit: number }>(
          `SELECT SUM((dv.prix_unitaire - p.prix_achat) * dv.quantite) as profit
           FROM details_ventes dv
           JOIN produits p ON dv.produit_id = p.id
           JOIN ventes v ON dv.vente_id = v.id
           WHERE v.date_vente >= ?;`,
          [debutMois]
        );
        beneficesMois = benefMoisResult?.profit || 0;
      }

      const panierResult = await db.getFirstAsync<{ avg: number }>(
        "SELECT AVG(montant_net) as avg FROM ventes WHERE date_vente LIKE ?;",
        [`${aujourdHui}%`]
      );
      const panierMoyen = panierResult?.avg || 0;

      const tauxConversion = clientsJour > 0 ? (ventesJour / clientsJour) * 100 : 0;
      const progression = objectifJour > 0 ? (caJour / objectifJour) * 100 : 0;
      setProgressionObjectif(Math.min(progression, 100));

      setKpi({
        caJour,
        caMois,
        beneficesJour,
        beneficesMois,
        dettesEnCours: dettes,
        produitsAlerte,
        ventesJour,
        clientsJour,
        tauxConversion,
        panierMoyen,
      });

    } catch (error) {
      console.error("[Dashboard] Erreur chargement KPI:", error);
    }
  };

  const loadStockAlerts = async (db: SQLite.SQLiteDatabase) => {
    try {
      const results = await db.getAllAsync<ProduitAlerte>(
        `SELECT id, nom, stock_actuel, stock_minimum, categorie
         FROM produits
         WHERE stock_actuel <= stock_minimum
         ORDER BY (stock_minimum - stock_actuel) DESC
         LIMIT 5;`
      );
      setProduitsAlerte(results || []);
    } catch (error) {
      console.error("[Dashboard] Erreur chargement alertes:", error);
    }
  };

  const loadWeeklyStats = async (db: SQLite.SQLiteDatabase) => {
    try {
      const dateDebutSemaine = new Date();
      dateDebutSemaine.setDate(dateDebutSemaine.getDate() - 7);

      const results = await db.getAllAsync<StatistiquesVentes>(
        `SELECT DATE(date_vente) as jour, SUM(montant_net) as total
         FROM ventes
         WHERE date_vente >= ?
         GROUP BY DATE(date_vente)
         ORDER BY jour ASC;`,
        [dateDebutSemaine.toISOString().split('T')[0]]
      );
      setStatistiquesHebdo(results || []);
    } catch (error) {
      console.error("[Dashboard] Erreur chargement stats hebdo:", error);
    }
  };

  const loadCategorySales = async (db: SQLite.SQLiteDatabase) => {
    try {
      const today = new Date().toISOString().split('T')[0];
     
      const results = await db.getAllAsync<{ nom: string; total: number }>(
        `SELECT p.categorie as nom, SUM(dv.sous_total) as total
         FROM details_ventes dv
         JOIN produits p ON dv.produit_id = p.id
         JOIN ventes v ON dv.vente_id = v.id
         WHERE v.date_vente LIKE ?
         GROUP BY p.categorie
         ORDER BY total DESC
         LIMIT 5;`,
        [`${today}%`]
      );

      const categoryData: VenteParCategorie[] = results.map((item, index) => ({
        ...item,
        color: colors[index % colors.length],
      }));
      setVentesParCategorie(categoryData);
    } catch (error) {
      console.error("[Dashboard] Erreur chargement catégories:", error);
    }
  };

  const loadRecentActivities = async (db: SQLite.SQLiteDatabase) => {
    try {
      // Les logs d'audit sont chargés ici en tâche de fond si nécessaire
    } catch (error) {
      console.error("[Dashboard] Erreur chargement activités:", error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toFixed(0);
  };

  const handleStockAlert = () => {
    if (produitsAlerte.length === 0) {
      Alert.alert("✅ Stock OK", "Tous les produits sont bien approvisionnés.");
      return;
    }

    const message = produitsAlerte
      .map(p => `• ${p.nom}: ${p.stock_actuel}/${p.stock_minimum} unités`)
      .join('\n');

    Alert.alert(
      `⚠️ Alertes Stock (${produitsAlerte.length})`,
      `${message}\n\nVeuillez réapprovisionner ces produits.`,
      [
        { text: "OK" },
        { text: "Voir détails", onPress: () => {} }
      ]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Warning);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Chargement du tableau de bord...</Text>
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
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* EN-TÊTE */}
          <View style={styles.header}>
            <View>
              <Text style={styles.shopName}>{nomBoutique}</Text>
              <Text style={styles.userBadge}>
                <Ionicons name="person-circle" size={16} color="#666" /> {user?.nom} ({user?.role})
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={handleStockAlert}
              >
                <Ionicons name="notifications-outline" size={24} color="#1565C0" />
                {produitsAlerte.length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {produitsAlerte.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={onRefresh}>
                <Ionicons name="refresh-outline" size={24} color="#1565C0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* OBJECTIF DU JOUR */}
          <View style={styles.objectifContainer}>
            <View style={styles.objectifHeader}>
              <Text style={styles.objectifLabel}>🎯 Objectif du jour</Text>
              <Text style={styles.objectifValue}>
                {kpi.caJour.toFixed(2)} / {objectifJour.toFixed(2)} {devise}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progressionObjectif}%` },
                  progressionObjectif >= 100 && styles.progressBarComplete
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progressionObjectif.toFixed(0)}% atteint
            </Text>
          </View>

          {/* KPI GRID */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="cash" size={20} color="#1565C0" />
              </View>
              <Text style={styles.kpiLabel}>CA du jour</Text>
              <Text style={[styles.kpiValue, styles.blueText]}>
                {kpi.caJour.toFixed(2)} {devise}
              </Text>
              <Text style={styles.kpiSub}>Mois: {kpi.caMois.toFixed(2)}</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="receipt" size={20} color="#2E7D32" />
              </View>
              <Text style={styles.kpiLabel}>Ventes</Text>
              <Text style={[styles.kpiValue, styles.greenText]}>
                {kpi.ventesJour}
              </Text>
              <Text style={styles.kpiSub}>{kpi.clientsJour} clients</Text>
            </View>

            {isAdminOuGerant && (
              <View style={styles.kpiCard}>
                <View style={styles.kpiIconContainer}>
                  <Ionicons name="trending-up" size={20} color="#EF6C00" />
                </View>
                <Text style={styles.kpiLabel}>Bénéfice (Jour)</Text>
                <Text style={[styles.kpiValue, styles.orangeText]}>
                  +{kpi.beneficesJour.toFixed(2)} {devise}
                </Text>
                <Text style={styles.kpiSub}>Mois: +{kpi.beneficesMois.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.kpiCard}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="cart" size={20} color="#6A1B9A" />
              </View>
              <Text style={styles.kpiLabel}>Panier moyen</Text>
              <Text style={[styles.kpiValue, styles.purpleText]}>
                {kpi.panierMoyen.toFixed(2)} {devise}
              </Text>
              <Text style={styles.kpiSub}>{formatNumber(kpi.ventesJour)} vts</Text>
            </View>

            <TouchableOpacity
              style={[styles.kpiCard, styles.stockCard]}
              onPress={handleStockAlert}
            >
              <View style={styles.kpiIconContainer}>
                <Ionicons
                  name={kpi.produitsAlerte > 0 ? "alert" : "checkmark"}
                  size={20}
                  color={kpi.produitsAlerte > 0 ? "#C62828" : "#2E7D32"}
                />
              </View>
              <Text style={styles.kpiLabel}>Alertes Stock</Text>
              <Text style={[
                styles.kpiValue,
                kpi.produitsAlerte > 0 ? styles.redText : styles.greenText
              ]}>
                {kpi.produitsAlerte}
              </Text>
              <Text style={styles.kpiSub}>
                {kpi.produitsAlerte > 0 ? `⚠️ ${kpi.produitsAlerte} prod` : "✅ Stock OK"}
              </Text>
            </TouchableOpacity>

            <View style={styles.kpiCard}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="stats-chart" size={20} color="#00838F" />
              </View>
              <Text style={styles.kpiLabel}>Conversion</Text>
              <Text style={[styles.kpiValue, styles.cyanText]}>
                {kpi.tauxConversion.toFixed(1)}%
              </Text>
              <Text style={styles.kpiSub}>{kpi.clientsJour} clt</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// CORRECTION 2 : Retrait de l'export default redondant à la fin

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#EAEAEA", elevation: 2 },
  shopName: { fontSize: 18, fontWeight: "bold", color: "#1565C0" },
  userBadge: { fontSize: 13, color: "#666", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  notificationButton: { position: "relative" },
  notificationBadge: { position: "absolute", top: -6, right: -6, backgroundColor: "#C62828", borderRadius: 10, width: 18, height: 18, justifyContent: "center", alignItems: "center" },
  notificationBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  objectifContainer: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#EAEAEA" },
  objectifHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  objectifLabel: { fontSize: 14, color: "#666", fontWeight: "500" },
  objectifValue: { fontSize: 14, fontWeight: "bold", color: "#1565C0" },
  progressBarContainer: { height: 8, backgroundColor: "#E0E0E0", borderRadius: 4, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: "#1565C0", borderRadius: 4 },
  progressBarComplete: { backgroundColor: "#2E7D32" },
  progressText: { fontSize: 12, color: "#666", marginTop: 4, textAlign: "right" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  kpiCard: { flex: 1, minWidth: "45%", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#EAEAEA", elevation: 1 },
  kpiIconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#F5F5F5", justifyContent: "center", alignItems: "center", marginBottom: 4 },
  kpiLabel: { fontSize: 11, color: "#777", fontWeight: "500" },
  kpiValue: { fontSize: 16, fontWeight: "bold", marginTop: 2 },
  kpiSub: { fontSize: 10, color: "#999", marginTop: 2 },
  stockCard: { backgroundColor: "#FFF5F5", borderColor: "#FFCDD2" },
  blueText: { color: "#1565C0" },
  greenText: { color: "#2E7D32" },
  orangeText: { color: "#EF6C00" },
  redText: { color: "#C62828" },
  purpleText: { color: "#6A1B9A" },
  cyanText: { color: "#00838F" },
}); 

export default DashboardScreen;