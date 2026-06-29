import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as SQLite from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  LineChart,
  PieChart
} from "react-native-chart-kit";
import { useUser } from "../context/UserContext";

const DATABASE_NAME = "stockia_secure.db";
const { width } = Dimensions.get("window");

// === INTERFACES ===
interface ReportFilter {
  period: "day" | "week" | "month" | "year" | "custom";
  startDate: string;
  endDate: string;
  category?: string;
  type: "sales" | "stock" | "financial" | "products";
}

interface SalesReport {
  totalSales: number;
  totalAmount: number;
  averageTicket: number;
  totalDiscount: number;
  totalProfit: number;
  margin: number;
  dailyData: { date: string; amount: number; count: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
  topCategories: { name: string; total: number }[];
  topClients: { name: string; total: number; count: number }[];
  paymentMethods: { method: string; total: number; count: number }[];
}

interface StockReport {
  totalProducts: number;
  totalValue: number;
  lowStock: number;
  outOfStock: number;
  movements: { type: string; quantity: number }[];
  topMovements: { product: string; quantity: number; type: string }[];
  categoryDistribution: { name: string; count: number; value: number }[];
}

interface FinancialReport {
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  dailyProfit: { date: string; revenue: number; profit: number }[];
}

interface ProductReportItem {
  id: number;
  nom: string;
  categorie: string;
  prix_achat: number;
  prix_view: number;
  stock_actuel: number;
  stock_minimum: number;
  total_vendus: number;
  total_ventes: number;
  marge: number;
}

// === CONSTANTES ===
const PERIODS = [
  { value: "day", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois-ci" },
  { value: "year", label: "Cette année" },
  { value: "custom", label: "Personnalisé" },
];

const REPORT_TYPES = [
  { value: "sales", label: "📊 Ventes", icon: "cash-outline" },
  { value: "stock", label: "📦 Stock", icon: "cube-outline" },
  { value: "financial", label: "💰 Financier", icon: "trending-up-outline" },
  { value: "products", label: "🏷️ Produits", icon: "pricetag-outline" },
];

const COLORS = [
  "#1565C0", "#2E7D32", "#F57C00", "#C62828",
  "#6A1B9A", "#00838F", "#E65100", "#1A237E",
  "#4CAF50", "#FF6F00", "#AD1457", "#004D40",
];

export default function ReportScreen() {
  const { user } = useUser();
  const isAdminOuGerant = user?.role === "ADMIN" || user?.role === "GERANT";

  // === ÉTATS ===
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [devise, setDevise] = useState("USD");
  const [reportType, setReportType] = useState<"sales" | "stock" | "financial" | "products">("sales");
  const [filter, setFilter] = useState<ReportFilter>({
    period: "month",
    startDate: "",
    endDate: "",
    type: "sales",
  });
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [stockReport, setStockReport] = useState<StockReport | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [productReport, setProductReport] = useState<ProductReportItem[]>([]);

  // === ÉTATS MODAL ===
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilter, setTempFilter] = useState<ReportFilter>(filter);
  const [exportLoading, setExportLoading] = useState(false);

  // === INITIALISATION ===
  useEffect(() => {
    loadCurrency();
    initializeFilter();
  }, []);

  useEffect(() => {
    if (filter.startDate && filter.endDate) {
      loadReport();
    }
  }, [filter, reportType]);

  const initializeFilter = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDateStr = startOfMonth.toISOString().split("T")[0];
    const endDateStr = now.toISOString().split("T")[0];

    const initialFilter: ReportFilter = {
      period: "month",
      startDate: startDateStr,
      endDate: endDateStr,
      type: "sales",
    };

    setFilter(initialFilter);
    setTempFilter(initialFilter);
  };

