import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchProperties,
  saveProperty,
  unsaveProperty,
  fetchSavedProperties,
} from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Property } from '@/types/property';
import PropertyDetailsModal from '@/components/PropertyDetailsModal';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

export default function HomeScreen() {
  const { user } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  
  // Detail Modal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [properties, searchQuery, selectedType]);

  const loadData = async (isRefreshing = false) => {
    try {
      setHasError(false);
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const res = await fetchProperties();
      if (res.success && res.data) {
        const parsed: Property[] = res.data.map((item: any) => ({
          ...item,
          photos: Array.isArray(item.photos) ? item.photos : [],
        }));
        setProperties(parsed);
        setHasError(false);
      } else {
        setHasError(true);
        setErrorMessage(res.error || 'Failed to fetch properties');
      }

      if (user) {
        const savedRes = await fetchSavedProperties(user.id);
        if (savedRes.success && savedRes.data) {
          const ids = new Set<string>(savedRes.data.map((item: any) => item.id));
          setSavedIds(ids);
        }
      }
    } catch (error: any) {
      console.error('Error loading property feed:', error);
      setHasError(true);
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let result = [...properties];

    // Filter by type
    if (selectedType !== 'All') {
      result = result.filter((p) => p.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    setFilteredProperties(result);
  };

  const handleSaveToggle = async (propertyId: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please log in to save properties.');
      return;
    }

    const isCurrentlySaved = savedIds.has(propertyId);
    const updatedSavedIds = new Set(savedIds);

    if (isCurrentlySaved) {
      updatedSavedIds.delete(propertyId);
      setSavedIds(updatedSavedIds);
      const res = await unsaveProperty(user.id, propertyId);
      if (!res.success) {
        updatedSavedIds.add(propertyId);
        setSavedIds(updatedSavedIds);
        Alert.alert('Error', 'Failed to unsave property');
      }
    } else {
      updatedSavedIds.add(propertyId);
      setSavedIds(updatedSavedIds);
      const res = await saveProperty(user.id, propertyId);
      if (!res.success) {
        updatedSavedIds.delete(propertyId);
        setSavedIds(updatedSavedIds);
        Alert.alert('Error', 'Failed to save property');
      }
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

  const renderCategoryPill = (label: string, value: string) => {
    const isSelected = selectedType === value;
    return (
      <TouchableOpacity
        style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
        onPress={() => setSelectedType(value)}
      >
        <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPropertyCard = ({ item }: { item: Property }) => {
    const isSaved = savedIds.has(item.id);
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
        
        {/* Heart Favorite Button */}
        <TouchableOpacity
          style={styles.cardHeart}
          onPress={() => handleSaveToggle(item.id)}
        >
          <MaterialCommunityIcons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={24}
            color={isSaved ? '#CF6679' : '#FFFFFF'}
          />
        </TouchableOpacity>

        {/* Pricing Badge Overlay */}
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
      {/* Branding Header */}
      <View style={styles.brandHeader}>
        <View>
          <Text style={styles.brandSubtitle}>Find Your Perfect</Text>
          <Text style={styles.brandTitle}>Room & PG</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color="#666666" />
          <TextInput
            placeholder="Search by area, title or landmark..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close" size={20} color="#BBBBBB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Horizontal Bar */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {renderCategoryPill('All Rooms', 'All')}
          {renderCategoryPill('1 BHK', '1BHK')}
          {renderCategoryPill('2 BHK', '2BHK')}
          {renderCategoryPill('3 BHK', '3BHK')}
          {renderCategoryPill('PG Listings', 'PG')}
          {renderCategoryPill('Single Rooms', 'Room')}
          {renderCategoryPill('Houses', 'Independent House')}
        </ScrollView>
      </View>

      {/* Property Feed List */}
      {hasError ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="wifi-off" size={80} color="#CF6679" />
          <Text style={styles.emptyTitle}>Network Connection Failed</Text>
          <Text style={styles.emptySubtitle}>
            {errorMessage || 'Check your internet connection and try again.'}
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => loadData()}>
            <Text style={styles.resetBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#BB86FC" />
          <Text style={styles.loadingText}>Fetching available spaces...</Text>
        </View>
      ) : filteredProperties.length > 0 ? (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item.id}
          renderItem={renderPropertyCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="home-search-outline" size={80} color="#3D3D3D" />
          <Text style={styles.emptyTitle}>No Rooms Available</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedType !== 'All' 
              ? 'Try widening your search keywords or switching filters.'
              : 'Be the first to list a property in this area!'}
          </Text>
          {(searchQuery || selectedType !== 'All') && (
            <TouchableOpacity style={styles.resetBtn} onPress={() => { setSearchQuery(''); setSelectedType('All'); }}>
              <Text style={styles.resetBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Floating Map Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/map')}
      >
        <MaterialCommunityIcons name="map" size={24} color="#121212" />
        <Text style={styles.fabText}>Map</Text>
      </TouchableOpacity>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        visible={showDetailModal}
        property={selectedProperty}
        onClose={() => setShowDetailModal(false)}
        isSaved={selectedProperty ? savedIds.has(selectedProperty.id) : false}
        onSaveToggle={handleSaveToggle}
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
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandSubtitle: {
    color: '#BBBBBB',
    fontSize: 14,
    fontWeight: '500',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  categoriesWrapper: {
    marginBottom: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    marginRight: 8,
    height: 38,
    justifyContent: 'center',
  },
  categoryPillActive: {
    backgroundColor: '#BB86FC',
    borderColor: '#BB86FC',
  },
  categoryPillText: {
    color: '#BBBBBB',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#121212',
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 90,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  loadingText: {
    color: '#BBBBBB',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#666666',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: 20,
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  resetBtnText: {
    color: '#BB86FC',
    fontWeight: 'bold',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#BB86FC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    gap: 6,
  },
  fabText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
