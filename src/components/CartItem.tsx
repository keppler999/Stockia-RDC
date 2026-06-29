import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    Alert,
    Animated,
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
import { Swipeable } from "react-native-gesture-handler";
import AlertBadge from "./AlertBadge";

const { width } = Dimensions.get("window");

// === INTERFACES ===
export interface CartItemProps {
  /** ID de l'article */
  id: number | string;
  /** Nom du produit */
  name: string;
  /** Prix unitaire */
  price: number;
  /** Quantité */
  quantity: number;
  /** Image du produit */
  image?: ImageSourcePropType;
  /** Variante du produit (taille, couleur, etc.) */
  variant?: string;
  /** Remise appliquée sur l'article */
  discount?: number;
  /** Prix avec remise */
  discountedPrice?: number;
  /** Stock disponible */
  stock?: number;
  /** En promotion */
  onSale?: boolean;
  /** Devise */
  currency?: string;
  /** Style personnalisé */
  style?: ViewStyle;
  /** Style du conteneur */
  containerStyle?: ViewStyle;
  /** Style du texte */
  textStyle?: TextStyle;
  /** Fonction d'augmentation de la quantité */
  onIncrease?: (id: number | string) => void;
  /** Fonction de diminution de la quantité */
  onDecrease?: (id: number | string) => void;
  /** Fonction de suppression */
  onRemove?: (id: number | string) => void;
  /** Fonction de clic sur l'article */
  onPress?: (id: number | string) => void;
  /** Désactiver les interactions */
  disabled?: boolean;
  /** Afficher les contrôles de quantité */
  showQuantityControls?: boolean;
  /** Afficher le prix unitaire */
  showUnitPrice?: boolean;
  /** Afficher le total */
  showTotal?: boolean;
  /** Afficher le badge de promotion */
  showPromoBadge?: boolean;
  /** Afficher le stock */
  showStock?: boolean;
}

