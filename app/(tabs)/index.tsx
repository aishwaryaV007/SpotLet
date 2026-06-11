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
  Platform,
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
import PropertyDetailsModal from '@/components/PropertyDetailsModal';
import LoginPromptSheet from '@/components/LoginPromptSheet';
import { useResponsive } from '@/utils/useResponsive';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isMobile, isDesktopWeb } = useResponsive();
  
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
  const [selectedFurnished, setSelectedFurnished] = useState<string>('All');
  const [selectedForWhom, setSelectedForWhom] = useState<string>('All');
  
  // Detail Modal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Login Prompt for guests
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [properties, searchQuery, selectedType, selectedFurnished, selectedForWhom]);

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

    if (selectedType !== 'All') {
      result = result.filter((p) => p.type === selectedType);
    }

    if (selectedFurnished !== 'All') {
      const isFurnished = selectedFurnished === 'Furnished';
      result = result.filter((p) => p.furnished === isFurnished);
    }

    if (selectedForWhom !== 'All') {
      result = result.filter((p) => p.for_whom === selectedForWhom);
    }

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
      setShowLoginPrompt(true);
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

  // ─── MOBILE COMPONENTS ───

  const renderCategoryPill = (label: string, value: string) => {
    const isSelected = selectedType === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
        onPress={() => setSelectedType(value)}
      >
        <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMobilePropertyCard = ({ item }: { item: Property }) => {
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

  // ─── WEB COMPONENTS ───

  const renderWebSidebar = () => {
    const typeOptions = [
      { label: 'All Rooms', value: 'All' },
      { label: '1 BHK', value: '1BHK' },
      { label: '2 BHK', value: '2BHK' },
      { label: '3 BHK', value: '3BHK' },
      { label: 'PG Listings', value: 'PG' },
      { label: 'Single Rooms', value: 'Room' },
      { label: 'Houses', value: 'Independent House' },
    ];

    const furnishedOptions = [
      { label: 'All', value: 'All' },
      { label: 'Furnished', value: 'Furnished' },
      { label: 'Unfurnished', value: 'Unfurnished' },
    ];

    const tenantOptions = [
      { label: 'All Tenants', value: 'All' },
      { label: 'Family', value: 'Family' },
      { label: 'Bachelor', value: 'Bachelor' },
    ];

    return (
      <View style={webStyles.sidebar}>
        <Text style={webStyles.sidebarTitle}>Filters</Text>

        {/* Property Type */}
        <Text style={webStyles.filterGroupTitle}>Property Type</Text>
        {typeOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={webStyles.filterOption}
            onPress={() => setSelectedType(opt.value)}
          >
            <View style={[webStyles.radio, selectedType === opt.value && webStyles.radioActive]}>
              {selectedType === opt.value && <View style={webStyles.radioInner} />}
            </View>
            <Text style={[webStyles.filterOptionText, selectedType === opt.value && webStyles.filterOptionTextActive]}>
              {opt.label}
            </Text>
            <Text style={webStyles.filterCount}>
              {opt.value === 'All'
                ? properties.length
                : properties.filter((p) => p.type === opt.value).length}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={webStyles.filterDivider} />

        {/* Furnished */}
        <Text style={webStyles.filterGroupTitle}>Furnishing</Text>
        {furnishedOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={webStyles.filterOption}
            onPress={() => setSelectedFurnished(opt.value)}
          >
            <View style={[webStyles.radio, selectedFurnished === opt.value && webStyles.radioActive]}>
              {selectedFurnished === opt.value && <View style={webStyles.radioInner} />}
            </View>
            <Text style={[webStyles.filterOptionText, selectedFurnished === opt.value && webStyles.filterOptionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={webStyles.filterDivider} />

        {/* Tenant Preference */}
        <Text style={webStyles.filterGroupTitle}>Preferred Tenants</Text>
        {tenantOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={webStyles.filterOption}
            onPress={() => setSelectedForWhom(opt.value)}
          >
            <View style={[webStyles.radio, selectedForWhom === opt.value && webStyles.radioActive]}>
              {selectedForWhom === opt.value && <View style={webStyles.radioInner} />}
            </View>
            <Text style={[webStyles.filterOptionText, selectedForWhom === opt.value && webStyles.filterOptionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Clear Filters */}
        {(selectedType !== 'All' || selectedFurnished !== 'All' || selectedForWhom !== 'All') && (
          <TouchableOpacity
            style={webStyles.clearFiltersBtn}
            onPress={() => {
              setSelectedType('All');
              setSelectedFurnished('All');
              setSelectedForWhom('All');
            }}
          >
            <Text style={webStyles.clearFiltersBtnText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderWebPropertyCard = (item: Property) => {
    const isSaved = savedIds.has(item.id);
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
            onPress={() => handleSaveToggle(item.id)}
          >
            <MaterialCommunityIcons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={22}
              color={isSaved ? '#CF6679' : '#FFFFFF'}
            />
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
            {item.deposit ? (
              <View style={webStyles.badge}>
                <MaterialCommunityIcons name="cash" size={14} color="#FFB74D" />
                <Text style={webStyles.badgeText}>Deposit: ₹{item.deposit.toLocaleString('en-IN')}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── WEB DESKTOP LAYOUT ───

  if (isDesktopWeb) {
    return (
      <View style={webStyles.container}>
        {/* Header */}
        <View style={webStyles.headerBar}>
          <View style={webStyles.headerLeft}>
            <Text style={webStyles.headerSubtitle}>Find Your Perfect</Text>
            <Text style={webStyles.headerTitle}>Room & PG</Text>
          </View>
          <Text style={webStyles.resultCount}>
            {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
          </Text>
        </View>

        {/* Search Bar */}
        <View style={webStyles.searchContainer}>
          <View style={webStyles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={22} color="#888888" />
            <TextInput
              placeholder="Search by area, title or landmark..."
              placeholderTextColor="#666666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={webStyles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#888888" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Main Content */}
        <View style={webStyles.mainLayout}>
          {renderWebSidebar()}

          <View style={webStyles.contentArea}>
            {hasError ? (
              <View style={webStyles.centeredMessage}>
                <MaterialCommunityIcons name="wifi-off" size={64} color="#CF6679" />
                <Text style={webStyles.messageTitle}>Connection Failed</Text>
                <Text style={webStyles.messageSubtitle}>
                  {errorMessage || 'Check your internet and try again.'}
                </Text>
                <TouchableOpacity style={webStyles.retryBtn} onPress={() => loadData()}>
                  <Text style={webStyles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : loading ? (
              <View style={webStyles.centeredMessage}>
                <ActivityIndicator size="large" color="#BB86FC" />
                <Text style={webStyles.messageSubtitle}>Fetching available spaces...</Text>
              </View>
            ) : filteredProperties.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={webStyles.cardList}>
                {filteredProperties.map((item) => renderWebPropertyCard(item))}
              </ScrollView>
            ) : (
              <View style={webStyles.centeredMessage}>
                <MaterialCommunityIcons name="home-search-outline" size={64} color="#3D3D3D" />
                <Text style={webStyles.messageTitle}>No Properties Found</Text>
                <Text style={webStyles.messageSubtitle}>
                  Try widening your search or clearing filters.
                </Text>
                <TouchableOpacity
                  style={webStyles.retryBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedType('All');
                    setSelectedFurnished('All');
                    setSelectedForWhom('All');
                  }}
                >
                  <Text style={webStyles.retryBtnText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Property Details Modal */}
        <PropertyDetailsModal
          visible={showDetailModal}
          property={selectedProperty}
          onClose={() => setShowDetailModal(false)}
          isSaved={selectedProperty ? savedIds.has(selectedProperty.id) : false}
          onSaveToggle={handleSaveToggle}
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
          isGuest={!user}
        />

        {/* Login Prompt */}
        <LoginPromptSheet
          visible={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          message="Sign in to save properties"
        />
      </View>
    );
  }

  // ─── MOBILE LAYOUT (unchanged) ───

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
          renderItem={renderMobilePropertyCard}
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
        isGuest={!user}
      />

      {/* Login Prompt */}
      <LoginPromptSheet
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="Sign in to save properties"
      />
    </SafeAreaView>
  );
}

// ─── MOBILE STYLES (unchanged) ───

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

// ─── WEB STYLES ───

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 8,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  headerLeft: {},
  headerSubtitle: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  resultCount: {
    color: '#888888',
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 10,
    // @ts-ignore - Web-specific outline removal
    outlineStyle: 'none',
  },
  mainLayout: {
    flexDirection: 'row',
    flex: 1,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 40,
    gap: 24,
  },
  // ─── Sidebar ───
  sidebar: {
    width: 260,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    padding: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  sidebarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  filterGroupTitle: {
    color: '#BB86FC',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#555555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#BB86FC',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#BB86FC',
  },
  filterOptionText: {
    color: '#BBBBBB',
    fontSize: 14,
    flex: 1,
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterCount: {
    color: '#666666',
    fontSize: 12,
  },
  filterDivider: {
    height: 1,
    backgroundColor: '#2D2D2D',
    marginVertical: 16,
  },
  clearFiltersBtn: {
    marginTop: 20,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BB86FC',
  },
  clearFiltersBtnText: {
    color: '#BB86FC',
    fontWeight: '600',
    fontSize: 13,
  },
  // ─── Content Area ───
  contentArea: {
    flex: 1,
    marginTop: 8,
  },
  cardList: {
    paddingBottom: 40,
    gap: 16,
  },
  // ─── Horizontal Card ───
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  cardImageContainer: {
    width: 280,
    height: 200,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2D2D2D',
  },
  cardHeart: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(18, 18, 18, 0.7)',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#03DAC6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    color: '#121212',
    fontWeight: '900',
    fontSize: 16,
  },
  priceUnit: {
    color: '#121212',
    fontWeight: '500',
    fontSize: 11,
    marginLeft: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  locationText: {
    color: '#888888',
    fontSize: 13,
    flex: 1,
  },
  descriptionText: {
    color: '#999999',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2D2D2D',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  // ─── States ───
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  messageTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  messageSubtitle: {
    color: '#888888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#BB86FC',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
