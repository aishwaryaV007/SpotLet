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

  // Inject global styles to ensure fullscreen layout on web
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    html, body, #root {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      overflow: auto;
      background-color: #121212;
    }
    /* Smooth scrolling */
    html { scroll-behavior: smooth; }
    /* Custom scrollbar for dark theme */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #1A1A1A; }
    ::-webkit-scrollbar-thumb { background: #3D3D3D; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #555555; }
    /* Remove outline on focused elements for cleaner look */
    *:focus { outline: none; }
  `;
  document.head.appendChild(styleEl);

  // Also set the viewport meta tag if missing
  if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.appendChild(meta);
  }
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
      // GUEST BROWSING: Only redirect logged-in users away from auth pages.
      // Non-logged-in users are allowed to access tabs freely.
      if (isLoggedIn && inAuthGroup) {
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
    <GestureHandlerRootView style={{ flex: 1, height: Platform.OS === 'web' ? '100%' : undefined }}>
      <PaperProvider theme={darkTheme}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
