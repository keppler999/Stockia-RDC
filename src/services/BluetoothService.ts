import AsyncStorage from "@react-native-async-storage/async-storage";
import { BluetoothEscposPrinter, BluetoothManager } from "react-native-bluetooth-escpos-printer";

// === INTERFACES ===
export interface BluetoothDevice {
  address: string;
  name: string;
  type?: string;
  connected?: boolean;
  rssi?: number;
  manufacturerData?: any;
}

export interface BluetoothDeviceInfo extends BluetoothDevice {
  isPaired: boolean;
  isConnected: boolean;
  lastSeen?: Date;
}

export interface PrintOptions {
  copies?: number;
  cutPaper?: boolean;
  openDrawer?: boolean;
  wait?: boolean;
}

export interface PrinterStatus {
  connected: boolean;
  ready: boolean;
  deviceName?: string;
  deviceAddress?: string;
  paper?: boolean;
  error?: string;
  battery?: number;
  temperature?: number;
}

export interface BluetoothConfig {
  scanTimeout: number;
  connectionTimeout: number;
  printTimeout: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  preferredDevice?: string;
}

// === CONSTANTES ===
const STORAGE_KEY_CONFIG = "@stockia_bluetooth_config";
const STORAGE_KEY_DEVICES = "@stockia_bluetooth_devices";
const STORAGE_KEY_PREFERRED = "@stockia_bluetooth_preferred";

const DEFAULT_CONFIG: BluetoothConfig = {
  scanTimeout: 10000,
  connectionTimeout: 15000,
  printTimeout: 30000,
  reconnectAttempts: 3,
  reconnectDelay: 2000,
};

export class BluetoothService {
  private static instance: BluetoothService;
  private config: BluetoothConfig = DEFAULT_CONFIG;
  private isInitialized: boolean = false;
  private isPrinting: boolean = false;
  private connectedDevice: BluetoothDevice | null = null;

  private constructor() {}

  static getInstance(): BluetoothService {
    if (!BluetoothService.instance) {
      BluetoothService.instance = new BluetoothService();
    }
    return BluetoothService.instance;
  }

  // === INITIALISATION ===
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadConfig();
      await this.loadPreferredDevice();
      await this.checkConnection();

