import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// === INTERFACES ===
export interface CartItem {
  id: number;
  produit_id: number;
  nom: string;
  prix_unitaire: number;
  quantite: number;
  stock_disponible: number;
  code_barre?: string;
  categorie?: string;
  image?: string;
  remise?: number;
  prix_remise?: number;
}

export interface CartSummary {
  totalItems: number;
  totalQuantity: number;
  subTotal: number;
  totalRemise: number;
  total: number;
  tax: number;
  shipping: number;
  grandTotal: number;
}

export interface CartContextType {
  /** Articles dans le panier */
  items: CartItem[];
  /** Ajouter un article */
  addItem: (item: Omit<CartItem, "id">) => void;
  /** Retirer un article */
  removeItem: (produitId: number) => void;
  /** Diminuer la quantité */
  decreaseQuantity: (produitId: number) => void;
  /** Augmenter la quantité */
  increaseQuantity: (produitId: number) => void;
  /** Vider le panier */
  clearCart: () => void;
  /** Nombre total d'articles */
  totalItems: number;
  /** Quantité totale */
  totalQuantity: number;
  /** Sous-total */
  subTotal: number;
  /** Total avec remises */
  total: number;
  /** Résumé complet */
  summary: CartSummary;
  /** Sauvegarder le panier */
  saveCart: () => Promise<void>;
  /** Charger le panier */
  loadCart: () => Promise<void>;
  /** Vérifier si un article est dans le panier */
  isInCart: (produitId: number) => boolean;
  /** Obtenir la quantité d'un article */
  getQuantity: (produitId: number) => number;
  /** Appliquer une remise */
  applyDiscount: (code: string) => Promise<boolean>;
  /** Supprimer la remise */
  removeDiscount: () => void;
}

// === CONSTANTES ===
const STORAGE_KEY = "@stockia_cart";
const STORAGE_KEY_DISCOUNT = "@stockia_cart_discount";

// === DISCOUNTS ===
const DISCOUNTS: Record<string, { type: "percentage" | "fixed"; value: number }> = {
  "STOCKIA10": { type: "percentage", value: 10 },
  "STOCKIA20": { type: "percentage", value: 20 },
  "STOCKIA50": { type: "percentage", value: 50 },
  "PROMO2024": { type: "fixed", value: 5 },
};

// === CONTEXTE ===
const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart doit être utilisé à l'intérieur d'un CartProvider");
  }
  return context;
};export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // === ÉTATS ===
  const [items, setItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // === CHARGEMENT INITIAL ===
  useEffect(() => {
    loadCart();
  }, []);

  // === SAUVEGARDE AUTOMATIQUE ===
  useEffect(() => {
    if (isLoaded) {
      saveCart();
    }
  }, [items, discountCode, discountValue]);

  // === FONCTIONS ===
  const generateId = useCallback(() => {
    return Date.now() + Math.random() * 1000;
  }, []);

  // === AJOUTER UN ARTICLE ===
  const addItem = useCallback(
    (item: Omit<CartItem, "id">) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.produit_id === item.produit_id);

        if (existingIndex >= 0) {
          // Vérifier le stock
          const current = prev[existingIndex];
          if (current.quantite >= current.stock_disponible) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return prev;
          }

          // Augmenter la quantité
          const updated = [...prev];
          updated[existingIndex] = {
            ...current,
            quantite: current.quantite + 1,
          };
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return updated;
        }

        // Ajouter un nouvel article
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return [
          ...prev,
          {
            id: generateId(),
            ...item,
            quantite: 1,
          },
        ];
      });
    },
    [generateId]
  );

  // === RETIRER UN ARTICLE ===
  const removeItem = useCallback((produitId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((item) => item.produit_id !== produitId));
  }, []);

  // === DIMINUER LA QUANTITÉ ===
  const decreaseQuantity = useCallback((produitId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.produit_id === produitId);
      if (existingIndex < 0) return prev;

      const current = prev[existingIndex];
      if (current.quantite <= 1) {
        // Supprimer l'article
        return prev.filter((_, index) => index !== existingIndex);
      }

      const updated = [...prev];
      updated[existingIndex] = {
        ...current,
        quantite: current.quantite - 1,
      };
      return updated;
    });
  }, []);

  // === AUGMENTER LA QUANTITÉ ===
  const increaseQuantity = useCallback((produitId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.produit_id === produitId);
      if (existingIndex < 0) return prev;

      const current = prev[existingIndex];
      if (current.quantite >= current.stock_disponible) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return prev;
      }

      const updated = [...prev];
      updated[existingIndex] = {
        ...current,
        quantite: current.quantite + 1,
      };
      return updated;
    });
  }, []);

  // === VIDER LE PANIER ===
  const clearCart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems([]);
    setDiscountCode(null);
    setDiscountValue(0);
  }, []);// === CALCULS ===
