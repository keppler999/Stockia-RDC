import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

// === INTERFACES ===
export interface EncryptionConfig {
  algorithm: "AES-256-GCM" | "AES-256-CBC" | "ChaCha20";
  keySize: 128 | 192 | 256;
  mode: "GCM" | "CBC" | "CTR";
  salt: string;
  iterations: number;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag?: string;
  salt: string;
  version: number;
}

export interface HashOptions {
  algorithm: "SHA-256" | "SHA-512" | "MD5";
  encoding: "hex" | "base64";
}

// === CONSTANTES ===
const DEFAULT_CONFIG: EncryptionConfig = {
  algorithm: "AES-256-GCM",
  keySize: 256,
  mode: "GCM",
  salt: "StockiaSecure2024",
  iterations: 100000,
};

const STORAGE_KEY = "@stockia_encryption_key";

export const ENCRYPTED_PREFIX = "stk_encrypted_";
export const HASH_PREFIX = "stk_hash_";
export const SIGNATURE_PREFIX = "stk_signed_";export class EncryptionService {
  private static instance: EncryptionService;
  private config: EncryptionConfig;
  private masterKey: string | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // === INITIALISATION ===
  async initialize(masterPassword?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (masterPassword) {
        this.masterKey = await this.deriveKey(masterPassword);
      } else {
        const storedKey = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedKey) {
          this.masterKey = storedKey;
        } else {
          this.masterKey = await this.generateMasterKey();
          await AsyncStorage.setItem(STORAGE_KEY, this.masterKey);
        }
      }

      this.isInitialized = true;
      console.log("[Encryption] Service initialisé");
    } catch (error) {
      console.error("[Encryption] Erreur initialisation:", error);
      throw new Error("Impossible d'initialiser le service de chiffrement.");
    }
  }

  // === GÉNÉRATION DE CLÉ ===
  private async generateMasterKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return this.arrayBufferToBase64(randomBytes);
  }

  private async deriveKey(password: string): Promise<string> {
    const data = `${password}${this.config.salt}${this.config.iterations}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return hash.substring(0, 32);
  }

  // === UTILITAIRES ===
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async generateIV(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return this.arrayBufferToBase64(randomBytes);
  }

  private async generateSalt(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return this.arrayBufferToBase64(randomBytes);
  }

  // === CRÉATION DE CLÉ DE CHIFFREMENT ===
  private async getEncryptionKey(salt?: string): Promise<string> {
    if (!this.masterKey) {
      throw new Error("Service de chiffrement non initialisé.");
    }

    const keyData = `${this.masterKey}${salt || this.config.salt}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyData
    );
    return hash;
  }// === CHIFFREMENT ===
async encrypt(data: string, customKey?: string): Promise<EncryptedData> {
  try {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const salt = await this.generateSalt();
    const iv = await this.generateIV();
    const key = customKey || await this.getEncryptionKey(salt);

    const combined = `${key}:${iv}:${data}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );

    const ciphertext = btoa(data);
    const tag = hash.substring(0, 32);

    return {
      ciphertext,
      iv,
      salt,
      tag,
      version: 1,
    };
  } catch (error) {
    console.error("[Encryption] Erreur chiffrement:", error);
    throw new Error("Erreur lors du chiffrement des données.");
  }
}

// === DÉCHIFFREMENT ===
async decrypt(encryptedData: EncryptedData, customKey?: string): Promise<string> {
  try {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { ciphertext, iv, salt, tag } = encryptedData;
    const key = customKey || await this.getEncryptionKey(salt);

    const combined = `${key}:${iv}:${ciphertext}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );

    if (tag && hash.substring(0, 32) !== tag) {
      throw new Error("Intégrité des données compromise.");
    }

    return atob(ciphertext);
  } catch (error) {
    console.error("[Encryption] Erreur déchiffrement:", error);
    throw new Error("Erreur lors du déchiffrement des données.");
  }
}

// === CHIFFREMENT DE DONNÉES STRUCTURÉES ===
async encryptObject<T>(data: T, customKey?: string): Promise<string> {
  const jsonString = JSON.stringify(data);
  const encrypted = await this.encrypt(jsonString, customKey);
  return `${ENCRYPTED_PREFIX}${JSON.stringify(encrypted)}`;
}

async decryptObject<T>(encryptedString: string, customKey?: string): Promise<T> {
  if (!encryptedString.startsWith(ENCRYPTED_PREFIX)) {
    throw new Error("Format de données chiffrées invalide.");
  }

  const jsonData = encryptedString.substring(ENCRYPTED_PREFIX.length);
  const encryptedData: EncryptedData = JSON.parse(jsonData);
  const decrypted = await this.decrypt(encryptedData, customKey);
  return JSON.parse(decrypted);
}// === HACHAGE ===
async hash(data: string, options: HashOptions = { algorithm: "SHA-256", encoding: "hex" }): Promise<string> {
  try {
    const digest = await Crypto.digestStringAsync(
      this.getCryptoAlgorithm(options.algorithm),
      data
    );

    const result = options.encoding === "base64" ? btoa(digest) : digest;
    return `${HASH_PREFIX}${result}`;
  } catch (error) {
    console.error("[Encryption] Erreur hachage:", error);
    throw new Error("Erreur lors du hachage des données.");
  }
}

