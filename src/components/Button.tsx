import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from "react-native";

// === INTERFACES ===
export interface ButtonProps extends TouchableOpacityProps {
  /** Texte du bouton */
  title: string;
  /** Variante de style */
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "outline"
    | "ghost";
  /** Taille du bouton */
  size?: "small" | "medium" | "large";
  /** État de chargement */
  loading?: boolean;
  /** Icône à afficher (nom de l'icône Ionicons) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Position de l'icône */
  iconPosition?: "left" | "right";
  /** Désactiver le bouton */
  disabled?: boolean;
  /** Style personnalisé */
  style?: ViewStyle;
  /** Style du texte */
  textStyle?: TextStyle;
  /** Largeur complète */
  fullWidth?: boolean;
}

// === CONFIGURATION DES VARIANTES ===
const variantStyles = {
  primary: {
    background: "#1565C0",
    text: "#FFFFFF",
    border: "#1565C0",
  },
  secondary: {
    background: "#E3F2FD",
    text: "#1565C0",
    border: "#E3F2FD",
  },
  success: {
    background: "#2E7D32",
    text: "#FFFFFF",
    border: "#2E7D32",
  },
  danger: {
    background: "#C62828",
    text: "#FFFFFF",
    border: "#C62828",
  },
  warning: {
    background: "#EF6C00",
    text: "#FFFFFF",
    border: "#EF6C00",
  },
  outline: {
    background: "transparent",
    text: "#1565C0",
    border: "#1565C0",
  },
  ghost: {
    background: "transparent",
    text: "#1565C0",
    border: "transparent",
  },
};

// === CONFIGURATION DES TAILLES ===
const sizeStyles = {
  small: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 12,
    iconSize: 16,
    height: 32,
  },
  medium: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    iconSize: 20,
    height: 44,
  },
  large: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 16,
    iconSize: 24,
    height: 52,
  },
};
export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "medium",
  loading = false,
  icon,
  iconPosition = "left",
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  ...props
}) => {
  // === STYLES DYNAMIQUES ===
  const variantStyle = variantStyles[variant] || variantStyles.primary;
  const sizeStyle = sizeStyles[size] || sizeStyles.medium;

  const buttonStyles: ViewStyle[] = [
    styles.button,
    {
      backgroundColor: variantStyle.background,
      borderColor: variantStyle.border,
      borderWidth: variant === "outline" || variant === "ghost" ? 1 : 0,
      paddingVertical: sizeStyle.paddingVertical,
      paddingHorizontal: sizeStyle.paddingHorizontal,
      height: sizeStyle.height,
      opacity: disabled || loading ? 0.6 : 1,
      width: fullWidth ? "100%" : undefined,
    },
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    {
      color: variantStyle.text,
      fontSize: sizeStyle.fontSize,
    },
    textStyle,
  ];

  // === RENDU ===
  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size={sizeStyle.iconSize}
          color={variantStyle.text}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "left" && (
            <Ionicons
              name={icon}
              size={sizeStyle.iconSize}
              color={variantStyle.text}
              style={styles.iconLeft}
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === "right" && (
            <Ionicons
              name={icon}
              size={sizeStyle.iconSize}
              color={variantStyle.text}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
