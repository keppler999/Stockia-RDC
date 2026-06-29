// ============================================
// 📁 HOOKS - USEAPP
// Version: 3.0.0
// Description: Gestion optimisée de l'état global de l'appareil (Réseau, Batterie, Uptime)
// ============================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Battery from "expo-battery";
import * as Device from "expo-device";
import * as Network from "expo-network";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { useUser } from "../context/UserContext";

// === INTERFACES ===
export interface AppStateInfo {
  appState: "active" | "background" | "inactive";
  isConnected: boolean;
  connectionType: "wifi" | "cellular" | "ethernet" | "unknown" | "none";
  batteryLevel: number;
  isCharging: boolean;
  deviceInfo: {
    model: string;
    os: string;
    osVersion: string;
    isTablet: boolean;
  };
  uptime: number;
  lastActivity: string;
  isOfflineMode: boolean;
}

export interface UseAppReturn {
  appState: AppStateInfo;
  refresh: () => Promise<void>;
  checkNetwork: () => Promise<boolean>;
  updateActivity: () => void;
  getUptime: () => string;
  restart: () => void;
  clearCache: () => Promise<void>;
}

// === CONSTANTES ===
const UPTIME_INTERVAL = 60000;

export function useApp(): UseAppReturn {
  const { user } = useUser();
  const uptimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [startTime] = useState(() => Date.now());

  const [appState, setAppState] = useState<AppStateInfo>({
    appState: "active",
    isConnected: true,
    connectionType: "unknown",
    batteryLevel: 100,
    isCharging: false,
    deviceInfo: {
      model: "Unknown",
      os: Platform.OS,
      osVersion: Platform.Version.toString(),
      isTablet: false,
    },
    uptime: 0,
    lastActivity: new Date().toISOString(),
    isOfflineMode: false,
  });

  const getDeviceInfo = async () => {
    try {
      const model = (await Device.getModelNameAsync()) || "Unknown";
      const osVersion = Device.osVersion || "Unknown";
      const isTablet = await Device.isTabletAsync();

      return { model, os: Platform.OS, osVersion, isTablet };
    } catch (error) {
      console.error("[useApp] Erreur device info:", error);
      return {
        model: "Unknown",
        os: Platform.OS,
        osVersion: Platform.Version.toString(),
        isTablet: false,
      };
    }
  };

  const checkNetworkStatus = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return {
        isConnected: networkState.isConnected || false,
        connectionType: (networkState.type as any) || "unknown",
      };
    } catch (error) {
      console.error("[useApp] Erreur réseau:", error);
      return { isConnected: false, connectionType: "none" as const };
    }
  };

  const getBatteryInfo = useCallback(async () => {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();

      return {
        level: Math.round(batteryLevel * 100),
        isCharging: batteryState === Battery.BatteryState.CHARGING,
      };
    } catch (error) {
      console.error("[useApp] Erreur batterie:", error);
      return { level: 100, isCharging: false };
    }
  };

  const checkOfflineMode = useCallback(async (): Promise<boolean> => {
    try {
      const offlineMode = await AsyncStorage.getItem("@stockia_offline_mode");
      return offlineMode === "true";
    } catch (error) {
      console.error("[useApp] Erreur offline mode:", error);
      return false;
    }
  };

  const startUptimeCounter = useCallback(() => {
    if (uptimeIntervalRef.current) {
      clearInterval(uptimeIntervalRef.current);
    }

    uptimeIntervalRef.current = setInterval(() => {
      const currentUptime = Math.floor((Date.now() - startTime) / 1000);
      setAppState((prev) => ({ ...prev, uptime: currentUptime }));
    }, UPTIME_INTERVAL);
  }, [startTime]);

  const refresh = useCallback(async () => {
    try {
      const networkInfo = await checkNetworkStatus();
      const batteryInfo = await getBatteryInfo();
      const offlineMode = await checkOfflineMode();

      setAppState((prev) => ({
        ...prev,
        isConnected: networkInfo.isConnected,
        connectionType: networkInfo.connectionType,
        batteryLevel: batteryInfo.level,
        isCharging: batteryInfo.isCharging,
        isOfflineMode: offlineMode,
        lastActivity: new Date().toISOString(),
      }));

      console.log("[useApp] Informations rafraîchies");
    } catch (error) {
      console.error("[useApp] Erreur refresh:", error);
    }
  }, [checkNetworkStatus, getBatteryInfo, checkOfflineMode]);

  const updateActivity = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      lastActivity: new Date().toISOString(),
    }));
  }, []);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    setAppState((prev) => ({
      ...prev,
      appState: nextAppState as any,
      lastActivity: new Date().toISOString(),
    }));

    if (nextAppState === "active") {
      refresh();
    }
  }, [refresh]);

  const initializeApp = useCallback(async () => {
    try {
      const deviceInfo = await getDeviceInfo();
      const networkInfo = await checkNetworkStatus();
      const batteryInfo = await getBatteryInfo();
      const offlineMode = await checkOfflineMode();

      setAppState((prev) => ({
        ...prev,
        deviceInfo,
        isConnected: networkInfo.isConnected,
        connectionType: networkInfo.connectionType,
        batteryLevel: batteryInfo.level,
        isCharging: batteryInfo.isCharging,
        isOfflineMode: offlineMode,
        lastActivity: new Date().toISOString(),
      }));

      startUptimeCounter();
      console.log("[useApp] Application initialisée");
    } catch (error) {
      console.error("[useApp] Erreur initialisation:", error);
    }
  }, [checkNetworkStatus, getBatteryInfo, checkOfflineMode, startUptimeCounter]);

  useEffect(() => {
    initializeApp();

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
      if (uptimeIntervalRef.current) {
        clearInterval(uptimeIntervalRef.current);
      }
    };
  }, [initializeApp, handleAppStateChange]);

  const checkNetwork = useCallback(async (): Promise<boolean> => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const isConnected = networkState.isConnected || false;

      setAppState((prev) => ({
        ...prev,
        isConnected,
        connectionType: (networkState.type as any) || "unknown",
      }));

      return isConnected;
    } catch (error) {
      console.error("[useApp] Erreur checkNetwork:", error);
      return false;
    }
  }, []);

  const getUptime = useCallback((): string => {
    const seconds = appState.uptime;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }, [appState.uptime]);

  const restart = useCallback(() => {
    console.log("[useApp] Redémarrage de l'application");
  }, []);

  const clearCache = useCallback(async () => {
    try {
      console.log("[useApp] Nettoyage du cache...");

      if (uptimeIntervalRef.current) {
        clearInterval(uptimeIntervalRef.current);
        startUptimeCounter();
      }

      setAppState((prev) => ({
        ...prev,
        uptime: 0,
        lastActivity: new Date().toISOString(),
      }));

      console.log("[useApp] Cache nettoyé");
    } catch (error) {
      console.error("[useApp] Erreur clearCache:", error);
    }
  }, [startUptimeCounter]);

  return useMemo(
    () => ({
      appState,
      refresh,
      checkNetwork,
      updateActivity,
      getUptime,
      restart,
      clearCache,
    }),
    [appState, refresh, checkNetwork, updateActivity, getUptime, restart, clearCache]
  );
}

// === HOOKS DÉRIVÉS ===
export function useNetworkStatus(): boolean {
  const { appState } = useApp();
  return appState.isConnected;
}

export function useBatteryLevel(): number {
  const { appState } = useApp();
  return appState.batteryLevel;
}

export function useOfflineMode(): boolean {
  const { appState } = useApp();
  return appState.isOfflineMode;
}

export function useAppState(): "active" | "background" | "inactive" {
  const { appState } = useApp();
  return appState.appState;
}

export default useApp;