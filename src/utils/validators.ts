// ============================================
// ✅ VALIDATIONS DE BASE
// ============================================

/**
 * Vérifie si une valeur est définie (non null et non undefined)
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

/**
 * Vérifie si une valeur est une chaîne non vide
 */
export const isNonEmptyString = (value: any): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

/**
 * Vérifie si une valeur est un nombre valide
 */
export const isValidNumber = (value: any): value is number => {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
};

/**
 * Vérifie si une valeur est un entier valide
 */
export const isValidInteger = (value: any): value is number => {
  return isValidNumber(value) && Number.isInteger(value) && value >= 0;
};

/**
 * Vérifie si une valeur est un booléen
 */
export const isValidBoolean = (value: any): value is boolean => {
  return typeof value === "boolean";
};

/**
 * Vérifie si une valeur est un tableau non vide
 */
export const isNonEmptyArray = <T>(value: any): value is T[] => {
  return Array.isArray(value) && value.length > 0;
};

/**
 * Vérifie si une valeur est un objet non null
 */
export const isObject = (value: any): value is Record<string, any> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Vérifie si une valeur est une fonction
 */
export const isFunction = (value: any): value is Function => {
  return typeof value === "function";
};

// ============================================
// 📧 VALIDATIONS D'EMAIL
// ============================================

/**
 * Vérifie si une chaîne est un email valide
 */
export const isValidEmail = (email: string): boolean => {
  if (!isNonEmptyString(email)) return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

/**
 * Vérifie si une chaîne est un email professionnel
 */
export const isProfessionalEmail = (email: string): boolean => {
  if (!isValidEmail(email)) return false;

  const domain = email.split("@")[1];
  const freeDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
  ];
  return !freeDomains.includes(domain);
};

// ============================================
// 📱 VALIDATIONS DE TÉLÉPHONE
// ============================================

/**
 * Vérifie si une chaîne est un numéro de téléphone valide
 */
export const isValidPhone = (phone: string): boolean => {
  if (!isNonEmptyString(phone)) return false;

  // Supprime les espaces, tirets et parenthèses
  const clean = phone.replace(/[\s\-()]/g, "");

  // Accepte les formats: +243812345678 ou 0812345678 ou 243812345678
  const phoneRegex = /^(\+?\d{1,3})?(\d{9,12})$/;
  return phoneRegex.test(clean) && clean.length >= 8;
};

/**
 * Vérifie si un numéro est un numéro congolais
 */
export const isCongolesePhone = (phone: string): boolean => {
  if (!isValidPhone(phone)) return false;

  const clean = phone.replace(/[\s\-()]/g, "");
  // Formats congolais: +243..., 243..., 08...
  return /^(\+243|243|0[8])\d{9}$/.test(clean);
}; // ============================================
// 🔐 VALIDATIONS DE MOT DE PASSE
// ============================================

/**
 * Vérifie si un mot de passe est valide (minimum 6 caractères)
 */
export const isValidPassword = (password: string): boolean => {
  return isNonEmptyString(password) && password.length >= 6;
};

/**
 * Vérifie si un mot de passe est fort
 */
export const isStrongPassword = (password: string): boolean => {
  if (!isNonEmptyString(password) || password.length < 8) return false;

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const score = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(
    Boolean,
  ).length;
  return score >= 3 && password.length >= 8;
};

/**
 * Vérifie si deux mots de passe correspondent
 */
export const passwordsMatch = (
  password: string,
  confirmPassword: string,
): boolean => {
  return password === confirmPassword;
};

/**
 * Retourne les critères de force d'un mot de passe
 */
export const getPasswordStrength = (
  password: string,
): {
  score: number;
  label: "Faible" | "Moyen" | "Fort" | "Très fort";
  details: string[];
} => {
  if (!isNonEmptyString(password)) {
    return { score: 0, label: "Faible", details: ["Mot de passe requis"] };
  }

  const details: string[] = [];
  let score = 0;

  // Longueur
  if (password.length >= 8) {
    score++;
  } else {
    details.push("Au moins 8 caractères");
  }

  // Lettres majuscules
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    details.push("Au moins une majuscule");
  }

  // Lettres minuscules
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    details.push("Au moins une minuscule");
  }

  // Chiffres
  if (/[0-9]/.test(password)) {
    score++;
  } else {
    details.push("Au moins un chiffre");
  }

  // Caractères spéciaux
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    details.push("Au moins un caractère spécial");
  }

  // Score final
  const labels = ["Faible", "Faible", "Moyen", "Fort", "Très fort"];
  const label = labels[Math.min(score, 4)] as
    | "Faible"
    | "Moyen"
    | "Fort"
    | "Très fort";

  return { score, label, details };
};

