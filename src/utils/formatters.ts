// ============================================
// 🔤 FORMATAGE DE TEXTE
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

/** Met en minuscules */
export const toLowerCase = (text: string): string => {
  if (!text) return "";
  return text.toLowerCase();
};

/** Met en majuscules */
export const toUpperCase = (text: string): string => {
  if (!text) return "";
  return text.toUpperCase();
};

/** Tronque un texte */
export const truncateText = (text: string, maxLength: number = 50, suffix: string = "..."): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
};

/** Tronque au milieu */
export const truncateMiddle = (text: string, maxLength: number = 20): string => {
  if (!text || text.length <= maxLength) return text;
  const half = Math.floor((maxLength - 3) / 2);
  return text.substring(0, half) + "..." + text.substring(text.length - half);
};

/** Supprime les accents */
export const removeAccents = (text: string): string => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

/** Supprime les espaces superflus */
export const trimText = (text: string): string => {
  if (!text) return "";
  return text.trim().replace(/\s+/g, " ");
};

/** Génère un slug */
export const generateSlug = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/** Extrait les initiales */
export const getInitials = (name: string, max: number = 2): string => {
  if (!name) return "";
  const words = name.trim().split(" ");
  const initials = words.map(word => word.charAt(0).toUpperCase());
  return initials.slice(0, max).join("");
};

/** Formate un nom complet */
export const formatFullName = (firstName: string, lastName: string): string => {
  return `${capitalize(firstName)} ${capitalize(lastName)}`.trim();
};

/** Masque une partie d'une chaîne */
export const maskText = (text: string, visibleStart: number = 2, visibleEnd: number = 2, maskChar: string = "*"): string => {
  if (!text || text.length <= visibleStart + visibleEnd) return text;
  const start = text.substring(0, visibleStart);
  const end = text.substring(text.length - visibleEnd);
  const masked = maskChar.repeat(text.length - visibleStart - visibleEnd);
  return start + masked + end;
};/** Formate un nombre */
export const formatNumber = (number: number, decimals: number = 0, locale: string = "fr-FR"): string => {
  if (!isFinite(number)) return "0";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/** Formate un nombre compact (K, M, B) */
export const formatCompactNumber = (number: number, locale: string = "fr-FR"): string => {
  if (!isFinite(number)) return "0";
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
  }).format(number);
};

/** Formate un nombre avec suffixe */
export const formatNumberWithSuffix = (number: number): string => {
  if (!isFinite(number)) return "0";
  if (number >= 1e9) return (number / 1e9).toFixed(1) + "B";
  if (number >= 1e6) return (number / 1e6).toFixed(1) + "M";
  if (number >= 1e3) return (number / 1e3).toFixed(1) + "K";
  return number.toString();
};

