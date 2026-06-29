import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Dimensions,
    Image,
    ImageSourcePropType,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from "react-native";
import AlertBadge from "./AlertBadge";
import Button from "./Button";

const { width } = Dimensions.get("window");

// === INTERFACES ===
export interface ProductCardProps {
  /** ID du produit */
  id: number | string;
  /** Nom du produit */
  name: string;
  /** Prix de vente */
  price: number;
  /** Prix d'achat (optionnel) */
  purchasePrice?: number;
  /** Catégorie */
  category?: string;
  /** Stock actuel */
  stock?: number;
  /** Stock minimum pour alerte */
  minStock?: number;
  /** Image du produit */
  image?: ImageSourcePropType;
  /** Code-barres */
  barcode?: string;
  /** Variante de carte */
  variant?: "default" | "compact" | "horizontal" | "grid" | "list";
  /** En promotion */
  onSale?: boolean;
  /** Pourcentage de remise */
  discount?: number;
  /** Nouveau produit */
  isNew?: boolean;
  /** Quantité dans le panier */
  quantityInCart?: number;
  /** Style personnalisé */
  style?: ViewStyle;
  /** Style du conteneur image */
  imageStyle?: ViewStyle;
  /** Fonction d'ajout au panier */
  onAddToCart?: (id: number | string) => void;
  /** Fonction de suppression du panier */
  onRemoveFromCart?: (id: number | string) => void;
  /** Fonction de clic sur la carte */
  onPress?: (id: number | string) => void;
  /** Fonction de long press */
  onLongPress?: (id: number | string) => void;
  /** Désactiver les interactions */
  disabled?: boolean;
  /** Devise */
  currency?: string;
  /** Afficher le stock */
  showStock?: boolean;
  /** Afficher la catégorie */
  showCategory?: boolean;
  /** Afficher le code-barres */
  showBarcode?: boolean;
  /** Afficher le prix d'achat */
  showPurchasePrice?: boolean;
  /** Largeur de la carte (pour grid) */
  cardWidth?: number;
}

