// ============================================
// 📅 FONCTIONS DE DATE ET HEURE
// ============================================

/** Formate une date */
export const formatDate = (
  date: Date | string | number,
  format: "short" | "medium" | "long" | "full" = "medium",
  locale: string = "fr-FR"
): string => {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return "Date invalide";
  }

  const options: Intl.DateTimeFormatOptions = {};
  
  switch (format) {
    case "short":
      options.day = "2-digit";
      options.month = "2-digit";
      options.year = "numeric";
      break;
    case "medium":
      options.day = "2-digit";
      options.month = "long";
      options.year = "numeric";
      break;
    case "long":
      options.weekday = "long";
      options.day = "2-digit";
      options.month = "long";
      options.year = "numeric";
      break;
    case "full":
      options.weekday = "long";
      options.day = "2-digit";
      options.month = "long";
      options.year = "numeric";
      options.hour = "2-digit";
      options.minute = "2-digit";
      break;
  }

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/** Formate une heure */
export const formatTime = (
  date: Date | string | number,
  locale: string = "fr-FR"
): string => {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return "Heure invalide";
  }

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};

/** Formate une date et heure */
export const formatDateTime = (
  date: Date | string | number,
  locale: string = "fr-FR"
): string => {
  return `${formatDate(date, "medium", locale)} à ${formatTime(date, locale)}`;
};

/** Retourne la date d'aujourd'hui au format ISO */
export const getTodayISO = (): string => {
  return new Date().toISOString().split("T")[0];
};

/** Retourne la date d'aujourd'hui formatée */
export const getTodayFormatted = (format: "short" | "medium" | "long" = "medium"): string => {
  return formatDate(new Date(), format);
};

/** Calcule la différence en jours entre deux dates */
export const daysBetween = (date1: Date | string, date2: Date | string): number => {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  const diff = d2.getTime() - d1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/** Ajoute des jours à une date */
export const addDays = (date: Date | string, days: number): Date => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const result = new Date(dateObj);
  result.setDate(result.getDate() + days);
  return result;
};

/** Vérifie si une date est valide */
export const isValidDate = (date: any): boolean => {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

/** Retourne le début du jour */
export const startOfDay = (date: Date | string): Date => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const result = new Date(dateObj);
  result.setHours(0, 0, 0, 0);
  return result;
};

/** Retourne la fin du jour */
export const endOfDay = (date: Date | string): Date => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const result = new Date(dateObj);
  result.setHours(23, 59, 59, 999);
  return result;
};

/** Vérifie si une date est aujourd'hui */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();
};

/** Vérifie si une date est dans le passé */
export const isPast = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.getTime() < Date.now();
};

/** Vérifie si une date est dans le futur */
export const isFuture = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.getTime() > Date.now();
};

/** Retourne le nombre de jours restants */
export const daysUntil = (date: Date | string): number => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const diff = dateObj.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};// ============================================
// 💰 FONCTIONS DE FORMATAGE
// ============================================

