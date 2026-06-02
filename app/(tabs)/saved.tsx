import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSavedProperties, unsaveProperty } from '@/lib/supabase';
import { Property } from '@/types/property';
import PropertyDetailsModal from '@/components/PropertyDetailsModal';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

export default function SavedScreen() {
  const { user } = useAuth();

  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Detail Modal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavedListings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadSavedListings = async (isRefreshing = false) => {
    try {
      setHasError(false);
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (user) {
        const res = await fetchSavedProperties(user.id);
        if (res.success && res.data) {
          const parsed: Property[] = res.data.map((item: any) => ({
            ...item,
            photos: Array.isArray(item.photos) ? item.photos : [],
          }));
          setSavedProperties(parsed);
          setHasError(false);
        } else {
          setHasError(true);
          setErrorMessage(res.error || 'Failed to fetch saved properties');
        }
      }
    } catch (error: any) {
      console.error('Error loading saved listings:', error);
      setHasError(true);
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUnsave = async (propertyId: string) => {
    if (!user) return;

    // Optimistically update list
    const originalList = [...savedProperties];
    setSavedProperties(prev => prev.filter(p => p.id !== propertyId));

    try {
      const res = await unsaveProperty(user.id, propertyId);
      if (!res.success) {
        // Rollback on error
        setSavedProperties(originalList);
        Alert.alert('Error', 'Failed to remove listing from saved.');
      } else {
        // If the item removed is currently selected in modal, close modal
        if (selectedProperty?.id === propertyId) {
          setShowDetailModal(false);
        }
      }
    } catch (error) {
      setSavedProperties(originalList);
      Alert.alert('Error', 'An error occurred.');
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Cannot complete call on this device.');
    });
  };

  const handleWhatsApp = (phoneNumber: string, title: string) => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hi, I'm interested in your property listing "${title}" on SpotLet.`);
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${message}`).catch(() => {
      Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`).catch(() => {
        Alert.alert('Error', 'Cannot open WhatsApp.');
      });
    });
  };

  const renderPropertyCard = ({ item }: { item: Property }) => {
    const imgUrl = item.photos && item.photos.length > 0 ? item.photos[0] : FALLBACK_IMAGE;

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          setSelectedProperty(item);
          setShowDetailModal(true);
        }}
        style={styles.card}
      >
        <Image source={{ uri: imgUrl }} style={styles.cardImage} />

        {/* Heart Favorite Button (removes it immediately) */}
        <TouchableOpacity
          style={styles.cardHeart}
          onPress={() => handleUnsave(item.id)}
        >
          <MaterialCommunityIcons name="heart" size={24} color="#CF6679" />
        </TouchableOpacity>

        {/* Pricing Overlay */}
        <View style={styles.priceOverlay}>
          <Text style={styles.priceOverlayText}>₹{item.rent.toLocaleString('en-IN')}/mo</Text>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{item.type}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#BB86FC" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="sofa-single-outline" size={16} color="#03DAC6" />
              <Text style={styles.detailText}>{item.furnished ? 'Furnished' : 'Unfurnished'}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="account-group-outline" size={16} color="#03DAC6" />
              <Text style={styles.detailText}>For {item.for_whom}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Listings</Text>
        <Text style={styles.headerSubtitle}>Spaces you pinned for later</Text>
      </View>

      {!user ? (
        <View style={styles.centeredContainer}>
          <MaterialCommunityIcons name="lock-outline" size={80} color="#3D3D3D" />
          <Text style={styles.errorTitle}>Sign In Required</Text>
          <Text style={styles.errorSubtitle}>Please log in to view your saved listings.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.replace('/auth')}>
            <Text style={styles.actionBtnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      ) : hasError ? (
        <View style={styles.centeredContainer}>
          <MaterialCommunityIcons name="wifi-off" size={80} color="#CF6679" />
          <Text style={styles.errorTitle}>Network Connection Failed</Text>
          <Text style={styles.errorSubtitle}>
            {errorMessage || 'Check your internet connection and try again.'}
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => loadSavedListings()}>
            <Text style={styles.actionBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#BB86FC" />
          <Text style={styles.loadingText}>Fetching saved rooms...</Text>
        </View>
      ) : savedProperties.length > 0 ? (
        <FlatList
          data={savedProperties}
          keyExtractor={(item) => item.id}
          renderItem={renderPropertyCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadSavedListings(true)}
        />
      ) : (
        <View style={styles.centeredContainer}>
          <MaterialCommunityIcons name="heart-broken-outline" size={80} color="#3D3D3D" />
          <Text style={styles.errorTitle}>No Saved listings</Text>
          <Text style={styles.errorSubtitle}>
            Browse properties and tap the heart icon to save them here.
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.actionBtnText}>Explore Rooms</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Property Details Modal */}
      <PropertyDetailsModal
        visible={showDetailModal}
        property={selectedProperty}
        onClose={() => setShowDetailModal(false)}
        isSaved={selectedProperty ? true : false}
        onSaveToggle={handleUnsave}
        onCall={handleCall}
        onWhatsApp={handleWhatsApp}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#BBBBBB',
    fontSize: 13,
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  cardImage: {
    width: '100%',
    height: 190,
    backgroundColor: '#2D2D2D',
  },
  cardHeart: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(18, 18, 18, 0.7)',
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  priceOverlay: {
    position: 'absolute',
    top: 140,
    left: 12,
    backgroundColor: '#03DAC6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 2,
  },
  priceOverlayText: {
    color: '#121212',
    fontWeight: '900',
    fontSize: 14,
  },
  cardInfo: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  typeBadge: {
    backgroundColor: '#2D2D2D',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#BB86FC',
    fontWeight: 'bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    color: '#888888',
    fontSize: 13,
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorSubtitle: {
    color: '#666666',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 20,
    backgroundColor: '#BB86FC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingText: {
    color: '#BBBBBB',
    marginTop: 12,
    fontSize: 14,
  },
});
