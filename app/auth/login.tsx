import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Paragraph } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const { signInWithOTP, verifyOTP, isLoggedIn, error: authError } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      // Detect if we are running in Expo Go or standalone build
      const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
      
      // Build the correct redirect URL: Expo Go needs its own dynamic scheme, standalone uses 'spotlet'
      const redirectUrl = isExpoGo 
        ? Linking.createURL('auth/callback') 
        : Linking.createURL('auth/callback', { scheme: 'spotlet' });
      
      console.log('OAuth redirect URL:', redirectUrl);
      

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        setGoogleError(error.message);
        Alert.alert('Google Sign-In Error', error.message);
        return;
      }

      if (data?.url) {
        console.log('OAuth URL:', data.url);
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
          console.log('OAuth browser returned URL:', result.url);

          // With PKCE flow, Supabase returns a `code` in the URL
          const url = new URL(result.url);
          const code = url.searchParams.get('code');

          if (code) {
            // Exchange the authorization code for a session
            const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

            if (sessionError) {
              setGoogleError(sessionError.message);
              Alert.alert('Session Error', sessionError.message);
            }
            // Auth guard in RootLayoutNav will automatically redirect to /(tabs)
          } else {
            // Fallback: try extracting tokens from hash fragment (implicit flow)
            let accessToken = '';
            let refreshToken = '';
            const hashPart = result.url.split('#')[1];
            if (hashPart) {
              const params = new URLSearchParams(hashPart);
              accessToken = params.get('access_token') || '';
              refreshToken = params.get('refresh_token') || '';
            }
            if (accessToken && refreshToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (sessionError) {
                setGoogleError(sessionError.message);
                Alert.alert('Session Error', sessionError.message);
              }
            } else {
              console.log('No code or tokens found in redirect URL.');
            }
          }
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          console.log('User cancelled Google sign in');
        }
      } else {
        setGoogleError('Failed to retrieve authentication URL.');
        Alert.alert('Google Sign-In Error', 'Failed to retrieve authentication URL.');
      }
    } catch (err: any) {
      setGoogleError(err.message || 'Failed to start Google sign in');
      Alert.alert('Google Sign-In Error', err.message || 'Failed to start Google sign in');
    } finally {
      setGoogleLoading(false);
    }
  };

  const formatPhoneNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 2) return '+' + cleaned;
    if (cleaned.length <= 5) return '+' + cleaned.slice(0, 2) + ' ' + cleaned.slice(2);
    if (cleaned.length <= 10) return '+' + cleaned.slice(0, 2) + ' ' + cleaned.slice(2, 5) + ' ' + cleaned.slice(5);
    return '+' + cleaned.slice(0, 2) + ' ' + cleaned.slice(2, 5) + ' ' + cleaned.slice(5, 10) + ' ' + cleaned.slice(10, 12);
  };

  const handleSendOTP = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number with country code');
      return;
    }

    const formattedPhone = '+' + cleaned;
    setLocalLoading(true);
    try {
      const success = await signInWithOTP(formattedPhone);
      if (success) {
        setOtpSent(true);
        Alert.alert('OTP Sent', 'A verification code has been sent to your phone number.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit verification code');
      return;
    }

    const cleaned = phone.replace(/\D/g, '');
    const formattedPhone = '+' + cleaned;
    setLocalLoading(true);
    try {
      const success = await verifyOTP(formattedPhone, otp);
      if (success) {
        Alert.alert('Success', 'Logged in successfully!');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Verification Failed', 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="home-map-marker" size={56} color="#BB86FC" />
          </View>
          <Text style={styles.title}>SpotLet</Text>
          <Paragraph style={styles.subtitle}>Find Your Perfect Rental</Paragraph>
        </View>

        {/* Auth Container (Glass Card) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{otpSent ? 'Verify OTP' : 'Login'}</Text>
          <Paragraph style={styles.description}>
            {otpSent 
              ? `Enter the 6-digit code sent to ${phone}`
              : 'Enter your phone number to get started'
            }
          </Paragraph>

          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={(text) => setPhone(formatPhoneNumber(text))}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
            placeholder="+91 98765 43210"
            left={<TextInput.Icon icon="phone" color="rgba(255, 255, 255, 0.6)" />}
            textColor="#FFFFFF"
            disabled={otpSent || localLoading || googleLoading}
            theme={{
              colors: {
                primary: '#BB86FC',
                outline: 'rgba(255, 255, 255, 0.15)',
                placeholder: 'rgba(255, 255, 255, 0.4)',
                onSurfaceVariant: 'rgba(255, 255, 255, 0.5)',
              },
              roundness: 12,
            }}
          />

          {otpSent && (
            <TextInput
              label="OTP Code"
              value={otp}
              onChangeText={setOtp}
              style={styles.input}
              mode="outlined"
              keyboardType="number-pad"
              placeholder="123456"
              maxLength={6}
              left={<TextInput.Icon icon="lock" color="rgba(255, 255, 255, 0.6)" />}
              textColor="#FFFFFF"
              disabled={localLoading || googleLoading}
              theme={{
                colors: {
                  primary: '#BB86FC',
                  outline: 'rgba(255, 255, 255, 0.15)',
                  placeholder: 'rgba(255, 255, 255, 0.4)',
                  onSurfaceVariant: 'rgba(255, 255, 255, 0.5)',
                },
                roundness: 12,
              }}
            />
          )}

          {authError && (
            <Text style={styles.errorText}>{authError}</Text>
          )}

          {googleError && (
            <Text style={styles.errorText}>{googleError}</Text>
          )}

          {!otpSent ? (
            <Button
              mode="contained"
              onPress={handleSendOTP}
              style={styles.button}
              buttonColor="#FFFFFF"
              textColor="#121212"
              disabled={localLoading || googleLoading || phone.replace(/\D/g, '').length < 10}
              loading={localLoading}
              labelStyle={styles.buttonLabel}
            >
              Send OTP
            </Button>
          ) : (
            <View style={styles.otpButtonGroup}>
              <Button
                mode="contained"
                onPress={handleVerifyOTP}
                style={styles.button}
                buttonColor="#FFFFFF"
                textColor="#121212"
                disabled={localLoading || googleLoading || otp.length < 6}
                loading={localLoading}
                labelStyle={styles.buttonLabel}
              >
                Verify & Login
              </Button>
              <Button
                mode="text"
                onPress={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
                style={styles.secondaryButton}
                textColor="rgba(255, 255, 255, 0.8)"
                disabled={localLoading || googleLoading}
              >
                Change Phone Number
              </Button>
            </View>
          )}

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In Button */}
          <Button
            mode="outlined"
            onPress={handleGoogleSignIn}
            style={styles.googleButton}
            contentStyle={styles.googleButtonContent}
            disabled={localLoading || googleLoading}
            loading={googleLoading}
            textColor="#FFFFFF"
            icon={({ size }) => (
              <MaterialCommunityIcons name="google" size={size} color="#FFFFFF" />
            )}
            theme={{
              colors: {
                outline: 'rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            Continue with Google
          </Button>

          <Paragraph style={styles.termsText}>
            By logging in, you agree to our Terms of Service and Privacy Policy
          </Paragraph>
        </View>

        {/* Footer Info */}
        <View style={styles.infoContainer}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#03DAC6" />
          <Paragraph style={styles.infoText}>
            Your data is encrypted and secure
          </Paragraph>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Pure black-gray background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#BB86FC', // Brand purple subtitle
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.04)', // Semi-transparent glass card on black background
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    // Web only style
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
    }),
    // Mobile shadow style
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 24,
    paddingVertical: 6,
  },
  buttonLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  otpButtonGroup: {
    gap: 8,
  },
  secondaryButton: {
    marginTop: 4,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(3, 218, 198, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(3, 218, 198, 0.12)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 400,
  },
  infoText: {
    fontSize: 12,
    color: '#03DAC6',
    flex: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  googleButton: {
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

