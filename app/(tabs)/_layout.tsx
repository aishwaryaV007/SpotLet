import { Tabs, Slot, usePathname, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type TabsParamList = {
  index: undefined;
  map: undefined;
  add: undefined;
  saved: undefined;
  profile: undefined;
};

const NAV_ITEMS = [
  { name: '/(tabs)', label: 'Home', icon: 'home' as const },
  { name: '/(tabs)/map', label: 'Map', icon: 'map' as const },
  { name: '/(tabs)/add', label: 'Add Listing', icon: 'plus-circle' as const },
  { name: '/(tabs)/saved', label: 'Saved', icon: 'heart' as const },
  { name: '/(tabs)/profile', label: 'Profile', icon: 'account' as const },
];

function WebTopNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (name: string) => {
    if (name === '/(tabs)') return pathname === '/' || pathname === '/(tabs)';
    const segment = name.replace('/(tabs)/', '');
    return pathname.includes(segment);
  };

  return (
    <View style={webStyles.navBar}>
      {/* Brand */}
      <TouchableOpacity
        style={webStyles.brand}
        onPress={() => router.push('/(tabs)')}
      >
        <MaterialCommunityIcons name="home-map-marker" size={28} color="#BB86FC" />
        <Text style={webStyles.brandText}>SpotLet</Text>
      </TouchableOpacity>

      {/* Nav Links */}
      <View style={webStyles.navLinks}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.name);
          return (
            <TouchableOpacity
              key={item.name}
              style={[webStyles.navLink, active && webStyles.navLinkActive]}
              onPress={() => router.push(item.name as any)}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={active ? '#BB86FC' : '#888888'}
              />
              <Text style={[webStyles.navLinkText, active && webStyles.navLinkTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  if (Platform.OS === 'web') {
    return (
      <View style={webStyles.container}>
        <WebTopNav />
        <View style={webStyles.content}>
          <Slot />
        </View>
      </View>
    );
  }

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
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
    paddingHorizontal: 32,
    height: 64,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    gap: 8,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navLinkActive: {
    backgroundColor: 'rgba(187, 134, 252, 0.12)',
  },
  navLinkText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  navLinkTextActive: {
    color: '#BB86FC',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});
