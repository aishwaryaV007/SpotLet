import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface LoginPromptSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Customizable message explaining why login is needed */
  message?: string;
}

export default function LoginPromptSheet({
  visible,
  onClose,
  message = 'Sign in to unlock this feature',
}: LoginPromptSheetProps) {
  const router = useRouter();

  const handleGoToLogin = () => {
    onClose();
    router.push('/auth/login');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheet}>
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Branding */}
              <View style={styles.brandRow}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="home-map-marker" size={36} color="#BB86FC" />
                </View>
                <Text style={styles.brandName}>SpotLet</Text>
              </View>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>
              <Text style={styles.subMessage}>
                Create an account or sign in to save properties, add listings, and contact owners.
              </Text>

              {/* Google Button */}
              <TouchableOpacity style={styles.googleBtn} onPress={handleGoToLogin} activeOpacity={0.85}>
                <MaterialCommunityIcons name="google" size={22} color="#FFFFFF" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Phone Button */}
              <TouchableOpacity style={styles.phoneBtn} onPress={handleGoToLogin} activeOpacity={0.85}>
                <MaterialCommunityIcons name="phone" size={22} color="#BB86FC" />
                <Text style={styles.phoneBtnText}>Continue with Phone</Text>
              </TouchableOpacity>

              {/* Dismiss */}
              <TouchableOpacity style={styles.laterBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.laterBtnText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'web' ? 32 : 40,
    paddingTop: 12,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#2D2D2D',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      maxWidth: 480,
      alignSelf: 'center',
      width: '100%',
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3D3D3D',
    marginBottom: 20,
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BB86FC',
    borderRadius: 14,
    height: 52,
    width: '100%',
    gap: 10,
    marginBottom: 12,
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(187, 134, 252, 0.08)',
    borderRadius: 14,
    height: 52,
    width: '100%',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.25)',
    marginBottom: 16,
  },
  phoneBtnText: {
    color: '#BB86FC',
    fontSize: 16,
    fontWeight: '700',
  },
  laterBtn: {
    paddingVertical: 10,
  },
  laterBtnText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '500',
  },
});