  const loadCurrency = async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const result = await db.getFirstAsync<{ valeur: string }>(
        "SELECT valeur FROM parametres_systeme WHERE cle = 'devise_symbole';"
      );
      if (result) setDevise(result.valeur);
    } catch (error) {
      console.error("[ReportScreen] Erreur devise:", error);
    }
  };

  // === AUXILIARY LOADERS ===
  const loadSalesReport = async (db: SQLite.SQLiteDatabase) => {
    const { startDate, endDate } = filter;

    const totalResult = await db.getFirstAsync<{
      total: number;
      count: number;
      discount: number;
    }>(
      `SELECT
        SUM(montant_net) as total,
        COUNT(*) as count,
        SUM(remise) as discount
       FROM ventes
       WHERE date_vente BETWEEN ? AND ?
       AND statut = 'COMPLETEE';`,
      [startDate, endDate]
    );

    const profitResult = await db.getFirstAsync<{ profit: number }>(
      `SELECT SUM((dv.prix_unitaire - p.prix_achat) * dv.quantite) as profit
       FROM details_ventes dv
       JOIN produits p ON dv.produit_id = p.id
       JOIN ventes v ON dv.vente_id = v.id
       WHERE v.date_vente BETWEEN ? AND ?
       AND v.statut = 'COMPLETEE';`,
      [startDate, endDate]
    );

    const dailyData = await db.getAllAsync<{ date: string; amount: number; count: number }>(
      `SELECT DATE(date_vente) as date,
              SUM(montant_net) as amount,
              COUNT(*) as count
       FROM ventes
       WHERE date_vente BETWEEN ? AND ?
       AND statut = 'COMPLETEE'
       GROUP BY DATE(date_vente)
       ORDER BY date ASC;`,
      [startDate, endDate]
    );

    const topProducts = await db.getAllAsync<{ name: string; quantity: number; total: number }>(
      `SELECT p.nom as name,
              SUM(dv.quantite) as quantity,
              SUM(dv.sous_total) as total
       FROM details_ventes dv
       JOIN produits p ON dv.produit_id = p.id
       JOIN ventes v ON dv.vente_id = v.id
       WHERE v.date_vente BETWEEN ? AND ?
       AND v.statut = 'COMPLETEE'
       GROUP BY dv.produit_id
       ORDER BY total DESC
       LIMIT 10;`,
      [startDate, endDate]
    );

    const topCategories = await db.getAllAsync<{ name: string; total: number }>(
      `SELECT p.categorie as name,
              SUM(dv.sous_total) as total
       FROM details_ventes dv
       JOIN produits p ON dv.produit_id = p.id
       JOIN ventes v ON dv.vente_id = v.id
       WHERE v.date_vente BETWEEN ? AND ?
       AND v.statut = 'COMPLETEE'
       GROUP BY p.categorie
       ORDER BY total DESC
       LIMIT 5;`,
       [startDate, endDate]
    );

    const topClients = await db.getAllAsync<{ name: string; total: number; count: number }>(
      `SELECT c.nom as name,
              SUM(v.montant_net) as total,
              COUNT(v.id) as count
       FROM clients c
       JOIN ventes v ON c.id = v.client_id
       WHERE v.date_vente BETWEEN ? AND ?
       AND v.statut = 'COMPLETEE'
       GROUP BY c.id
       ORDER BY total DESC
       LIMIT 5;`,
      [startDate, endDate]
    );

    const paymentMethods = await db.getAllAsync<{ method: string; total: number; count: number }>(
      `SELECT mode_paiement as method,
              SUM(montant_net) as total,
              COUNT(*) as count
       FROM ventes
       WHERE date_vente BETWEEN ? AND ?
       AND statut = 'COMPLETEE'
       GROUP BY mode_paiement;`,
      [startDate, endDate]
    );

    const total = totalResult?.total || 0;
    const count = totalResult?.count || 0;

    setSalesReport({
      totalSales: total,
      totalAmount: total,
      averageTicket: count > 0 ? total / count : 0,
      totalDiscount: totalResult?.discount || 0,
      totalProfit: profitResult?.profit || 0,
      margin: total > 0 ? ((profitResult?.profit || 0) / total) * 100 : 0,
      dailyData,
      topProducts,
      topCategories,
      topClients,
      paymentMethods,
    });
  };

  const loadStockReport = async (db: SQLite.SQLiteDatabase) => {
    const totalResult = await db.getFirstAsync<{ count: number; value: number }>(
      `SELECT
        COUNT(*) as count,
        SUM(stock_actuel * prix_achat) as value
       FROM produits
       WHERE actif = 1;`
    );

    const alerts = await db.getFirstAsync<{ low: number; out: number }>(
      `SELECT
        SUM(CASE WHEN stock_actuel <= stock_minimum AND stock_actuel > 0 THEN 1 ELSE 0 END) as low,
        SUM(CASE WHEN stock_actuel <= 0 THEN 1 ELSE 0 END) as out
       FROM produits
       WHERE actif = 1;`
    );

    const movements = await db.getAllAsync<{ type: string; quantity: number }>(
      `SELECT type_mouvement as type,
              SUM(quantite) as quantity
       FROM mouvements_stock
       WHERE date_mouvement BETWEEN ? AND ?
       GROUP BY type_mouvement;`,
      [filter.startDate, filter.endDate]
    );

    const topMovements = await db.getAllAsync<{ product: string; quantity: number; type: string }>(
      `SELECT p.nom as product,
              m.quantite as quantity,
              m.type_mouvement as type
       FROM mouvements_stock m
       JOIN produits p ON m.produit_id = p.id
       WHERE m.date_mouvement BETWEEN ? AND ?
       ORDER BY ABS(m.quantite) DESC
       LIMIT 10;`,
      [filter.startDate, filter.endDate]
    );

    const categoryDistribution = await db.getAllAsync<{ name: string; count: number; value: number }>(
      `SELECT categorie as name,
              COUNT(*) as count,
              SUM(stock_actuel * prix_achat) as value
       FROM produits
       WHERE actif = 1
       GROUP BY categorie;`
    );

    setStockReport({
      totalProducts: totalResult?.count || 0,
      totalValue: totalResult?.value || 0,
      lowStock: alerts?.low || 0,
      outOfStock: alerts?.out || 0,
      movements,
      topMovements,
      categoryDistribution,
    });
  };

  const loadFinancialReport = async (db: SQLite.SQLiteDatabase) => {
    const revenueResult = await db.getFirstAsync<{ total: number }>(
      `SELECT SUM(montant_net) as total
       FROM ventes
       WHERE date_vente BETWEEN ? AND ?
       AND statut = 'COMPLETEE';`,
      [filter.startDate, filter.endDate]
    );

    const profitResult = await db.getFirstAsync<{ profit: number }>(
      `SELECT SUM((dv.prix_unitaire - p.prix_achat) * dv.quantite) as profit
       FROM details_ventes dv
       JOIN produits p ON dv.produit_id = p.id
       JOIN ventes v ON dv.vente_id = v.id
       WHERE v.date_vente BETWEEN ? AND ?
       AND v.statut = 'COMPLETEE';`,
      [filter.startDate, filter.endDate]
    );

    const expensesResult = await db.getFirstAsync<{ total: number }>(
      `SELECT SUM(quantite * prix_achat) as total
       FROM mouvements_stock m
       JOIN produits p ON m.produit_id = p.id
       WHERE m.type_mouvement IN ('VENTE', 'PERTE')
       AND m.date_mouvement BETWEEN ? AND ?;`,
      [filter.startDate, filter.endDate]
    );

    const dailyProfit = await db.getAllAsync<{ date: string; revenue: number; profit: number }>(
      `SELECT DATE(v.date_vente) as date,
              SUM(v.montant_net) as revenue,
              SUM((dv.prix_unitaire - p.prix_achat) * dv.quantite) as profit
       FROM ventes v
       JOIN details_ventes dv ON v.id = dv.vente_id
       JOIN produits p ON dv.produit_id = p.id
       WHERE v.date_vente BETWEEN ? AND ?
       AND v.statut = 'COMPLETEE'
       GROUP BY DATE(v.date_vente)
       ORDER BY date ASC;`,
      [filter.startDate, filter.endDate]
    );

    const revenue = revenueResult?.total || 0;
    const profit = profitResult?.profit || 0;

    setFinancialReport({
      totalRevenue: revenue,
      totalProfit: profit,
      totalExpenses: expensesResult?.total || 0,
      netProfit: profit - (expensesResult?.total || 0),
      profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
      dailyProfit,
    });
  };

  const loadProductReport = async (db: SQLite.SQLiteDatabase) => {
    const results = await db.getAllAsync<ProductReportItem>(
      `SELECT p.id, p.nom, p.categorie,
              p.prix_achat, p.prix_view,
              p.stock_actuel, p.stock_minimum,
              COALESCE(SUM(dv.quantite), 0) as total_vendus,
              COALESCE(SUM(dv.sous_total), 0) as total_ventes,
              ((p.prix_view - p.prix_achat) / NULLIF(p.prix_achat, 0)) * 100 as marge
       FROM produits p
       LEFT JOIN details_ventes dv ON p.id = dv.produit_id
       LEFT JOIN ventes v ON dv.vente_id = v.id AND v.date_vente BETWEEN ? AND ?
       WHERE p.actif = 1
       GROUP BY p.id
       ORDER BY total_vendus DESC;`,
      [filter.startDate, filter.endDate]
    );

    setProductReport(results || []);
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      switch (reportType) {
        case "sales":
          await loadSalesReport(db);
          break;
        case "stock":
          await loadStockReport(db);
          break;
        case "financial":
          await loadFinancialReport(db);
          break;
        case "products":
          await loadProductReport(db);
          break;
      }
    } catch (error) {
      console.error("[ReportScreen] Erreur chargement:", error);
      Alert.alert("Erreur", "Impossible de charger le rapport.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const data = {
        type: reportType,
        period: filter.period,
        startDate: filter.startDate,
        endDate: filter.endDate,
        ...(salesReport && { sales: salesReport }),
        ...(stockReport && { stock: stockReport }),
        ...(financialReport && { financial: financialReport }),
        ...(productReport.length > 0 && { products: productReport }),
      };

      const json = JSON.stringify(data, null, 2);
      const path = `${FileSystem.documentDirectory}rapport_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
      await FileSystem.writeAsStringAsync(path, json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: "application/json",
          dialogTitle: "Partager le rapport",
        });
      }
    } catch (error) {
      console.error("[ReportScreen] Erreur export:", error);
      Alert.alert("Erreur", "Impossible d'exporter le rapport.");
    } finally {
      setExportLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReport();
  }, [filter, reportType]);

  // === SECURE SCREEN GUARD ===
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

  // === RENDU DES RAPPORTS ===
  const renderSalesReport = () => {
    if (!salesReport) return null;

    const chartData = salesReport.dailyData.map(d => d.amount);
    const labels = salesReport.dailyData.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    return (
      <View style={styles.reportContainer}>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Chiffre d'affaires</Text>
            <Text style={[styles.kpiValue, styles.blueText]}>
              {salesReport.totalSales.toFixed(2)} {devise}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Nombre de ventes</Text>
            <Text style={[styles.kpiValue, styles.greenText]}>
              {salesReport.dailyData.reduce((sum, d) => sum + d.count, 0)}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Panier moyen</Text>
            <Text style={[styles.kpiValue, styles.orangeText]}>
              {salesReport.averageTicket.toFixed(2)} {devise}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Bénéfice</Text>
            <Text style={[styles.kpiValue, styles.greenText]}>
              +{salesReport.totalProfit.toFixed(2)} {devise}
            </Text>
          </View>
        </View>

        {chartData.length > 1 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>📈 Évolution des ventes</Text>
            <LineChart
              data={{
                labels: labels.length > 0 ? labels.map((_, i) =>
                  i % Math.ceil(labels.length / 7) === 0 ? labels[i] : ""
                ) : [],
                datasets: [{ data: chartData }],
              }}
              width={width - 40}
              height={180}
              chartConfig={{
                backgroundColor: "#FFFFFF",
                backgroundGradientFrom: "#FFFFFF",
                backgroundGradientTo: "#FFFFFF",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(21, 101, 192, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 8 },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}
      </View>
    );
  };

  const renderStockReport = () => {
    if (!stockReport) return null;

    const pieData = stockReport.categoryDistribution.map((c, i) => ({
      name: c.name,
      population: c.value,
      color: COLORS[i % COLORS.length],
      legendFontColor: "#333",
      legendFontSize: 12,
    }));

    return (
      <View style={styles.reportContainer}>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total produits</Text>
            <Text style={[styles.kpiValue, styles.blueText]}>
              {stockReport.totalProducts}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Valeur du stock</Text>
            <Text style={[styles.kpiValue, styles.greenText]}>
              {stockReport.totalValue.toFixed(2)} {devise}
            </Text>
          </View>
          <View style={[styles.kpiCard, stockReport.lowStock > 0 && styles.kpiWarning]}>
            <Text style={styles.kpiLabel}>Alertes stock</Text>
            <Text style={[styles.kpiValue, stockReport.lowStock > 0 ? styles.redText : styles.greenText]}>
              {stockReport.lowStock}
            </Text>
          </View>
          <View style={[styles.kpiCard, stockReport.outOfStock > 0 && styles.kpiDanger]}>
            <Text style={styles.kpiLabel}>Ruptures</Text>
            <Text style={[styles.kpiValue, stockReport.outOfStock > 0 ? styles.redText : styles.greenText]}>
              {stockReport.outOfStock}
            </Text>
          </View>
        </View>

        {pieData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>📊 Répartition par catégorie</Text>
            <PieChart
              data={pieData}
              width={width - 40}
              height={180}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}
      </View>
    );
  };

  const renderFinancialReport = () => {
    if (!financialReport) return null;

    return (
      <View style={styles.reportContainer}>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Revenus</Text>
            <Text style={[styles.kpiValue, styles.blueText]}>
              {financialReport.totalRevenue.toFixed(2)} {devise}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Bénéfices</Text>
            <Text style={[styles.kpiValue, styles.greenText]}>
              +{financialReport.totalProfit.toFixed(2)} {devise}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Dépenses</Text>
            <Text style={[styles.kpiValue, styles.redText]}>
              -{financialReport.totalExpenses.toFixed(2)} {devise}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Marge</Text>
            <Text style={[styles.kpiValue, styles.orangeText]}>
              {financialReport.profitMargin.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderProductReport = () => {
    if (!productReport || productReport.length === 0) return null;

    return (
      <View style={styles.reportContainer}>
        {productReport.slice(0, 10).map((item, index) => (
          <View key={item.id} style={styles.productReportItem}>
            <View style={styles.productReportLeft}>
              <Text style={styles.productReportRank}>#{index + 1}</Text>
              <View>
                <Text style={styles.productReportName}>{item.nom}</Text>
                <Text style={styles.productReportCategory}>{item.categorie}</Text>
              </View>
            </View>
            <View style={styles.productReportRight}>
              <Text style={styles.productReportSales}>
                {item.total_vendus || 0} vendus
              </Text>
              <Text style={styles.productReportAmount}>
                {(item.total_ventes || 0).toFixed(2)} {devise}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Chargement du rapport...</Text>
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
          <View style={styles.headerTop}>
            <Text style={styles.title}>📊 Rapports</Text>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}
              disabled={exportLoading}
            >
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

          <Text style={styles.subtitle}>
            {filter.startDate} au {filter.endDate}
          </Text>

          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {REPORT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeChip,
                    reportType === type.value && styles.typeChipActive,
                  ]}
                  onPress={() => setReportType(type.value as any)}
                >
                  <Text style={[styles.typeChipText, reportType === type.value && { color: "#1565C0" }]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="options-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENU DU RAPPORT */}
        {reportType === "sales" && renderSalesReport()}
        {reportType === "stock" && renderStockReport()}
        {reportType === "financial" && renderFinancialReport()}
        {reportType === "products" && renderProductReport()}
      </ScrollView>

      {/* MODAL FILTRES */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Période</Text>
            <View style={styles.periodSelector}>
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.periodChip,
                    tempFilter.period === p.value && styles.periodChipActive,
                  ]}
                  onPress={() => setTempFilter({ ...tempFilter, period: p.value as any })}
                >
                  <Text style={[
                    styles.periodChipText,
                    tempFilter.period === p.value && styles.periodChipTextActive,
                  ]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {tempFilter.period === "custom" && (
              <View>
                <Text style={styles.inputLabel}>Date de début</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={tempFilter.startDate}
                  onChangeText={(text) => setTempFilter({ ...tempFilter, startDate: text })}
                />
                <Text style={styles.inputLabel}>Date de fin</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={tempFilter.endDate}
                  onChangeText={(text) => setTempFilter({ ...tempFilter, endDate: text })}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                setFilter(tempFilter);
                setShowFilterModal(false);
              }}
            >
              <Text style={styles.applyButtonText}>Appliquer</Text>
            </TouchableOpacity>
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    color: "#1565C0",
    fontSize: 13,
    fontWeight: "500",
  },
  subtitle: {
    color: "#FFF",
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: "#FFF",
  },
  typeChipText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "500",
  },
  filterButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 8,
  },
  reportContainer: {
    padding: 16,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    elevation: 1,
  },
  kpiWarning: {
    borderColor: "#FFCDD2",
    backgroundColor: "#FFF5F5",
  },
  kpiDanger: {
    borderColor: "#FFCDD2",
    backgroundColor: "#FFEBEE",
  },
  kpiLabel: {
    fontSize: 11,
    color: "#777",
    fontWeight: "500",
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  blueText: { color: "#1565C0" },
  greenText: { color: "#2E7D32" },
  orangeText: { color: "#EF6C00" },
  redText: { color: "#C62828" },
  chartContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  productReportItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  productReportLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  productReportRank: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1565C0",
    width: 30,
  },
  productReportName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  productReportCategory: {
    fontSize: 11,
    color: "#999",
  },
  productReportRight: {
    alignItems: "flex-end",
  },
  productReportSales: {
    fontSize: 12,
    color: "#666",
  },
  productReportAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1565C0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
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
  periodSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  periodChipActive: {
    backgroundColor: "#1565C0",
    borderColor: "#1565C0",
  },
  periodChipText: {
    fontSize: 13,
    color: "#666",
  },
  periodChipTextActive: {
    color: "#FFF",
  },
  applyButton: {
    backgroundColor: "#1565C0",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  applyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
}); 

export default ReportScreen;
