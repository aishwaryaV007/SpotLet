import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LoginPromptSheet from '@/components/LoginPromptSheet';
import { useResponsive } from '@/utils/useResponsive';
import { TouchableOpacity } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut, isLoading } = useAuth();
  const { isDesktopWeb } = useResponsive();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleSignOut = async () => {
    try {
      const success = await signOut();
      if (success) {
        Alert.alert('Signed Out', 'You have been signed out successfully.');
      } else {
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign out.');
    }
  };

  // Guest gate: show login prompt if not logged in
  if (!user) {
    return (
      <View style={isDesktopWeb ? webStyles.container : styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <View style={webStyles.avatarContainer}>
            <MaterialCommunityIcons name="account-circle" size={80} color="#3D3D3D" />
          </View>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginTop: 16 }}>Sign In Required</Text>
          <Text style={{ color: '#888888', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            Sign in to view your profile, manage listings, and more.
          </Text>
          <TouchableOpacity
            style={{ marginTop: 24, backgroundColor: '#BB86FC', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
            onPress={() => setShowLoginPrompt(true)}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <LoginPromptSheet
          visible={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          message="Sign in to view your profile"
        />
      </View>
    );
  }

  if (isDesktopWeb) {
    return (
      <View style={webStyles.container}>
        <View style={webStyles.card}>
          {/* Avatar */}
          <View style={webStyles.avatarContainer}>
            <MaterialCommunityIcons name="account-circle" size={80} color="#BB86FC" />
          </View>

          <Text style={webStyles.title}>Profile</Text>

          {/* Info Row */}
          <View style={webStyles.infoRow}>
            <MaterialCommunityIcons name="phone" size={20} color="#03DAC6" />
            <Text style={webStyles.infoLabel}>Phone</Text>
            <Text style={webStyles.infoValue}>
              {user?.phone || 'Not available'}
            </Text>
          </View>

          {user?.email && (
            <View style={webStyles.infoRow}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#03DAC6" />
              <Text style={webStyles.infoLabel}>Email</Text>
              <Text style={webStyles.infoValue}>{user.email}</Text>
            </View>
          )}

          <View style={webStyles.divider} />

          <Button
            mode="contained"
            onPress={handleSignOut}
            style={webStyles.signOutBtn}
            disabled={isLoading}
            loading={isLoading}
            buttonColor="#CF6679"
            textColor="#FFFFFF"
            icon="logout"
          >
            Sign Out
          </Button>
        </View>
      </View>
    );
  }

  // ─── MOBILE LAYOUT ───
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Screen</Text>
      {user?.phone ? (
        <Text style={styles.subtitle}>Phone: {user.phone}</Text>
      ) : (
        <Text style={styles.subtitle}>Not logged in</Text>
      )}
      <Button
        mode="contained"
        onPress={handleSignOut}
        style={styles.button}
        disabled={isLoading}
        loading={isLoading}
        buttonColor="#CF6679"
        textColor="#FFFFFF"
      >
        Sign Out
      </Button>
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
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 24,
  },
  button: {
    width: '80%',
    paddingVertical: 6,
  },
});

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    padding: 40,
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },
  infoLabel: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#2D2D2D',
    width: '100%',
    marginVertical: 24,
  },
  signOutBtn: {
    width: '100%',
    paddingVertical: 6,
    borderRadius: 10,
  },
});
