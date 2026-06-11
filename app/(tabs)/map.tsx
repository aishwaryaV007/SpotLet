import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  fetchProperties,
  saveProperty,
  unsaveProperty,
  fetchSavedProperties,
} from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Property } from '@/types/property';
import { Searchbar } from 'react-native-paper';
import PropertyDetailsModal from '@/components/PropertyDetailsModal';
import LoginPromptSheet from '@/components/LoginPromptSheet';
import { useResponsive } from '@/utils/useResponsive';

import MapView, { Marker, PROVIDER_GOOGLE } from '@/components/CustomMap';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82;
const CARD_SPACING = 12;

// Premium Custom Dark Map Style JSON
const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#181818" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] },
  { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#b0b0b0" }] },
  { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#c0c0c0" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#1e1e1e" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#353535" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#383838" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#707070" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0a0a0a" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#4e4e4e" }] }
];

const DEFAULT_REGION = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

export default function MapScreen() {
  const { user } = useAuth();
  const { isDesktopWeb } = useResponsive();
  const mapRef = useRef<MapView | null>(null);
  const flatListRef = useRef<FlatList | null>(null);

  // Login Prompt for guests
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  // Filters State
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedFurnished, setSelectedFurnished] = useState<string>('All');
  const [selectedForWhom, setSelectedForWhom] = useState<string>('All');

  useEffect(() => {
    loadData();
    requestLocation();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [properties, selectedType, selectedFurnished, selectedForWhom, searchQuery]);

  const loadData = async () => {
    try {
      setHasError(false);
      setLoading(true);
      const res = await fetchProperties();
      if (res.success && res.data) {
        // Parse DB schema if photo is a text array
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
      console.error('Error loading map data:', error);
      setHasError(true);
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      if (mapReady && mapRef.current) {
        mapRef.current.animateToRegion(userRegion, 1000);
      }
    } catch (error) {
      console.log('Location request error:', error);
    }
  };

  const applyFilters = () => {
    let result = [...properties];

    // Filter by type
    if (selectedType !== 'All') {
      result = result.filter((p) => p.type === selectedType);
    }

    // Filter by furnishing
    if (selectedFurnished !== 'All') {
      const isFurnished = selectedFurnished === 'Furnished';
      result = result.filter((p) => p.furnished === isFurnished);
    }

    // Filter by target tenants
    if (selectedForWhom !== 'All') {
      result = result.filter((p) => p.for_whom === selectedForWhom);
    }

    // Filter by search query (address, title, description)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.address.toLowerCase().includes(query) ||
          p.title.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    setFilteredProperties(result);

    // Auto-select first item in filtered list if available
    if (result.length > 0) {
      setSelectedProperty(result[0]);
      if (mapReady && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: result[0].latitude,
          longitude: result[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 800);
      }
    } else {
      setSelectedProperty(null);
    }
  };

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowDetailModal(true); // Open the details card modal instantly when pin is clicked
    const index = filteredProperties.findIndex((p) => p.id === property.id);
    if (index > -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
    mapRef.current?.animateToRegion(
      {
        latitude: property.latitude,
        longitude: property.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      600
    );
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

  const formatRent = (value: number) => {
    if (value >= 100000) {
      return `${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  const renderFilterPill = (
    label: string,
    currentValue: string,
    value: string,
    onPress: (val: string) => void
  ) => {
    const isSelected = currentValue === value;
    return (
      <TouchableOpacity
        style={[styles.filterPill, isSelected && styles.filterPillActive]}
        onPress={() => onPress(value)}
      >
        <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (hasError) {
    return (
      <View style={styles.centeredErrorContainer}>
        <MaterialCommunityIcons name="wifi-off" size={80} color="#CF6679" />
        <Text style={styles.errorTitle}>Network Connection Failed</Text>
        <Text style={styles.errorSubtitle}>
          {errorMessage || 'Check your internet connection and try again.'}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && properties.length === 0) {
    return (
      <View style={styles.centeredErrorContainer}>
        <ActivityIndicator size="large" color="#BB86FC" />
        <Text style={styles.loadingText}>Loading map coordinates...</Text>
      </View>
    );
  }

  if (!loading && properties.length === 0 && !hasError) {
    return (
      <View style={styles.centeredErrorContainer}>
        <MaterialCommunityIcons name="home-search-outline" size={80} color="#3D3D3D" />
        <Text style={styles.errorTitle}>No Listings Found</Text>
        <Text style={styles.errorSubtitle}>
          There are no rental properties listed on the map yet.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
          <Text style={styles.retryBtnText}>Refresh Map</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // ─── WEB DESKTOP LAYOUT (split: list | map) ───
  if (isDesktopWeb) {
    return (
      <View style={webMapStyles.container}>
        {/* Left Panel: Property List */}
        <View style={webMapStyles.leftPanel}>
          {/* Search */}
          <View style={webMapStyles.searchContainer}>
            <View style={webMapStyles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={20} color="#888888" />
              <TextInput
                placeholder="Search by area or city..."
                placeholderTextColor="#666666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={webMapStyles.searchInput}
              />
            </View>
          </View>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={webMapStyles.filtersScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 6, alignItems: 'center' }}>
            {renderFilterPill('All', selectedType, 'All', setSelectedType)}
            {renderFilterPill('1BHK', selectedType, '1BHK', setSelectedType)}
            {renderFilterPill('2BHK', selectedType, '2BHK', setSelectedType)}
            {renderFilterPill('3BHK', selectedType, '3BHK', setSelectedType)}
            {renderFilterPill('PG', selectedType, 'PG', setSelectedType)}
            {renderFilterPill('Room', selectedType, 'Room', setSelectedType)}
          </ScrollView>

          {/* Property List */}
          <ScrollView style={webMapStyles.propertyListContainer} showsVerticalScrollIndicator={false} contentContainerStyle={webMapStyles.propertyList}>
            {loading ? (
              <View style={webMapStyles.centered}>
                <ActivityIndicator size="large" color="#BB86FC" />
              </View>
            ) : filteredProperties.length === 0 ? (
              <View style={webMapStyles.centered}>
                <MaterialCommunityIcons name="home-search-outline" size={48} color="#3D3D3D" />
                <Text style={webMapStyles.emptyText}>No properties match filters</Text>
              </View>
            ) : (
              filteredProperties.map((item) => {
                const isSaved = savedIds.has(item.id);
                const imgUrl = item.photos && item.photos.length > 0 ? item.photos[0] : FALLBACK_IMAGE;
                const isActive = selectedProperty?.id === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => handleSelectProperty(item)}
                    style={[webMapStyles.card, isActive && webMapStyles.cardActive]}
                  >
                    <Image source={{ uri: imgUrl }} style={webMapStyles.cardImage} />
                    <TouchableOpacity
                      style={webMapStyles.cardHeart}
                      onPress={() => handleSaveToggle(item.id)}
                    >
                      <MaterialCommunityIcons
                        name={isSaved ? 'heart' : 'heart-outline'}
                        size={18}
                        color={isSaved ? '#CF6679' : '#FFFFFF'}
                      />
                    </TouchableOpacity>
                    <View style={webMapStyles.cardInfo}>
                      <Text style={webMapStyles.cardTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={webMapStyles.cardPrice}>₹{item.rent.toLocaleString('en-IN')}/mo</Text>
                      <Text style={webMapStyles.cardAddress} numberOfLines={1}>{item.address}</Text>
                      <View style={webMapStyles.cardBadges}>
                        <View style={webMapStyles.badge}>
                          <Text style={webMapStyles.badgeText}>{item.type}</Text>
                        </View>
                        <View style={webMapStyles.badge}>
                          <Text style={webMapStyles.badgeText}>{item.furnished ? 'Furnished' : 'Unfurnished'}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Right Panel: Map */}
        <View style={webMapStyles.rightPanel}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={DEFAULT_REGION}
            customMapStyle={DARK_MAP_STYLE}
            showsUserLocation
            showsMyLocationButton={false}
            onMapReady={() => {
              setMapReady(true);
              requestLocation();
            }}
          >
            {filteredProperties.map((item) => {
              const isSelected = selectedProperty?.id === item.id;
              return (
                <Marker
                  key={item.id}
                  coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                  onPress={() => handleSelectProperty(item)}
                >
                  <View style={[styles.markerBubble, isSelected && styles.markerBubbleSelected]}>
                    <Text style={[styles.markerText, isSelected && styles.markerTextSelected]}>
                      ₹{formatRent(item.rent)}
                    </Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>
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
    <View style={styles.container}>
      {/* Search / Filters Bar */}
      <View style={styles.filterBarContainer}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by area or city..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            iconColor="#BB86FC"
            placeholderTextColor="#888888"
            inputStyle={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {/* Property Types */}
          {renderFilterPill('All Types', selectedType, 'All', setSelectedType)}
          {renderFilterPill('1 BHK', selectedType, '1BHK', setSelectedType)}
          {renderFilterPill('2 BHK', selectedType, '2BHK', setSelectedType)}
          {renderFilterPill('3 BHK', selectedType, '3BHK', setSelectedType)}
          {renderFilterPill('PG', selectedType, 'PG', setSelectedType)}
          {renderFilterPill('Room', selectedType, 'Room', setSelectedType)}
          {renderFilterPill('House', selectedType, 'Independent House', setSelectedType)}

          <View style={styles.divider} />

          {/* Furnished status */}
          {renderFilterPill('All Furnish', selectedFurnished, 'All', setSelectedFurnished)}
          {renderFilterPill('Furnished', selectedFurnished, 'Furnished', setSelectedFurnished)}
          {renderFilterPill('Unfurnished', selectedFurnished, 'Unfurnished', setSelectedFurnished)}

          <View style={styles.divider} />

          {/* Target Tenants */}
          {renderFilterPill('All Tenants', selectedForWhom, 'All', setSelectedForWhom)}
          {renderFilterPill('Family', selectedForWhom, 'Family', setSelectedForWhom)}
          {renderFilterPill('Bachelor', selectedForWhom, 'Bachelor', setSelectedForWhom)}
        </ScrollView>
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        onMapReady={() => {
          setMapReady(true);
          requestLocation();
        }}
      >
        {filteredProperties.map((item) => {
          const isSelected = selectedProperty?.id === item.id;
          return (
            <Marker
              key={item.id}
              coordinate={{ latitude: item.latitude, longitude: item.longitude }}
              onPress={() => handleSelectProperty(item)}
            >
              <View style={[styles.markerBubble, isSelected && styles.markerBubbleSelected]}>
                <Text style={[styles.markerText, isSelected && styles.markerTextSelected]}>
                  ₹{formatRent(item.rent)}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Re-center / Location Button */}
      <TouchableOpacity style={styles.locationButton} onPress={requestLocation}>
        <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#BB86FC" />
      </TouchableOpacity>

      {/* Carousel overlay */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#BB86FC" />
        </View>
      ) : filteredProperties.length > 0 ? (
        <View style={styles.carouselWrapper}>
          <FlatList
            ref={flatListRef}
            data={filteredProperties}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_SPACING}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING)
              );
              if (index >= 0 && index < filteredProperties.length) {
                const prop = filteredProperties[index];
                setSelectedProperty(prop);
                mapRef.current?.animateToRegion(
                  {
                    latitude: prop.latitude,
                    longitude: prop.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  },
                  500
                );
              }
            }}
            renderItem={({ item }) => {
              const isSaved = savedIds.has(item.id);
              const imgUrl = item.photos && item.photos.length > 0 ? item.photos[0] : FALLBACK_IMAGE;

              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setShowDetailModal(true)}
                  style={styles.card}
                >
                  <Image source={{ uri: imgUrl }} style={styles.cardImage} />
                  
                  {/* Saved Heart Button */}
                  <TouchableOpacity
                    style={styles.cardHeart}
                    onPress={() => handleSaveToggle(item.id)}
                  >
                    <MaterialCommunityIcons
                      name={isSaved ? 'heart' : 'heart-outline'}
                      size={22}
                      color={isSaved ? '#CF6679' : '#FFFFFF'}
                    />
                  </TouchableOpacity>

                  <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardPrice}>₹{item.rent.toLocaleString('en-IN')}</Text>
                    </View>

                    <Text style={styles.cardAddress} numberOfLines={1}>
                      {item.address}
                    </Text>

                    <View style={styles.cardBadges}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.type}</Text>
                      </View>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {item.furnished ? 'Furnished' : 'Unfurnished'}
                        </Text>
                      </View>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>For {item.for_whom}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No properties match the selected filters.</Text>
        </View>
      )}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  filterBarContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: 10,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchbar: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    height: 48,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 0,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 38,
  },
  filterPillActive: {
    backgroundColor: '#BB86FC',
    borderColor: '#BB86FC',
  },
  filterPillText: {
    color: '#BBBBBB',
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#121212',
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#3D3D3D',
    alignSelf: 'center',
    marginHorizontal: 8,
  },
  map: {
    width: width,
    height: height,
  },
  markerBubble: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2D2D2D',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerBubbleSelected: {
    backgroundColor: '#BB86FC',
    borderColor: '#FFFFFF',
  },
  markerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  markerTextSelected: {
    color: '#121212',
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 270,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  carouselWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  carouselContent: {
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: 190,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginRight: CARD_SPACING,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    flexDirection: 'row',
  },
  cardImage: {
    width: '40%',
    height: '100%',
    backgroundColor: '#2D2D2D',
  },
  cardHeart: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(18, 18, 18, 0.7)',
    borderRadius: 18,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cardInfo: {
    width: '60%',
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#03DAC6',
    marginTop: 2,
  },
  cardAddress: {
    fontSize: 12,
    color: '#888888',
    marginVertical: 4,
  },
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    backgroundColor: '#2D2D2D',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(30,30,30,0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  emptyText: {
    color: '#BBBBBB',
    fontSize: 14,
    textAlign: 'center',
  },
  centeredErrorContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#BB86FC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
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

const webMapStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#121212',
  },
  leftPanel: {
    width: 400,
    borderRightWidth: 1,
    borderRightColor: '#2D2D2D',
    backgroundColor: '#121212',
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  filtersScroll: {
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 8,
  },
  propertyListContainer: {
    flex: 1,
  },
  propertyList: {
    padding: 12,
    gap: 12,
  },
  centered: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  cardActive: {
    borderColor: '#BB86FC',
    borderWidth: 2,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#2D2D2D',
  },
  cardHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(18, 18, 18, 0.7)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  cardInfo: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#03DAC6',
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: '#2D2D2D',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  rightPanel: {
    flex: 1,
  },
});