// === CONFIGURATIONS ===
const DEFAULT_CURRENCY = "USD";
export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  purchasePrice,
  category,
  stock = 0,
  minStock = 5,
  image,
  barcode,
  variant = "default",
  onSale = false,
  discount = 0,
  isNew = false,
  quantityInCart = 0,
  style,
  imageStyle,
  onAddToCart,
  onRemoveFromCart,
  onPress,
  onLongPress,
  disabled = false,
  currency = DEFAULT_CURRENCY,
  showStock = true,
  showCategory = true,
  showBarcode = true,
  showPurchasePrice = false,
  cardWidth,
}) => {
  // === ÉTATS ===
  const [imageError, setImageError] = useState(false);

  // === CALCULS ===
  const finalPrice =
    onSale && discount > 0 ? price - (price * discount) / 100 : price;

  const isLowStock = stock > 0 && stock <= minStock;
  const isOutOfStock = stock <= 0;
  const formattedPrice = `${finalPrice.toFixed(2)} ${currency}`;

  // === GESTIONNAIRES ===
  const handleAddToCart = () => {
    if (onAddToCart && !disabled && !isOutOfStock) {
      onAddToCart(id);
    }
  };

  const handleRemoveFromCart = () => {
    if (onRemoveFromCart && !disabled && quantityInCart > 0) {
      onRemoveFromCart(id);
    }
  };

  const handlePress = () => {
    if (onPress && !disabled) {
      onPress(id);
    }
  };

  const handleLongPress = () => {
    if (onLongPress && !disabled) {
      onLongPress(id);
    }
  };

  // === RENDU DU STOCK ===
  const renderStockBadge = () => {
    if (!showStock) return null;

    if (isOutOfStock) {
      return <AlertBadge text="RUPTURE" variant="danger" size="small" />;
    }
    if (isLowStock) {
      return <AlertBadge text={`${stock} u`} variant="warning" size="small" />;
    }
    return <AlertBadge text={`${stock} u`} variant="success" size="small" />;
  };

  // === RENDU DES BADGES ===
  const renderBadges = () => {
    return (
      <View style={styles.badgeContainer}>
        {isNew && (
          <AlertBadge
            text="NOUVEAU"
            variant="info"
            size="small"
            position="top-left"
          />
        )}
        {onSale && (
          <AlertBadge
            text={`-${discount}%`}
            variant="danger"
            size="small"
            position="top-right"
          />
        )}
      </View>
    );
  };

  // === RENDU DE L'IMAGE ===
  const renderImage = () => {
    const imageSource = image && !imageError ? image : null;

    return (
      <View style={[styles.imageContainer, imageStyle]}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#CCC" />
          </View>
        )}
        {renderBadges()}
        {renderStockBadge()}
      </View>
    );
  };

  // === RENDU DES INFORMATIONS ===
  const renderInfo = () => {
    return (
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        {showCategory && category && (
          <Text style={styles.category} numberOfLines={1}>
            {category}
          </Text>
        )}

        <View style={styles.priceContainer}>
          {onSale && discount > 0 && (
            <Text style={styles.oldPrice}>
              {price.toFixed(2)} {currency}
            </Text>
          )}
          <Text style={[styles.price, onSale && styles.salePrice]}>
            {formattedPrice}
          </Text>
        </View>

        {showPurchasePrice && purchasePrice && (
          <Text style={styles.purchasePrice}>
            Achat: {purchasePrice.toFixed(2)} {currency}
          </Text>
        )}

        {showBarcode && barcode && (
          <Text style={styles.barcode}>{barcode}</Text>
        )}
      </View>
    );
  };

  // === RENDU DES ACTIONS ===
  const renderActions = () => {
    const canAdd = !isOutOfStock && !disabled;

    return (
      <View style={styles.actionsContainer}>
        {quantityInCart > 0 ? (
          <View style={styles.cartControls}>
            <TouchableOpacity
              style={[styles.cartButton, styles.cartRemove]}
              onPress={handleRemoveFromCart}
              disabled={disabled}
            >
              <Ionicons name="remove" size={18} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.cartQuantity}>{quantityInCart}</Text>
            <TouchableOpacity
              style={[styles.cartButton, styles.cartAdd]}
              onPress={handleAddToCart}
              disabled={!canAdd}
            >
              <Ionicons name="add" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            title={isOutOfStock ? "Rupture" : "Ajouter"}
            variant={isOutOfStock ? "default" : "primary"}
            size="small"
            onPress={handleAddToCart}
            disabled={!canAdd}
            fullWidth
          />
        )}
      </View>
    );
  }; // === RENDU SELON LA VARIANTE ===
  const renderCard = () => {
    const commonProps = {
      style: [
        styles.card,
        variant === "compact" && styles.compactCard,
        variant === "horizontal" && styles.horizontalCard,
        variant === "grid" && [
          styles.gridCard,
          { width: cardWidth || (width - 40) / 2 },
        ],
        variant === "list" && styles.listCard,
        disabled && styles.disabledCard,
        style,
      ],
      onPress: handlePress,
      onLongPress: handleLongPress,
      activeOpacity: 0.7,
    };

    // === VARIANTE HORIZONTALE ===
    if (variant === "horizontal") {
      return (
        <TouchableOpacity {...commonProps}>
          <View style={styles.horizontalContent}>
            <View style={styles.horizontalImage}>{renderImage()}</View>
            <View style={styles.horizontalInfo}>
              {renderInfo()}
              {renderActions()}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // === VARIANTE COMPACTE ===
    if (variant === "compact") {
      return (
        <TouchableOpacity {...commonProps}>
          <View style={styles.compactContent}>
            <View style={styles.compactImage}>{renderImage()}</View>
            <View style={styles.compactInfo}>
              <Text style={styles.compactName} numberOfLines={2}>
                {name}
              </Text>
              <Text style={styles.compactPrice}>{formattedPrice}</Text>
              {quantityInCart > 0 && (
                <View style={styles.compactCartBadge}>
                  <Text style={styles.compactCartText}>
                    🛒 {quantityInCart}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // === VARIANTE GRILLE ===
    if (variant === "grid") {
      return (
        <TouchableOpacity {...commonProps}>
          <View style={styles.gridContent}>
            <View style={styles.gridImage}>{renderImage()}</View>
            <View style={styles.gridInfo}>
              <Text style={styles.gridName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.gridPrice}>{formattedPrice}</Text>
              {quantityInCart > 0 && (
                <View style={styles.gridCartBadge}>
                  <Text style={styles.gridCartText}>{quantityInCart}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // === VARIANTE LISTE ===
    if (variant === "list") {
      return (
        <TouchableOpacity {...commonProps}>
          <View style={styles.listContent}>
            <View style={styles.listImage}>{renderImage()}</View>
            <View style={styles.listInfo}>
              {renderInfo()}
              {renderActions()}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // === VARIANTE PAR DÉFAUT ===
    return (
      <TouchableOpacity {...commonProps}>
        <View style={styles.defaultContent}>
          {renderImage()}
          {renderInfo()}
          {renderActions()}
        </View>
      </TouchableOpacity>
    );
  };

  return renderCard();
};
const styles = StyleSheet.create({
  // === CARTE DE BASE ===
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  disabledCard: {
    opacity: 0.6,
  },

  // === CONTENU PAR DÉFAUT ===
  defaultContent: {
    flex: 1,
  },

  // === IMAGE ===
  imageContainer: {
    width: "100%",
    height: 160,
    backgroundColor: "#F5F5F5",
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
  badgeContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
  },

  // === INFORMATIONS ===
  infoContainer: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1565C0",
  },
  salePrice: {
    color: "#C62828",
  },
  oldPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
  },
  purchasePrice: {
    fontSize: 11,
    color: "#E65100",
    marginTop: 2,
  },
  barcode: {
    fontSize: 10,
    color: "#BBB",
    marginTop: 2,
  },

  // === ACTIONS ===
  actionsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  cartControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cartAdd: {
    backgroundColor: "#1565C0",
  },
  cartRemove: {
    backgroundColor: "#C62828",
  },
  cartQuantity: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    minWidth: 30,
    textAlign: "center",
  },

  // === VARIANTE COMPACT ===
  compactCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  compactContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  compactImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1565C0",
  },
  compactCartBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  compactCartText: {
    fontSize: 10,
    color: "#1565C0",
    fontWeight: "500",
  },

  // === VARIANTE HORIZONTALE ===
  horizontalCard: {
    marginBottom: 12,
  },
  horizontalContent: {
    flexDirection: "row",
  },
  horizontalImage: {
    width: 120,
    height: 140,
    backgroundColor: "#F5F5F5",
  },
  horizontalInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },

  // === VARIANTE GRILLE ===
  gridCard: {
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 8,
  },
  gridContent: {
    flex: 1,
  },
  gridImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#F5F5F5",
    position: "relative",
  },
  gridInfo: {
    padding: 8,
  },
  gridName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1565C0",
  },
  gridCartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#1565C0",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  gridCartText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "bold",
  },

  // === VARIANTE LISTE ===
  listCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  listContent: {
    flexDirection: "row",
    padding: 8,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#F5F5F5",
  },
  listInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
});

export default ProductCard;