// ============================================
// 📋 VALIDATIONS DE FORMULAIRE
// ============================================

/**
 * Vérifie si un champ est requis
 */
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Vérifie la longueur minimale d'une chaîne
 */
export const minLength = (value: string, min: number): boolean => {
  return isNonEmptyString(value) && value.length >= min;
};

/**
 * Vérifie la longueur maximale d'une chaîne
 */
export const maxLength = (value: string, max: number): boolean => {
  return isNonEmptyString(value) && value.length <= max;
};

/**
 * Vérifie qu'une valeur est dans une plage
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return isValidNumber(value) && value >= min && value <= max;
};

/**
 * Vérifie qu'une valeur est dans une liste
 */
export const isInList = <T>(value: T, list: T[]): boolean => {
  return list.includes(value);
}; // ============================================
// 📦 VALIDATIONS DE CODES
// ============================================

/**
 * Vérifie si une chaîne est un code-barres valide
 */
export const isValidBarcode = (barcode: string): boolean => {
  if (!isNonEmptyString(barcode)) return false;

  // EAN-8 (8 chiffres) ou EAN-13 (13 chiffres)
  const clean = barcode.replace(/\s/g, "");
  return /^[0-9]{8,13}$/.test(clean);
};

/**
 * Vérifie si une chaîne est un code produit valide
 */
export const isValidProductCode = (code: string): boolean => {
  if (!isNonEmptyString(code)) return false;

  const clean = code.trim();
  // Format: PROD-XXXXX ou PRD-XXXX
  return /^PR[D]{0,1}-[A-Z0-9]{4,8}$/.test(clean);
};

/**
 * Vérifie si une chaîne est un numéro de facture valide
 */
export const isValidInvoiceNumber = (invoice: string): boolean => {
  if (!isNonEmptyString(invoice)) return false;

  const clean = invoice.trim();
  // Format: FC-YYYYMMDD-XXXX
  return /^FC-\d{8}-\d{4}$/.test(clean);
};

/**
 * Vérifie si une chaîne est un code de licence valide
 */
export const isValidLicenceKey = (key: string): boolean => {
  if (!isNonEmptyString(key)) return false;

  const clean = key.trim();
  // Format: STK-XXXX-XXXX-XXXX
  return /^STK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(clean);
};

/**
 * Vérifie si une chaîne est un UUID valide
 */
export const isValidUUID = (uuid: string): boolean => {
  if (!isNonEmptyString(uuid)) return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid.trim());
};

// ============================================
// 🌐 VALIDATIONS D'URL
// ============================================

/**
 * Vérifie si une chaîne est une URL valide
 */