// === CONFIGURATION ===
const DEFAULT_CURRENCY = "USD";
export const CartItem: React.FC<CartItemProps> = ({
  id,
  name,
  price,
  quantity,
  image,
  variant,
  discount = 0,
  discountedPrice,
  stock,
  onSale = false,
  currency = DEFAULT_CURRENCY,
  style,
  containerStyle,
  textStyle,
  onIncrease,
  onDecrease,
  onRemove,
  onPress,
  disabled = false,
  showQuantityControls = true,
  showUnitPrice = true,
  showTotal = true,
  showPromoBadge = true,
  showStock = false,
}) => {
  // === ÉTATS ===
  const [imageError, setImageError] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // === CALCULS ===
  const finalPrice =
    discountedPrice ||
    (onSale && discount > 0 ? price - (price * discount) / 100 : price);

  const totalPrice = finalPrice * quantity;
  const isLowStock = stock !== undefined && stock > 0 && stock <= 5;
  const isOutOfStock = stock !== undefined && stock <= 0;

  // === ANIMATIONS ===
  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // === GESTIONNAIRES ===
  const handleIncrease = () => {
    if (onIncrease && !disabled) {
      animatePress();
      onIncrease(id);
    }
  };

  const handleDecrease = () => {
    if (onDecrease && !disabled) {
      animatePress();
      onDecrease(id);
    }
  };

  const handleRemove = () => {
    if (onRemove && !disabled) {
      Alert.alert("Supprimer l'article", `Retirer "${name}" du panier ?`, [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => onRemove(id),
        },
      ]);
    }
  };

  const handlePress = () => {
    if (onPress && !disabled) {
      animatePress();
      onPress(id);
    }
  };

  // === RENDU DE L'IMAGE ===
  const renderImage = () => {
    const imageSource = image && !imageError ? image : null;

    return (
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={handlePress}
        disabled={!onPress}
      >
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="cube-outline" size={30} color="#CCC" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // === RENDU DES PROMOTIONS ===
  const renderPromoBadge = () => {
    if (!showPromoBadge || !onSale || discount <= 0) return null;
    return (
      <AlertBadge
        text={`-${discount}%`}
        variant="danger"
        size="small"
        position="top-right"
      />
    );
  };

  // === RENDU DU STOCK ===
  const renderStock = () => {
    if (!showStock || stock === undefined) return null;

    let stockText = `${stock} en stock`;
    let stockColor = "#2E7D32";

    if (isOutOfStock) {
      stockText = "Rupture de stock";
      stockColor = "#C62828";
    } else if (isLowStock) {
      stockText = `Plus que ${stock}`;
      stockColor = "#EF6C00";
    }

    return (
      <Text style={[styles.stockText, { color: stockColor }]}>{stockText}</Text>
    );
  }; // === RENDU DES INFORMATIONS ===
  const renderInfo = () => {
    return (
      <View style={styles.infoContainer}>
        <TouchableOpacity
          style={styles.nameContainer}
          onPress={handlePress}
          disabled={!onPress}
        >
          <Text style={[styles.name, textStyle]} numberOfLines={2}>
            {name}
          </Text>
        </TouchableOpacity>

        {variant && <Text style={styles.variant}>{variant}</Text>}

        {showUnitPrice && (
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {finalPrice.toFixed(2)} {currency}
            </Text>
            {onSale && discount > 0 && (
              <Text style={styles.oldPrice}>
                {price.toFixed(2)} {currency}
              </Text>
            )}
          </View>
        )}

        {renderStock()}
      </View>
    );
  };

  // === RENDU DES CONTRÔLES ===
  const renderControls = () => {
    if (!showQuantityControls) {
      return (
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityBadgeText}>×{quantity}</Text>
        </View>
      );
    }

    return (
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, styles.controlDecrease]}
          onPress={handleDecrease}
          disabled={disabled || quantity <= 1}
        >
          <Ionicons
            name="remove"
            size={18}
            color={disabled || quantity <= 1 ? "#CCC" : "#FFF"}
          />
        </TouchableOpacity>

        <Text style={[styles.quantityText, textStyle]}>{quantity}</Text>

        <TouchableOpacity
          style={[styles.controlButton, styles.controlIncrease]}
          onPress={handleIncrease}
          disabled={disabled || (stock !== undefined && quantity >= stock)}
        >
          <Ionicons
            name="add"
            size={18}
            color={
              disabled || (stock !== undefined && quantity >= stock)
                ? "#CCC"
                : "#FFF"
            }
          />
        </TouchableOpacity>
      </View>
    );
  };

  // === RENDU DU TOTAL ===
  const renderTotal = () => {
    if (!showTotal) return null;

    return (
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalPrice}>
          {totalPrice.toFixed(2)} {currency}
        </Text>
      </View>
    );
  }; // === RENDU DU CONTENU ===
  const renderContent = () => {
    return (
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {renderImage()}
        {renderInfo()}
        <View style={styles.rightContainer}>
          {renderControls()}
          {renderTotal()}
        </View>
        {renderPromoBadge()}
      </Animated.View>
    );
  };

  // === RENDU DES ACTIONS DE GLISSEMENT ===
  const renderRightActions = () => {
    if (!onRemove) return null;

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={handleRemove}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={24} color="#FFF" />
        <Text style={styles.deleteActionText}>Supprimer</Text>
      </TouchableOpacity>
    );
  };

  // === RENDU PRINCIPAL ===
  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      enabled={!!onRemove}
    >
      <View style={[styles.container, containerStyle]}>{renderContent()}</View>
    </Swipeable>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginBottom: 10,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  content: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },

  // === IMAGE ===
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
    marginRight: 12,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },

  // === INFORMATIONS ===
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  nameContainer: {
    flexShrink: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  variant: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1565C0",
  },
  oldPrice: {
    fontSize: 11,
    color: "#999",
    textDecorationLine: "line-through",
  },
  stockText: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },

  // === DROITE ===
  rightContainer: {
    alignItems: "flex-end",
    gap: 8,
  },

  // === CONTRÔLES ===
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  controlDecrease: {
    backgroundColor: "#C62828",
  },
  controlIncrease: {
    backgroundColor: "#1565C0",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    minWidth: 24,
    textAlign: "center",
  },
  quantityBadge: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityBadgeText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },

  // === TOTAL ===
  totalContainer: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 10,
    color: "#999",
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2E7D32",
  },

  // === SUPPRESSION (SWIPE) ===
  deleteAction: {
    backgroundColor: "#C62828",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 12,
    marginBottom: 10,
    marginLeft: 8,
  },
  deleteActionText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});

export default CartItem;
