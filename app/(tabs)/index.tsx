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
  Modal,
  ScrollView,
  Linking,
  Dimensions,
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

const { width } = Dimensions.get('window');
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

export default function HomeScreen() {
  const { user } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      }

      if (user) {
        const savedRes = await fetchSavedProperties(user.id);
        if (savedRes.success && savedRes.data) {
          const ids = new Set<string>(savedRes.data.map((item: any) => item.id));
          setSavedIds(ids);
        }
      }
    } catch (error) {
      console.error('Error loading property feed:', error);
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
      {loading ? (
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
            Try widening your search keywords or switching filters.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setSearchQuery(''); setSelectedType('All'); }}>
            <Text style={styles.resetBtnText}>Clear Filters</Text>
          </TouchableOpacity>
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
      {selectedProperty && (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Close and Favorite Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowDetailModal(false)}
                  style={styles.closeBtn}
                >
                  <MaterialCommunityIcons name="chevron-down" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>Property Details</Text>
                <TouchableOpacity
                  onPress={() => handleSaveToggle(selectedProperty.id)}
                  style={styles.modalFavBtn}
                >
                  <MaterialCommunityIcons
                    name={savedIds.has(selectedProperty.id) ? 'heart' : 'heart-outline'}
                    size={26}
                    color={savedIds.has(selectedProperty.id) ? '#CF6679' : '#FFFFFF'}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Images view */}
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                  {selectedProperty.photos && selectedProperty.photos.length > 0 ? (
                    selectedProperty.photos.map((photo, i) => (
                      <Image key={i} source={{ uri: photo }} style={styles.modalImage} />
                    ))
                  ) : (
                    <Image source={{ uri: FALLBACK_IMAGE }} style={styles.modalImage} />
                  )}
                </ScrollView>

                {/* Details Section */}
                <View style={styles.modalDetails}>
                  <View style={styles.modalPricing}>
                    <View>
                      <Text style={styles.modalPriceText}>
                        ₹{selectedProperty.rent.toLocaleString('en-IN')}
                        <Text style={styles.priceSub}> / month</Text>
                      </Text>
                      <Text style={styles.modalDepositText}>
                        Deposit: ₹{selectedProperty.deposit.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.modalTypeBadge}>
                      <Text style={styles.modalTypeBadgeText}>{selectedProperty.type}</Text>
                    </View>
                  </View>

                  <Text style={styles.modalTitleText}>{selectedProperty.title}</Text>
                  
                  <View style={styles.modalLocationRow}>
                    <MaterialCommunityIcons name="map-marker" size={18} color="#BB86FC" />
                    <Text style={styles.modalLocationText}>{selectedProperty.address}</Text>
                  </View>

                  {/* Highlights Grid */}
                  <View style={styles.highlightsGrid}>
                    <View style={styles.highlightCard}>
                      <MaterialCommunityIcons name="sofa-single" size={20} color="#03DAC6" />
                      <Text style={styles.highlightVal}>
                        {selectedProperty.furnished ? 'Furnished' : 'Unfurnished'}
                      </Text>
                      <Text style={styles.highlightLbl}>Furnishing</Text>
                    </View>
                    <View style={styles.highlightCard}>
                      <MaterialCommunityIcons name="account-group" size={20} color="#03DAC6" />
                      <Text style={styles.highlightVal}>{selectedProperty.for_whom}</Text>
                      <Text style={styles.highlightLbl}>Preferred Tenant</Text>
                    </View>
                    <View style={styles.highlightCard}>
                      <MaterialCommunityIcons name="home-circle" size={20} color="#03DAC6" />
                      <Text style={styles.highlightVal}>{selectedProperty.type}</Text>
                      <Text style={styles.highlightLbl}>Property Type</Text>
                    </View>
                  </View>

                  {/* Description */}
                  {selectedProperty.description && (
                    <View style={styles.sectionContainer}>
                      <Text style={styles.sectionTitle}>Description</Text>
                      <Text style={styles.sectionText}>{selectedProperty.description}</Text>
                    </View>
                  )}

                  {/* Amenities */}
                  {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <Text style={styles.sectionTitle}>Amenities</Text>
                      <View style={styles.amenitiesContainer}>
                        {selectedProperty.amenities.map((item, idx) => (
                          <View key={idx} style={styles.amenityPill}>
                            <Text style={styles.amenityText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Owner Contact */}
                  <View style={styles.ownerSection}>
                    <View style={styles.ownerHeader}>
                      <MaterialCommunityIcons name="account-circle" size={40} color="#BBBBBB" />
                      <View style={styles.ownerInfo}>
                        <Text style={styles.ownerName}>Property Owner</Text>
                        <Text style={styles.ownerPhone}>{selectedProperty.owner_phone || 'Contact Info Available'}</Text>
                      </View>
                    </View>

                    {selectedProperty.owner_phone && (
                      <View style={styles.contactActions}>
                        <TouchableOpacity
                          style={[styles.contactBtn, styles.callBtn]}
                          onPress={() => handleCall(selectedProperty.owner_phone)}
                        >
                          <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
                          <Text style={styles.contactBtnText}>Call Owner</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.contactBtn, styles.waBtn]}
                          onPress={() => handleWhatsApp(selectedProperty.owner_phone, selectedProperty.title)}
                        >
                          <MaterialCommunityIcons name="whatsapp" size={20} color="#FFFFFF" />
                          <Text style={styles.contactBtnText}>WhatsApp</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalFavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: 240,
    resizeMode: 'cover',
    backgroundColor: '#1E1E1E',
  },
  modalDetails: {
    padding: 20,
  },
  modalPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalPriceText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#03DAC6',
  },
  priceSub: {
    fontSize: 14,
    color: '#888888',
    fontWeight: 'normal',
  },
  modalDepositText: {
    fontSize: 13,
    color: '#BBBBBB',
    marginTop: 2,
  },
  modalTypeBadge: {
    backgroundColor: '#BB86FC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalTypeBadgeText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingRight: 10,
  },
  modalLocationText: {
    color: '#BBBBBB',
    fontSize: 14,
    marginLeft: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  highlightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    padding: 12,
    alignItems: 'center',
  },
  highlightVal: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  highlightLbl: {
    color: '#666666',
    fontSize: 10,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionText: {
    color: '#BBBBBB',
    fontSize: 14,
    lineHeight: 20,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityPill: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  amenityText: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  ownerSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    padding: 16,
    marginTop: 10,
    marginBottom: 30,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ownerInfo: {
    marginLeft: 12,
  },
  ownerName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ownerPhone: {
    color: '#BBBBBB',
    fontSize: 14,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  callBtn: {
    backgroundColor: '#BB86FC',
  },
  waBtn: {
    backgroundColor: '#25D366',
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