/** Formate un pourcentage */
export const formatPercentage = (value: number, decimals: number = 1, locale: string = "fr-FR"): string => {
  if (!isFinite(value)) return "0%";
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/** Arrondit un nombre */
export const roundNumber = (number: number, decimals: number = 2): number => {
  if (!isFinite(number)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
};

/** Tronque un nombre */
export const truncateNumber = (number: number, decimals: number = 2): number => {
  if (!isFinite(number)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.trunc(number * factor) / factor;
};

/** Formate une durée */
export const formatDuration = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return "0s";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

/** Formate une taille de fichier */
export const formatFileSize = (bytes: number): string => {
  if (!isFinite(bytes) || bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(2)} ${sizes[i]}`;
};/** Formate un prix */
export const formatPrice = (
  amount: number,
  currency: string = "USD",
  locale: string = "fr-FR"
): string => {
  if (!isFinite(amount)) return `0,00 ${currency}`;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/** Formate un prix sans devise */
export const formatPriceOnly = (amount: number, locale: string = "fr-FR"): string => {
  if (!isFinite(amount)) return "0,00";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/** Formate un prix avec marge */
export const formatPriceWithMargin = (
  price: number,
  purchasePrice: number,
  currency: string = "USD",
  locale: string = "fr-FR"
): string => {
  const margin = purchasePrice > 0 ? ((price - purchasePrice) / purchasePrice) * 100 : 0;
  return `${formatPrice(price, currency, locale)} (marge: ${margin.toFixed(1)}%)`;
};

/** Formate un prix avec remise - retourne un objet */
export const formatPriceWithDiscount = (
  originalPrice: number,
  discountPercentage: number,
  currency: string = "USD",
  locale: string = "fr-FR"
): {
  original: string;
  discounted: string;
  discount: string;
  savings: string;
} => {
  const discountedPrice = originalPrice * (1 - discountPercentage / 100);
  return {
    original: formatPrice(originalPrice, currency, locale),
    discounted: formatPrice(discountedPrice, currency, locale),
    discount: `${discountPercentage}%`,
    savings: formatPrice(originalPrice - discountedPrice, currency, locale),
  };
};

/** Formate un prix avec TVA - retourne un objet */
export const formatPriceWithTax = (
  amountHT: number,
  taxRate: number = 18,
  currency: string = "USD",
  locale: string = "fr-FR"
): {
  ht: string;
  tva: string;
  ttc: string;
} => {
  const tax = amountHT * (taxRate / 100);
  const amountTTC = amountHT + tax;
  return {
    ht: formatPrice(amountHT, currency, locale),
    tva: formatPrice(tax, currency, locale),
    ttc: formatPrice(amountTTC, currency, locale),
  };
};/** Formate une date */
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
  format: "short" | "long" = "short",
  locale: string = "fr-FR"
): string => {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return "Heure invalide";
  }

  const options: Intl.DateTimeFormatOptions = {};
  
  switch (format) {
    case "short":
      options.hour = "2-digit";
      options.minute = "2-digit";
      break;
    case "long":
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.second = "2-digit";
      break;
  }

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/** Formate une date et heure */
export const formatDateTime = (
  date: Date | string | number,
  locale: string = "fr-FR"
): string => {
  return `${formatDate(date, "medium", locale)} à ${formatTime(date, "short", locale)}`;
};

/** Formate une date relative (ex: "il y a 2 jours") */
export const formatRelativeTime = (
  date: Date | string | number,
  locale: string = "fr-FR"
): string => {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return "Date invalide";
  }

  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (seconds < 60) return rtf.format(-seconds, "second");
  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (hours < 24) return rtf.format(-hours, "hour");
  if (days < 30) return rtf.format(-days, "day");
  if (months < 12) return rtf.format(-months, "month");
  return rtf.format(-years, "year");
};

/** Formate une date en ISO */
export const formatISO = (date: Date | string | number): string => {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return "";
  }

  return dateObj.toISOString();
};/** Formate un téléphone */
export const formatPhone = (phone: string, locale: string = "fr-FR"): string => {
  if (!phone) return "";
  const clean = phone.replace(/[^0-9+]/g, "");
  if (locale === "fr-FR") {
    if (clean.startsWith("+") && clean.length === 13) {
      const parts = clean.match(/.{1,2}/g);
      return parts ? parts.join(" ") : clean;
    }
    if (clean.length === 10) {
      const parts = clean.match(/.{2}/g);
      return parts ? parts.join(" ") : clean;
    }
  }
  return clean;
};

/** Formate une carte bancaire */
export const formatCreditCard = (number: string): string => {
  if (!number) return "";
  const clean = number.replace(/\s/g, "");
  const parts = clean.match(/.{4}/g);
  return parts ? parts.join(" ") : clean;
};

/** Formate une adresse */
export const formatAddress = (
  address: string,
  city: string,
  postalCode: string,
  country: string,
  locale: string = "fr-FR"
): string => {
  const parts = [address.trim()];
  if (postalCode) parts.push(`${postalCode} ${city}`.trim());
  else if (city) parts.push(city);
  if (country) parts.push(country);
  return parts.join(", ");
};

/** Formate un statut */
export const formatStatus = (status: string, labels?: Record<string, string>): string => {
  if (labels && labels[status]) {
    return labels[status];
  }
  return status
    .toLowerCase()
    .split("_")
    .map(word => capitalize(word))
    .join(" ");
};

/** Formate une liste */
export const formatList = (
  items: string[],
  separator: string = ", ",
  lastSeparator: string = " et "
): string => {
  if (!items || items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(lastSeparator);
  return items.slice(0, -1).join(separator) + lastSeparator + items[items.length - 1];
};

/** Formate des paramètres en URL */
export const formatQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
};

/** Formate un ID de transaction */
export const formatTransactionId = (id: string | number, prefix: string = "TXN"): string => {
  return `${prefix}-${String(id).padStart(6, "0")}`;
};

/** Formate un email pour affichage */
export const formatEmail = (email: string): string => {
  if (!email) return "";
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  return `${parts[0].substring(0, 2)}...@${parts[1]}`;
};

export default {
  // Texte
  capitalize,
  capitalizeWords,
  toLowerCase,
  toUpperCase,
  truncateText,
  truncateMiddle,
  removeAccents,
  trimText,
  generateSlug,
  getInitials,
  formatFullName,
  maskText,

  // Nombres
  formatNumber,
  formatCompactNumber,
  formatNumberWithSuffix,
  formatPercentage,
  roundNumber,
  truncateNumber,
  formatDuration,
  formatFileSize,

  // Prix
  formatPrice,
  formatPriceOnly,
  formatPriceWithMargin,
  formatPriceWithDiscount,
  formatPriceWithTax,

  // Date
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatISO,

  // Avancé
  formatPhone,
  formatCreditCard,
  formatAddress,
  formatStatus,
  formatList,
  formatQueryParams,
  formatTransactionId,
  formatEmail,
};