      this.isInitialized = true;
      console.log("[BluetoothService] Initialisé");
    } catch (error) {
      console.error("[BluetoothService] Erreur initialisation:", error);
      throw new Error("Impossible d'initialiser le service Bluetooth.");
    }
  }

  // === CHARGEMENT DE LA CONFIGURATION ===
  async loadConfig(): Promise<void> {
    try {
      const configData = await AsyncStorage.getItem(STORAGE_KEY_CONFIG);
      if (configData) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
      }
    } catch (error) {
      console.error("[BluetoothService] Erreur chargement config:", error);
    }
  }

  async saveConfig(config: Partial<BluetoothConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      await AsyncStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error("[BluetoothService] Erreur sauvegarde config:", error);
    }
  }

  getConfig(): BluetoothConfig {
    return { ...this.config };
  }

  // === APPAREIL PRÉFÉRÉ ===
  async loadPreferredDevice(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_PREFERRED);
      if (data) {
        const device = JSON.parse(data);
        if (device && device.address) {
          this.connectedDevice = device;
          console.log(`[BluetoothService] Appareil préféré chargé: ${device.name}`);
        }
      }
    } catch (error) {
      console.error("[BluetoothService] Erreur chargement appareil préféré:", error);
    }
  }

  async setPreferredDevice(device: BluetoothDevice): Promise<void> {
    try {
      this.connectedDevice = device;
      await AsyncStorage.setItem(STORAGE_KEY_PREFERRED, JSON.stringify(device));
    } catch (error) {
      console.error("[BluetoothService] Erreur sauvegarde appareil préféré:", error);
    }
  }

  async clearPreferredDevice(): Promise<void> {
    try {
      this.connectedDevice = null;
      await AsyncStorage.removeItem(STORAGE_KEY_PREFERRED);
    } catch (error) {
      console.error("[BluetoothService] Erreur suppression appareil préféré:", error);
    }
  }

  // === SCAN DES APPAREILS ===
  async scanDevices(timeout?: number): Promise<BluetoothDevice[]> {
    try {
      const scanTimeout = timeout || this.config.scanTimeout;
      console.log(`[BluetoothService] Scan en cours (${scanTimeout}ms)...`);

      const response = await BluetoothManager.scanDevices(scanTimeout);
      let devices: any[] = [];

      if (typeof response === "string") {
        const parsed = JSON.parse(response);
        devices = parsed.found || parsed.paired || [];
      } else if (response && typeof response === "object") {
        devices = (response as any).found || (response as any).paired || [];
      }

      const formattedDevices: BluetoothDevice[] = devices.map((d: any) => ({
        address: d.address,
        name: d.name || `Appareil ${d.address?.substring(0, 4) || "Inconnu"}`,
        type: d.type,
        connected: false,
        rssi: d.rssi,
        manufacturerData: d.manufacturerData,
      }));

      console.log(`[BluetoothService] ${formattedDevices.length} appareils trouvés`);
      return formattedDevices;
    } catch (error: any) {
      console.error("[BluetoothService] Erreur scan:", error);
      throw new Error(error.message || "Erreur de scan Bluetooth.");
    }
  }

  // === SCAN DES IMPRIMANTES THERMIQUES ===
  async scanPrinters(timeout?: number): Promise<BluetoothDevice[]> {
    try {
      const devices = await this.scanDevices(timeout);
      const printers = devices.filter((d) => {
        const name = d.name.toLowerCase();
        return (
          name.includes("printer") ||
          name.includes("pos") ||
          name.includes("thermal") ||
          name.includes("bluetooth") ||
          name.includes("esc") ||
          name.includes("receipt")
        );
      });

      console.log(`[BluetoothService] ${printers.length} imprimantes trouvées`);
      return printers;
    } catch (error) {
      console.error("[BluetoothService] Erreur scan imprimantes:", error);
      throw error;
    }
  }

  // === SCAN AVANCÉ ===
  async scanWithFilter(
    options: {
      timeout?: number;
      nameFilter?: string;
      typeFilter?: string[];
      minRssi?: number;
    } = {}
  ): Promise<BluetoothDevice[]> {
    try {
      let devices = await this.scanDevices(options.timeout);

      if (options.nameFilter) {
        devices = devices.filter((d) =>
          d.name.toLowerCase().includes(options.nameFilter!.toLowerCase())
        );
      }

      if (options.typeFilter && options.typeFilter.length > 0) {
        devices = devices.filter((d) => d.type && options.typeFilter!.includes(d.type));
      }

      if (options.minRssi !== undefined) {
        devices = devices.filter((d) => d.rssi !== undefined && d.rssi >= options.minRssi!);
      }

      return devices;
    } catch (error) {
      console.error("[BluetoothService] Erreur scan filtré:", error);
      throw error;
    }
  }

  // === CONNEXION ===
  async connect(address: string, timeout?: number): Promise<boolean> {
    try {
      console.log(`[BluetoothService] Connexion à ${address}...`);
      const connectTimeout = timeout || this.config.connectionTimeout;

      const connectPromise = BluetoothManager.connect(address);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout de connexion")), connectTimeout);
      });

      await Promise.race([connectPromise, timeoutPromise]);

      const device = await BluetoothManager.getConnectedDevice();
      const connectedDevice: BluetoothDevice = {
        address: device?.address || address,
        name: device?.name || `Appareil ${address.substring(0, 4)}`,
        connected: true,
      };

      this.connectedDevice = connectedDevice;
      await this.setPreferredDevice(connectedDevice);

      console.log(`[BluetoothService] Connecté à ${connectedDevice.name}`);
      return true;
    } catch (error: any) {
      console.error("[BluetoothService] Erreur connexion:", error);
      throw new Error(error.message || "Erreur de connexion Bluetooth.");
    }
  }

  async connectPreferred(): Promise<boolean> {
    if (!this.connectedDevice) {
      throw new Error("Aucun appareil préféré configuré.");
    }
    return await this.connect(this.connectedDevice.address);
  }

  async disconnect(): Promise<void> {
    try {
      await BluetoothManager.close();
      this.connectedDevice = null;
      console.log("[BluetoothService] Déconnecté");
    } catch (error) {
      console.error("[BluetoothService] Erreur déconnexion:", error);
      throw new Error("Erreur de déconnexion Bluetooth.");
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const isConnected = await BluetoothManager.isConnected();
      if (isConnected) {
        const device = await BluetoothManager.getConnectedDevice();
        if (device) {
          this.connectedDevice = {
            address: device.address,
            name: device.name || "Imprimante",
            connected: true,
          };
        }
        return true;
      }
      this.connectedDevice = null;
      return false;
    } catch (error) {
      console.error("[BluetoothService] Erreur checkConnection:", error);
      return false;
    }
  }

  async reconnect(): Promise<boolean> {
    if (!this.connectedDevice) {
      throw new Error("Aucun appareil à reconnecter.");
    }

    let attempts = 0;
    const maxAttempts = this.config.reconnectAttempts;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`[BluetoothService] Tentative de reconnexion ${attempts}/${maxAttempts}`);

        await this.disconnect();
        await new Promise((resolve) => setTimeout(resolve, this.config.reconnectDelay));
        await this.connect(this.connectedDevice.address);

        return true;
      } catch (error) {
        console.error(`[BluetoothService] Échec reconnexion ${attempts}:`, error);
        if (attempts >= maxAttempts) {
          throw new Error("Échec de la reconnexion après plusieurs tentatives.");
        }
      }
    }
    return false;
  }

  // === IMPRESSION DE TEXTE ===
  async printText(
    text: string,
    options: {
      fontSize?: number;
      fontBold?: boolean;
      fontItalic?: boolean;
      align?: "left" | "center" | "right";
      encoding?: string;
    } = {}
  ): Promise<void> {
    if (this.isPrinting) {
      throw new Error("Une impression est déjà en cours.");
    }

    try {
      this.isPrinting = true;

      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error("L'imprimante n'est pas connectée.");
      }

      const printOptions = {
        encoding: options.encoding || "UTF-8",
        codepage: 0,
        align: options.align === "center" ? 1 : options.align === "right" ? 2 : 0,
        width: options.fontSize || 1,
        height: options.fontSize || 1,
        fontType: options.fontBold ? 1 : 0,
      };

      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printText(text, printOptions);
      console.log("[BluetoothService] Impression terminée");
    } catch (error: any) {
      console.error("[BluetoothService] Erreur impression:", error);
      throw new Error(error.message || "Erreur d'impression.");
    } finaly {
      this.isPrinting = false;
    }
  }

  async cutPaper(): Promise<void> {
    try {
      await BluetoothEscposPrinter.printCutPaper();
      console.log("[BluetoothService] Papier coupé");
    } catch (error) {
      console.error("[BluetoothService] Erreur coupe papier:", error);
      throw new Error("Erreur de coupe du papier.");
    }
  }

  async openDrawer(): Promise<void> {
    try {
      await BluetoothEscposPrinter.openDrawer();
      console.log("[BluetoothService] Tiroir-caisse ouvert");
    } catch (error) {
      console.error("[BluetoothService] Erreur ouverture tiroir:", error);
      throw new Error("Erreur d'ouverture du tiroir-caisse.");
    }
  }

  async printWithOptions(text: string, printOptions: PrintOptions = {}): Promise<void> {
    try {
      const { copies = 1, cutPaper = true, openDrawer = false } = printOptions;

      for (let i = 0; i < copies; i++) {
        await this.printText(text);
        if (i < copies - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      if (cutPaper) await this.cutPaper();
      if (openDrawer) await this.openDrawer();
    } catch (error) {
      console.error("[BluetoothService] Erreur impression avec options:", error);
      throw error;
    }
  }

  // === STATUT DE L'IMPRIMANTE ===
  async getPrinterStatus(): Promise<PrinterStatus> {
    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        return {
          connected: false,
          ready: false,
          error: "Imprimante non connectée",
        };
      }

      return {
        connected: true,
        ready: true,
        deviceName: this.connectedDevice?.name,
        deviceAddress: this.connectedDevice?.address,
        paper: true,
      };
    } catch (error) {
      console.error("[BluetoothService] Erreur statut:", error);
      return {
        connected: false,
        ready: false,
        error: "Impossible de récupérer le statut",
      };
    }
  }

  // === APPAREILS SAUVEGARDÉS ===
  async getSavedDevices(): Promise<BluetoothDevice[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_DEVICES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("[BluetoothService] Erreur getSavedDevices:", error);
      return [];
    }
  }

  async saveDevice(device: BluetoothDevice): Promise<void> {
    try {
      const devices = await this.getSavedDevices();
      const index = devices.findIndex((d) => d.address === device.address);
      if (index >= 0) {
        devices[index] = device;
      } else {
        devices.push(device);
      }
      await AsyncStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(devices));
    } catch (error) {
      console.error("[BluetoothService] Erreur saveDevice:", error);
    }
  }

  async removeDevice(address: string): Promise<void> {
    try {
      const devices = await this.getSavedDevices();
      const filtered = devices.filter((d) => d.address !== address);
      await AsyncStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(filtered));
    } catch (error) {
      console.error("[BluetoothService] Erreur removeDevice:", error);
    }
  }

  // === RÉINITIALISATION ===
  async reset(): Promise<void> {
    try {
      await this.disconnect();
      await this.clearPreferredDevice();
      this.isPrinting = false;
      this.config = { ...DEFAULT_CONFIG };
      await AsyncStorage.removeItem(STORAGE_KEY_CONFIG);
      console.log("[BluetoothService] Réinitialisé");
    } catch (error) {
      console.error("[BluetoothService] Erreur reset:", error);
    }
  }
}

export const bluetoothService = BluetoothService.getInstance();
export default BluetoothService; 