export const isValidUrl = (url: string): boolean => {
  if (!isNonEmptyString(url)) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Vérifie si une chaîne est une URL HTTPS
 */
export const isHttpsUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// ============================================
// 📁 VALIDATIONS DE FICHIERS
// ============================================

/**
 * Vérifie si une extension de fichier est autorisée
 */
export const isValidFileExtension = (
  filename: string,
  allowedExtensions: string[],
): boolean => {
  if (!isNonEmptyString(filename)) return false;

  const extension = filename.split(".").pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
};

/**
 * Vérifie si une taille de fichier est valide (en octets)
 */
export const isValidFileSize = (size: number, maxSize: number): boolean => {
  return isValidNumber(size) && size > 0 && size <= maxSize;
};

/**
 * Vérifie si un nom de fichier est valide
 */
export const isValidFilename = (filename: string): boolean => {
  if (!isNonEmptyString(filename)) return false;

  // Caractères interdits: / \ : * ? " < > |
  const invalidChars = /[\/\\:*?"<>|]/;
  return !invalidChars.test(filename);
}; // ============================================
// 📊 VALIDATIONS MÉTIER
// ============================================

/**
 * Vérifie si un produit a un stock suffisant
 */
export const hasSufficientStock = (
  currentStock: number,
  requestedQuantity: number,
): boolean => {
  return (
    isValidInteger(currentStock) &&
    isValidInteger(requestedQuantity) &&
    requestedQuantity > 0 &&
    currentStock >= requestedQuantity
  );
};

/**
 * Vérifie si un prix est valide
 */
export const isValidPrice = (price: number): boolean => {
  return isValidNumber(price) && price > 0 && price < 1000000;
};

/**
 * Vérifie si une remise est valide
 */
export const isValidDiscount = (
  discount: number,
  maxDiscount: number = 100,
): boolean => {
  return isValidNumber(discount) && discount >= 0 && discount <= maxDiscount;
};

/**
 * Vérifie si une quantité est valide
 */
export const isValidQuantity = (quantity: number): boolean => {
  return isValidInteger(quantity) && quantity > 0 && quantity < 100000;
};

/**
 * Vérifie si un montant de paiement est suffisant
 */
export const isSufficientPayment = (
  amountPaid: number,
  total: number,
): boolean => {
  return (
    isValidNumber(amountPaid) && isValidNumber(total) && amountPaid >= total
  );
};

/**
 * Vérifie si une date d'expiration est valide (non expirée)
 */
export const isNotExpired = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isValidDate(dateObj) && dateObj > new Date();
};

/**
 * Vérifie si une date est dans une plage valide
 */
export const isDateInRange = (
  date: Date | string,
  start: Date | string,
  end: Date | string,
): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const startObj = typeof start === "string" ? new Date(start) : start;
  const endObj = typeof end === "string" ? new Date(end) : end;

  return (
    isValidDate(dateObj) &&
    isValidDate(startObj) &&
    isValidDate(endObj) &&
    dateObj >= startObj &&
    dateObj <= endObj
  );
};

// ============================================
// 🔍 VALIDATIONS AVANCÉES
// ============================================

/**
 * Valide un objet avec un schéma personnalisé
 */
export const validateObject = <T extends Record<string, any>>(
  obj: T,
  schema: Record<keyof T, (value: any) => boolean>,
): { valid: boolean; errors: Partial<Record<keyof T, string>> } => {
  const errors: Partial<Record<keyof T, string>> = {};
  let valid = true;

  for (const key in schema) {
    if (schema.hasOwnProperty(key)) {
      const isValid = schema[key](obj[key]);
      if (!isValid) {
        errors[key] = `Champ ${String(key)} invalide`;
        valid = false;
      }
    }
  }

  return { valid, errors };
};

/**
 * Crée un validateur de chaîne avec des règles
 */
export const createStringValidator = (rules: {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
}) => {
  return (value: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (rules.required && !isNonEmptyString(value)) {
      errors.push("Ce champ est requis");
    }

    if (rules.min && !minLength(value, rules.min)) {
      errors.push(`Minimum ${rules.min} caractères`);
    }

    if (rules.max && !maxLength(value, rules.max)) {
      errors.push(`Maximum ${rules.max} caractères`);
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push("Format invalide");
    }

    if (rules.custom && !rules.custom(value)) {
      errors.push("Valeur invalide");
    }

    return { valid: errors.length === 0, errors };
  };
};

/**
 * Crée un validateur de nombre avec des règles
 */
export const createNumberValidator = (rules: {
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
  custom?: (value: number) => boolean;
}) => {
  return (value: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (rules.required && !isValidNumber(value)) {
      errors.push("Ce champ est requis");
    }

    if (rules.min !== undefined && value < rules.min) {
      errors.push(`Minimum ${rules.min}`);
    }

    if (rules.max !== undefined && value > rules.max) {
      errors.push(`Maximum ${rules.max}`);
    }

    if (rules.integer && !Number.isInteger(value)) {
      errors.push("Doit être un nombre entier");
    }

    if (rules.custom && !rules.custom(value)) {
      errors.push("Valeur invalide");
    }

    return { valid: errors.length === 0, errors };
  };
}; // ============================================
// 📝 VALIDATIONS DE FORMULAIRE
// ============================================

