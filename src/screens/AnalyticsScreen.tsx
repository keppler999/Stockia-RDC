 import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as SQLite from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
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
    View
} from "react-native";
// CORRECTION : Importation de l'icône manquante
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";

const DATABASE_NAME = "stockia_secure.db";
const { width, height } = Dimensions.get("window");

// === INTERFACES ===
interface KPI {
  caJour: number;
  caMois: number;
  caAnnee: number;
  caPrecedent: number;
  beneficesJour: number;
  beneficesMois: number;
  beneficesAnnee: number;
  margeMoyenne: number;
  panierMoyen: number;
  panierMoyenMois: number;
  tauxConversion: number;
  tauxFidelisation: number;
  nombreVentes: number;
  nombreClients: number;
  produitsVendus: number;
  stockTotal: number;
  valeurStock: number;
  rotationStock: number;
  joursStock: number;
  dettesEnCours: number;
  dettesRecouvrees: number;
  topProduits: TopProduit[];
  topClients: TopClient[];
  ventesJournalieres: VenteJournaliere[];
  ventesParCategorie: VenteParCategorie[];
  ventesParMois: VenteParMois[];
  objectifAtteint: boolean;
  progressionObjectif: number;
}

interface TopProduit {
  id: number;
  nom: string;
  quantite: number;
  total: number;
  categorie: string;
}

interface TopClient {
  id: number;
  nom: string;
  total_achats: number;
  points: number;
  nombre_ventes: number;
}

interface VenteJournaliere {
  date: string;
  total: number;
  nombre: number;
}

interface VenteParCategorie {
  nom: string;
  total: number;
  couleur: string;
}

interface VenteParMois {
  mois: string;
  ca: number;
  benefices: number;
  nombre_ventes: number;
}

// COULEURS POUR LES CATÉGORIES
const colors = [
  "#1565C0", "#2E7D32", "#F57C00", "#C62828",
  "#6A1B9A", "#00838F", "#E65100", "#1A237E",
  "#4CAF50", "#FF6F00", "#AD1457", "#004D40",
];

