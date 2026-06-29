import Ionicons from "@expo/vector-icons/Ionicons"; // Ajouté (Manquant)
import * as Haptics from "expo-haptics";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions, // Ajouté (Manquant)
    FlatList,
    Modal // Ajouté pour la gestion des fenêtres surgissantes
    ,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View
} from "react-native";
import { BluetoothEscposPrinter, BluetoothManager } from "react-native-bluetooth-escpos-printer";
import { useUser } from "../context/UserContext";

const DATABASE_NAME = "stockia_secure.db";
const { width, height } = Dimensions.get("window");

// === INTERFACES ===
interface Produit {
  id: number;
  code_barre: string;
  nom: string;
  categorie: string;
  prix_view: number;
  stock_actuel: number;
  stock_minimum: number;
}

interface ItemPanier {
  produit: Produit;
  quantite: number;
}

interface Client {
  id: number;
  nom: string;
  telephone: string;
  points_fidelite: number;
  email?: string;
}

interface Promotion {
  id: number;
  produit_id: number;
  type: "REMISE_POURCENTAGE" | "REMISE_FIXE" | "ACHAT_OFFERT";
  valeur: number;
  date_debut: string;
  date_fin: string;
  actif: number;
}

export default function CaisseScreen() {
  const { user, printEnabled } = useUser(); // Suppression de 'settings' inutilisé pour éviter les warnings TS

  // === ÉTATS PRINCIPAUX ===
  const [produits, setProduits] = useState<Produit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [panier, setPanier] = useState<ItemPanier[]>([]);
  const [devise, setDevise] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [factureNumero, setFactureNumero] = useState("");

  // === ÉTATS BLUETOOTH ===
  const [isPrinting, setIsPrinting] = useState(false);
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState<string>("");

  // === ÉTATS CLIENTS ===
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  // === ÉTATS REMISE ===
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  // === ÉTATS PAIEMENT ===
  const [modePaiement, setModePaiement] = useState<"CASH" | "MOBILE_MONEY" | "CARTE" | "CHEQUE">("CASH");
  const [montantRecu, setMontantRecu] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // === ÉTATS PROMOTIONS ===
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [appliedPromotions, setAppliedPromotions] = useState<Map<number, Promotion>>(new Map());

  // === RÉFÉRENCES ===
  const inputRef = useRef<TextInput>(null);
  const panierRef = useRef<FlatList>(null);

  // === INITIALISATION ===
  useEffect(() => {
    initializeCaisse();
  }, []);

  // === SCROLL AUTOMATIQUE VERS LE BAS DU PANIER ===
  useEffect(() => {
    if (panier.length > 0 && panierRef.current) {
      setTimeout(() => {
        panierRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [panier.length]);

  // === FONCTION D'INITIALISATION ===
  const initializeCaisse = async () => {
    try {
      setLoading(true);
      await loadInitialData();
      await checkBluetoothConnection();
      await generateInvoiceNumber();
      await loadClients();
      await loadPromotions();
    } catch (error) {
      console.error("[CaisseScreen] Erreur initialisation:", error);
      Alert.alert("Erreur", "Impossible d'initialiser la caisse.");
    } finally {
      setLoading(false);
    }
  };

  // === CHARGEMENT DES DONNÉES INITIALES ===
  const loadInitialData = async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
     
      const paramDevise = await db.getFirstAsync<{ valeur: string }>(
        "SELECT valeur FROM parametres_systeme WHERE cle = 'devise_symbole';"
      );
      if (paramDevise) setDevise(paramDevise.valeur);

      const allProducts = await db.getAllAsync<Produit>(
        `SELECT id, code_barre, nom, categorie, prix_view, stock_actuel, stock_minimum
         FROM produits
         WHERE stock_actuel > 0
         ORDER BY nom ASC;`
      );
      setProduits(allProducts || []);
    } catch (error) {
      console.error("[CaisseScreen] Erreur chargement données:", error);
      throw error;
    }
  };

  // === GÉNÉRATION DU NUMÉRO DE FACTURE ===
  const generateInvoiceNumber = async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
     
      const result = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM ventes WHERE date_vente LIKE ?;",
        [`${today.toISOString().slice(0, 10)}%`]
      );
     
      const count = (result?.count || 0) + 1;
      setFactureNumero(`FC-${dateStr}-${String(count).padStart(4, '0')}`);
    } catch (error) {
      console.error("[Facture] Erreur génération:", error);
      setFactureNumero(`FC-${Date.now()}`);
    }
  };

  // === CHARGEMENT DES CLIENTS ===
  const loadClients = async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const allClients = await db.getAllAsync<Client>(
        "SELECT id, nom, telephone, points_fidelite, email FROM clients WHERE actif = 1 ORDER BY nom ASC;"
      );
      setClients(allClients || []);
    } catch (error) {
      console.error("[CaisseScreen] Erreur chargement clients:", error);
    }
  };

  // === CHARGEMENT DES PROMOTIONS ===
  const loadPromotions = async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const now = new Date().toISOString();
      const allPromotions = await db.getAllAsync<Promotion>(
        `SELECT * FROM promotions
         WHERE actif = 1
         AND date_debut <= ?
         AND date_fin >= ?;`,
        [now, now]
      );
      setPromotions(allPromotions || []);
    } catch (error) {
      console.error("[CaisseScreen] Erreur chargement promotions:", error);
    }
  };

  // === VÉRIFICATION CONNEXION BLUETOOTH ===
  const checkBluetoothConnection = async () => {
    try {
      const isConnected = await BluetoothManager.isConnected();
      setBluetoothConnected(isConnected);
     
      if (isConnected) {
        const device = await BluetoothManager.getConnectedDevice();
        if (device) {
          setBluetoothDevice(device.name || "Imprimante");
        }
      }
    } catch (error) {
      console.error("[Bluetooth] Erreur vérification:", error);
      setBluetoothConnected(false);
    }
  };

  // === CONNEXION BLUETOOTH ===
  const connectBluetooth = async () => {
    try {
      const devices = await BluetoothManager.scanDevices(5000);
      if (!devices || devices.length === 0) {
        Alert.alert("Aucun appareil", "Aucun appareil Bluetooth trouvé.");
        return;
      }

      const printers = devices.filter((d: any) =>
        d.name?.toLowerCase().includes('printer') ||
        d.name?.toLowerCase().includes('pos') ||
        d.name?.toLowerCase().includes('thermal')
      );

      if (printers.length === 0) {
        Alert.alert(
          "Aucune imprimante",
          "Aucune imprimante thermique trouvée. Vérifiez que votre imprimante est allumée.",
          [
            { text: "Réessayer", onPress: connectBluetooth },
            { text: "Annuler", style: "cancel" }
          ]
        );
        return;
      }

      const selectedDevice = printers[0];
      await BluetoothManager.connect(selectedDevice.address);
      setBluetoothConnected(true);
      setBluetoothDevice(selectedDevice.name || "Imprimante");
     
      Alert.alert("Succès", `Connecté à ${selectedDevice.name}`);
     
    } catch (error) {
      console.error("[Bluetooth] Erreur connexion:", error);
      Alert.alert("Erreur", "Impossible de se connecter à l'imprimante.");
    }
  };

  // === AJOUT AU PANIER ===
  const ajouterAuPanier = (produit: Produit) => {
    const promotion = promotions.find(p => p.produit_id === produit.id);
    const itemExistant = panier.find((item) => item.produit.id === produit.id);
    const qteActuelle = itemExistant ? itemExistant.quantite : 0;

    if (qteActuelle + 1 > produit.stock_actuel) {
      Alert.alert(
        "Stock insuffisant",
        `Il ne reste que ${produit.stock_actuel} unités de ${produit.nom}.`
      );
      Vibration.vibrate(100);
      return;
    }

    if (promotion && !appliedPromotions.has(produit.id)) {
      const newPromotions = new Map(appliedPromotions);
      newPromotions.set(produit.id, promotion);
      setAppliedPromotions(newPromotions);
    }

    if (itemExistant) {
      setPanier(
        panier.map((item) =>
          item.produit.id === produit.id
            ? { ...item, quantite: item.quantite + 1 }
            : item
        )
      );
    } else {
      setPanier([...panier, { produit, quantite: 1 }]);
    }
   
    Vibration.vibrate(50);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // === RETIRER DU PANIER ===
  const retirerDuPanier = (produitId: number) => {
    const item = panier.find((item) => item.produit.id === produitId);
    if (item) {
      if (item.quantite > 1) {
        setPanier(
          panier.map((i) =>
            i.produit.id === produitId ? { ...i, quantite: i.quantite - 1 } : i
          )
        );
      } else {
        setPanier(panier.filter((i) => i.produit.id !== produitId));
        const newPromotions = new Map(appliedPromotions);
        newPromotions.delete(produitId);
        setAppliedPromotions(newPromotions);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // === SUPPRIMER DU PANIER ===
  const supprimerDuPanier = (produitId: number) => {
    const item = panier.find((i) => i.produit.id === produitId);
    if (item) {
      Alert.alert(
        "Supprimer",
        `Retirer ${item.produit.nom} du panier ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => {
              setPanier(panier.filter((i) => i.produit.id !== produitId));
              const newPromotions = new Map(appliedPromotions);
              newPromotions.delete(produitId);
              setAppliedPromotions(newPromotions);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }
        ]
      );
    }
  };

  // === VIDER LE PANIER ===
  const viderPanier = () => {
    if (panier.length === 0) return;
   
    Alert.alert(
      "Vider le panier",
      "Êtes-vous sûr de vouloir vider tout le panier ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Vider",
          style: "destructive",
          onPress: () => {
            setPanier([]);
            setAppliedDiscount(0);
            setAppliedPromotions(new Map());
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
      ]
    );
  };

  // === CALCULS ===
  const calculerSousTotal = () => {
    return panier.reduce((sum, item) => sum + item.produit.prix_view * item.quantite, 0);
  };

  const calculerRemisesPromo = () => {
    let totalRemise = 0;
    appliedPromotions.forEach((promo, produitId) => {
      const item = panier.find(i => i.produit.id === produitId);
      if (!item) return;
     
      const prixTotal = item.produit.prix_view * item.quantite;
      if (promo.type === "REMISE_POURCENTAGE") {
        totalRemise += (prixTotal * promo.valeur) / 100;
      } else if (promo.type === "REMISE_FIXE") {
        totalRemise += Math.min(promo.valeur, prixTotal);
      } else if (promo.type === "ACHAT_OFFERT") {
        const offre = Math.floor(item.quantite / (promo.valeur + 1));
        totalRemise += offre * item.produit.prix_view;
      }
    });
    return totalRemise;
  };

  const calculerTotal = () => {
    const sousTotal = calculerSousTotal();
    const remisesPromo = calculerRemisesPromo();
    return sousTotal - remisesPromo - appliedDiscount;
  };

  const calculerNombreArticles = () => {
    return panier.reduce((sum, item) => sum + item.quantite, 0);
  };

  const applyDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un montant valide.");
      return;
    }

    const sousTotal = calculerSousTotal();
    let discountAmount = 0;
   
    if (discountType === "percentage") {
      if (value > 100) {
        Alert.alert("Erreur", "Le pourcentage ne peut pas dépasser 100%.");
        return;
      }
      discountAmount = (sousTotal * value) / 100;
    } else {
      if (value > sousTotal) {
        Alert.alert("Erreur", "La remise ne peut pas dépasser le total.");
        return;
      }
      discountAmount = value;
    }

    setAppliedDiscount(discountAmount);
    setShowDiscountModal(false);
    setDiscountValue("");
    Vibration.vibrate(50);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeDiscount = () => {
    setAppliedDiscount(0);
  };

  const clearClient = () => {
    setSelectedClient(null);
  };

  // === IMPRESSION DU TICKET ===
  const printReceipt = async (venteId: number, total: number) => {
    if (!printEnabled) return;

    try {
      setIsPrinting(true);
      const isConnected = await BluetoothManager.isConnected();
      if (!isConnected) {
        Alert.alert(
          "Imprimante hors-ligne",
          "L'imprimante thermique n'est pas connectée.",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Connecter", onPress: connectBluetooth }
          ]
        );
        return;
      }

      const dateStr = new Date().toLocaleString();
      const totalDisplay = total.toFixed(2);
     
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printText("\n\n", { align: 1 });
      await BluetoothEscposPrinter.printText(" STOCKIA - TICKET\n", { fontBold: 1, align: 1 });
      await BluetoothEscposPrinter.printText("=".repeat(32) + "\n", { align: 1 });
      await BluetoothEscposPrinter.printText(`Facture: ${factureNumero}\n`, { align: 0 });
      await BluetoothEscposPrinter.printText(`Date: ${dateStr}\n`, { align: 0 });
      await BluetoothEscposPrinter.printText(`Vendeur: ${user?.nom || 'Inconnu'}\n`, { align: 0 });
     
      if (selectedClient) {
        await BluetoothEscposPrinter.printText(`Client: ${selectedClient.nom}\n`, { align: 0 });
      }
     
      await BluetoothEscposPrinter.printText("-".repeat(32) + "\n", { align: 1 });

      for (const item of panier) {
        const nomTronque = item.produit.nom.substring(0, 16).padEnd(16);
        const qteStr = `x${item.quantite}`.padEnd(4);
        const totalLigne = (item.produit.prix_view * item.quantite).toFixed(2);
        const prixStr = `${totalLigne} ${devise}`.padStart(10);
        await BluetoothEscposPrinter.printText(`${nomTronque} ${qteStr} ${prixStr}\n`, { align: 0 });
      }

      await BluetoothEscposPrinter.printText("-".repeat(32) + "\n", { align: 1 });
      await BluetoothEscposPrinter.printText(`SOUS-TOTAL: ${calculerSousTotal().toFixed(2)} ${devise}\n`, { align: 2 });
     
      await BluetoothEscposPrinter.printText("=".repeat(32) + "\n", { align: 1 });
      await BluetoothEscposPrinter.printText(`TOTAL: ${totalDisplay} ${devise}\n`, { fontBold: 1, align: 2 });
      await BluetoothEscposPrinter.printCutPaper();
     
      Alert.alert("✅ Impression réussie", "Le ticket a été imprimé.");
    } catch (error) {
      console.error("[Impression] Erreur:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleValiderVente = () => {
    if (panier.length === 0) {
      Alert.alert("Panier vide", "Veuillez ajouter au moins un produit.");
      return;
    }
    setShowPaymentModal(true);
  };

  const finaliserVente = async () => {
    try {
      const total = calculerTotal();
      const montantRecuNum = parseFloat(montantRecu);

      if (isNaN(montantRecuNum) || montantRecuNum < total) {
        Alert.alert("Erreur", "Le montant reçu est insuffisant.");
        return;
      }

      const monnaie = montantRecuNum - total;
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const dateVente = new Date().toISOString();
      let venteId: number | null = null;

      await db.withTransactionAsync(async () => {
        const resultVente = await db.runAsync(
          `INSERT INTO ventes (facture_numero, client_id, utilisateur_id, montant_brut, remise, montant_net, montant_paye, mode_paiement, statut, date_vente) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETEE', ?);`,
          [factureNumero, selectedClient?.id || null, user?.id || 1, calculerSousTotal(), appliedDiscount + calculerRemisesPromo(), total, montantRecuNum, modePaiement, dateVente]
        );
        venteId = Number(resultVente.lastInsertRowId);
      });

      setPanier([]);
      setMontantRecu("");
      setShowPaymentModal(false);
      await generateInvoiceNumber();
      Alert.alert("✅ Vente Réussie", `Monnaie: ${monnaie.toFixed(2)} ${devise}`);
      await loadInitialData();
    } catch (error) {
      console.error("[Vente] Erreur:", error);
    }
  };

  // === RENDUS CONDITIONNELS DES MODALS (Squelettes fonctionnels créés pour éviter les crashs) ===
  const renderPaymentModal = () => (
    <Modal visible={showPaymentModal} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 20 }}>
        <View style={{ backgroundColor: "#FFF", padding: 20, borderRadius: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15 }}>Finaliser le paiement</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Montant reçu"
            keyboardType="numeric"
            value={montantRecu}
            onChangeText={setMontantRecu}
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 15 }}>
            <TouchableOpacity style={{ flex: 1, padding: 10, backgroundColor: "#CCC", borderRadius: 5, alignItems: "center" }} onPress={() => setShowPaymentModal(false)}>
              <Text>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 10, backgroundColor: "#1565C0", borderRadius: 5, alignItems: "center" }} onPress={finaliserVente}>
              <Text style={{ color: "#FFF" }}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDiscountModal = () => (
    <Modal visible={showDiscountModal} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 20 }}>
        <View style={{ backgroundColor: "#FFF", padding: 20, borderRadius: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15 }}>Appliquer une remise</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Valeur"
            keyboardType="numeric"
            value={discountValue}
            onChangeText={setDiscountValue}
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 15 }}>
            <TouchableOpacity style={{ flex: 1, padding: 10, backgroundColor: "#CCC", borderRadius: 5, alignItems: "center" }} onPress={() => setShowDiscountModal(false)}>
              <Text>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 10, backgroundColor: "#1565C0", borderRadius: 5, alignItems: "center" }} onPress={applyDiscount}>
              <Text style={{ color: "#FFF" }}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderClientModal = () => (
    <Modal visible={showClientModal} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 20 }}>
        <View style={{ backgroundColor: "#FFF", padding: 20, borderRadius: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15 }}>Sélectionner un Client</Text>
          <FlatList
            data={clients}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={{ padding: 10, borderBottomWidth: 1, borderColor: "#EEE" }} onPress={() => { setSelectedClient(item); setShowClientModal(false); }}>
                <Text>{item.nom} ({item.telephone})</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={{ padding: 10, backgroundColor: "#CCC", borderRadius: 5, alignItems: "center", marginTop: 15 }} onPress={() => setShowClientModal(false)}>
            <Text>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const filteredProduits = produits.filter((p) =>
    p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code_barre && p.code_barre.includes(searchQuery))
  );

  const renderPanierItem = ({ item }: { item: ItemPanier }) => {
    const hasPromo = appliedPromotions.has(item.produit.id);
    return (
      <TouchableOpacity style={styles.cartItem} onPress={() => retirerDuPanier(item.produit.id)} onLongPress={() => supprimerDuPanier(item.produit.id)} activeOpacity={0.7}>
        <View style={styles.cartItemContent}>
          <View style={styles.cartItemInfo}>
            <Text style={styles.cartItemName}>{item.produit.nom}</Text>
            {hasPromo && (
              <View style={styles.promoBadge}>
                <Ionicons name="pricetag" size={12} color="#FFF" />
                <Text style={styles.promoBadgeText}>PROMO</Text>
              </View>
            )}
            <Text style={styles.cartItemQuantity}>x{item.quantite}</Text>
          </View>
          <View style={styles.cartItemRight}>
            <Text style={styles.cartItemPrice}>{(item.produit.prix_view * item.quantite).toFixed(2)} {devise}</Text>
            <Text style={styles.cartItemUnitPrice}>{item.produit.prix_view.toFixed(2)} {devise}/u</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderProduitItem = ({ item }: { item: Produit }) => {
    const enStock = item.stock_actuel > 0;
    const enAlerte = item.stock_actuel <= item.stock_minimum;
    const hasPromo = promotions.some(p => p.produit_id === item.id && p.actif === 1);
   
    return (
      <TouchableOpacity style={[styles.productItem, !enStock && styles.productItemOutOfStock, enAlerte && styles.productItemAlert]} onPress={() => enStock && ajouterAuPanier(item)} disabled={!enStock} activeOpacity={0.7}>
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{item.nom}</Text>
            {hasPromo && (
              <View style={styles.productPromoBadge}>
                <Ionicons name="flame" size={14} color="#FFF" />
                <Text style={styles.productPromoText}>PROMO</Text>
              </View>
            )}
          </View>
          <Text style={styles.productCategory}>{item.categorie}</Text>
        </View>
        <View style={styles.productRight}>
          <Text style={styles.productPrice}>{item.prix_view.toFixed(2)} {devise}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPanier = () => {
    if (panier.length === 0) {
      return (
        <View style={styles.cartContainer}>
          <View style={styles.emptyCartContainer}>
            <Ionicons name="cart-outline" size={48} color="#CCC" />
            <Text style={styles.emptyCartText}>Panier vide</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cartContainer}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>🛒 Panier ({calculerNombreArticles()})</Text>
          <TouchableOpacity onPress={viderPanier}><Ionicons name="trash-outline" size={20} color="#D32F2F" /></TouchableOpacity>
        </View>

        <FlatList ref={panierRef} data={panier} keyExtractor={(item) => item.produit.id.toString()} renderItem={renderPanierItem} style={styles.cartList} />

        <View style={styles.totalsContainer}>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total à payer</Text>
            <Text style={styles.grandTotalValue}>{calculerTotal().toFixed(2)} {devise}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.discountButton} onPress={() => setShowDiscountModal(true)}>
            <Text style={styles.discountButtonText}>Remise</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleValiderVente}>
            <Text style={styles.checkoutButtonText}>Payer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // === CONDITION DE CHARGEMENT LOGIQUE (Rapatriée à l'intérieur du composant) ===
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Chargement de la caisse...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {printEnabled && (
        <TouchableOpacity style={styles.bluetoothStatus} onPress={connectBluetooth}>
          <View style={[styles.statusDot, bluetoothConnected ? styles.connected : styles.disconnected]} />
          <Text style={styles.statusText}>
            {bluetoothConnected ? `✓ ${bluetoothDevice || 'Imprimante'} connectée` : "✗ Imprimante hors-ligne"}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput ref={inputRef} style={styles.searchInput} placeholder="Rechercher un article..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <FlatList
        data={filteredProduits}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduitItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInitialData} />}
      />

      {renderPanier()}

      {renderPaymentModal()}
      {renderDiscountModal()}
      {renderClientModal()}
    </SafeAreaView>
  );
}

// === STYLES ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 14 },
  bluetoothStatus: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#E0E0E0" },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  connected: { backgroundColor: "#4CAF50" },
  disconnected: { backgroundColor: "#F44336" },
  statusText: { flex: 1, fontSize: 12, color: "#333" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 10, borderWidth: 1, borderColor: "#DDD", margin: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: "#333" },
  productItem: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#FFF", padding: 14, borderRadius: 10, marginBottom: 8, mx: 12, borderWidth: 1, borderColor: "#EAEAEA" },
  productItemOutOfStock: { opacity: 0.5, backgroundColor: "#F5F5F5" },
  productItemAlert: { borderColor: "#FFCDD2" },
  productInfo: { flex: 1 },
  productHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  productName: { fontSize: 15, fontWeight: "600", color: "#333" },
  productPromoBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F57C00", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  productPromoText: { fontSize: 9, color: "#FFF", fontWeight: "bold" },
  productCategory: { fontSize: 12, color: "#999", marginTop: 2 },
  productRight: { alignItems: "flex-end", justifyContent: "center" },
  productPrice: { fontSize: 16, color: "#1565C0", fontWeight: "700" },
  cartContainer: { backgroundColor: "#FFF", borderTopWidth: 2, borderTopColor: "#1565C0", padding: 16, maxHeight: 350 },
  cartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cartTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  cartList: { maxHeight: 120, marginBottom: 10 },
  cartItem: { paddingVertical: 4 },
  cartItemContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  cartItemInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  cartItemName: { fontSize: 14, color: "#555" },
  promoBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F57C00", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  promoBadgeText: { fontSize: 8, color: "#FFF", fontWeight: "bold" },
  cartItemQuantity: { fontSize: 12, color: "#999" },
  cartItemRight: { alignItems: "flex-end" },
  cartItemPrice: { fontSize: 14, fontWeight: "600", color: "#333" },
  cartItemUnitPrice: { fontSize: 10, color: "#999" },
  emptyCartContainer: { alignItems: "center", paddingVertical: 20 },
  emptyCartText: { fontSize: 14, color: "#999", marginTop: 8 },
  totalsContainer: { borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingTop: 8, marginBottom: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: "#EAEAEA", paddingTop: 8, marginTop: 4 },
  grandTotalLabel: { fontSize: 16, fontWeight: "bold", color: "#333" },
  grandTotalValue: { fontSize: 18, fontWeight: "bold", color: "#2E7D32" },
  actionsContainer: { flexDirection: "row", gap: 10 },
  discountButton: { backgroundColor: "#E3F2FD", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flex: 1, alignItems: "center" },
  discountButtonText: { color: "#1565C0", fontWeight: "500" },
  checkoutButton: { backgroundColor: "#1565C0", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flex: 2, alignItems: "center" },
  checkoutButtonText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
}); 

export default CaisseScreen;