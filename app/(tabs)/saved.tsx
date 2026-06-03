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
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSavedProperties, unsaveProperty } from '@/lib/supabase';
import { Property } from '@/types/property';
import PropertyDetailsModal from '@/components/PropertyDetailsModal';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

const isWeb = Platform.OS === 'web';

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

    const originalList = [...savedProperties];
    setSavedProperties(prev => prev.filter(p => p.id !== propertyId));

    try {
      const res = await unsaveProperty(user.id, propertyId);
      if (!res.success) {
        setSavedProperties(originalList);
        Alert.alert('Error', 'Failed to remove listing from saved.');
      } else {
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

  // ─── WEB CARD ───
  const renderWebCard = (item: Property) => {
    const imgUrl = item.photos && item.photos.length > 0 ? item.photos[0] : FALLBACK_IMAGE;

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.95}
        onPress={() => {
          setSelectedProperty(item);
          setShowDetailModal(true);
        }}
        style={webStyles.card}
      >
        <View style={webStyles.cardImageContainer}>
          <Image source={{ uri: imgUrl }} style={webStyles.cardImage} />
          <TouchableOpacity
            style={webStyles.cardHeart}
            onPress={() => handleUnsave(item.id)}
          >
            <MaterialCommunityIcons name="heart" size={22} color="#CF6679" />
          </TouchableOpacity>
        </View>

        <View style={webStyles.cardContent}>
          <View style={webStyles.cardTopRow}>
            <Text style={webStyles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={webStyles.priceBadge}>
              <Text style={webStyles.priceText}>₹{item.rent.toLocaleString('en-IN')}</Text>
              <Text style={webStyles.priceUnit}>/month</Text>
            </View>
          </View>

          <View style={webStyles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#BB86FC" />
            <Text style={webStyles.locationText} numberOfLines={1}>{item.address}</Text>
          </View>

          {item.description ? (
            <Text style={webStyles.descriptionText} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={webStyles.cardBadges}>
            <View style={webStyles.badge}>
              <MaterialCommunityIcons name="home-outline" size={14} color="#BB86FC" />
              <Text style={webStyles.badgeText}>{item.type}</Text>
            </View>
            <View style={webStyles.badge}>
              <MaterialCommunityIcons name="sofa-single-outline" size={14} color="#03DAC6" />
              <Text style={webStyles.badgeText}>{item.furnished ? 'Furnished' : 'Unfurnished'}</Text>
            </View>
            <View style={webStyles.badge}>
              <MaterialCommunityIcons name="account-group-outline" size={14} color="#03DAC6" />
              <Text style={webStyles.badgeText}>For {item.for_whom}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── MOBILE CARD ───
  const renderMobileCard = ({ item }: { item: Property }) => {
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

        <TouchableOpacity
          style={styles.cardHeart}
          onPress={() => handleUnsave(item.id)}
        >
          <MaterialCommunityIcons name="heart" size={24} color="#CF6679" />
        </TouchableOpacity>

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

  // ─── STATE VIEWS ───
  const renderCenteredState = (
    icon: string,
    title: string,
    subtitle: string,
    actionLabel?: string,
    onAction?: () => void
  ) => (
    <View style={isWeb ? webStyles.centeredMessage : styles.centeredContainer}>
      <MaterialCommunityIcons name={icon as any} size={isWeb ? 64 : 80} color="#3D3D3D" />
      <Text style={isWeb ? webStyles.messageTitle : styles.errorTitle}>{title}</Text>
      <Text style={isWeb ? webStyles.messageSubtitle : styles.errorSubtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={isWeb ? webStyles.retryBtn : styles.actionBtn} onPress={onAction}>
          <Text style={isWeb ? webStyles.retryBtnText : styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── WEB LAYOUT ───
  if (isWeb) {
    return (
      <View style={webStyles.container}>
        {/* Header */}
        <View style={webStyles.headerBar}>
          <View>
            <Text style={webStyles.headerTitle}>Saved Listings</Text>
            <Text style={webStyles.headerSubtitle}>Spaces you pinned for later</Text>
          </View>
          <Text style={webStyles.resultCount}>
            {savedProperties.length} saved {savedProperties.length === 1 ? 'property' : 'properties'}
          </Text>
        </View>

        {/* Content */}
        <View style={webStyles.contentArea}>
          {!user ? (
            renderCenteredState('lock-outline', 'Sign In Required', 'Please log in to view your saved listings.', 'Go to Login', () => router.replace('/auth'))
          ) : hasError ? (
            renderCenteredState('wifi-off', 'Connection Failed', errorMessage || 'Check your internet connection.', 'Retry', () => loadSavedListings())
          ) : loading ? (
            <View style={webStyles.centeredMessage}>
              <ActivityIndicator size="large" color="#BB86FC" />
              <Text style={webStyles.messageSubtitle}>Fetching saved rooms...</Text>
            </View>
          ) : savedProperties.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={webStyles.cardList}>
              {savedProperties.map((item) => renderWebCard(item))}
            </ScrollView>
          ) : (
            renderCenteredState('heart-broken-outline', 'No Saved Listings', 'Browse properties and tap the heart icon to save them here.', 'Explore Rooms', () => router.replace('/(tabs)'))
          )}
        </View>

        <PropertyDetailsModal
          visible={showDetailModal}
          property={selectedProperty}
          onClose={() => setShowDetailModal(false)}
          isSaved={selectedProperty ? true : false}
          onSaveToggle={handleUnsave}
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
        />
      </View>
    );
  }

  // ─── MOBILE LAYOUT (unchanged) ───
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Listings</Text>
        <Text style={styles.headerSubtitle}>Spaces you pinned for later</Text>
      </View>

      {!user ? (
        renderCenteredState('lock-outline', 'Sign In Required', 'Please log in to view your saved listings.', 'Go to Login', () => router.replace('/auth'))
      ) : hasError ? (
        renderCenteredState('wifi-off', 'Network Connection Failed', errorMessage || 'Check your internet connection and try again.', 'Retry Connection', () => loadSavedListings())
      ) : loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#BB86FC" />
          <Text style={styles.loadingText}>Fetching saved rooms...</Text>
        </View>
      ) : savedProperties.length > 0 ? (
        <FlatList
          data={savedProperties}
          keyExtractor={(item) => item.id}
          renderItem={renderMobileCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadSavedListings(true)}
        />
      ) : (
        renderCenteredState('heart-broken-outline', 'No Saved listings', 'Browse properties and tap the heart icon to save them here.', 'Explore Rooms', () => router.replace('/(tabs)'))
      )}

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

// ─── MOBILE STYLES (unchanged) ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#BBBBBB', fontSize: 13, marginTop: 2 },
  listContainer: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 16, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#2D2D2D', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  cardImage: { width: '100%', height: 190, backgroundColor: '#2D2D2D' },
  cardHeart: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(18, 18, 18, 0.7)', borderRadius: 20, width: 38, height: 38, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  priceOverlay: { position: 'absolute', top: 140, left: 12, backgroundColor: '#03DAC6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, zIndex: 2 },
  priceOverlayText: { color: '#121212', fontWeight: '900', fontSize: 14 },
  cardInfo: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', flex: 1, marginRight: 10 },
  typeBadge: { backgroundColor: '#2D2D2D', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeText: { fontSize: 11, color: '#BB86FC', fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  locationText: { color: '#888888', fontSize: 13, marginLeft: 4 },
  detailsRow: { flexDirection: 'row', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { color: '#BBBBBB', fontSize: 12 },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  errorTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  errorSubtitle: { color: '#666666', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  actionBtn: { marginTop: 20, backgroundColor: '#BB86FC', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  actionBtnText: { color: '#121212', fontWeight: 'bold', fontSize: 14 },
  loadingText: { color: '#BBBBBB', marginTop: 12, fontSize: 14 },
});

// ─── WEB STYLES ───
const webStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 40, paddingTop: 24, paddingBottom: 8,
    maxWidth: 1280, width: '100%', alignSelf: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { color: '#888888', fontSize: 14, marginTop: 4 },
  resultCount: { color: '#888888', fontSize: 14 },
  contentArea: { flex: 1, maxWidth: 1280, width: '100%', alignSelf: 'center', paddingHorizontal: 40 },
  cardList: { paddingVertical: 16, gap: 16 },
  // Horizontal card
  card: { flexDirection: 'row', backgroundColor: '#1E1E1E', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#2D2D2D' },
  cardImageContainer: { width: 280, height: 200, position: 'relative' },
  cardImage: { width: '100%', height: '100%', backgroundColor: '#2D2D2D' },
  cardHeart: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(18, 18, 18, 0.7)', borderRadius: 18, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, padding: 20, justifyContent: 'space-between' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', flex: 1 },
  priceBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#03DAC6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priceText: { color: '#121212', fontWeight: '900', fontSize: 16 },
  priceUnit: { color: '#121212', fontWeight: '500', fontSize: 11, marginLeft: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  locationText: { color: '#888888', fontSize: 13, flex: 1 },
  descriptionText: { color: '#999999', fontSize: 13, lineHeight: 18, marginTop: 8 },
  cardBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2D2D2D', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, color: '#BBBBBB', fontWeight: '500' },
  // States
  centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  messageTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  messageSubtitle: { color: '#888888', fontSize: 14, marginTop: 8, textAlign: 'center' },
  retryBtn: { marginTop: 20, backgroundColor: '#BB86FC', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#121212', fontWeight: 'bold', fontSize: 14 },
});
