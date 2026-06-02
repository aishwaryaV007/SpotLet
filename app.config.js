module.exports = {
  expo: {
    name: "SpotLet",
    displayName: "SpotLet",
    version: "1.0.0",
    description: "Discover rental homes on a live map",
    slug: "spotlet",
    scheme: "spotlet",
    privacy: "public",
    sdkVersion: "54.0.0",
    platforms: [
      "ios",
      "android",
      "web"
    ],
    ios: {
      supportsTabletMode: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "SpotLet needs access to your location to show nearby rentals.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "SpotLet needs access to your location to show nearby rentals.",
        NSPhotoLibraryUsageDescription: "We need access to your photos to upload property images."
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
      }
    },
    android: {
      package: "com.spotlet.app",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "CAMERA"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
        }
      },
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#7165e3"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0c0c0b"
    },
    icon: "./assets/icon.png",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    plugins: [
      [
        "expo-splash-screen",
        {
          "image": "./assets/splash.png",
          "resizeMode": "contain",
          "backgroundColor": "#0c0c0b"
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
        }
      ],
      "expo-router"
    ]
  }
};
