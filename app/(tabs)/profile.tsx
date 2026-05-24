import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut, isLoading } = useAuth();

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
