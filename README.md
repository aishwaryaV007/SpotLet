# 🏠 SpotLet - Map-Based Rental House Discovery

A modern, full-featured **React Native Expo application** for discovering and listing rental properties in India. SpotLet integrates interactive maps, detailed property management, saved properties, and secure phone OTP authentication.

![Status](https://img.shields.io/badge/status-Ready%20to%20Run-brightgreen)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue)
![Expo](https://img.shields.io/badge/Expo-54.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)

---

## ⚡ Quick Start

To run the application locally on your machine, follow these steps to clean and refresh dependencies with the latest fixes:

### 1. Clean Existing Node Modules
```bash
rmdir /s /q node_modules
```

### 2. Clean npm Cache
```bash
npm cache clean --force
```

### 3. Install Compatible Dependencies
```bash
npm install
```
*(This install includes the critical `react-native-worklets` package needed for Reanimated v4)*

### 4. Start the Metro Bundler
```bash
npm start
```
*Press **a** to run on an Android emulator, **i** for iOS simulator, **w** for web browser, or scan the QR code using the **Expo Go** app on your physical mobile device.*

---

## 📱 Features

### 🔐 User Authentication & Context Flow
*   **Phone OTP Login**: A streamlined SMS-based login flow using Supabase Phone Auth.
*   **Auth Guard**: The root router checks login state in `contexts/AuthContext.tsx` and dynamically redirects authenticated users to the dashboard tabs, and unauthenticated users to the Login view.
*   **Profile Integration**: User details and verification states are managed seamlessly across sessions.

### 🏠 Home Screen
*   **Live Search**: Real-time property searching and filtering.
*   **Filter Chips**: Instant filtering by property type (1BHK, 2BHK, PG, Room).
*   **Indian Rupee Formatting**: Consistent local pricing formatting (₹).
*   **Furnished Indicators**: Badges indicating if properties are furnished or unfurnished.

### 🗺️ Map Screen
*   **Interactive Pins**: Map rendering powered by `react-native-maps` with Google Maps configuration.
*   **Color-Coded Property Markers**:
    *   🔴 **Red** (#FF6B6B) - Flat / Apartment (1BHK, 2BHK)
    *   🔵 **Blue** (#4ECDC4) - PG (Paying Guest)
    *   🟢 **Green** (#95E1D3) - Single Room
*   **Property Detail Bottom Sheet**: Tap a marker to reveal key pricing details, photos, and fast actions:
    *   **Call Owner**: Directly dials the owner.
    *   **WhatsApp**: Initiates a chat on WhatsApp with pre-filled property details.
    *   **Navigate**: Launches Google Maps directions to the property.

### ➕ Add Property Screen
*   **Form Validation**: Inputs for property title, monthly rent, security deposit, description, type, and owner contact details.
*   **Multi-Image Selection**: Select multiple images using `expo-image-picker`.
*   **Supabase Submission**: Uploads images to Supabase Storage and inserts property records with geographic coordinates.

### ❤️ Saved Properties Screen
*   **Bookmarks**: Instantly save or unsave favorite properties to your account.
*   **Persistent Layout**: Renders bookmarked listings using the same beautiful design as the home feed.

### 👤 Profile Screen
*   **User Statistics**: Shows counts of listed and saved properties.
*   **Edit Profile Mode**: Inline editing of user name and profile details, directly syncing back to the Supabase database.

---

## 🎨 Design System & Colors

SpotLet is built with a premium dark-themed Material Design 3 interface utilizing `react-native-paper`.

*   **Background**: `#121212` (Deep Dark Black)
*   **Surface**: `#1E1E1E` (Dark Charcoal)
*   **Primary Accent**: `#BB86FC` (Vibrant Purple)
*   **Secondary Accent**: `#03DAC6` (Teal/Cyan)
*   **Tertiary Accent**: `#CF6679` (Light Coral Pink)

---

## 📦 Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Core Framework** | React Native | `0.81.5` |
| **Tooling & Platform** | Expo SDK | `54.0.0` |
| **Language** | TypeScript | `^5.9.3` |
| **Navigation** | expo-router / react-navigation | `~6.0.23` |
| **UI Kit** | react-native-paper (Material 3) | `^5.11.0` |
| **Maps** | react-native-maps (Google Maps) | `1.20.1` |
| **Backend API / Auth** | Supabase JS Client | `^2.44.0` |
| **Location APIs** | expo-location | `~19.0.8` |
| **Image Uploader** | expo-image-picker | `~17.0.11` |
| **Animation Engine** | react-native-reanimated + worklets | `~4.1.1` / `^0.4.0` |

---

## 📁 Project Structure

```
SpotLet/
├── app/
│   ├── _layout.tsx              # Root layout (Dark theme & Auth Providers)
│   ├── index.tsx                # Auth guard entry point
│   ├── (tabs)/                  # Tab-Based Dashboard Navigation
│   │   ├── _layout.tsx          # Tab navigator & style configuration
│   │   ├── index.tsx            # Home screen feed with listings
│   │   ├── map.tsx              # Google Maps with color-coded markers
│   │   ├── add.tsx              # Create property form
│   │   ├── saved.tsx            # Favorite bookmarks list
│   │   └── profile.tsx          # Profile screen & statistics
│   └── auth/                    # Phone OTP Login Stack
│       ├── _layout.tsx          # Authentication navigator stack
│       ├── index.tsx            # Redirects to /auth/login
│       └── login.tsx            # Phone OTP entry & code verification
├── assets/                      # App launcher and splash screen images
│   ├── favicon.png
│   ├── icon.png
│   └── splash.png
├── contexts/
│   └── AuthContext.tsx          # React Context for login state & verification
├── lib/
│   └── supabase.ts              # Supabase API helper methods and client
├── types/
│   ├── auth.ts                  # Auth-related TypeScript declarations
│   └── property.ts              # Property & Saved Property schema definitions
├── app.json                     # Expo manifest (API keys & App permissions)
├── package.json                 # Dependency list and dev scripts
└── tsconfig.json                # TypeScript compiler config
```

---

## 🛠️ Resolved Issues & Stability Fixes

Four major environment and configuration issues have been fixed to ensure smooth building and loading on all devices:

1.  **₹ Unicode Symbol SyntaxError**: Fixed formatting issue in `initialize.js` where the raw rupee symbol (`₹`) was causing compilation syntax errors. It has been replaced with the safe unicode representation `\u20B9`.
2.  **Missing Static Assets**: Created the `assets/` directory and generated placeholder PNGs (`icon.png`, `splash.png`, `favicon.png`) preventing Metro bundling errors.
3.  **Expo SDK 54 Dependency Alignments**: Upgraded 18 package definitions in `package.json` to be fully compatible with Expo 54.0.0 and React Native 0.81.5.
4.  **Reanimated Crash Fix (react-native-worklets)**: Added `react-native-worklets` version `^0.4.0` to package dependencies. Reanimated v4.x requires this plugin to be present; its absence previously caused Metro bundling crashes (Error 500) on device.

---

## 🧭 Verification & Troubleshooting

### Check Configuration Status
You can run the built-in checker to verify your project files and setup:
```bash
node verify-fixes.js
```
*Expected output: `✅ 11 passed | ❌ 0 issues`*

### Common Resolving Steps
*   **Metro Cache Reset**: If hot reloading or bundling fails, start Expo with a cleared cache:
    ```bash
    npx expo start --clear
    ```
*   **Port Conflicts**: Run Metro on a custom port if another process occupies `8081`:
    ```bash
    npx expo start --port 8082
    ```
