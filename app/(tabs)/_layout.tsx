import { Tabs, Slot, usePathname, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useResponsive } from '@/utils/useResponsive';
import { useAuth } from '@/contexts/AuthContext';
import React, { useEffect } from 'react';

export type TabsParamList = {
  index: undefined;
  map: undefined;
  add: undefined;
  saved: undefined;
  profile: undefined;
};

// Inject hover CSS once on web for nav link interactions
if (Platform.OS === 'web') {
  const navStyle = document.createElement('style');
  navStyle.textContent = `
    .spotlet-nav-link {
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .spotlet-nav-link:hover {
      background-color: rgba(187, 134, 252, 0.08) !important;
    }
    .spotlet-login-btn {
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .spotlet-login-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(187, 134, 252, 0.4);
    }
  `;
  document.head.appendChild(navStyle);
}

const GUEST_NAV_ITEMS = [
  { name: '/(tabs)', label: 'Home', icon: 'home' as const },
  { name: '/(tabs)/map', label: 'Map', icon: 'map' as const },
  { name: '/(tabs)/add', label: 'Add Listing', icon: 'plus-circle' as const },
  { name: '/(tabs)/saved', label: 'Saved', icon: 'heart' as const },
];

const LOGGED_IN_NAV_ITEMS = [
  { name: '/(tabs)', label: 'Home', icon: 'home' as const },
  { name: '/(tabs)/map', label: 'Map', icon: 'map' as const },
  { name: '/(tabs)/add', label: 'Add Listing', icon: 'plus-circle' as const },
  { name: '/(tabs)/saved', label: 'Saved', icon: 'heart' as const },
  { name: '/(tabs)/my-properties', label: 'My Listings', icon: 'home-city-outline' as const },
  { name: '/(tabs)/profile', label: 'Profile', icon: 'account' as const },
];

function WebTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const isActive = (name: string) => {
    if (name === '/(tabs)') return pathname === '/' || pathname === '/(tabs)';
    const segment = name.replace('/(tabs)/', '');
    return pathname.includes(segment);
  };

  const navItems = user ? LOGGED_IN_NAV_ITEMS : GUEST_NAV_ITEMS;

  return (
    <View style={webStyles.navBar}>
      {/* Brand */}
      <TouchableOpacity
        style={webStyles.brand}
        onPress={() => router.push('/(tabs)')}
      >
        <View style={webStyles.brandIconWrap}>
          <MaterialCommunityIcons name="home-map-marker" size={24} color="#BB86FC" />
        </View>
        <Text style={webStyles.brandText}>SpotLet</Text>
      </TouchableOpacity>

      {/* Nav Links + Auth Button */}
      <View style={webStyles.navLinks}>
        {navItems.map((item) => {
          const active = isActive(item.name);
          return (
            <TouchableOpacity
              key={item.name}
              // @ts-ignore - web className for hover CSS
              className="spotlet-nav-link"
              style={[webStyles.navLink, active && webStyles.navLinkActive]}
              onPress={() => router.push(item.name as any)}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={18}
                color={active ? '#BB86FC' : '#999999'}
              />
              <Text style={[webStyles.navLinkText, active && webStyles.navLinkTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Login Button (guests only) */}
        {!user && (
          <TouchableOpacity
            // @ts-ignore
            className="spotlet-login-btn"
            style={webStyles.loginBtn}
            onPress={() => router.push('/auth/login')}
          >
            <MaterialCommunityIcons name="login" size={18} color="#FFFFFF" />
            <Text style={webStyles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function MobileWebBottomBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const isActive = (name: string) => {
    if (name === '/(tabs)') return pathname === '/' || pathname === '/(tabs)';
    const segment = name.replace('/(tabs)/', '');
    return pathname.includes(segment);
  };

  const navItems = user ? LOGGED_IN_NAV_ITEMS : GUEST_NAV_ITEMS;

  return (
    <View style={mobileWebStyles.bottomBar}>
      {navItems.map((item) => {
        const active = isActive(item.name);
        return (
          <TouchableOpacity
            key={item.name}
            style={mobileWebStyles.tabItem}
            onPress={() => router.push(item.name as any)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={active ? '#BB86FC' : '#666666'}
            />
            <Text style={[mobileWebStyles.tabLabel, active && mobileWebStyles.tabLabelActive]}>
              {item.label === 'Add Listing' ? 'Add' : item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      {/* Login tab for guests */}
      {!user && (
        <TouchableOpacity
          style={mobileWebStyles.tabItem}
          onPress={() => router.push('/auth/login')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="login" size={24} color="#BB86FC" />
          <Text style={[mobileWebStyles.tabLabel, mobileWebStyles.tabLabelActive]}>Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { isMobileWeb, isDesktopWeb, isNativeMobile } = useResponsive();

  // Desktop Web: Top nav bar
  if (isDesktopWeb) {
    return (
      <View style={webStyles.container}>
        <WebTopNav />
        <View style={webStyles.content}>
          <Slot />
        </View>
      </View>
    );
  }

  // Mobile Web: Bottom tab bar (custom)
  if (isMobileWeb) {
    return (
      <View style={mobileWebStyles.container}>
        <View style={mobileWebStyles.content}>
          <Slot />
        </View>
        <MobileWebBottomBar />
      </View>
    );
  }

  // Native Mobile: Expo Tabs
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopColor: '#2D2D2D',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#BB86FC',
        tabBarInactiveTintColor: '#666666',
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-properties"
        options={{
          title: 'My Listings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-city-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 45, 45, 0.6)',
    paddingHorizontal: 32,
    height: 64,
    // @ts-ignore - web backdrop filter
    backdropFilter: 'blur(12px)',
    // @ts-ignore
    WebkitBackdropFilter: 'blur(12px)',
    // @ts-ignore
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(187, 134, 252, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navLinkActive: {
    backgroundColor: 'rgba(187, 134, 252, 0.15)',
  },
  navLinkText: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '500',
  },
  navLinkTextActive: {
    color: '#BB86FC',
    fontWeight: '700',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#BB86FC',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    marginLeft: 8,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    // @ts-ignore
    overflow: 'auto',
  },
});

const mobileWebStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    color: '#666666',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#BB86FC',
    fontWeight: '700',
  },
});
