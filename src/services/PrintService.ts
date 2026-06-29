import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { BluetoothEscposPrinter, BluetoothManager } from "react-native-bluetooth-escpos-printer";

// === INTERFACES ===
export interface PrintItem {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  remise?: number;
  code_barre?: string;
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
}

export interface PrintResult {
  success: boolean;
  error?: string;
  ticketPath?: string;
}

export interface BluetoothDevice {
  address: string;
  name: string;
  type?: string;
  connected?: boolean;
}

// === CONSTANTES ===
const STORAGE_KEY_CONFIG = "@stockia_print_config";
const STORAGE_KEY_LAST_DEVICE = "@stockia_last_bluetooth_device";

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
};

const PAPER_WIDTH: Record<"58mm" | "80mm", number> = {
  "58mm": 32,
  "80mm": 48,
};

export class PrintService {
  private static instance: PrintService;
  private config: PrintConfig = DEFAULT_CONFIG;
  private isPrinting: boolean = false;
  private connectedDevice: BluetoothDevice | null = null;

  private constructor() {
    this.loadConfig();
    this.loadLastDevice();
  }

  static getInstance(): PrintService {
    if (!PrintService.instance) {
      PrintService.instance = new PrintService();
    }
    return PrintService.instance;
  }

  // === CONFIGURATION ===
  async loadConfig(): Promise<void> {
    try {
      const configData = await AsyncStorage.getItem(STORAGE_KEY_CONFIG);
      if (configData) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
      }
    } catch (error) {
      console.error("[PrintService] Erreur chargement config:", error);
    }
  }

  async saveConfig(config: Partial<PrintConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      await AsyncStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error("[PrintService] Erreur sauvegarde config:", error);
    }
  }

  getConfig(): PrintConfig {
    return this.config;
  }

  // === APPAREILS ===
  async loadLastDevice(): Promise<void> {
    try {
      const deviceData = await AsyncStorage.getItem(STORAGE_KEY_LAST_DEVICE);
      if (deviceData) {
        this.connectedDevice = JSON.parse(deviceData);
      }
    } catch (error) {
      console.error("[PrintService] Erreur chargement dernier appareil:", error);
    }
  }

  async saveLastDevice(device: BluetoothDevice): Promise<void> {
    try {
      this.connectedDevice = device;
      await AsyncStorage.setItem(STORAGE_KEY_LAST_DEVICE, JSON.stringify(device));
    } catch (error) {
      console.error("[PrintService] Erreur sauvegarde appareil:", error);
    }
  }

  // === SCAN ===
  async scanDevices(timeout: number = 10000): Promise<BluetoothDevice[]> {
    try {
      const devicesString = await BluetoothManager.scanDevices();
      const devices = typeof devicesString === "string" ? JSON.parse(devicesString) : devicesString;
     
      const foundDevices: any[] = devices.found || devices;
      return foundDevices.map((d: any) => ({
        address: d.address,
        name: d.name || `Appareil ${d.address.substring(0, 4)}`,
        type: d.type,
        connected: false,
      }));
    } catch (error) {
      console.error("[PrintService] Erreur scan:", error);
      throw new Error("Impossible de scanner les appareils Bluetooth.");
    }
  }

  // === CONNEXION ===
  async connect(address: string): Promise<boolean> {
    try {
      await BluetoothManager.connect(address);
      await this.saveLastDevice({
        address,
        name: `Imprimante BTP`,
        connected: true,
      });
      this.isPrinting = false;
      return true;
    } catch (error) {
      console.error("[PrintService] Erreur connexion:", error);
      throw new Error("Impossible de se connecter à l'imprimante.");
    }
  }

  async disconnect(): Promise<void> {
    try {
      await BluetoothManager.disableBluetooth(); // Ou méthode native équivalente selon la version
      this.connectedDevice = null;
      this.isPrinting = false;
    } catch (error) {
      console.error("[PrintService] Erreur déconnexion:", error);
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      // Vérification sommaire selon les capacités du package
      return this.connectedDevice !== null;
    } catch (error) {
      return false;
    }
  }

  async ensureConnection(): Promise<boolean> {
    try {
      const isConnected = await this.isConnected();
      if (isConnected) return true;
      if (this.connectedDevice) {
        await this.connect(this.connectedDevice.address);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[PrintService] Erreur vérification connexion:", error);
      return false;
    }
  }

  // === FORMATAGE ===
  formatReceipt(data: PrintReceiptData): string[] {
    const lines: string[] = [];
    const maxChars = PAPER_WIDTH[this.config.paperSize] || 32;
    const separator = "=".repeat(maxChars);
    const lineSeparator = "-".repeat(maxChars);

    // En-tête
    lines.push("");
    lines.push(this.centerText(data.nomBoutique || "STOCKIA", maxChars));
    lines.push(this.centerText("=".repeat(data.nomBoutique?.length || 8), maxChars));
    lines.push("");
    lines.push(this.centerText("📄 TICKET DE CAISSE", maxChars));
    lines.push("");

    // Informations
    lines.push(`Facture: ${data.numero}`);
    lines.push(`Date: ${data.date}`);
    lines.push(`Vendeur: ${data.vendeur}`);
    if (data.client) {
      lines.push(`Client: ${data.client}`);
    }
    lines.push(lineSeparator);

    // Articles
    lines.push("");
    lines.push(this.centerText("ARTICLES", maxChars));
    lines.push("");

    let itemCount = 0;
    for (const item of data.items) {
      itemCount++;
      const nomTronque = this.truncateText(item.nom, maxChars - 18);
      const qteStr = `x${item.quantite}`;
      const prixStr = `${item.total.toFixed(2)} ${data.devise}`;
     
      lines.push(`${nomTronque}`);
      const infoLine = `${qteStr.padEnd(6)} ${prixStr.padStart(12)}`;
      lines.push(` ${infoLine}`);
     
      if (item.quantite > 1) {
        const unitPrice = `(${item.prix_unitaire.toFixed(2)} ${data.devise}/u)`;
        lines.push(` ${unitPrice}`);
      }

      if (item.remise && item.remise > 0) {
        lines.push(` Remise: -${item.remise.toFixed(2)} ${data.devise}`);
      }

      if (itemCount < data.items.length) {
        lines.push("");
      }
    }

    lines.push("");
    lines.push(lineSeparator);

    // Totaux
    lines.push(`Sous-total: ${data.sousTotal.toFixed(2)} ${data.devise}`);
   
    if (data.remisesPromo > 0) {
      lines.push(`Promotions: -${data.remisesPromo.toFixed(2)} ${data.devise}`);
    }
   
    if (data.remise > 0) {
      lines.push(`Remise: -${data.remise.toFixed(2)} ${data.devise}`);
    }
   
    lines.push(separator);
    lines.push(this.centerText(`TOTAL: ${data.total.toFixed(2)} ${data.devise}`, maxChars));
    lines.push(separator);
   
    // Paiement
    lines.push(`Paiement: ${data.modePaiement}`);
    lines.push(`Montant payé: ${data.montantPaye.toFixed(2)} ${data.devise}`);
   
    if (data.monnaie > 0) {
      lines.push(`Monnaie rendue: ${data.monnaie.toFixed(2)} ${data.devise}`);
    }

    lines.push(lineSeparator);

    // Notes
    if (data.notes) {
      lines.push("");
      lines.push(`📝 ${data.notes}`);
      lines.push("");
    }

    // Pied de page
    if (data.footer) {
      lines.push("");
      lines.push(this.centerText(data.footer, maxChars));
    }

    lines.push("");
    lines.push(this.centerText("Merci de votre confiance !", maxChars));
    lines.push(this.centerText("Solution par Spiral Agence", maxChars));
    lines.push("");
    lines.push(this.centerText("=".repeat(maxChars), maxChars));
    lines.push("");
    lines.push("");
    lines.push("");

    return lines;
  }

  private centerText(text: string, maxChars: number): string {
    const padding = Math.max(0, maxChars - text.length);
    const leftPad = Math.floor(padding / 2);
    return " ".repeat(leftPad) + text + " ".repeat(padding - leftPad);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text.padEnd(maxLength);
    }
    return text.substring(0, maxLength - 3) + "...";
  }

  generateReceiptText(data: PrintReceiptData): string {
    const lines = this.formatReceipt(data);
    return lines.join("\n");
  }

  // === IMPRESSION ===
  async printReceipt(data: PrintReceiptData): Promise<PrintResult> {
    if (this.isPrinting) {
      return { success: false, error: "Une impression est déjà en cours." };
    }

    try {
      this.isPrinting = true;

      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        throw new Error("L'imprimante n'est pas connectée.");
      }

      await BluetoothEscposPrinter.printerInit();

      const lines = this.formatReceipt(data);

      const printOptions = {
        encoding: this.config.encoding,
        codepage: this.config.codepage,
        align: 0,
        fontSize: this.config.fontSize,
        fontBold: this.config.fontBold ? 1 : 0,
        fontItalic: this.config.fontItalic ? 1 : 0,
        fontUnderline: this.config.fontUnderline ? 1 : 0,
        width: 1,
        height: 1,
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isTitle = line.includes(data.nomBoutique) || line.includes("TICKET");
        const isTotal = line.includes("TOTAL:");
        const isSeparator = line.includes("=".repeat(10));

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

      await BluetoothEscposPrinter.printCutPaper();
      const ticketPath = await this.saveReceipt(data);
      this.isPrinting = false;

      return { success: true, ticketPath };

    } catch (error: any) {
      console.error("[PrintService] Erreur impression:", error);
      this.isPrinting = false;
      return {
        success: false,
        error: error.message || "Erreur d'impression.",
      };
    }
  }

  // === IMPRESSION AVEC RETRY ===
  async printWithRetry(data: PrintReceiptData, maxRetries: number = 3): Promise<PrintResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[PrintService] Tentative ${attempt}/${maxRetries}`);
      const result = await this.printReceipt(data);

      if (result.success) return result;
      lastError = result.error;

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        try {
          await this.disconnect();
          if (this.connectedDevice) {
            await this.connect(this.connectedDevice.address);
          }
        } catch (e) {
          // Ignorer l'erreur de reconnexion intermédiaire
        }
      }
    }

    return {
      success: false,
      error: lastError || "Échec après plusieurs tentatives.",
    };
  }

  // === SAUVEGARDE ===
  async saveReceipt(data: PrintReceiptData): Promise<string> {
    try {
      const receiptsDir = `${FileSystem.documentDirectory}receipts/`;
     
      // FIX EXPO FILE SYSTEM
      const dirInfo = await FileSystem.getInfoAsync(receiptsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(receiptsDir, { intermediates: true });
      }

      const filename = `ticket_${data.numero.replace(/\//g, "_")}_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
      const path = `${receiptsDir}${filename}`;

      const content = this.generateReceiptText(data);
      await FileSystem.writeAsStringAsync(path, content);

      return path;
    } catch (error) {
      console.error("[PrintService] Erreur sauvegarde ticket:", error);
      return "";
    }
  }

  // === PARTAGE ===
  async shareReceipt(data: PrintReceiptData): Promise<boolean> {
    try {
      const content = this.generateReceiptText(data);
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
      console.error("[PrintService] Erreur partage ticket:", error);
      return false;
    }
  }
}

// === EXPORTS ===
export const printService = PrintService.getInstance();
export default PrintService; 