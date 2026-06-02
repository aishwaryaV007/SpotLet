import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { Text } from 'react-native-paper';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      try {
        console.log('Received redirect URL in callback:', url);
        
        let accessToken = '';
        let refreshToken = '';

        // Try parsing hash fragment first
        const hashSplit = url.split('#');
        if (hashSplit.length > 1) {
          const params = hashSplit[1].split('&');
          params.forEach(param => {
            const [key, val] = param.split('=');
            if (key === 'access_token') accessToken = decodeURIComponent(val);
            if (key === 'refresh_token') refreshToken = decodeURIComponent(val);
          });
        }

        // If not found in hash, try query parameters
        if (!accessToken || !refreshToken) {
          const parsed = Linking.parse(url);
          const qAccess = parsed.queryParams?.access_token;
          const qRefresh = parsed.queryParams?.refresh_token;
          accessToken = Array.isArray(qAccess) ? qAccess[0] : (qAccess || '');
          refreshToken = Array.isArray(qRefresh) ? qRefresh[0] : (qRefresh || '');
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting Supabase session:', error.message);
          } else {
            console.log('Successfully restored OAuth session!');
          }
        }
      } catch (err) {
        console.error('Error handling redirect URL:', err);
      } finally {
        // The centralized auth guard in RootLayoutNav will redirect to /(tabs) if session is set,
        // but explicitly calling router.replace helps ensure a clean navigation state.
        router.replace('/(tabs)');
      }
    };

    const getInitialUrlAndParse = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && initialUrl.includes('auth/callback')) {
        await handleUrl(initialUrl);
      } else {
        router.replace('/auth/login');
      }
    };

    // Listen for deep link events if the app was already running in the background
    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url && event.url.includes('auth/callback')) {
        handleUrl(event.url);
      }
    });

    getInitialUrlAndParse();

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#BB86FC" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    color: '#FFFFFF',
    marginTop: 24,
    fontSize: 16,
    fontWeight: '500',
  },
});
