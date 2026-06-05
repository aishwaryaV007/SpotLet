import '@/lib/polyfills';
import { useEffect, useState } from 'react';
import { MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Platform, Alert } from 'react-native';

// Polyfill Alert.alert for React Native Web
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const msg = title ? `${title}: ${message}` : message;
    if (buttons && buttons.length > 0) {
      const result = window.confirm(msg);
      if (result) {
        const okButton = buttons.find(b => b.text && b.text.toLowerCase() !== 'cancel') || buttons[0];
        if (okButton && okButton.onPress) {
          okButton.onPress();
        }
      } else {
        const cancelButton = buttons.find(b => b.text && b.text.toLowerCase() === 'cancel');
        if (cancelButton && cancelButton.onPress) {
          cancelButton.onPress();
        }
      }
    } else {
      window.alert(msg);
    }
  };
}

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#BB86FC',
    secondary: '#03DAC6',
    tertiary: '#CF6679',
    background: '#121212',
    surface: '#1E1E1E',
  },
};

function RootLayoutNav() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [routerReady, setRouterReady] = useState(false);

  // Give the router a moment to be ready before attempting navigation
  useEffect(() => {
    const timer = setTimeout(() => setRouterReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading || !routerReady) return;

    const inAuthGroup = segments[0] === 'auth';

    try {
      if (!isLoggedIn && !inAuthGroup) {
        // Redirect to the sign-in page if not logged in
        router.replace('/auth/login');
      } else if (isLoggedIn && inAuthGroup) {
        // Redirect to the tabs page if logged in
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.warn('Router redirect failed:', e);
    }
  }, [isLoggedIn, isLoading, segments, routerReady]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={darkTheme}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
