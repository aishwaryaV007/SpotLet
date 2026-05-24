import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Paragraph } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const { signInWithOTP, verifyOTP, isLoggedIn, error: authError } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn]);

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
            <MaterialCommunityIcons name="home-map-marker" size={64} color="#BB86FC" />
          </View>
          <Text style={styles.title}>SpotLet</Text>
          <Paragraph style={styles.subtitle}>Find Your Perfect Rental</Paragraph>
        </View>

        {/* Auth Container */}
        <View style={styles.authContainer}>
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
            left={<TextInput.Icon icon="phone" />}
            disabled={otpSent || localLoading}
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
              left={<TextInput.Icon icon="lock" />}
              disabled={localLoading}
            />
          )}

          {authError && (
            <Text style={styles.errorText}>{authError}</Text>
          )}

          {!otpSent ? (
            <Button
              mode="contained"
              onPress={handleSendOTP}
              style={styles.button}
              disabled={localLoading || phone.replace(/\D/g, '').length < 10}
              loading={localLoading}
            >
              Send OTP
            </Button>
          ) : (
            <View style={styles.otpButtonGroup}>
              <Button
                mode="contained"
                onPress={handleVerifyOTP}
                style={styles.button}
                disabled={localLoading || otp.length < 6}
                loading={localLoading}
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
                disabled={localLoading}
              >
                Change Phone Number
              </Button>
            </View>
          )}

          <Paragraph style={styles.termsText}>
            By logging in, you agree to our Terms of Service and Privacy Policy
          </Paragraph>
        </View>

        {/* Footer Info */}
        <View style={styles.infoContainer}>
          <MaterialCommunityIcons name="lock" size={20} color="#03DAC6" />
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
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#BB86FC',
  },
  authContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1E1E1E',
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  otpButtonGroup: {
    gap: 8,
  },
  secondaryButton: {
    marginTop: 4,
  },
  errorText: {
    color: '#CF6679',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#03DAC6',
    flex: 1,
  },
});

