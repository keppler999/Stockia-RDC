import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

// === INTERFACES ===
export interface AlertBadgeProps {
  /** Texte du badge */
  text?: string;
  /** Nombre à afficher */
  count?: number;
  /** Variante de style */
  variant?: "primary" | "success" | "danger" | "warning" | "info" | "default";
  /** Taille du badge */
  size?: "small" | "medium" | "large";
  /** Position du badge */
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
  /** Icône à afficher */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Taille de l'icône */
  iconSize?: number;
  /** Afficher l'icône seule (sans texte) */
  iconOnly?: boolean;
  /** Style personnalisé */
  style?: ViewStyle;
  /** Style du texte */
  textStyle?: TextStyle;
  /** Animation à l'affichage */
  animated?: boolean;
  /** Effet de pulsation */
  pulse?: boolean;
  /** Largeur maximale */
  maxWidth?: number;
  /** Fonction de clic */
  onPress?: () => void;
  /** Afficher un point de notification */
  dot?: boolean;
  /** Couleur personnalisée */
  color?: string;
  /** Texte de la couleur */
  textColor?: string;
}

// === CONFIGURATIONS ===
const variantConfig = {
  primary: { background: "#1565C0", text: "#FFFFFF" },
  success: { background: "#2E7D32", text: "#FFFFFF" },
  danger: { background: "#C62828", text: "#FFFFFF" },
  warning: { background: "#EF6C00", text: "#FFFFFF" },
  info: { background: "#00838F", text: "#FFFFFF" },
  default: { background: "#757575", text: "#FFFFFF" },
};

const sizeConfig = {
  small: { padding: 4, fontSize: 10, height: 20, minWidth: 20 },
  medium: { padding: 6, fontSize: 12, height: 26, minWidth: 26 },
  large: { padding: 8, fontSize: 14, height: 32, minWidth: 32 },
};
export const AlertBadge: React.FC<AlertBadgeProps> = ({
  text,
  count,
  variant = "default",
  size = "medium",
  position = "top-right",
  icon,
  iconSize,
  iconOnly = false,
  style,
  textStyle,
  animated = true,
  pulse = false,
  maxWidth = 200,
  onPress,
  dot = false,
  color,
  textColor,
}) => {
  // === ANIMATIONS ===
  const scaleValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation d'apparition
    Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation
    if (pulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, []);

  // === STYLES DYNAMIQUES ===
  const variantStyle = color
    ? { background: color, text: textColor || "#FFFFFF" }
    : variantConfig[variant] || variantConfig.default;

  const sizeStyle = sizeConfig[size] || sizeConfig.medium;

  // === FORMATION DU CONTENU ===
  const getDisplayText = () => {
    if (dot) return null;
    if (iconOnly) return null;
    if (count !== undefined) {
      if (count > 99) return "99+";
      return count.toString();
    }
    return text || "";
  };

  const displayText = getDisplayText();

  // === STYLES ===
  const badgeStyles: ViewStyle[] = [
    styles.badge,
    {
      backgroundColor: variantStyle.background,
      paddingHorizontal: displayText
        ? sizeStyle.padding
        : sizeStyle.padding / 2,
      height: dot ? sizeStyle.height / 2 : sizeStyle.height,
      minWidth: dot ? sizeStyle.minWidth / 2 : sizeStyle.minWidth,
      borderRadius: dot ? sizeStyle.height / 4 : sizeStyle.height / 2,
      borderWidth: dot ? 0 : 2,
      borderColor: "#FFFFFF",
    },
    styles[position],
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    {
      fontSize: sizeStyle.fontSize,
      color: variantStyle.text,
    },
    textStyle,
  ];

  // === RENDU ===
  const renderContent = () => {
    if (dot) {
      return null;
    }

    if (icon && iconOnly) {
      return (
        <Ionicons
          name={icon}
          size={iconSize || sizeStyle.fontSize * 1.6}
          color={variantStyle.text}
        />
      );
    }

    if (icon) {
      return (
        <View style={styles.contentWithIcon}>
          <Ionicons
            name={icon}
            size={iconSize || sizeStyle.fontSize * 1.2}
            color={variantStyle.text}
            style={styles.icon}
          />
          {displayText && <Text style={textStyles}>{displayText}</Text>}
        </View>
      );
    }

    return displayText && <Text style={textStyles}>{displayText}</Text>;
  };

  // === RENDU PRINCIPAL ===
  const badgeElement = (
    <Animated.View
      style={[
        badgeStyles,
        {
          transform: [
            { scale: animated ? scaleValue : 1 },
            { scale: pulse ? pulseValue : 1 },
          ],
          opacity: animated ? opacityValue : 1,
        },
      ]}
    >
      {renderContent()}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {badgeElement}
      </TouchableOpacity>
    );
  }

  return badgeElement;
};
const styles = StyleSheet.create({
  badge: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  text: {
    fontWeight: "bold",
    textAlign: "center",
    includeFontPadding: false,
  },
  contentWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  icon: {
    marginRight: 2,
  },

  // === POSITIONS ===
  "top-left": {
    position: "absolute",
    top: -8,
    left: -8,
    zIndex: 1,
  },
  "top-right": {
    position: "absolute",
    top: -8,
    right: -8,
    zIndex: 1,
  },
  "bottom-left": {
    position: "absolute",
    bottom: -8,
    left: -8,
    zIndex: 1,
  },
  "bottom-right": {
    position: "absolute",
    bottom: -8,
    right: -8,
    zIndex: 1,
  },
  center: {
    alignSelf: "center",
  },
});

export default AlertBadge;