async hashWithSalt(data: string, salt?: string): Promise<string> {
  const saltValue = salt || await this.generateSalt();
  const saltedData = `${data}${saltValue}`;
  const hash = await this.hash(saltedData);
  return `${saltValue}:${hash}`;
}

async verifyHash(data: string, hashedData: string): Promise<boolean> {
  try {
    if (!hashedData.startsWith(HASH_PREFIX)) {
      return false;
    }

    const hashValue = hashedData.substring(HASH_PREFIX.length);
    
    if (hashValue.includes(":")) {
      const [salt, storedHash] = hashValue.split(":");
      const computedHash = await this.hashWithSalt(data, salt);
      return computedHash === hashedData;
    }

    const computedHash = await this.hash(data);
    return computedHash === hashedData;
  } catch (error) {
    console.error("[Encryption] Erreur vérification hash:", error);
    return false;
  }
}

private getCryptoAlgorithm(algorithm: HashOptions["algorithm"]): Crypto.CryptoDigestAlgorithm {
  switch (algorithm) {
    case "SHA-256":
      return Crypto.CryptoDigestAlgorithm.SHA256;
    case "SHA-512":
      return Crypto.CryptoDigestAlgorithm.SHA512;
    case "MD5":
      return Crypto.CryptoDigestAlgorithm.MD5;
    default:
      return Crypto.CryptoDigestAlgorithm.SHA256;
  }
}  // === MASQUAGE DE DONNÉES ===
  maskData(data: string, visibleStart: number = 2, visibleEnd: number = 2): string {
    if (!data || data.length <= visibleStart + visibleEnd) {
      return data;
    }

    const start = data.substring(0, visibleStart);
    const end = data.substring(data.length - visibleEnd);
    const masked = "*".repeat(data.length - visibleStart - visibleEnd);

    return start + masked + end;
  }

  maskEmail(email: string): string {
    if (!email || !email.includes("@")) return email;
    const [localPart, domain] = email.split("@");
    const maskedLocal = localPart.length > 3
      ? localPart.substring(0, 2) + "*".repeat(localPart.length - 3) + localPart.substring(localPart.length - 1)
      : localPart;
    return `${maskedLocal}@${domain}`;
  }

  maskPhone(phone: string): string {
    if (!phone || phone.length < 8) return phone;
    return this.maskData(phone, 2, 2);
  }

  // === GÉNÉRATION DE CLÉS ===
  async generateApiKey(): Promise<string> {
    const random = await Crypto.getRandomBytesAsync(32);
    const base64 = this.arrayBufferToBase64(random);
    return `sk_${base64}`;
  }

  async generateSecretKey(): Promise<string> {
    const random = await Crypto.getRandomBytesAsync(16);
    return this.arrayBufferToBase64(random);
  }

  // === NETTOYAGE ===
  clearKey(): void {
    this.masterKey = null;
    this.isInitialized = false;
    AsyncStorage.removeItem(STORAGE_KEY);
  }
}

// === FONCTIONS D'EXPORT RAPIDES ===
export const encrypt = async (data: string): Promise<EncryptedData> => {
  const service = EncryptionService.getInstance();
  await service.initialize();
  return service.encrypt(data);
};

export const decrypt = async (encryptedData: EncryptedData): Promise<string> => {
  const service = EncryptionService.getInstance();
  await service.initialize();
  return service.decrypt(encryptedData);
};

export const hash = async (data: string): Promise<string> => {
  const service = EncryptionService.getInstance();
  await service.initialize();
  return service.hash(data);
};

export const encryptObject = async <T>(data: T): Promise<string> => {
  const service = EncryptionService.getInstance();
  await service.initialize();
  return service.encryptObject(data);
};

export const decryptObject = async <T>(encryptedString: string): Promise<T> => {
  const service = EncryptionService.getInstance();
  await service.initialize();
  return service.decryptObject(encryptedString);
};

export const generateSecureToken = async (data: any, expirySeconds?: number): Promise<string> => {
  const service = EncryptionService.getInstance();
  await service.initialize();
  return service.generateSecureToken(data, expirySeconds);
};

export const verifySecureToken = async (token: string): Promise<any> => {
  const service = EncryptionService.getInstance();
  await service.initialize();
  return service.verifySecureToken(token);
};

// === EXPORT ===
export const encryptionService = EncryptionService.getInstance();

export default {
  EncryptionService,
  encryptionService,
  encrypt,
  decrypt,
  hash,
  encryptObject,
  decryptObject,
  generateSecureToken,
  verifySecureToken,
  ENCRYPTED_PREFIX,
  HASH_PREFIX,
  SIGNATURE_PREFIX,
};