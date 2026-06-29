// ============================================
// 📁 HOOKS - USEBLUETOOTH
// Version: 3.0.0
// Description: Pont d'appairage Bluetooth natif pour imprimantes thermiques ESC/POS
// ============================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Vibration } from "react-native";
import { BluetoothManager } from "react-native-bluetooth-escpos-printer";

// === INTERFACES ===
export interface BluetoothDevice {
  address: string;
  name: string;
  type?: string;
  connected?: boolean;
  rssi?: number;
  saved?: boolean;
}

export interface BluetoothState {
  isAvailable: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isScanning: boolean;
  devices: BluetoothDevice[];
  connectedDevice: BluetoothDevice | null;
  lastDevice: BluetoothDevice | null;
  error: string | null;
  savedDevices: BluetoothDevice[];
}

export interface BluetoothScanOptions {
  timeout?: number;
  nameFilter?: string;
  typeFilter?: string[];
}

export interface UseBluetoothReturn {
  state: BluetoothState;
  scanDevices: (options?: BluetoothScanOptions) => Promise<BluetoothDevice[]>;
  connect: (address: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  saveDevice: (device: BluetoothDevice) => Promise<void>;
  removeDevice: (address: string) => Promise<void>;
  getSavedDevices: () => Promise<BluetoothDevice[]>;
  reset: () => Promise<void>;
}

// === CONSTANTES ===
const STORAGE_KEY_DEVICES = "@stockia_bluetooth_devices";
const STORAGE_KEY_LAST_DEVICE = "@stockia_bluetooth_last_device";
const DEFAULT_SCAN_TIMEOUT = 10000;

export function useBluetooth(): UseBluetoothReturn {
  const [state, setState] = useState<BluetoothState>({
    isAvailable: false,
    isConnected: false,
    isConnecting: false,
    isScanning: false,
    devices: [],
    connectedDevice: null,
    lastDevice: null,
    error: null,
    savedDevices: [],
  });

  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // === CHARGER LES APPAREILS SAUVEGARDÉS ===
  const loadSavedDevices = useCallback(async () => {
    try {
      const devicesData = await AsyncStorage.getItem(STORAGE_KEY_DEVICES);
      const lastDeviceData = await AsyncStorage.getItem(STORAGE_KEY_LAST_DEVICE);

      if (!isMountedRef.current) return;

      setState((prev) => ({
        ...prev,
        savedDevices: devicesData ? JSON.parse(devicesData) : [],
        lastDevice: lastDeviceData ? JSON.parse(lastDeviceData) : null,
      }));
    } catch (error) {
      console.error("[useBluetooth] Erreur chargement appareils:", error);
    }
  }, []);

  // === VÉRIFICATION DE LA CONNEXION ===
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const isConnected = await BluetoothManager.isConnected();

      if (!isMountedRef.current) return isConnected;

      if (isConnected) {
        const device = await BluetoothManager.getConnectedDevice();
        const connectedDevice: BluetoothDevice = {
          address: device.address,
          name: device.name || "Imprimante",
          connected: true,
        };

        setState((prev) => ({ ...prev, isConnected: true, connectedDevice }));
        return true;
      }

      setState((prev) => ({ ...prev, isConnected: false, connectedDevice: null }));
      return false;
    } catch (error) {
      console.error("[useBluetooth] Erreur checkConnection:", error);
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isConnected: false, connectedDevice: null }));
      }
      return false;
    }
  }, []);

  // === INITIALISATION ===
  const initializeBluetooth = useCallback(async () => {
    try {
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isAvailable: true }));
      }
      await loadSavedDevices();
      await checkConnection();
    } catch (error) {
      console.error("[useBluetooth] Erreur initialisation:", error);
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isAvailable: false, error: "Bluetooth non disponible" }));
      }
    }
  }, [loadSavedDevices, checkConnection]);

  useEffect(() => {
    isMountedRef.current = true;
    initializeBluetooth();

    return () => {
      isMountedRef.current = false;
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [initializeBluetooth]);

  // === SCAN DES APPAREILS ===
  const scanDevices = useCallback(async (options: BluetoothScanOptions = {}): Promise<BluetoothDevice[]> => {
    const { timeout = DEFAULT_SCAN_TIMEOUT, nameFilter, typeFilter } = options;

    try {
      setState((prev) => ({ ...prev, isScanning: true, error: null, devices: [] }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const devices = await BluetoothManager.scanDevices(timeout);
      
      let filteredDevices = devices.map((d: any) => ({
        address: d.address,
        name: d.name || `Appareil ${d.address.substring(0, 4)}`,
        type: d.type,
        connected: false,
        rssi: d.rssi,
      }));

      if (nameFilter) {
        filteredDevices = filteredDevices.filter((d: BluetoothDevice) =>
          d.name.toLowerCase().includes(nameFilter.toLowerCase())
        );
      }

      if (typeFilter && typeFilter.length > 0) {
        filteredDevices = filteredDevices.filter((d: BluetoothDevice) =>
          d.type && typeFilter.includes(d.type)
        );
      }

      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isScanning: false, devices: filteredDevices }));
        Vibration.vibrate(50);
      }

      return filteredDevices;
    } catch (error: any) {
      console.error("[useBluetooth] Erreur scan:", error);
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isScanning: false,
          error: error.message || "Erreur de scan Bluetooth",
        }));
      }
      return [];
    }
  }, []);

  // === SAUVEGARDER UN APPAREIL (Version atomique anti-doublon) ===
  const saveDevice = useCallback(async (device: BluetoothDevice): Promise<void> => {
    try {
      let updatedDevices: BluetoothDevice[] = [];

      setState((prev) => {
        const existingIndex = prev.savedDevices.findIndex((d) => d.address === device.address);
        if (existingIndex >= 0) {
          updatedDevices = [...prev.savedDevices];
          updatedDevices[existingIndex] = { ...device, saved: true };
        } else {
          updatedDevices = [...prev.savedDevices, { ...device, saved: true }];
        }
        return { ...prev, savedDevices: updatedDevices, lastDevice: device };
      });

      await AsyncStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(updatedDevices));
      await AsyncStorage.setItem(STORAGE_KEY_LAST_DEVICE, JSON.stringify(device));
    } catch (error) {
      console.error("[useBluetooth] Erreur saveDevice:", error);
    }
  }, []);

  // === CONNEXION À UN APPAREIL ===
  const connect = useCallback(async (address: string): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await BluetoothManager.connect(address);
      const connectedDevice = await BluetoothManager.getConnectedDevice();

      const device: BluetoothDevice = {
        address: connectedDevice.address || address,
        name: connectedDevice.name || `Appareil ${address.substring(0, 4)}`,
        connected: true,
      };

      await saveDevice(device);

      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectedDevice: device,
          lastDevice: device,
        }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Vibration.vibrate(100);
      }
      return true;
    } catch (error: any) {
      console.error("[useBluetooth] Erreur connexion:", error);
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: error.message || "Erreur de connexion Bluetooth",
        }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate(200);
      }
      return false;
    }
  }, [saveDevice]);

  // === DÉCONNEXION ===
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await BluetoothManager.close();

      setState((prev) => ({ ...prev, isConnected: false, connectedDevice: null, error: null }));
      console.log("[useBluetooth] Déconnecté");
    } catch (error: any) {
      console.error("[useBluetooth] Erreur déconnexion:", error);
      setState((prev) => ({ ...prev, error: error.message || "Erreur de déconnexion" }));
    }
  }, []);

  // === SUPPRIMER UN APPAREIL SAUVEGARDÉ ===
  const removeDevice = useCallback(async (address: string): Promise<void> => {
    try {
      let updatedDevices: BluetoothDevice[] = [];

      setState((prev) => {
        updatedDevices = prev.savedDevices.filter((d) => d.address !== address);
        return { ...prev, savedDevices: updatedDevices };
      });

      await AsyncStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(updatedDevices));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("[useBluetooth] Erreur removeDevice:", error);
    }
  }, []);

  // === OBTENIR LES APPAREILS SAUVEGARDÉS ===
  const getSavedDevices = useCallback(async (): Promise<BluetoothDevice[]> => {
    try {
      const devicesData = await AsyncStorage.getItem(STORAGE_KEY_DEVICES);
      if (devicesData) {
        const devices = JSON.parse(devicesData);
        setState((prev) => ({ ...prev, savedDevices: devices }));
        return devices;
      }
      return [];
    } catch (error) {
      console.error("[useBluetooth] Erreur getSavedDevices:", error);
      return [];
    }
  }, []);

  // === RÉINITIALISATION ===
  const reset = useCallback(async (): Promise<void> => {
    try {
      await disconnect();
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        isScanning: false,
        devices: [],
        connectedDevice: null,
        error: null,
      }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("[useBluetooth] Erreur reset:", error);
    }
  }, [disconnect]);

  // === VALEURS MÉMOISÉES ===
  const value = useMemo<UseBluetoothReturn>(
    () => ({
      state,
      scanDevices,
      connect,
      disconnect,
      checkConnection,
      saveDevice,
      removeDevice,
      getSavedDevices,
      reset,
    }),
    [state, scanDevices, connect, disconnect, checkConnection, saveDevice, removeDevice, getSavedDevices, reset]
  );

  return value;
}

// === HOOKS DÉRIVÉS UNIFIÉS ===
export function useBluetoothState(): BluetoothState {
  return useBluetooth().state;
}

export function useBluetoothConnection() {
  const { state } = useBluetooth();
  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    connectedDevice: state.connectedDevice,
  };
}

export function useBluetoothDevices(): BluetoothDevice[] {
  return useBluetooth().state.devices;
}

export function useBluetoothSavedDevices(): BluetoothDevice[] {
  return useBluetooth().state.savedDevices;
}

export default useBluetooth;