import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useRef, useState } from "react";
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

// === INTERFACES ===
export interface InputProps extends TextInputProps {
  /** Label du champ */
  label?: string;
  /** Message d'erreur */
  error?: string;
  /** Message d'aide */
  helper?: string;
  /** Icône à gauche */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Icône à droite */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  /** Action de l'icône droite */
  onRightIconPress?: () => void;
  /** Variante de style */
  variant?: "default" | "outlined" | "filled" | "underline";
  /** Taille du champ */
  size?: "small" | "medium" | "large";
  /** Désactiver le champ */
  disabled?: boolean;
  /** Afficher le mot de passe */
  secureTextEntry?: boolean;
  /** Afficher le compteur de caractères */
  showCounter?: boolean;
  /** Nombre maximum de caractères */
  maxLength?: number;
  /** Style personnalisé */
  style?: ViewStyle;
  /** Style du label */
  labelStyle?: TextStyle;
  /** Style du conteneur */
  containerStyle?: ViewStyle;
  /** Style du champ de saisie */
  inputStyle?: TextStyle;
  /** Style du message d'erreur */
  errorStyle?: TextStyle;
  /** Style du message d'aide */
  helperStyle?: TextStyle;
  /** Couleur de focus */
  focusColor?: string;
  /** Couleur d'erreur */
  errorColor?: string;
  /** Placeholder */
  placeholder?: string;
  /** Valeur du champ */
  value?: string;
  /** Fonction de changement */
  onChangeText?: (text: string) => void;
  /** Fonction de validation */
  onValidate?: (text: string) => boolean;
  /** Nettoyer le champ */
  clearable?: boolean;
  /** Largeur complète */
  fullWidth?: boolean;
  /** Masquer le label flottant */
  floatingLabel?: boolean;
}
export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      onRightIconPress,
      variant = "default",
      size = "medium",
      disabled = false,
      secureTextEntry = false,
      showCounter = false,
      maxLength,
      style,
      labelStyle,
      containerStyle,
      inputStyle,
      errorStyle,
      helperStyle,
      focusColor = "#1565C0",
      errorColor = "#C62828",
      placeholder,
      value = "",
      onChangeText,
      onValidate,
      clearable = false,
      fullWidth = false,
      floatingLabel = false,
      ...props
    },
    ref,
  ) => {
    // === ÉTATS ===
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState(value || "");
    const [isValid, setIsValid] = useState(true);
    const animatedLabel = useRef(new Animated.Value(0)).current;

    // === GESTION DES VALEURS ===
    const currentValue = value !== undefined ? value : internalValue;
    const currentOnChange = onChangeText || setInternalValue;

    const handleChange = (text: string) => {
      currentOnChange(text);
      if (onValidate) {
        setIsValid(onValidate(text));
      }
    };

    // === GESTION DU FOCUS ===
    const handleFocus = () => {
      setIsFocused(true);
      Animated.timing(animatedLabel, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (!currentValue) {
        Animated.timing(animatedLabel, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    };

    // === RENDU DU LABEL ===
    const renderLabel = () => {
      if (!label) return null;

      const labelStyles = [
        styles.label,
        { color: error ? errorColor : isFocused ? focusColor : "#666" },
        labelStyle,
      ];

      return <Text style={labelStyles}>{label}</Text>;
    };

    // === RENDU DU LABEL FLOTTANT ===
    const renderFloatingLabel = () => {
      if (!floatingLabel || !label) return null;

      const translateY = animatedLabel.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -20],
      });

      const fontSize = animatedLabel.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 12],
      });

      const color = animatedLabel.interpolate({
        inputRange: [0, 1],
        outputRange: ["#999", error ? errorColor : focusColor],
      });

      return (
        <Animated.Text
          style={[
            styles.floatingLabel,
            {
              transform: [{ translateY }],
              fontSize,
              color,
            },
          ]}
        >
          {label}
        </Animated.Text>
      );
    };

    // === RENDU DES ICÔNES ===
    const renderLeftIcon = () => {
      if (!leftIcon) return null;
      return (
        <View style={styles.leftIconContainer}>
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? errorColor : isFocused ? focusColor : "#999"}
          />
        </View>
      );
    };

    const renderRightIcon = () => {
      if (secureTextEntry) {
        return (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconContainer}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={error ? errorColor : isFocused ? focusColor : "#999"}
            />
          </TouchableOpacity>
        );
      }

      if (clearable && currentValue) {
        return (
          <TouchableOpacity
            onPress={() => handleChange("")}
            style={styles.rightIconContainer}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        );
      }

      if (rightIcon) {
        return (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={error ? errorColor : isFocused ? focusColor : "#999"}
            />
          </TouchableOpacity>
        );
      }

      return null;
    };

    // === STYLES DYNAMIQUES ===
    const getVariantStyles = () => {
      switch (variant) {
        case "outlined":
          return {
            borderWidth: 1,
            borderColor: error ? errorColor : isFocused ? focusColor : "#DDD",
            backgroundColor: "transparent",
          };
        case "filled":
          return {
            borderWidth: 0,
            borderBottomWidth: 0,
            backgroundColor: isFocused ? "#E3F2FD" : "#F5F5F5",
          };
        case "underline":
          return {
            borderWidth: 0,
            borderBottomWidth: 2,
            borderBottomColor: error
              ? errorColor
              : isFocused
                ? focusColor
                : "#DDD",
            backgroundColor: "transparent",
            borderRadius: 0,
          };
        default:
          return {
            borderWidth: 1,
            borderColor: error ? errorColor : isFocused ? focusColor : "#DDD",
            backgroundColor: "#FFFFFF",
          };
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case "small":
          return {
            paddingVertical: 6,
            paddingHorizontal: 10,
            fontSize: 12,
            height: 36,
          };
        case "large":
          return {
            paddingVertical: 14,
            paddingHorizontal: 16,
            fontSize: 18,
            height: 52,
          };
        default:
          return {
            paddingVertical: 10,
            paddingHorizontal: 14,
            fontSize: 16,
            height: 44,
          };
      }
    };

    const variantStyle = getVariantStyles();
    const sizeStyle = getSizeStyles();

    const inputContainerStyles: ViewStyle[] = [
      styles.inputContainer,
      {
        borderWidth: variantStyle.borderWidth || 0,
        borderColor: variantStyle.borderColor || "transparent",
        borderBottomWidth: variantStyle.borderBottomWidth || 0,
        borderBottomColor: variantStyle.borderBottomColor || "transparent",
        backgroundColor: variantStyle.backgroundColor || "#FFFFFF",
        borderRadius: variant === "underline" ? 0 : 8,
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? "100%" : undefined,
      },
      style,
      containerStyle,
    ];

    const inputStyles: TextStyle[] = [
      styles.input,
      {
        fontSize: sizeStyle.fontSize,
        paddingVertical: sizeStyle.paddingVertical,
        paddingHorizontal: sizeStyle.paddingHorizontal,
        height: sizeStyle.height,
        color: disabled ? "#999" : "#333",
      },
      inputStyle,
      leftIcon && { paddingLeft: 36 },
      (rightIcon || secureTextEntry || clearable) && { paddingRight: 36 },
    ]; // === RENDU PRINCIPAL ===
    return (
      <View style={[styles.container, fullWidth && { width: "100%" }]}>
        {/* Label */}
        {!floatingLabel && renderLabel()}

        {/* Conteneur du champ */}
        <View style={inputContainerStyles}>
          {/* Label flottant */}
          {floatingLabel && renderFloatingLabel()}

          {/* Icône gauche */}
          {renderLeftIcon()}

          {/* Champ de saisie */}
          <TextInput
            ref={ref}
            style={inputStyles}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={currentValue}
            onChangeText={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={secureTextEntry && !showPassword}
            editable={!disabled}
            maxLength={maxLength}
            {...props}
          />

          {/* Icône droite */}
          {renderRightIcon()}
        </View>

        {/* Messages d'aide et d'erreur */}
        {error ? (
          <Text style={[styles.errorText, errorStyle]}>{error}</Text>
        ) : helper ? (
          <Text style={[styles.helperText, helperStyle]}>{helper}</Text>
        ) : null}

        {/* Compteur de caractères */}
        {showCounter && maxLength && (
          <Text style={styles.counter}>
            {currentValue.length}/{maxLength}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = "Input";
const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: "relative",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 6,
  },
  floatingLabel: {
    position: "absolute",
    top: 12,
    left: 14,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    paddingHorizontal: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: "transparent",
      },
    }),
  },
  input: {
    flex: 1,
    color: "#333",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  leftIconContainer: {
    paddingLeft: 10,
    paddingRight: 4,
  },
  rightIconContainer: {
    paddingRight: 10,
    paddingLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#C62828",
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    marginLeft: 4,
  },
  counter: {
    fontSize: 11,
    color: "#999",
    textAlign: "right",
    marginTop: 2,
    marginRight: 4,
  },
});

export default Input;
