module.exports = {
  expo: {
    name: "BlueDeep",
    slug: "BlueDeep",
    plugins: ["expo-sqlite", "expo-barcode-scanner"],
    android: {
      package: "com.eric888.BlueDeep",
      permissions: ["CAMERA"]
    },
    ios: {
      bundleIdentifier: "com.eric888.Stockia"
    },
    extra: {
      eas: {
        projectId: "cc4be9bf-65c5-47a0-9335-e52182910620"
      }
    }
  }
};