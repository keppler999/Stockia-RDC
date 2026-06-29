// ============================================
// 📁 COMPONENTS - EXPORT CENTRALISÉ
// ============================================

// === COMPOSANTS UI ===
export { default as AlertBadge, AlertBadgeProps } from "./AlertBadge";
export { default as Button, ButtonProps } from "./Button";
export { default as Card, CardProps } from "./Card";
export { default as CartItem, CartItemProps } from "./CartItem";
export { default as Input, InputProps } from "./Input";
export { default as LoadingSpinner, LoadingSpinnerProps } from "./LoadingSpinner";
export { default as ProductCard, ProductCardProps } from "./ProductCard";

// === TYPES ===
export type {

    // AlertBadge
    AlertBadgeProps as AlertBadgeType,
    // Button
    ButtonProps as ButtonType,

    // Card
    CardProps as CardType,
    // CartItem
    CartItemProps as CartItemType,
    // Input
    InputProps as InputType,

    // LoadingSpinner
    LoadingSpinnerProps as LoadingSpinnerType,
    // ProductCard
    ProductCardProps as ProductCardType
};

// === CONSTANTES ===
export const COMPONENTS = {
  Button,
  Card,
  Input,
  LoadingSpinner,
  AlertBadge,
  ProductCard,
  CartItem,
};

// === EXPORT PAR DÉFAUT ===
export default {
  Button,
  Card,
  Input,
  LoadingSpinner,
  AlertBadge,
  ProductCard,
  CartItem,
  COMPONENTS,
};