// src/types/env.d.ts

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Environnement de l'application */
      NODE_ENV: "development" | "production" | "test";
     
      /** URL de l'API préfixée pour Expo */
      EXPO_PUBLIC_API_URL?: string;
      EXPO_PUBLIC_API_TIMEOUT?: string;
      EXPO_PUBLIC_SENTRY_DSN?: string;
     
      /** Support & Contacts */
      EXPO_PUBLIC_SUPPORT_EMAIL?: string;
      EXPO_PUBLIC_SUPPORT_PHONE?: string;
      EXPO_PUBLIC_WHATSAPP_NUMBER?: string;
     
      /** Base de données */
      EXPO_PUBLIC_DB_NAME?: string;
      EXPO_PUBLIC_DB_VERSION?: string;
     
      /** Configurations par défaut */
      EXPO_PUBLIC_DEFAULT_CURRENCY?: string;
      EXPO_PUBLIC_TAX_RATE?: string;
      EXPO_PUBLIC_PRINT_PAPER_SIZE?: "58mm" | "80mm";
    }
  }
}

export interface EnvVars {
  API_URL: string;
  SENTRY_DSN?: string;
  SUPPORT_EMAIL: string;
  WHATSAPP_NUMBER: string;
  APP_ENV: "development" | "staging" | "production";
  APP_VERSION: string;
  SENTRY_ENABLED: boolean;
}

// Transforme ce fichier en module pour que 'declare global' fonctionne
export { };
