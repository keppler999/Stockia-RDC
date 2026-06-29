import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    Image,
    ImageSourcePropType,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

const { width } = Dimensions.get("window");

// === INTERFACES ===
export interface CardProps {
  /** Titre de la carte */
  title?: string;
  /** Sous-titre de la carte */
  subtitle?: string;
  /** Description textuelle */
  description?: string;
  /** Image à afficher */
  image?: ImageSourcePropType;
  /** Hauteur de l'image */
  imageHeight?: number;
  /** Icone à afficher (nom Ionicons) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Taille de l'icône */
  iconSize?: number;
  /** Couleur de l'icône */
  iconColor?: string;
  /** Variante de style */
  variant?: "default" | "elevated" | "outlined" | "filled" | "gradient";
  /** Couleur de fond */
  backgroundColor?: string;
  /** Bordure colorée */
  borderColor?: string;
  /** Badge à afficher */
  badge?: string;
  /** Couleur du badge */
  badgeColor?: string;
  /** Texte du footer */
  footerText?: string;
  /** Bouton d'action */
  actionText?: string;
  /** Fonction du bouton */
  onAction?: () => void;
  /** Sur pression de la carte */
  onPress?: () => void;
  /** Longue pression */
  onLongPress?: () => void;
  /** Style personnalisé */
  style?: ViewStyle;
  /** Style du titre */
  titleStyle?: TextStyle;
  /** Style de la description */
  descriptionStyle?: TextStyle;
  /** Enfants personnalisés */
  children?: React.ReactNode;
  /** Niveau d'élévation */
  elevation?: number;
  /** Rayon des coins */
  borderRadius?: number;
  /** Marge */
  margin?: number;
  /** Largeur complète */
  fullWidth?: boolean;
  /** Statut de chargement */
  loading?: boolean;
  /** Désactiver les interactions */
  disabled?: boolean;
  /** Espacement interne */
  padding?: number;
  /** Afficher une ombre portée */
  shadow?: boolean;
  /** Afficher une bordure en haut */
  topBorder?: boolean;
  /** Couleur de la bordure supérieure */
  topBorderColor?: string;
}
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  description,
  image,
  imageHeight = 160,
  icon,
  iconSize = 32,
  iconColor = "#1565C0",
  variant = "default",
  backgroundColor = "#FFFFFF",
  borderColor = "#EAEAEA",
  badge,
  badgeColor = "#1565C0",
  footerText,
  actionText,
  onAction,
  onPress,
  onLongPress,
  style,
  titleStyle,
  descriptionStyle,
  children,
  elevation = 2,
  borderRadius = 12,
  margin = 8,
  fullWidth = false,
  loading = false,
  disabled = false,
  padding = 16,
  shadow = true,
  topBorder = false,
  topBorderColor = "#1565C0",
}) => {
  // === STYLES DYNAMIQUES ===
  const getVariantStyles = () => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: "#FFFFFF",
          borderWidth: 0,
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        };
      case "outlined":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: borderColor,
          elevation: 0,
          shadowOpacity: 0,
        };
      case "filled":
        return {
          backgroundColor: backgroundColor || "#F5F5F5",
          borderWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        };
      default:
        return {
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#EAEAEA",
          elevation: elevation,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: shadow ? 0.1 : 0,
          shadowRadius: 4,
        };
    }
  };

  const variantStyle = getVariantStyles();

  const cardStyles: ViewStyle[] = [
    styles.card,
    {
      backgroundColor: variantStyle.backgroundColor,
      borderWidth: variantStyle.borderWidth,
      borderColor: variantStyle.borderColor,
      elevation: variantStyle.elevation || 0,
      shadowColor: variantStyle.shadowColor || "transparent",
      shadowOffset: variantStyle.shadowOffset || { width: 0, height: 0 },
      shadowOpacity: variantStyle.shadowOpacity || 0,
      shadowRadius: variantStyle.shadowRadius || 0,
      borderRadius: borderRadius,
      margin: margin,
      width: fullWidth ? "100%" : undefined,
      padding: padding,
      opacity: disabled ? 0.6 : 1,
    },
    topBorder && {
      borderTopWidth: 3,
      borderTopColor: topBorderColor,
    },
    style,
  ];

  // === RENDU DU BADGE ===
  const renderBadge = () => {
    if (!badge) return null;
    return (
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    );
  };

  // === RENDU DE L'IMAGE ===
  const renderImage = () => {
    if (!image) return null;
    return (
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        <Image source={image} style={styles.image} resizeMode="cover" />
      </View>
    );
  };

  // === RENDU DE L'ICÔNE ===
  const renderIcon = () => {
    if (!icon) return null;
    return (
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </View>
    );
  };

  // === RENDU DU TITRE ===
  const renderTitle = () => {
    if (!title) return null;
    return (
      <Text style={[styles.title, titleStyle]} numberOfLines={2}>
        {title}
      </Text>
    );
  };

  // === RENDU DU SOUS-TITRE ===
  const renderSubtitle = () => {
    if (!subtitle) return null;
    return (
      <Text style={styles.subtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    );
  };

  // === RENDU DE LA DESCRIPTION ===
  const renderDescription = () => {
    if (!description) return null;
    return (
      <Text style={[styles.description, descriptionStyle]} numberOfLines={3}>
        {description}
      </Text>
    );
  };

  // === RENDU DU FOOTER ===
  const renderFooter = () => {
    if (!footerText && !actionText) return null;
    return (
      <View style={styles.footer}>
        {footerText && <Text style={styles.footerText}>{footerText}</Text>}
        {actionText && (
          <TouchableOpacity onPress={onAction} style={styles.actionButton}>
            <Text style={styles.actionText}>{actionText}</Text>
            <Ionicons name="arrow-forward" size={16} color="#1565C0" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // === RENDU DU CONTENU ===
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar} />
          <View style={[styles.loadingBar, { width: "70%" }]} />
          <View style={[styles.loadingBar, { width: "50%" }]} />
        </View>
      );
    }

    return (
      <>
        {renderImage()}
        <View style={styles.content}>
          {renderIcon()}
          {renderTitle()}
          {renderSubtitle()}
          {renderDescription()}
          {children}
          {renderBadge()}
          {renderFooter()}
        </View>
      </>
    );
  };

  // === RENDU PRINCIPAL ===
  return (
    <TouchableOpacity
      style={cardStyles}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      activeOpacity={0.95}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  content: {
    padding: 16,
  },
  imageContainer: {
    width: "100%",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 8,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#1565C0",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    color: "#1565C0",
    fontWeight: "600",
    marginRight: 4,
  },
  loadingContainer: {
    padding: 16,
    gap: 8,
  },
  loadingBar: {
    height: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    marginBottom: 4,
  },
});

export default Card;
