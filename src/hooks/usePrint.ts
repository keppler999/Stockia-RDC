// ============================================
// 📁 HOOKS - USEPRINT
// Version: 3.2.0
// Description: Moteur d'impression ESC/POS, archivage local et partage de reçus
// ============================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vibration } from "react-native";
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer";
import { useUser } from "../context/UserContext";
import { useBluetooth } from "./useBluetooth";

// === INTERFACES ===
export interface PrintItem {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  remise?: number;
  code_barre?: string;
}

export interface PrintReceiptData {
  numero: string;
  date: string;
  vendeur: string;
  client?: string;
  items: PrintItem[];
  sousTotal: number;
  remise: number;
  remisesPromo: number;
  total: number;
  montantPaye: number;
  monnaie: number;
  modePaiement: string;
  devise: string;
  nomBoutique: string;
  notes?: string;
  footer?: string;
  qrCode?: string;
  barcode?: string;
}

export interface PrintConfig {
  paperSize: "58mm" | "80mm";
  charsPerLine: number;
  encoding: string;
  codepage: number;
  fontSize: number;
  fontBold: boolean;
  fontItalic: boolean;
  fontUnderline: boolean;
  align: "left" | "center" | "right";
  copies: number;
  cutPaper: boolean;
}

export interface PrintState {
  isPrinting: boolean;
  lastPrintSuccess: boolean;
  lastError: string | null;
  printCount: number;
  lastReceipt: PrintReceiptData | null;
  lastReceiptPath: string | null;
}

export interface PrintResult {
  success: boolean;
  error?: string;
  ticketPath?: string;
}

export interface UsePrintReturn {
  state: PrintState;
  printReceipt: (data: PrintReceiptData) => Promise<PrintResult>;
  printWithRetry: (data: PrintReceiptData, maxRetries?: number) => Promise<PrintResult>;
  printTest: () => Promise<PrintResult>;
  shareReceipt: (data: PrintReceiptData) => Promise<boolean>;
  saveReceipt: (data: PrintReceiptData) => Promise<string>;
  reset: () => void;
  getConfig: () => PrintConfig;
  updateConfig: (config: Partial<PrintConfig>) => Promise<void>;
}

// === CONFIGURATION PAR DÉFAUT ===
const DEFAULT_CONFIG: PrintConfig = {
  paperSize: "58mm",
  charsPerLine: 32,
  encoding: "UTF-8",
  codepage: 0,
  fontSize: 0,
  fontBold: false,
  fontItalic: false,
  fontUnderline: false,
  align: "left",
  copies: 1,
  cutPaper: true,
};

// === CONSTANTES ===
const STORAGE_KEY_CONFIG = "@stockia_print_config";
const MAX_RETRIES = 3;