const totalItems = useMemo(() => items.length, [items]);
const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantite, 0), [items]);

const subTotal = useMemo(() => {
  return items.reduce((sum, item) => {
    const prix = item.prix_remise || item.prix_unitaire;
    return sum + prix * item.quantite;
  }, 0);
}, [items]);

const totalRemise = useMemo(() => {
  return items.reduce((sum, item) => {
    if (item.remise) {
      return sum + (item.prix_unitaire * item.remise / 100) * item.quantite;
    }
    return sum;
  }, 0);
}, [items]);

const total = useMemo(() => {
  let total = subTotal;
  if (discountCode && discountValue > 0) {
    const discount = DISCOUNTS[discountCode];
    if (discount.type === "percentage") {
      total = total * (1 - discount.value / 100);
    } else {
      total = Math.max(0, total - discount.value);
    }
  }
  return total;
}, [subTotal, discountCode, discountValue]);

const summary: CartSummary = useMemo(() => ({
  totalItems,
  totalQuantity,
  subTotal,
  totalRemise,
  total,
  tax: 0,
  shipping: 0,
  grandTotal: total,
}), [totalItems, totalQuantity, subTotal, totalRemise, total]);

// === VÉRIFICATIONS ===
const isInCart = useCallback((produitId: number) => {
  return items.some((item) => item.produit_id === produitId);
}, [items]);

const getQuantity = useCallback((produitId: number) => {
  const item = items.find((i) => i.produit_id === produitId);
  return item?.quantite || 0;
}, [items]);// === SAUVEGARDE ===
const saveCart = useCallback(async () => {
  try {
    const data = {
      items,
      discountCode,
      discountValue,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("[CartContext] Erreur sauvegarde:", error);
  }
}, [items, discountCode, discountValue]);

// === CHARGEMENT ===
const loadCart = useCallback(async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      setItems(parsed.items || []);
      setDiscountCode(parsed.discountCode || null);
      setDiscountValue(parsed.discountValue || 0);
    }
    setIsLoaded(true);
  } catch (error) {
    console.error("[CartContext] Erreur chargement:", error);
    setIsLoaded(true);
  }
}, []);

// === APPLIQUER UNE REMISE ===
const applyDiscount = useCallback(async (code: string) => {
  const discount = DISCOUNTS[code.toUpperCase()];
  if (!discount) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return false;
  }

  // Vérifier si le code est déjà utilisé
  if (discountCode === code.toUpperCase()) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return false;
  }

  setDiscountCode(code.toUpperCase());
  setDiscountValue(discount.value);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  
  await saveCart();
  return true;
}, [discountCode, saveCart]);

// === SUPPRIMER LA REMISE ===
const removeDiscount = useCallback(() => {
  if (discountCode) {
    setDiscountCode(null);
    setDiscountValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveCart();
  }
}, [discountCode, saveCart]);  // === VALEURS ===
  const value = useMemo<CartContextType>(
    () => ({
      items,
      addItem,
      removeItem,
      decreaseQuantity,
      increaseQuantity,
      clearCart,
      totalItems,
      totalQuantity,
      subTotal,
      total,
      summary,
      saveCart,
      loadCart,
      isInCart,
      getQuantity,
      applyDiscount,
      removeDiscount,
    }),
    [
      items,
      addItem,
      removeItem,
      decreaseQuantity,
      increaseQuantity,
      clearCart,
      totalItems,
      totalQuantity,
      subTotal,
      total,
      summary,
      saveCart,
      loadCart,
      isInCart,
      getQuantity,
      applyDiscount,
      removeDiscount,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// === HOOK PERSONNALISÉ ===
export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext doit être utilisé à l'intérieur d'un CartProvider");
  }
  return context;
};

// === EXPORT ===
export default CartProvider;