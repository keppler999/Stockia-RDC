import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

const { width, height } = Dimensions.get("window");

// === INTERFACES ===
export interface LoadingSpinnerProps {
  /** Taille du spinner */
  size?: "small" | "medium" | "large" | number;
  /** Couleur du spinner */
  color?: string;
  /** Texte à afficher */
  text?: string;
  /** Style du texte */
  textStyle?: TextStyle;
  /** Variante de style */
  variant?: "default" | "overlay" | "inline" | "fullscreen" | "skeleton";
  /** Type de spinner */
  type?: "circle" | "dots" | "pulse" | "progress";
  /** Pourcentage de progression (pour type "progress") */
  progress?: number;
  /** Désactiver l'animation */
  paused?: boolean;
  /** Arrière-plan transparent */
  transparent?: boolean;
  /** Style personnalisé du conteneur */
  containerStyle?: ViewStyle;
  /** Temps de délai avant affichage (ms) */
  delay?: number;
  /** Opacité de l'arrière-plan */
  backdropOpacity?: number;
  /** Icône à afficher */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Taille de l'icône */
  iconSize?: number;
  /** Couleur de l'icône */
  iconColor?: string;
}

// === CONFIGURATION DES TAILLES ===
const sizeConfig = {
  small: {
    spinner: 24,
    text: 12,
    icon: 20,
    container: 40,
  },
  medium: {
    spinner: 40,
    text: 14,
    icon: 28,
    container: 60,
  },
  large: {
    spinner: 56,
    text: 16,
    icon: 36,
    container: 80,
  },
};
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  color = "#1565C0",
  text,
  textStyle,
  variant = "default",
  type = "circle",
  progress = 0,
  paused = false,
  transparent = false,
  containerStyle,
  delay = 0,
  backdropOpacity = 0.5,
  icon,
  iconSize,
  iconColor = "#1565C0",
}) => {
  // === ÉTATS D'ANIMATION ===
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const dotsValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  // === HOOKS ===
  useEffect(() => {
    // Animation de rotation pour le spinner
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    // Animation de pulsation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    // Animation de fade in
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Animation des points pour type "dots"
    const dotsAnimations = dotsValues.map((dot, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay: index * 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            delay: 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    });

    // Démarrer les animations
    if (!paused) {
      if (type === "circle") {
        spinAnimation.start();
      }
      if (type === "pulse") {
        pulseAnimation.start();
      }
      if (type === "dots") {
        dotsAnimations.forEach((anim) => anim.start());
      }
    }

    // Nettoyage
    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
      dotsAnimations.forEach((anim) => anim.stop());
    };
  }, [type, paused]);

  // Mise à jour de la progression
  useEffect(() => {
    Animated.timing(progressValue, {
      toValue: progress / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // === STYLES DYNAMIQUES ===
  const getSize = () => {
    if (typeof size === "number") {
      return {
        spinner: size,
        text: 14,
        icon: size * 0.6,
        container: size * 1.6,
      };
    }
    return sizeConfig[size] || sizeConfig.medium;
  };

  const config = getSize();

  // === RENDU DES VARIANTES ===
  const renderContent = () => {
    // === TYPE: CIRCLE ===
    if (type === "circle") {
      const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      });

      return (
        <Animated.View
          style={[
            styles.spinnerContainer,
            {
              width: config.container,
              height: config.container,
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <ActivityIndicator size={config.spinner} color={color} />
        </Animated.View>
      );
    }

    // === TYPE: DOTS ===
    if (type === "dots") {
      return (
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => {
            const scale = dotsValues[index].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.8, 1.4, 0.8],
            });

            const opacity = dotsValues[index].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.4, 1, 0.4],
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: config.spinner * 0.3,
                    height: config.spinner * 0.3,
                    backgroundColor: color,
                    transform: [{ scale }],
                    opacity,
                  },
                ]}
              />
            );
          })}
        </View>
      );
    }

    // === TYPE: PULSE ===
    if (type === "pulse") {
      return (
        <Animated.View
          style={[
            styles.pulseContainer,
            {
              width: config.container,
              height: config.container,
              transform: [{ scale: pulseValue }],
            },
          ]}
        >
          <View
            style={[
              styles.pulseInner,
              {
                backgroundColor: color + "20",
                borderRadius: config.container / 2,
              },
            ]}
          >
            {icon ? (
              <Ionicons
                name={icon}
                size={iconSize || config.icon}
                color={iconColor}
              />
            ) : (
              <ActivityIndicator size={config.spinner} color={color} />
            )}
          </View>
        </Animated.View>
      );
    }

    // === TYPE: PROGRESS ===
    if (type === "progress") {
      const widthInterpolate = progressValue.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
      });

      return (
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: widthInterpolate,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      );
    }

    return null;
  };

  // === RENDU DU CONTENU AVEC TEXTE ===
  const renderWithText = () => {
    return (
      <View style={styles.contentContainer}>
        {renderContent()}
        {text && (
          <Text style={[styles.text, { fontSize: config.text }, textStyle]}>
            {text}
          </Text>
        )}
      </View>
    );
  };

  // === RENDU SELON LA VARIANTE ===
  switch (variant) {
    case "fullscreen":
      return (
        <View style={[styles.fullscreenContainer, containerStyle]}>
          <View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
                backgroundColor: transparent ? "transparent" : "#000",
              },
            ]}
          />
          <Animated.View
            style={[styles.fullscreenContent, { opacity: fadeValue }]}
          >
            {renderWithText()}
          </Animated.View>
        </View>
      );

    case "overlay":
      return (
        <View style={[styles.overlayContainer, containerStyle]}>
          <View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
                backgroundColor: transparent ? "transparent" : "#000",
              },
            ]}
          />
          <Animated.View
            style={[styles.overlayContent, { opacity: fadeValue }]}
          >
            {renderWithText()}
          </Animated.View>
        </View>
      );

    case "skeleton":
      return (
        <Animated.View
          style={[
            styles.skeletonContainer,
            {
              opacity: fadeValue,
              backgroundColor: "#E0E0E0",
              borderRadius: 8,
            },
            containerStyle,
          ]}
        >
          <View style={styles.skeletonContent}>
            <View style={[styles.skeletonLine, { width: "60%", height: 16 }]} />
            <View style={[styles.skeletonLine, { width: "80%", height: 12 }]} />
            <View style={[styles.skeletonLine, { width: "40%", height: 12 }]} />
          </View>
        </Animated.View>
      );

    case "inline":
      return (
        <View style={[styles.inlineContainer, containerStyle]}>
          {renderWithText()}
        </View>
      );

    default:
      return (
        <View style={[styles.defaultContainer, containerStyle]}>
          {renderWithText()}
        </View>
      );
  }
};
const styles = StyleSheet.create({
  // === SPINNER ===
  spinnerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  // === DOTS ===
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    borderRadius: 100,
  },

  // === PULSE ===
  pulseContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  pulseInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // === PROGRESS ===
  progressContainer: {
    width: "100%",
    minWidth: 120,
  },
  progressBackground: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },

  // === CONTENU ===
  contentContainer: {
    alignItems: "center",
    gap: 12,
  },
  text: {
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },

  // === FULLSCREEN ===
  fullscreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullscreenContent: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    minWidth: 120,
  },

  // === OVERLAY ===
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  overlayContent: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 100,
  },

  // === INLINE ===
  inlineContainer: {
    padding: 8,
    alignItems: "center",
  },

  // === DEFAULT ===
  defaultContainer: {
    padding: 8,
    alignItems: "center",
  },

  // === SKELETON ===
  skeletonContainer: {
    padding: 16,
    minHeight: 80,
    overflow: "hidden",
  },
  skeletonContent: {
    gap: 8,
  },
  skeletonLine: {
    backgroundColor: "#EEEEEE",
    borderRadius: 4,
  },
});

export default LoadingSpinner;