export default function AnalyticsScreen() {
  const { user } = useUser();
  const isAdminOuGerant = user?.role === "ADMIN" || user?.role === "GERANT";

  // === ÉTATS ===
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [devise, setDevise] = useState("USD");
  const [selectedPeriod, setSelectedPeriod] = useState<"jour" | "semaine" | "mois" | "annee">("mois");
  const [selectedView, setSelectedView] = useState<"ca" | "benefices" | "ventes">("ca");
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // === ANIMATION ===
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];

  // === CHARGEMENT DES DONNÉES ===
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      // 1. Devise
      const paramDevise = await db.getFirstAsync<{ valeur: string }>(
        "SELECT valeur FROM parametres_systeme WHERE cle = 'devise_symbole';"
      );
      if (paramDevise) setDevise(paramDevise.valeur);

      // 2. Périodes
      const today = new Date();
      const aujourdHui = today.toISOString().split("T")[0];
      const debutMois = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const debutAnnee = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];

      // 3. CA et bénéfices
      const caJour = await getCA(db, aujourdHui, aujourdHui);
      const caMois = await getCA(db, debutMois, aujourdHui);
      const caAnnee = await getCA(db, debutAnnee, aujourdHui);
      const caPrecedent = await getCAPrecedent(db, selectedPeriod);

      const benefices = await getBenefices(db, selectedPeriod);
      const topProduits = await getTopProduits(db, selectedPeriod);
      const topClients = await getTopClients(db, selectedPeriod);
      const ventesJournalieres = await getVentesJournalieres(db, selectedPeriod);
      const ventesParCategorie = await getVentesParCategorie(db, selectedPeriod);
      const ventesParMois = await getVentesParMois(db);
      const stockStats = await getStockStats(db);
      const dettes = await getDettes(db);
      const objectif = await getObjectif(db);

      const kpiData: KPI = {
        caJour,
        caMois,
        caAnnee,
        caPrecedent: caPrecedent.actuel,
        beneficesJour: benefices.jour,
        beneficesMois: benefices.mois,
        beneficesAnnee: benefices.annee,
        margeMoyenne: benefices.margeMoyenne,
        panierMoyen: caJour / ((await getNombreVentes(db, aujourdHui, aujourdHui)) || 1),
        panierMoyenMois: caMois / ((await getNombreVentes(db, debutMois, aujourdHui)) || 1),
        tauxConversion: await getTauxConversion(db, aujourdHui),
        tauxFidelisation: await getTauxFidelisation(db),
        nombreVentes: await getNombreVentes(db, selectedPeriod === "jour" ? aujourdHui : debutMois, aujourdHui),
        nombreClients: await getNombreClients(db, selectedPeriod),
        produitsVendus: await getProduitsVendus(db, selectedPeriod),
        stockTotal: stockStats.total,
        valeurStock: stockStats.valeur,
        rotationStock: stockStats.rotation,
        joursStock: stockStats.jours,
        dettesEnCours: dettes.enCours,
        dettesRecouvrees: dettes.recouvrees,
        topProduits,
        topClients,
        ventesJournalieres,
        ventesParCategorie,
        ventesParMois,
        objectifAtteint: caJour >= objectif.valeur,
        progressionObjectif: objectif.valeur > 0 ? (caJour / objectif.valeur) * 100 : 0,
      };

      setKpi(kpiData);
    } catch (error) {
      console.error("[Analytics] Erreur chargement:", error);
      Alert.alert("Erreur", "Impossible de charger les données analytiques.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // === INITIALISATION ===
  useEffect(() => {
    loadAnalyticsData();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedPeriod]);

  // === RAFRAÎCHISSEMENT ===
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAnalyticsData();
  }, [selectedPeriod]);

  // === EXPORT DES RAPPORTS ===
  const exportReport = async () => {
    if (!kpi) return;

    try {
      setExportLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const report = `
📊 RAPPORT ANALYTIQUE STOCKIA
${new Date().toLocaleString()}
${"=".repeat(50)}

📈 CHIFFRE D'AFFAIRES
• Jour: ${kpi.caJour.toFixed(2)} ${devise}
• Mois: ${kpi.caMois.toFixed(2)} ${devise}
• Année: ${kpi.caAnnee.toFixed(2)} ${devise}
• Variation: ${(((kpi.caJour - kpi.caPrecedent) / (kpi.caPrecedent || 1)) * 100).toFixed(1)}%

💰 BÉNÉFICES
• Jour: ${kpi.beneficesJour.toFixed(2)} ${devise}
• Mois: ${kpi.beneficesMois.toFixed(2)} ${devise}
• Année: ${kpi.beneficesAnnee.toFixed(2)} ${devise}
• Marge moyenne: ${kpi.margeMoyenne.toFixed(1)}%

🛒 VENTES
• Nombre: ${kpi.nombreVentes}
• Panier moyen: ${kpi.panierMoyen.toFixed(2)} ${devise}
• Taux conversion: ${kpi.tauxConversion.toFixed(1)}%

📦 STOCK
• Produits en stock: ${kpi.stockTotal}
• Valeur du stock: ${kpi.valeurStock.toFixed(2)} ${devise}
• Rotation: ${kpi.rotationStock.toFixed(2)}

🏆 TOP PRODUITS
${kpi.topProduits.slice(0, 5).map((p, i) =>
  `${i + 1}. ${p.nom} - ${p.quantite} unités (${p.total.toFixed(2)} ${devise})`
).join('\n')}

👥 TOP CLIENTS
${kpi.topClients.slice(0, 3).map((c, i) =>
  `${i + 1}. ${c.nom} - ${c.total_achats.toFixed(2)} ${devise} (${c.nombre_ventes} ventes)`
).join('\n')}

🎯 OBJECTIF
• Objectif: ${(kpi.progressionObjectif).toFixed(0)}%
• ${kpi.objectifAtteint ? '✅ Objectif atteint !' : '⏳ Objectif non atteint'}

${"=".repeat(50)}
Généré par Stockia Analytics
${new Date().toISOString().split('T')[0]}
      `;

      const filePath = `${FileSystem.documentDirectory}rapport_stockia_${new Date().toISOString().split('T')[0]}.txt`;
      await FileSystem.writeAsStringAsync(filePath, report);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "text/plain",
          dialogTitle: "Partager le rapport",
        });
      } else {
        Alert.alert("Erreur", "Le partage n'est pas disponible.");
      }
    } catch (error) {
      console.error("[Analytics] Erreur export:", error);
      Alert.alert("Erreur", "Impossible d'exporter le rapport.");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Chargement des analyses...</Text>
      </View>
    );
  }

  if (!kpi) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="analytics-outline" size={64} color="#CCC" />
        <Text style={styles.loadingText}>Aucune donnée disponible</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          {/* EN-TÊTE */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📊 Analyses</Text>
              <Text style={styles.subtitle}>
                {selectedPeriod === "jour" ? "Aujourd'hui" :
                 selectedPeriod === "semaine" ? "Cette semaine" :
                 selectedPeriod === "mois" ? "Ce mois-ci" :
                 "Cette année"}
              </Text>
            </View>
            <TouchableOpacity style={styles.exportButton} onPress={exportReport}>
              {exportLoading ? (
                <ActivityIndicator size="small" color="#1565C0" />
              ) : (
                <>
                  <Ionicons name="share-outline" size={20} color="#1565C0" />
                  <Text style={styles.exportButtonText}>Exporter</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* SÉLECTEUR DE PÉRIODE */}
          <View style={styles.periodSelector}>
            {(["jour", "semaine", "mois", "annee"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodButton, selectedPeriod === p && styles.periodButtonActive]}
                onPress={() => setSelectedPeriod(p)}
              >
                <Text style={[styles.periodButtonText, selectedPeriod === p && styles.periodButtonTextActive]}>
                  {p === "jour" ? "Jour" : p === "semaine" ? "Semaine" : p === "mois" ? "Mois" : "Année"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// === REQUÊTES SQL AUXILIAIRES ===
const getCA = async (db: SQLite.SQLiteDatabase, debut: string, fin: string) => {
  const result = await db.getFirstAsync<{ total: number }>(
    "SELECT SUM(montant_net) as total FROM ventes WHERE date_vente BETWEEN ? AND ?;",
    [debut, fin]
  );
  return result?.total || 0;
};

const getCAPrecedent = async (db: SQLite.SQLiteDatabase, periode: string) => {
  const now = new Date();
  let debutPrecedent = new Date();
  let finPrecedent = new Date();

  switch (periode) {
    case "jour":
      debutPrecedent.setDate(now.getDate() - 1);
      finPrecedent.setDate(now.getDate() - 1);
      break;
    case "semaine":
      debutPrecedent.setDate(now.getDate() - 14);
      finPrecedent.setDate(now.getDate() - 7);
      break;
    case "mois":
      debutPrecedent.setMonth(now.getMonth() - 1);
      finPrecedent.setMonth(now.getMonth() - 1);
      finPrecedent.setDate(now.getDate());
      break;
    case "annee":
      debutPrecedent.setFullYear(now.getFullYear() - 1);
      finPrecedent.setFullYear(now.getFullYear() - 1);
      break;
  }

  const result = await db.getFirstAsync<{ total: number }>(
    "SELECT SUM(montant_net) as total FROM ventes WHERE date_vente BETWEEN ? AND ?;",
    [debutPrecedent.toISOString().split("T")[0], finPrecedent.toISOString().split("T")[0]]
  );
  return { actuel: result?.total || 0 };
};

const getBenefices = async (db: SQLite.SQLiteDatabase, periode: string) => {
  const today = new Date();
  const aujourdHui = today.toISOString().split("T")[0];
  const debutMois = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const debutAnnee = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];

  const getProfit = async (debut: string, fin: string) => {
    const result = await db.getFirstAsync<{ profit: number }>(
      `SELECT SUM((dv.prix_unitaire - p.prix_achat) * dv.quantite) as profit
       FROM details_ventes dv
       JOIN produits p ON dv.produit_id = p.id
       JOIN ventes v ON dv.vente_id = v.id
       WHERE v.date_vente BETWEEN ? AND ?;`,
      [debut, fin]
    );
    return result?.profit || 0;
  };

  const getMarge = async () => {
    const result = await db.getFirstAsync<{ marge: number }>(
      `SELECT AVG((dv.prix_unitaire - p.prix_achat) / dv.prix_unitaire * 100) as marge
       FROM details_ventes dv
       JOIN produits p ON dv.produit_id = p.id
       JOIN ventes v ON dv.vente_id = v.id
       WHERE v.date_vente >= ?;`,
      [debutMois]
    );
    return result?.marge || 0;
  };

  const [jour, mois, annee, marge] = await Promise.all([
    getProfit(aujourdHui, aujourdHui),
    getProfit(debutMois, aujourdHui),
    getProfit(debutAnnee, aujourdHui),
    getMarge(),
  ]);

  return { jour, mois, annee, margeMoyenne: marge };
};

const getTopProduits = async (db: SQLite.SQLiteDatabase, periode: string) => {
  const { debut, fin } = getPeriodeDates(periode);
  const results = await db.getAllAsync<TopProduit>(
    `SELECT p.id, p.nom, SUM(dv.quantite) as quantite,
            SUM(dv.sous_total) as total, p.categorie
     FROM details_ventes dv
     JOIN produits p ON dv.produit_id = p.id
     JOIN ventes v ON dv.vente_id = v.id
     WHERE v.date_vente BETWEEN ? AND ?
     GROUP BY dv.produit_id
     ORDER BY total DESC
     LIMIT 10;`,
    [debut, fin]
  );
  return results || [];
};

const getTopClients = async (db: SQLite.SQLiteDatabase, periode: string) => {
  const { debut, fin } = getPeriodeDates(periode);
  const results = await db.getAllAsync<TopClient>(
    `SELECT c.id, c.nom, SUM(v.montant_net) as total_achats,
            c.points_fidelite as points, COUNT(v.id) as nombre_ventes
     FROM clients c
     JOIN ventes v ON c.id = v.client_id
     WHERE v.date_vente BETWEEN ? AND ? AND v.client_id IS NOT NULL
     GROUP BY c.id
     ORDER BY total_achats DESC
     LIMIT 5;`,
    [debut, fin]
  );
  return results || [];
};

const getVentesJournalieres = async (db: SQLite.SQLiteDatabase, periode: string) => {
  const { debut, fin } = getPeriodeDates(periode);
  const results = await db.getAllAsync<VenteJournaliere>(
    `SELECT DATE(date_vente) as date,
            SUM(montant_net) as total,
            COUNT(*) as nombre
     FROM ventes
     WHERE date_vente BETWEEN ? AND ?
     GROUP BY DATE(date_vente)
     ORDER BY date ASC;`,
    [debut, fin]
  );
  return results || [];
};

const getVentesParCategorie = async (db: SQLite.SQLiteDatabase, periode: string) => {
  const { debut, fin } = getPeriodeDates(periode);
  const results = await db.getAllAsync<{ nom: string; total: number }>(
    `SELECT p.categorie as nom, SUM(dv.sous_total) as total
     FROM details_ventes dv
     JOIN produits p ON dv.produit_id = p.id
     JOIN ventes v ON dv.vente_id = v.id
     WHERE v.date_vente BETWEEN ? AND ?
     GROUP BY p.categorie
     ORDER BY total DESC
     LIMIT 6;`,
    [debut, fin]
  );

  return results.map((item, index) => ({
    ...item,
    couleur: colors[index % colors.length],
  }));
};

const getVentesParMois = async (db: SQLite.SQLiteDatabase) => {
  const results = await db.getAllAsync<VenteParMois>(
    `SELECT strftime('%Y-%m', date_vente) as mois,
            SUM(montant_net) as ca,
            SUM((dv.prix_unitaire - p.prix_achat) * dv.quantite) as benefices,
            COUNT(DISTINCT v.id) as nombre_ventes
     FROM ventes v
     JOIN details_ventes dv ON v.id = dv.vente_id
     JOIN produits p ON dv.produit_id = p.id
     WHERE date_vente >= date('now', '-11 months')
     GROUP BY strftime('%Y-%m', date_vente)
     ORDER BY mois ASC;`
  );
  return results || [];
};

const getStockStats = async (db: SQLite.SQLiteDatabase) => {
  const total = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM produits WHERE stock_actuel > 0;");
  const valeur = await db.getFirstAsync<{ total: number }>("SELECT SUM(stock_actuel * prix_achat) as total FROM produits;");
  const rotation = await db.getFirstAsync<{ rotation: number }>(
    `SELECT COALESCE(
      (SELECT SUM(quantite) FROM mouvements_stock WHERE type_mouvement = 'VENTE' AND date_mouvement >= date('now', '-30 days')) /
      NULLIF((SELECT AVG(stock_actuel) FROM produits), 0), 0) as rotation;`
  );

  return {
    total: total?.count || 0,
    valeur: valeur?.total || 0,
    rotation: rotation?.rotation || 0,
    jours: rotation?.rotation ? 30 / rotation.rotation : 0,
  };
};

const getDettes = async (db: SQLite.SQLiteDatabase) => {
  const enCours = await db.getFirstAsync<{ total: number }>("SELECT SUM(montant_restant) as total FROM dettes WHERE statut = 'EN_COURS';");
  const recouvrees = await db.getFirstAsync<{ total: number }>(
    "SELECT SUM(montant_initial) as total FROM dettes WHERE statut = 'SOLDE' AND date_solde >= date('now', '-30 days');"
  );
  return {
    enCours: enCours?.total || 0,
    recouvrees: recouvrees?.total || 0,
  };
};

const getNombreVentes = async (db: SQLite.SQLiteDatabase, debut: string, fin: string) => {
  const result = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM ventes WHERE date_vente BETWEEN ? AND ?;", [debut, fin]);
  return result?.count || 0;
};

const getNombreClients = async (db: SQLite.SQLiteDatabase, periode: string) => {
  const { debut, fin } = getPeriodeDates(periode);
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(DISTINCT client_id) as count FROM ventes WHERE date_vente BETWEEN ? AND ? AND client_id IS NOT NULL;",
    [debut, fin]
  );
  return result?.count || 0;
};

const getProduitsVendus = async (db: SQLite.SQLiteDatabase, periode: string) => {
  const { debut, fin } = getPeriodeDates(periode);
  const result = await db.getFirstAsync<{ total: number }>(
    "SELECT SUM(quantite) as total FROM details_ventes dv JOIN ventes v ON dv.vente_id = v.id WHERE v.date_vente BETWEEN ? AND ?;",
    [debut, fin]
  );
  return result?.total || 0;
};

const getTauxConversion = async (db: SQLite.SQLiteDatabase, date: string) => {
  const clients = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(DISTINCT client_id) as count FROM ventes WHERE date_vente LIKE ? AND client_id IS NOT NULL;",
    [`${date}%`]
  );
  const total = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM ventes WHERE date_vente LIKE ?;", [`${date}%`]);
  if (!clients || !total || clients.count === 0) return 0;
  return (total.count / clients.count) * 100;
};

const getTauxFidelisation = async (db: SQLite.SQLiteDatabase) => {
  const result = await db.getFirstAsync<{ taux: number }>(
    `SELECT AVG(nb_ventes) as taux FROM (
      SELECT client_id, COUNT(*) as nb_ventes FROM ventes
      WHERE client_id IS NOT NULL
      GROUP BY client_id
    ) as subquery;`
  );
  return result?.taux || 0;
};

const getObjectif = async (db: SQLite.SQLiteDatabase) => {
  const result = await db.getFirstAsync<{ valeur: string }>("SELECT valeur FROM parametres_systeme WHERE cle = 'objectif_journalier';");
  return { valeur: parseFloat(result?.valeur || "500") };
};

const getPeriodeDates = (periode: string) => {
  const now = new Date();
  let debut = new Date();
  let fin = new Date();

  switch (periode) {
    case "jour":
      debut = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      fin = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "semaine":
      debut.setDate(now.getDate() - 7);
      break;
    case "mois":
      debut = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "annee":
      debut = new Date(now.getFullYear(), 0, 1);
      break;
  }

  return {
    debut: debut.toISOString().split("T")[0],
    fin: fin.toISOString().split("T")[0],
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#1565C0",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1565C0",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    color: "#1565C0",
    fontSize: 13,
    fontWeight: "500",
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: "#1565C0",
  },
  periodButtonText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  periodButtonTextActive: {
    color: "#FFF",
  },
}); 