export function usePrint(): UsePrintReturn {
  const { user } = useUser();
  const { disconnect, checkConnection } = useBluetooth();

  const [state, setState] = useState<PrintState>({
    isPrinting: false,
    lastPrintSuccess: false,
    lastError: null,
    printCount: 0,
    lastReceipt: null,
    lastReceiptPath: null,
  });

  const [config, setConfig] = useState<PrintConfig>(DEFAULT_CONFIG);
  const isMountedRef = useRef(true);

  // === CHARGEMENT DE LA CONFIGURATION ===
  const loadConfig = useCallback(async () => {
    try {
      const configData = await AsyncStorage.getItem(STORAGE_KEY_CONFIG);
      if (configData && isMountedRef.current) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(configData) });
      }
    } catch (error) {
      console.error("[usePrint] Erreur chargement config:", error);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadConfig();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadConfig]);

  // === SAUVEGARDE DE LA CONFIGURATION ===
  const updateConfig = useCallback(async (newConfig: Partial<PrintConfig>) => {
    try {
      const updated = { ...config, ...newConfig };
      setConfig(updated);
      await AsyncStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("[usePrint] Erreur sauvegarde config:", error);
    }
  }, [config]);

  // === OBTENIR LA CONFIGURATION ===
  const getConfig = useCallback(() => config, [config]);

  // === UTILITAIRES DE FORMATAGE ===
  const centerText = useCallback((text: string, maxChars: number): string => {
    const padding = Math.max(0, maxChars - text.length);
    const leftPad = Math.floor(padding / 2);
    return " ".repeat(leftPad) + text + " ".repeat(padding - leftPad);
  }, []);

  const truncateText = useCallback((text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
      return text.padEnd(maxLength);
    }
    return text.substring(0, maxLength - 3) + "...";
  }, []);

  // === FORMATAGE DU TICKET ===
  const formatReceipt = useCallback((data: PrintReceiptData): string[] => {
    const lines: string[] = [];
    const maxChars = config.paperSize === "58mm" ? 32 : 48;
    const separator = "=".repeat(maxChars);
    const lineSeparator = "-".repeat(maxChars);

    lines.push("");
    lines.push(centerText(data.nomBoutique || "STOCKIA", maxChars));
    lines.push(centerText("=".repeat(data.nomBoutique?.length || 7), maxChars));
    lines.push("");
    lines.push(centerText("📄 TICKET DE CAISSE", maxChars));
    lines.push("");

    lines.push(`Facture: ${data.numero}`);
    lines.push(`Date: ${data.date}`);
    lines.push(`Vendeur: ${data.vendeur}`);
    if (data.client) {
      lines.push(`Client: ${data.client}`);
    }
    lines.push(lineSeparator);

    lines.push("");
    lines.push(centerText("ARTICLES", maxChars));
    lines.push("");

    let itemCount = 0;
    for (const item of data.items) {
      itemCount++;
      const nomTronque = truncateText(item.nom, maxChars - 10);
      const qteStr = `x${item.quantite}`;
      const prixStr = `${item.total.toFixed(2)} ${data.devise}`;

      lines.push(`${nomTronque}`);
      const infoLine = `${qteStr.padEnd(6)} ${prixStr.padStart(maxChars - 7)}`;
      lines.push(`${infoLine}`);

      if (item.quantite > 1) {
        const unitPrice = `(${item.prix_unitaire.toFixed(2)} ${data.devise}/u)`;
        lines.push(`${unitPrice}`);
      }

      if (item.remise && item.remise > 0) {
        lines.push(`  Remise: -${item.remise.toFixed(2)} ${data.devise}`);
      }

      if (itemCount < data.items.length) {
        lines.push("");
      }
    }

    lines.push("");
    lines.push(lineSeparator);

    lines.push(`Sous-total: ${data.sousTotal.toFixed(2)} ${data.devise}`);
    if (data.remisesPromo > 0) {
      lines.push(`Promotions: -${data.remisesPromo.toFixed(2)} ${data.devise}`);
    }
    if (data.remise > 0) {
      lines.push(`Remise: -${data.remise.toFixed(2)} ${data.devise}`);
    }

    lines.push(separator);
    lines.push(centerText(`TOTAL: ${data.total.toFixed(2)} ${data.devise}`, maxChars));
    lines.push(separator);

    lines.push(`Paiement: ${data.modePaiement}`);
    lines.push(`Montant payé: ${data.montantPaye.toFixed(2)} ${data.devise}`);
    if (data.monnaie > 0) {
      lines.push(`Monnaie rendue: ${data.monnaie.toFixed(2)} ${data.devise}`);
    }

    lines.push(lineSeparator);

    if (data.notes) {
      lines.push("");
      lines.push(`📝 ${data.notes}`);
      lines.push("");
    }

    if (data.footer) {
      lines.push("");
      lines.push(centerText(data.footer, maxChars));
    }

    lines.push("");
    lines.push(centerText("Merci de votre confiance !", maxChars));
    lines.push(centerText("Solution par Spiral Agence", maxChars));
    lines.push("");
    lines.push(separator);
    lines.push("");
    lines.push("");
    lines.push("");

    return lines;
  }, [config.paperSize, centerText, truncateText]);

  // === SECURE SAVE DIR UTILITY ===
  const saveReceipt = useCallback(async (data: PrintReceiptData): Promise<string> => {
    try {
      const receiptsDir = `${FileSystem.documentDirectory}receipts/`;
      const dirInfo = await FileSystem.getInfoAsync(receiptsDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(receiptsDir, { intermediates: true });
      }

      const filename = `ticket_${data.numero.replace(/\//g, "_")}_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
      const path = `${receiptsDir}${filename}`;

      const lines = formatReceipt(data);
      const content = lines.join("\n");
      await FileSystem.writeAsStringAsync(path, content);

      return path;
    } catch (error) {
      console.error("[usePrint] Erreur sauvegarde ticket:", error);
      return "";
    }
  }, [formatReceipt]);

  // === IMPRESSION D'UN TICKET ===
  const printReceipt = useCallback(async (data: PrintReceiptData): Promise<PrintResult> => {
    if (state.isPrinting) {
      return { success: false, error: "Une impression est déjà en cours." };
    }

    try {
      setState((prev) => ({ ...prev, isPrinting: true, lastError: null }));

      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error("L'imprimante n'est pas connectée.");
      }

      const lines = formatReceipt(data);
      await BluetoothEscposPrinter.printerInit();

      const printOptions = {
        encoding: config.encoding,
        codepage: config.codepage,
        align: 0,
        fontSize: config.fontSize,
        fontBold: config.fontBold ? 1 : 0,
        fontItalic: config.fontItalic ? 1 : 0,
        fontUnderline: config.fontUnderline ? 1 : 0,
        width: 1,
        height: 1,
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isTitle = line.includes("STOCKIA") || line.includes("TICKET");
        const isTotal = line.includes("TOTAL:");
        const isSeparator = line.includes("==");

        let options = { ...printOptions };

        if (isTitle) {
          options.fontSize = 2;
          options.fontBold = 1;
          options.align = 1;
        } else if (isTotal) {
          options.fontSize = 1;
          options.fontBold = 1;
          options.align = 1;
        } else if (isSeparator) {
          options.fontSize = 0;
          options.fontBold = 0;
        }

        await BluetoothEscposPrinter.printText(line + "\n", options);
      }

      if (config.cutPaper) {
        await BluetoothEscposPrinter.printCutPaper();
      }

      const ticketPath = await saveReceipt(data);

      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isPrinting: false,
          lastPrintSuccess: true,
          printCount: prev.printCount + 1,
          lastReceipt: data,
          lastReceiptPath: ticketPath,
          lastError: null,
        }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Vibration.vibrate(50);
      }

      return { success: true, ticketPath };
    } catch (error: any) {
      console.error("[usePrint] Erreur impression:", error);
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isPrinting: false,
          lastPrintSuccess: false,
          lastError: error.message || "Erreur d'impression",
        }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate(200);
      }

      return { success: false, error: error.message || "Erreur d'impression" };
    }
  }, [state.isPrinting, checkConnection, formatReceipt, config, saveReceipt]);

  // === IMPRESSION TENTATIVES MULTIPLES ===
  const printWithRetry = useCallback(async (data: PrintReceiptData, maxRetries: number = MAX_RETRIES): Promise<PrintResult> => {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[usePrint] Tentative ${attempt}/${maxRetries}`);
      const result = await printReceipt(data);

      if (result.success) return result;
      lastError = result.error;

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        try {
          await disconnect();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await checkConnection();
        } catch (e) {
          // Ignorer l'erreur de tentative de reconnexion cyclique
        }
      }
    }

    return { success: false, error: lastError || "Échec après plusieurs tentatives." };
  }, [printReceipt, disconnect, checkConnection]);

  // === TICKET DE TEST ===
  const printTest = useCallback(async (): Promise<PrintResult> => {
    const testData: PrintReceiptData = {
      numero: "TEST-001",
      date: new Date().toLocaleString(),
      vendeur: user?.nom || "Système",
      items: [
        { nom: "Article Test 1", quantite: 2, prix_unitaire: 10.0, total: 20.0 },
        { nom: "Article Test 2", quantite: 1, prix_unitaire: 15.5, total: 15.5 },
        { nom: "Article très long pour tester le retour à la ligne", quantite: 3, prix_unitaire: 5.25, total: 15.75 },
      ],
      sousTotal: 51.25,
      remise: 0,
      remisesPromo: 0,
      total: 51.25,
      montantPaye: 60.0,
      monnaie: 8.75,
      modePaiement: "ESPÈCES",
      devise: "USD",
      nomBoutique: "TEST STOCKIA",
      footer: "Test matériel - Impression OK",
    };

    return await printReceipt(testData);
  }, [printReceipt, user]);

  // === PARTAGER UN TICKET ===
  const shareReceipt = useCallback(async (data: PrintReceiptData): Promise<boolean> => {
    try {
      const lines = formatReceipt(data);
      const content = lines.join("\n");
      const path = `${FileSystem.cacheDirectory}ticket_${Date.now()}.txt`;

      await FileSystem.writeAsStringAsync(path, content);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: "text/plain",
          dialogTitle: "Partager le ticket",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("[usePrint] Erreur partage ticket:", error);
      return false;
    }
  }, [formatReceipt]);

  // === RÉINITIALISATION ===
  const reset = useCallback(() => {
    setState({
      isPrinting: false,
      lastPrintSuccess: false,
      lastError: null,
      printCount: 0,
      lastReceipt: null,
      lastReceiptPath: null,
    });
  }, []);

  const value = useMemo<UsePrintReturn>(
    () => ({
      state,
      printReceipt,
      printWithRetry,
      printTest,
      shareReceipt,
      saveReceipt,
      reset,
      getConfig,
      updateConfig,
    }),
    [state, printReceipt, printWithRetry, printTest, shareReceipt, saveReceipt, reset, getConfig, updateConfig]
  );

  return value;
}

// === HOOKS DÉRIVÉS UNIFIÉS ===
export function usePrintState(): PrintState {
  return usePrint().state;
}

export function usePrintStatus() {
  const { state } = usePrint();
  return {
    isPrinting: state.isPrinting,
    lastPrintSuccess: state.lastPrintSuccess,
    printCount: state.printCount,
  };
}

export function usePrintConfig(): PrintConfig {
  return usePrint().getConfig();
}

export default usePrint;