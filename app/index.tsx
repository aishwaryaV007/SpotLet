import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
      <ActivityIndicator size="large" color="#BB86FC" />
      <Text style={{ color: '#fff', marginTop: 20, fontSize: 16 }}>Loading SpotLet...</Text>
    </View>
  );
}
