
```
 ____                  _   _          _
/ ___| _ __   ___  _ _| | | |    ___ | |_
\___ \| '_ \ / _ \| '_| | | |   / _ \| __|
 ___) | |_) | (_) | |_| |_| |__| |__/| |_
|____/| .__/ \___/\___|\__|_____\___| \__|
      |_|
```

<div align="center">

# ✦ SpotLet ✦

### *Spot it. Let it. Done.*

> **Map-powered rental discovery for 500 million Indians looking for a home.**

<br/>

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev)
[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54.0.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-2.44.0-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-1.20.1-4285f4?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-REST%20API-3448c5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=for-the-badge)](https://expo.dev)
[![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)](LICENSE)

</div>

---

## 📖 The Problem — A Story in Three Days

### 🌅 Day 1 — The Move

Priya gets a job in Bengaluru. She's excited. She opens WhatsApp and her relative sends her 3 broker numbers. She calls all three. Two don't pick up. The one that does quotes ₹2,00,000 as brokerage — for a flat she hasn't even seen a photo of.

She opens a classifieds website. Searches "2BHK Koramangala". Gets 847 results. Half are listed 6 months ago. Prices are negotiated separately "on call". She doesn't know where Koramangala ends and HSR Layout begins.

### ☀️ Day 2 — The Wasted Journey

She visits 4 places with a broker. Two are actually in different areas than advertised. One flat is "available" — but the owner is out of town for 10 days. The fourth is over budget by ₹4,000. The broker still wants to be paid.

She goes home exhausted. She's been at this since 9 AM. It's now 6 PM. She hasn't found a single place.

### 🌙 Day 3 — Still Searching

She's staying in a friend's house. She's already asked for 3 more days. She's on page 7 of broker listings. The anxiety is real. The process of searching, calling, visiting, verifying — it consumes 3 to 7 days on average. For working professionals, students, migrants — this is a crisis nobody built a real solution for.

**Until SpotLet.**

---

## ⚡ What SpotLet Does

| Scenario | ❌ Before SpotLet | ✅ After SpotLet |
|----------|-------------------|-----------------|
| Finding a rental | Calling 10 brokers who may not even pick up | Open map → tap pins → see real listings instantly |
| Verifying location | "Near metro station" is vague | Exact GPS pin dropped by the owner on a live map |
| Checking price | "Call to enquire" — opaque pricing | Rent + deposit visible right on the map marker |
| Contacting owner | Wait for broker to relay messages | Tap **Call** or **WhatsApp** directly from the listing |
| Saving favourites | Screenshot and forget | ❤️ Save listings to your account — synced across sessions |
| Listing a property | Pay a broker; wait days for reach | Fill form → drop pin → upload photos → publish in minutes |
| Authentication | Create account + password | Phone OTP & Google Sign-In — zero friction |
| Guest Browsing | Forced login to see anything | Browse map & listings freely, login only to contact or save |

---

## 🗺️ How It Works

### For the Seeker 🔍

```
1. Open SpotLet → Land on Login Screen
        │
        ▼
2. Enter phone number → OTP sent via Supabase Auth (SMS)
        │
        ▼
3. Verify 6-digit OTP → Authenticated session starts
        │
        ▼
4. Home Feed loads → Browse listings with search + type filters
        │                    (1BHK · 2BHK · 3BHK · PG · Room · Independent House)
        ▼
5. Tap "Map" FAB or bottom tab → Full-screen Google Maps view
        │
        ▼
6. Price bubbles appear as map markers → Each bubble = ₹rent/mo
        │
        ▼
7. Tap a marker → Snap carousel animates to that listing card
        │
        ▼
8. Tap card → Bottom sheet modal slides up with full details:
        │          photos · rent · deposit · type · furnishing
        │          preferred tenants · amenities · description
        ▼
9. Tap "Call Owner" or "WhatsApp" → Direct contact, zero brokerage
        │
        ▼
10. ❤️ Save listing → Persisted to your account via Supabase
```

### For the Owner 🏠

```
1. Login with phone OTP
        │
        ▼
2. Tap "Add" tab → "List Your Property" form opens
        │
        ▼
3. Fill basic details:
        │    Title · Description · Monthly Rent (₹) · Security Deposit (₹)
        ▼
4. Select specifications:
        │    Room Type: [1BHK · 2BHK · 3BHK · PG · Room · Independent House]
        │    Preferred Tenants: [Bachelor · Family · Any]
        │    Furnished toggle
        ▼
5. Set location:
        │    → Type address (auto-geocoded with 1.5s debounce)
        │    → OR tap "Use Current" to GPS-fill + reverse geocode
        │    → OR drag the map pin to fine-tune exact location
        ▼
6. Upload photos from gallery (expo-image-picker)
        │    → Uploaded to Cloudinary via REST API
        │    → Fallback to curated Unsplash images on upload failure
        ▼
7. Enter contact phone number (pre-filled from your profile)
        │
        ▼
8. Tap "Post Listing" → Property inserted into Supabase `properties` table
        │
        ▼
9. Redirect to Home Feed → Your listing is LIVE for all seekers
```

---

## 📍 Map Pin Legend

> SpotLet uses **price bubble markers** on a custom dark Google Maps style. The selected marker highlights in purple (#BB86FC).

| Pin State | Color | Hex | Meaning |
|-----------|-------|-----|---------|
| 🟣 Selected | Vibrant Purple | `#BB86FC` | Currently highlighted/active listing |
| ⬛ Default | Dark Surface | `#1E1E1E` | Unselected listing on the map |
| 🟩 Add-form pin | Purple Marker | `#BB86FC` | Drop-pin location during property creation |

> All markers display **₹{rent}** inline — no need to tap to see the price.

---

## 🚀 Features

| # | Feature | Description |
|---|---------|-------------|
| 🔐 | **Authentication** | Passwordless Phone OTP & Google Sign-In — zero friction |
| 🕵️ | **Guest Browsing** | Browse properties freely without an account; login only for protected actions |
| 🏠 | **Home Feed** | Scrollable property cards with search, category filters, and pull-to-refresh |
| 🗺️ | **Live Map** | Full-screen Google Maps with custom dark style, price-bubble markers, snap carousel |
| 📍 | **GPS Location** | Real-time user location on map; auto-zoom on permission grant |
| 🔍 | **Advanced Filters** | Filter by type · furnishing · tenant preference · keyword search — all chainable |
| ➕ | **List Property** | Complete form flow: title, price, specs, address geocoding, map pin, photos, contact |
| 📷 | **Photo Upload** | Multi-image picker → Cloudinary CDN upload with graceful Unsplash fallback |
| 📬 | **Direct Contact** | One-tap `tel:` call or WhatsApp deep-link with pre-written message template |
| ❤️ | **Save/Unsave** | Optimistic UI save/unsave with Supabase-backed persistence per user |
| 💾 | **Saved Listings** | Dedicated tab showing all bookmarked properties with full detail modal |
| 📊 | **My Properties** | Dashboard to manage your listings with edit, soft-delete, and restore actions |
| 🌙 | **Dark Mode** | Full Material Design 3 dark theme via react-native-paper, zero light mode flicker |
| 🔄 | **Session Persistence** | `onAuthStateChange` listener keeps session alive across app restarts |
| 📱 | **Cross-Platform** | Runs on iOS · Android · Web via Expo SDK 54, with responsive layouts |
| 🛡️ | **Auth Guard** | Guest access to feeds, with a smooth Login Prompt Sheet for protected actions |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Expo App)                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   app/auth/  │  │  app/(tabs)/ │  │  contexts/           │  │
│  │  login.tsx   │  │  index.tsx   │  │  AuthContext.tsx      │  │
│  │  (OTP Flow)  │  │  map.tsx     │  │  (Session · State)   │  │
│  │              │  │  add.tsx     │  └──────────────────────┘  │
│  └──────┬───────┘  │  saved.tsx   │                            │
│         │          │  profile.tsx │  ┌──────────────────────┐  │
│         │          └──────┬───────┘  │  types/              │  │
│         │                 │          │  auth.ts             │  │
│         └────────┬────────┘          │  property.ts         │  │
│                  │                   └──────────────────────┘  │
│         ┌────────▼────────┐                                     │
│         │     lib/        │                                     │
│         │  supabase.ts    │──── Auth · CRUD · Save/Unsave       │
│         │  cloudinary.ts  │──── Image Upload REST API           │
│         └────────┬────────┘                                     │
└──────────────────┼──────────────────────────────────────────────┘
                   │
         ┌─────────┼──────────────────────────────────────┐
         │         │         External Services             │
         │  ┌──────▼──────┐  ┌────────────┐  ┌─────────┐ │
         │  │  Supabase   │  │  Google    │  │Cloudinary│ │
         │  │  ─────────  │  │  Maps API  │  │  CDN     │ │
         │  │  Auth (OTP) │  │  ─────────  │  │  ──────  │ │
         │  │  PostgreSQL │  │  Maps      │  │  Image   │ │
         │  │  (properties│  │  Geocoding │  │  Upload  │ │
         │  │   saved_    │  │  Reverse   │  │  REST    │ │
         │  │   properties│  │  Geocode   │  │  Preset  │ │
         │  │   users)    │  └────────────┘  └─────────┘ │
         │  └─────────────┘                              │
         └───────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

```yaml
# Exact versions from package.json

runtime:
  react: "19.1.0"
  react-native: "0.81.5"
  react-dom: "19.1.0"

platform:
  expo: "^54.0.0"
  expo-router: "~6.0.23"
  expo-splash-screen: "~31.0.13"
  expo-status-bar: "~3.0.9"
  expo-constants: "~18.0.13"
  expo-font: "~14.0.11"

navigation:
  "@react-navigation/native": "^6.1.0"
  "@react-navigation/bottom-tabs": "^6.5.0"

ui:
  react-native-paper: "^5.11.0"           # Material Design 3 components
  react-native-safe-area-context: "~5.6.0"
  react-native-gesture-handler: "~2.28.0"
  react-native-screens: "~4.16.0"

maps:
  react-native-maps: "1.20.1"             # Google Maps provider

backend:
  "@supabase/supabase-js": "^2.44.0"      # Auth (Phone OTP) + PostgreSQL

media:
  expo-image-picker: "~17.0.11"           # Gallery picker
  expo-location: "~19.0.8"               # GPS + Geocoding

animation:
  react-native-reanimated: "~4.1.1"
  react-native-worklets: "^0.4.0"         # Required peer for Reanimated v4

web:
  react-native-web: "^0.21.0"

devtools:
  typescript: "^5.9.3"
  "@babel/core": "^7.24.0"
  "@types/react": "~19.1.10"
  "@types/react-native": "^0.73.0"
```

---

## 📁 Project Structure

```
SpotLet/                                  # Project root
│
├── app/                                  # Expo Router file-based routing
│   ├── _layout.tsx                       # Root layout: GestureHandler + PaperProvider + AuthProvider
│   ├── index.tsx                         # Auth guard: redirects to /(tabs) or /auth
│   │
│   ├── (tabs)/                           # Tab navigator (authenticated zone)
│   │   ├── _layout.tsx                   # Tab bar: Home · Map · Add · Saved · Profile
│   │   ├── index.tsx                     # 🏠 Home feed: search + filter + property cards + detail modal
│   │   ├── map.tsx                       # 🗺️ Map: Google Maps + price markers + carousel + detail modal
│   │   ├── add.tsx                       # ➕ List property: form + mini-map pin + photo upload
│   │   ├── saved.tsx                     # ❤️ Saved listings: bookmarks + detail modal
│   │   ├── my-properties.tsx             # 📊 My Properties: dashboard to edit, soft-delete, and restore
│   │   └── profile.tsx                   # 👤 Profile: stats, account info, and sign out
│   │
│   └── auth/                             # Unauthenticated zone
│       ├── _layout.tsx                   # Auth layout (Slot passthrough)
│       ├── index.tsx                     # Redirects to /auth/login
│       └── login.tsx                     # Phone input → OTP send → OTP verify
│
├── assets/                               # Static assets bundled with the app
│   ├── adaptive-icon.png                 # Android adaptive icon (bg: #7165e3)
│   ├── favicon.png                       # Web favicon
│   ├── icon.png                          # App icon
│   └── splash.png                        # Splash screen (bg: #0c0c0b)
│
├── components/                           # Custom shared React components
│   ├── CustomMap.tsx                     # Native maps wrapper (imports react-native-maps)
│   ├── CustomMap.web.tsx                 # Web maps wrapper (mock fallback, no native imports)
│   ├── LoginPromptSheet.tsx              # Bottom sheet prompting guests to login
│   └── PropertyDetailsModal.tsx          # Bottom sheet / modal displaying property details
│
├── contexts/
│   └── AuthContext.tsx                   # React Context: signInWithOTP · verifyOTP · signOut · isLoggedIn
│
├── lib/
│   ├── supabase.ts                       # Supabase client + all DB/Auth helpers
│   ├── cloudinary.ts                     # Cloudinary image upload via REST API
│   └── polyfills.ts                      # DOMException polyfill for Hermes engine
│
├── types/
│   ├── auth.ts                           # AuthState · AuthUser · AuthSession · OTPResponse · UserProfile
│   └── property.ts                       # Property · PropertyType · ForWhomType · SavedProperty · User
│
├── utils/
│   └── useResponsive.ts                  # Hook for responsive web breakpoints
│
├── .env                                  # ⚠️ Secret — gitignored (see .env.example)
├── .env.example                          # Template for required environment variables
├── .gitignore                            # Ignores node_modules, .expo, .env, build outputs
├── app.config.js                         # Dynamic Expo config (injects env vars at build time)
├── app.json                              # Expo manifest: name, slug, permissions, SDK version
├── entry.js                              # Custom main entry point (registers polyfills before routing)
├── metro.config.js                       # Metro bundler config (uses Expo defaults)
├── package.json                          # Dependencies, scripts, version
├── tsconfig.json                         # TypeScript: strict mode, path alias @/* → ./*
└── vercel.json                           # Vercel deployment config (SPA routing rewrites)
```

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- [Expo Go](https://expo.dev/go) app on your phone (for physical device testing)
- OR Android Emulator / iOS Simulator

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/aishwaryaV007/SpotLet.git
cd SpotLet

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your actual service credentials (see below)

# 4. Start the development server
npm start
# or
npx expo start --clear

# Then:
# Press [a] → Android emulator
# Press [i] → iOS simulator
# Press [w] → Web browser
# Scan QR code → Expo Go on your phone
```

### Available Scripts

npm start          # Start Expo Metro bundler
npm run android    # Start with Android target
npm run ios        # Start with iOS target
npm run web        # Start with web target
npm run build      # Export production web bundle for Vercel/Netlify hosting
npm run lint       # Run ESLint
npm test           # Run Jest tests (watch mode)
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root. **Never commit this file** (it is gitignored by default).

```bash
# .env — copy from .env.example and fill in your values

# Supabase — https://supabase.com/dashboard/project/<your-ref>/settings/api
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google Maps — https://console.cloud.google.com/apis/credentials
# Enable: Maps SDK for Android, Maps SDK for iOS
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Cloudinary — https://cloudinary.com/console
# Create an unsigned upload preset named e.g. "spotlet_upload"
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name-here
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-cloudinary-upload-preset-here
```

> **Tip:** All variables prefixed with `EXPO_PUBLIC_` are bundled into the client at build time by Expo. They are NOT server-side secrets — treat accordingly.

---

## 🗄️ Database Setup

SpotLet uses **Supabase** (PostgreSQL) as its backend database. Run the following SQL in your Supabase SQL Editor to create the required tables.

### Table: `properties`

```sql
CREATE TABLE public.properties (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       text NOT NULL,
  description text,
  rent        numeric NOT NULL,
  deposit     numeric NOT NULL,
  type        text NOT NULL
    CHECK (type IN ('1BHK', '2BHK', '3BHK', 'PG', 'Room', 'Independent House')),
  furnished   boolean DEFAULT false NOT NULL,
  for_whom    text NOT NULL
    CHECK (for_whom IN ('Family', 'Bachelor', 'Any')),
  latitude    double precision NOT NULL,
  longitude   double precision NOT NULL,
  address     text NOT NULL,
  photos      text[] DEFAULT '{}' NOT NULL,
  owner_phone text NOT NULL,
  owner_name  text,
  amenities   text[],
  available   boolean DEFAULT true NOT NULL,
  is_deleted  boolean DEFAULT false NOT NULL,
  status      text DEFAULT 'active' CHECK (status IN ('active', 'rented', 'inactive')),
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Anyone can read available properties
CREATE POLICY "Anyone can view properties"
  ON public.properties FOR SELECT
  USING (available = true AND is_deleted = false);

-- Only the owner can insert
CREATE POLICY "Owners can insert their properties"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Only the owner can update
CREATE POLICY "Owners can update their properties"
  ON public.properties FOR UPDATE
  USING (auth.uid() = owner_id);
```

### Table: `saved_properties`

```sql
CREATE TABLE public.saved_properties (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  saved_at    timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, property_id)
);

-- Enable RLS
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved items
CREATE POLICY "Users can view their saved properties"
  ON public.saved_properties FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save properties
CREATE POLICY "Users can save properties"
  ON public.saved_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave
CREATE POLICY "Users can unsave properties"
  ON public.saved_properties FOR DELETE
  USING (auth.uid() = user_id);
```

### Table: `users` (optional profile store)

```sql
CREATE TABLE public.users (
  id         uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  phone      text,
  name       text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR ALL
  USING (auth.uid() = id);
```

> **Enable Phone Auth in Supabase:** Go to `Authentication → Providers → Phone` and enable it. Configure your Twilio credentials (or use Supabase's built-in OTP in test mode).

---

## 🌏 The Opportunity

| Metric | Value |
|--------|-------|
| 🇮🇳 Indians looking for rentals annually | **500M+** |
| 📵 Searches that still happen physically or via brokers | **~90%** |
| ⏳ Average days spent searching for a rental | **3–7 days** |
| 💸 Average brokerage paid to an agent | **1–2 months rent** |
| 🏢 Tier-2/3 cities with zero digital rental inventory | **Hundreds** |
| 📱 Indians with smartphones (potential reach) | **750M+** |
| 🔑 Key differentiator | **Zero brokerage · Map-first · Phone OTP · WhatsApp contact** |

SpotLet doesn't just digitize rental listings — it **removes the middleman entirely** and gives both seekers and owners a direct, transparent, location-aware channel.

---

## 🗺️ Roadmap

### ✅ Already Built

- [x] Phone OTP authentication (Supabase SMS)
- [x] Home feed with property cards, search & category filters
- [x] Full-screen Google Maps with price-bubble markers
- [x] Custom dark map style JSON
- [x] Snap carousel synced to map markers
- [x] Property detail bottom sheet modal (photos · rent · deposit · amenities · contact)
- [x] One-tap Call Owner (`tel:` deep-link)
- [x] One-tap WhatsApp with pre-filled message
- [x] Save / Unsave with optimistic UI
- [x] Saved Listings screen
- [x] Add Property form (title · price · type · furnishing · for-whom · address · photos · contact)
- [x] Address auto-geocoding with 1.5s debounce (expo-location)
- [x] Reverse geocoding when using current location
- [x] Interactive mini-map with draggable pin in add form
- [x] Cloudinary image upload (REST API, no native SDK)
- [x] Unsplash fallback images on upload failure
- [x] Multi-filter chaining (type + furnishing + tenant + keyword)
- [x] Pull-to-refresh on all feed screens
- [x] Dark Material Design 3 theme (react-native-paper)
- [x] Cross-platform support: iOS · Android · Web
- [x] Google Sign-In authentication
- [x] Guest browsing mode with login prompts for protected actions
- [x] Responsive web design (mobile web bottom tabs + desktop layouts)
- [x] "My Properties" dashboard with property stats
- [x] Soft-delete & restore listings functionality

### 🔜 Planned

- [ ] Push notifications for new listings in saved areas
- [ ] Advanced price range slider filter
- [ ] Tenant reviews and owner ratings
- [ ] In-app chat (no need to leave the app)
- [ ] Verified owner badge (Aadhaar / document check)
- [ ] Neighbourhood heatmap (rental price density)
- [ ] Saved search alerts (notify when new listing matches)
- [ ] Multi-language support (Hindi, Kannada, Tamil, Telugu)
- [ ] Admin dashboard for listing moderation
- [ ] EAS Build + OTA updates via Expo Application Services

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

```bash
# 1. Fork the repository on GitHub
# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes
# 4. Lint and test
npm run lint
npm test

# 5. Commit with a descriptive message
git commit -m "feat: add neighbourhood heatmap view"

# 6. Push and open a Pull Request
git push origin feature/your-feature-name
```

### Branch Naming Convention

| Prefix | Purpose |
|--------|---------|
| `feature/` | New feature |
| `fix/` | Bug fix |
| `chore/` | Tooling, deps, config |
| `docs/` | Documentation only |
| `refactor/` | Code restructuring |

### Code Style

- TypeScript strict mode is enforced (`"strict": true` in `tsconfig.json`)
- No unused imports — `"noUnusedLocals": true`
- All new screens go under `app/(tabs)/` or `app/auth/`
- All DB operations go through `lib/supabase.ts`
- All image uploads go through `lib/cloudinary.ts`

---

## 🌐 Deployment (Vercel)

SpotLet is pre-configured for seamless deployment as a Single Page Application (SPA) on **Vercel**:

1. **Routing Redirects (`vercel.json`)**: Configures fallback rewrites forwarding all page requests back to `/index.html` so that refreshing pages (like `/map`) does not return a Vercel server 404 error.
2. **Build Configuration**:
   - **Build Command**: `npm run build` (which runs `expo export --platform web`)
   - **Output Directory**: `dist` (default Expo Web production export directory)

---

## 🔒 Security Notes

- `.env` is **gitignored** — never commit API keys
- Supabase Row Level Security (RLS) is required — see [Database Setup](#️-database-setup)
- All `EXPO_PUBLIC_*` variables are bundled into the client — use Supabase anon key only (never service role key on the client)
- Phone numbers are stored in `auth.users` managed by Supabase, not in a custom table

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Metro bundler crash on startup | `npx expo start --clear` to wipe Metro cache |
| Maps not rendering (blank screen) | Check `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env` |
| OTP not received | Ensure phone number is in E.164 format: `+91XXXXXXXXXX` |
| Image upload fails | Check `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — must be **unsigned** |
| Reanimated crash | Ensure `react-native-worklets ^0.4.0` is installed (required by Reanimated v4) |
| Port 8081 in use | `npx expo start --port 8082` |
| `@/*` import not resolving | Check `tsconfig.json` paths and `metro.config.js` |
| Web bundler fails on `react-native-maps` | Resolved using platform-specific map wrappers (`CustomMap.tsx` and `CustomMap.web.tsx`) so that the bundler completely skips compiling the native Google Maps package on web. |

---



**Built with ❤️ for India**

*Every migrant worker, every student, every professional looking for a home —*
*this app is for you.*

[![Made in India](https://img.shields.io/badge/Made%20in-India%20🇮🇳-FF9933?style=for-the-badge)](https://github.com)
[![Hackathon](https://img.shields.io/badge/Hackathon-Project-BB86FC?style=for-the-badge&logo=lightning&logoColor=white)](https://github.com)
[![Open Source Love](https://img.shields.io/badge/Open%20Source-♥-red?style=for-the-badge)](https://github.com)

---

*SpotLet v1.0.0 · Expo SDK 54 · React Native 0.81.5*

</div>