/** Formate un prix */
export const formatPrice = (
  amount: number,
  currency: string = "USD",
  locale: string = "fr-FR"
): string => {
  if (isNaN(amount)) {
    return `0,00 ${currency}`;
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/** Formate un nombre */
export const formatNumber = (
  number: number,
  decimals: number = 0,
  locale: string = "fr-FR"
): string => {
  if (isNaN(number)) {
    return "0";
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/** Tronque un nombre */
export const truncateNumber = (number: number, max: number): number => {
  if (number > max) return max;
  if (number < -max) return -max;
  return number;
};

/** Arrondit un nombre */
export const roundNumber = (number: number, decimals: number = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
};

/** Convertit en pourcentage */
export const toPercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/** Formate un pourcentage */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// ============================================
// 🔤 FONCTIONS DE TEXTE
// ============================================

/** Capitalise la première lettre */
export const capitalize = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/** Capitalise chaque mot */
export const capitalizeWords = (text: string): string => {
  if (!text) return "";
  return text.split(" ").map(word => capitalize(word)).join(" ");
};

/** Tronque un texte */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/** Supprime les accents */
export const removeAccents = (text: string): string => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

/** Génère un slug */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/** Vérifie si une chaîne est vide */
export const isEmptyString = (text: string | null | undefined): boolean => {
  return !text || text.trim().length === 0;
};

/** Extrait les initiales */
export const getInitials = (name: string, max: number = 2): string => {
  if (!name) return "";
  const words = name.trim().split(" ");
  const initials = words.map(word => word.charAt(0).toUpperCase());
  return initials.slice(0, max).join("");
};

/** Compte les mots */
export const wordCount = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};// ============================================
// ✅ FONCTIONS DE VALIDATION
// ============================================

/** Vérifie si une valeur est un nombre valide */
export const isValidNumber = (value: any): boolean => {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
};

/** Vérifie si une chaîne est un email valide */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/** Vérifie si une chaîne est un téléphone valide */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[0-9]{8,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

/** Vérifie si un mot de passe est fort */
export const isStrongPassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

/** Vérifie si une chaîne est un code-barres valide */
export const isValidBarcode = (barcode: string): boolean => {
  return /^[0-9]{8,13}$/.test(barcode);
};

/** Vérifie si une URL est valide */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/** Vérifie si une chaîne contient uniquement des lettres */
export const isAlpha = (text: string): boolean => {
  return /^[a-zA-Z\s]+$/.test(text);
};

/** Vérifie si une chaîne contient uniquement des chiffres */
export const isNumeric = (text: string): boolean => {
  return /^[0-9]+$/.test(text);
};

/** Vérifie si une chaîne est un UUID valide */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// ============================================
// 📊 FONCTIONS DE CALCUL
// ============================================

/** Calcule le pourcentage d'augmentation */
export const calculateIncrease = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/** Calcule la moyenne */
export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
};

/** Calcule la médiane */
export const calculateMedian = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
};

/** Calcule l'écart-type */
export const calculateStandardDeviation = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const mean = calculateAverage(numbers);
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
  const avgSquaredDiff = calculateAverage(squaredDiffs);
  return Math.sqrt(avgSquaredDiff);
};

/** Calcule la TVA */
export const calculateVAT = (amount: number, rate: number = 18): number => {
  return amount * (rate / 100);
};

/** Calcule le montant TTC */
export const calculateTotalWithVAT = (amount: number, rate: number = 18): number => {
  return amount + calculateVAT(amount, rate);
};// ============================================
// 🎲 FONCTIONS DE GÉNÉRATION
// ============================================

/** Génère un ID unique */
export const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
};

/** Génère un nombre aléatoire */
export const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/** Génère une couleur aléatoire */
export const randomColor = (): string => {
  const colors = [
    "#1565C0", "#2E7D32", "#F57C00", "#C62828",
    "#6A1B9A", "#00838F", "#E65100", "#1A237E",
    "#4CAF50", "#FF6F00", "#AD1457", "#004D40",
  ];
  return colors[randomNumber(0, colors.length - 1)];
};

/** Génère un code-barres aléatoire */
export const generateBarcode = (): string => {
  let barcode = "";
  for (let i = 0; i < 13; i++) {
    barcode += randomNumber(0, 9).toString();
  }
  return barcode;
};

/** Génère un numéro de facture */
export const generateInvoiceNumber = (prefix: string = "FC"): string => {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const random = String(randomNumber(1, 9999)).padStart(4, "0");
  return `${prefix}-${dateStr}-${random}`;
};

/** Génère un token aléatoire */
export const generateToken = (length: number = 32): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars[randomNumber(0, chars.length - 1)];
  }
  return token;
};

/** Génère un mot de passe aléatoire */
export const generatePassword = (length: number = 12): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specials = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const all = uppercase + lowercase + numbers + specials;

  let password = "";
  password += uppercase[randomNumber(0, uppercase.length - 1)];
  password += lowercase[randomNumber(0, lowercase.length - 1)];
  password += numbers[randomNumber(0, numbers.length - 1)];
  password += specials[randomNumber(0, specials.length - 1)];

  for (let i = 4; i < length; i++) {
    password += all[randomNumber(0, all.length - 1)];
  }

  return password.split("").sort(() => Math.random() - 0.5).join("");
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  getTodayISO,
  getTodayFormatted,
  daysBetween,
  addDays,
  isValidDate,
  startOfDay,
  endOfDay,
  isToday,
  isPast,
  isFuture,
  daysUntil,
  formatPrice,
  formatNumber,
  truncateNumber,
  roundNumber,
  toPercentage,
  formatPercentage,
  capitalize,
  capitalizeWords,
  truncateText,
  removeAccents,
  generateSlug,
  isEmptyString,
  getInitials,
  wordCount,
  isValidNumber,
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  isValidBarcode,
  isValidUrl,
  isAlpha,
  isNumeric,
  isValidUUID,
  calculateIncrease,
  calculateAverage,
  calculateMedian,
  calculateStandardDeviation,
  calculateVAT,
  calculateTotalWithVAT,
  generateId,
  randomNumber,
  randomColor,
  generateBarcode,
  generateInvoiceNumber,
  generateToken,
  generatePassword,
};