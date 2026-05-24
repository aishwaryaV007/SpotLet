import { MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { AuthProvider } from '@/contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot } from 'expo-router';

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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={darkTheme}>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
