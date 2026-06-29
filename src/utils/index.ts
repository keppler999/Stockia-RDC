// ============================================
// 📁 UTILS - EXPORT CENTRALISÉ ET NETTOYÉ
// ============================================

import * as constants from "./constants";
import * as encryption from "./encryption";
import * as errors from "./errors";
import * as formatters from "./formatters";
import * as helpers from "./helpers";
import * as permissions from "./permissions";
import * as validators from "./validators";

// 🚀 Ré-exportation globale et automatique de tous les modules
export * from "./constants";
export * from "./encryption";
export * from "./errors";
export * from "./formatters";
export * from "./helpers";
export * from "./permissions";
export * from "./types";
export * from "./validators";

// === UTILITAIRES GÉNÉRAUX CENTRALISÉS ===
export const Utils = {
  constants: {
    APP_NAME: constants.APP_NAME,
    APP_FULL_NAME: constants.APP_FULL_NAME,
    APP_VERSION: constants.APP_VERSION,
    COLORS: constants.COLORS,
    SIZES: constants.SIZES,
    ROLES: constants.ROLES,
    DEFAULTS: constants.DEFAULTS,
    PLATFORM: constants.PLATFORM,
    STORAGE_KEYS: constants.STORAGE_KEYS,
  },
  helpers: {
    formatDate: helpers.formatDate,
    formatTime: helpers.formatTime,
    formatPrice: helpers.formatPrice,
    capitalize: helpers.capitalize,
    generateSlug: helpers.generateSlug,
    isValidEmail: helpers.isValidEmail,
    isValidPhone: helpers.isValidPhone,
    isStrongPassword: helpers.isStrongPassword,
  },
  validators: {
    isValidEmail: validators.isValidEmail,
    isValidPhone: validators.isValidPhone,
    isStrongPassword: validators.isStrongPassword,
    validateLoginForm: validators.validateLoginForm,
    validateProductForm: validators.validateProductForm,
  },
  formatters: {
    formatPrice: formatters.formatPrice,
    formatDate: formatters.formatDate,
    formatNumber: formatters.formatNumber,
    capitalize: formatters.capitalize,
  },
  permissions: {
    hasPermission: permissions.hasPermission,
    userHasPermission: permissions.userHasPermission,
    isAdmin: permissions.isAdmin,
    isManagement: permissions.isManagement,
    ROLE_PERMISSIONS: permissions.ROLE_PERMISSIONS,
  },
  encryption: {
    encrypt: encryption.encrypt,
    decrypt: encryption.decrypt,
    hash: encryption.hash,
    encryptObject: encryption.encryptObject,
    decryptObject: encryption.decryptObject,
    generateSecureToken: encryption.generateSecureToken,
  },
  errors: {
    ERROR_CODES: errors.ERROR_CODES,
    AppError: errors.AppError,
    errorHandler: errors.errorHandler,
    isNetworkError: errors.isNetworkError,
    isAuthError: errors.isAuthError,
    isValidationError: errors.isValidationError,
    formatUserError: errors.formatUserError,
  },
};

// === EXPORT PAR DÉFAUT ===
export default {
  constants,
  helpers,
  validators,
  formatters,
  permissions,
  encryption,
  errors,
  Utils,
  
  // Raccourcis directs
  formatDate: helpers.formatDate,
  formatTime: helpers.formatTime,
  formatDateTime: helpers.formatDateTime,
  formatPrice: helpers.formatPrice,
  formatNumber: helpers.formatNumber,
  capitalize: helpers.capitalize,
  generateSlug: helpers.generateSlug,
  isValidEmail: helpers.isValidEmail,
  isValidPhone: helpers.isValidPhone,
  isStrongPassword: helpers.isStrongPassword,
  validateLoginForm: validators.validateLoginForm,
  hasPermission: permissions.hasPermission,
  encrypt: encryption.encrypt,
  decrypt: encryption.decrypt,
  hash: encryption.hash,
};