/**
 * Schéma de validation pour le formulaire de connexion
 */
export const validateLoginForm = (data: {
  username: string;
  password: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!isNonEmptyString(data.username)) {
    errors.username = "Identifiant requis";
  }

  if (!isNonEmptyString(data.password)) {
    errors.password = "Mot de passe requis";
  } else if (data.password.length < 6) {
    errors.password = "Minimum 6 caractères";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Schéma de validation pour le formulaire d'inscription
 */
export const validateRegisterForm = (data: {
  nom: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!isNonEmptyString(data.nom)) {
    errors.nom = "Nom requis";
  }

  if (!isNonEmptyString(data.username) || data.username.length < 3) {
    errors.username = "Identifiant requis (min 3 caractères)";
  }

  if (!isValidEmail(data.email)) {
    errors.email = "Email invalide";
  }

  if (!isValidPassword(data.password)) {
    errors.password = "Mot de passe requis (min 6 caractères)";
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Les mots de passe ne correspondent pas";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Schéma de validation pour le formulaire de produit
 */
export const validateProductForm = (data: {
  nom: string;
  categorie: string;
  prix_achat: string;
  prix_view: string;
  stock_actuel: string;
  stock_minimum: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!isNonEmptyString(data.nom)) {
    errors.nom = "Nom du produit requis";
  }

  if (!isNonEmptyString(data.categorie)) {
    errors.categorie = "Catégorie requise";
  }

  const prixAchat = parseFloat(data.prix_achat);
  if (isNaN(prixAchat) || prixAchat <= 0) {
    errors.prix_achat = "Prix d'achat invalide";
  }

  const prixView = parseFloat(data.prix_view);
  if (isNaN(prixView) || prixView <= 0) {
    errors.prix_view = "Prix de vente invalide";
  }

  if (prixAchat > prixView) {
    errors.prix_view = "Le prix de vente doit être supérieur au prix d'achat";
  }

  const stock = parseInt(data.stock_actuel);
  if (isNaN(stock) || stock < 0) {
    errors.stock_actuel = "Stock invalide";
  }

  const minStock = parseInt(data.stock_minimum);
  if (isNaN(minStock) || minStock < 0) {
    errors.stock_minimum = "Stock minimum invalide";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Schéma de validation pour le formulaire de client
 */
export const validateClientForm = (data: {
  nom: string;
  telephone: string;
  email: string;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!isNonEmptyString(data.nom)) {
    errors.nom = "Nom du client requis";
  }

  if (data.telephone && !isValidPhone(data.telephone)) {
    errors.telephone = "Numéro de téléphone invalide";
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.email = "Email invalide";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

// ============================================
// 📦 EXPORT PRINCIPAL
// ============================================

export default {
  // Validations de base
  isDefined,
  isNonEmptyString,
  isValidNumber,
  isValidInteger,
  isValidBoolean,
  isNonEmptyArray,
  isObject,
  isFunction,

  // Validations d'email
  isValidEmail,
  isProfessionalEmail,

  // Validations de téléphone
  isValidPhone,
  isCongolesePhone,

  // Validations de mot de passe
  isValidPassword,
  isStrongPassword,
  passwordsMatch,
  getPasswordStrength,

  // Validations de formulaire
  isRequired,
  minLength,
  maxLength,
  isInRange,
  isInList,

  // Validations de codes
  isValidBarcode,
  isValidProductCode,
  isValidInvoiceNumber,
  isValidLicenceKey,
  isValidUUID,

  // Validations d'URL
  isValidUrl,
  isHttpsUrl,

  // Validations de fichiers
  isValidFileExtension,
  isValidFileSize,
  isValidFilename,

  // Validations métier
  hasSufficientStock,
  isValidPrice,
  isValidDiscount,
  isValidQuantity,
  isSufficientPayment,
  isNotExpired,
  isDateInRange,

  // Validations avancées
  validateObject,
  createStringValidator,
  createNumberValidator,

  // Validations de formulaire
  validateLoginForm,
  validateRegisterForm,
  validateProductForm,
  validateClientForm,
};
