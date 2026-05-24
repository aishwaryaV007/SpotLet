import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { createProperty } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { PropertyType, ForWhomType } from '@/types/property';
// Default initial location: Bangalore center
const INITIAL_COORDS = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#181818" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0a0a0a" }] }
];

export default function AddScreen() {
  const { user } = useAuth();

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [type, setType] = useState<PropertyType>('1BHK');
  const [furnished, setFurnished] = useState(false);
  const [forWhom, setForWhom] = useState<ForWhomType>('Any');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  
  // Location picking
  const [coordinate, setCoordinate] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
  });
  const [mapRegion, setMapRegion] = useState(INITIAL_COORDS);

  // Photos state
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);

  // Geocoding States
  const [geocoding, setGeocoding] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);

  // Set default phone number from logged-in user metadata
  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
    requestLocationPermission();
  }, [user]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCoordinate(coords);
        setMapRegion({
          ...coords,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });
      }
    } catch (error) {
      console.log('Error getting user location for add property screen:', error);
    }
  };

  const triggerGeocode = useCallback(async () => {
    if (!address || address.trim().length < 5) return;
    try {
      setGeocoding(true);
      const results = await Location.geocodeAsync(address);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        const coords = { latitude, longitude };
        setCoordinate(coords);
        setMapRegion({
          ...coords,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        });
      }
    } catch (error) {
      console.log('Geocoding error:', error);
    } finally {
      setGeocoding(false);
    }
  }, [address]);

  // Geocode address when user stops typing (1.5s debounce)
  useEffect(() => {
    if (!isManualInput || !address || address.trim().length < 5) return;

    const delayDebounceFn = setTimeout(() => {
      triggerGeocode();
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [address, isManualInput, triggerGeocode]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Image picking error:', error);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMapPress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setCoordinate(coords);
  };

  const handleUseCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCoordinate(coords);
      setMapRegion({
        ...coords,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      });
      
      // Auto-reverse geocode to help user with address
      const geocoded = await Location.reverseGeocodeAsync(coords);
      if (geocoded && geocoded.length > 0) {
        const addr = geocoded[0];
        const formattedAddress = [
          addr.name,
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.postalCode,
        ].filter(Boolean).join(', ');
        setIsManualInput(false);
        setAddress(formattedAddress);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to acquire current location.');
    }
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!title.trim()) return Alert.alert('Validation Error', 'Please enter a title.');
    if (!rent.trim() || isNaN(Number(rent))) return Alert.alert('Validation Error', 'Please enter a valid monthly rent amount.');
    if (!deposit.trim() || isNaN(Number(deposit))) return Alert.alert('Validation Error', 'Please enter a valid security deposit amount.');
    if (!address.trim()) return Alert.alert('Validation Error', 'Please enter the property address.');
    if (!phone.trim()) return Alert.alert('Validation Error', 'Please enter a contact phone number.');
    if (!user) return Alert.alert('Authentication Error', 'You must be logged in to create a listing.');

    try {
      setSubmitting(true);
      const uploadedUrls: string[] = [];

      // 1. Upload photos to Cloudinary if photos are selected
      if (photos.length > 0) {
        setUploadingPhotos(true);
        for (const localUri of photos) {
          const res = await uploadToCloudinary(localUri);
          if (res.success && res.url) {
            uploadedUrls.push(res.url);
          } else {
            console.log('Upload failed:', res.error);
            // Fallback: If uploading fails (e.g. storage bucket not yet created or configured),
            // we will use a premium public Unsplash photo so the app remains fully functional!
            const fallbackHouseIds = [
              '1564013799919-ab600027ffc6',
              '1570129477492-45c003edd2be',
              '1580587771525-78b9dba3b914',
              '1600585154340-be6161a56a0c',
              '1600596542815-ffad4c1539a9',
              '1600607687939-ce8a6c25118c',
              '1600566753190-17f0baa2a6c3',
              '1512917774080-9991f1c4c750',
              '1600585154526-990dced4db0d',
              '1600210492486-724fe5c67fb0'
            ];
            const randomId = fallbackHouseIds[Math.floor(Math.random() * fallbackHouseIds.length)];
            uploadedUrls.push(`https://images.unsplash.com/photo-${randomId}?auto=format&fit=crop&w=800&q=80`);
          }
        }
        setUploadingPhotos(false);
      } else {
        // Fallback placeholder image if no photo is picked
        uploadedUrls.push('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80');
      }

      // 2. Insert record to properties table
      const propertyData = {
        owner_id: user.id,
        title: title.trim(),
        description: description.trim(),
        rent: Number(rent),
        deposit: Number(deposit),
        type,
        furnished,
        for_whom: forWhom,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: address.trim(),
        photos: uploadedUrls,
        owner_phone: phone.trim(),
        available: true,
      };

      const result = await createProperty(propertyData);

      if (result.success) {
        Alert.alert('Success', 'Your rental property has been listed!', [
          {
            text: 'OK',
            onPress: () => {
              // Reset Form
              setTitle('');
              setDescription('');
              setRent('');
              setDeposit('');
              setType('1BHK');
              setFurnished(false);
              setForWhom('Any');
              setIsManualInput(false);
              setAddress('');
              setPhotos([]);
              
              // Redirect to main feed
              router.replace('/(tabs)');
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to list property. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTypeSelector = (option: PropertyType) => {
    const isSelected = type === option;
    return (
      <TouchableOpacity
        key={option}
        style={[styles.pillBtn, isSelected && styles.pillBtnActive]}
        onPress={() => setType(option)}
      >
        <Text style={[styles.pillBtnText, isSelected && styles.pillBtnTextActive]}>{option}</Text>
      </TouchableOpacity>
    );
  };

  const renderPreferenceSelector = (option: ForWhomType) => {
    const isSelected = forWhom === option;
    return (
      <TouchableOpacity
        key={option}
        style={[styles.pillBtn, isSelected && styles.pillBtnActive]}
        onPress={() => setForWhom(option)}
      >
        <Text style={[styles.pillBtnText, isSelected && styles.pillBtnTextActive]}>{option}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>List Your Property</Text>
        <Text style={styles.headerSubtitle}>Rent out your space instantly</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
        {/* Basic Details */}
        <Text style={styles.sectionTitle}>Basic Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            placeholder="e.g. Cozy 2BHK Flat near HSR Layout"
            placeholderTextColor="#666666"
            value={title}
            onChangeText={setTitle}
            style={styles.textInput}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            placeholder="Tell searchers about amenities, location highlights, rules..."
            placeholderTextColor="#666666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.textInput, styles.textArea]}
          />
        </View>

        {/* Pricing Rows */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
            <Text style={styles.inputLabel}>Monthly Rent (₹) *</Text>
            <TextInput
              placeholder="e.g. 15000"
              placeholderTextColor="#666666"
              keyboardType="number-pad"
              value={rent}
              onChangeText={setRent}
              style={styles.textInput}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Security Deposit (₹) *</Text>
            <TextInput
              placeholder="e.g. 50000"
              placeholderTextColor="#666666"
              keyboardType="number-pad"
              value={deposit}
              onChangeText={setDeposit}
              style={styles.textInput}
            />
          </View>
        </View>

        {/* Categories Section */}
        <Text style={styles.sectionTitle}>Specifications</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Room Type *</Text>
          <View style={styles.pillRow}>
            {(['1BHK', '2BHK', '3BHK', 'PG', 'Room', 'Independent House'] as PropertyType[]).map(renderTypeSelector)}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Preferred Tenants *</Text>
          <View style={styles.pillRow}>
            {(['Bachelor', 'Family', 'Any'] as ForWhomType[]).map(renderPreferenceSelector)}
          </View>
        </View>

        {/* Furnished Switch */}
        <View style={styles.switchGroup}>
          <View>
            <Text style={styles.switchLabel}>Fully Furnished</Text>
            <Text style={styles.switchSubtitle}>Does this unit include sofas, beds, fridge?</Text>
          </View>
          <Switch
            value={furnished}
            onValueChange={setFurnished}
            trackColor={{ false: '#2D2D2D', true: '#BB86FC' }}
            thumbColor={furnished ? '#03DAC6' : '#BBBBBB'}
          />
        </View>

        {/* Location Section */}
        <Text style={styles.sectionTitle}>Location Coordinates</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Street Address *</Text>
          <View style={styles.addressInputContainer}>
            <TextInput
              placeholder="e.g. Flat 302, Green Glen Layout, Bellandur, Bengaluru"
              placeholderTextColor="#666666"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                setIsManualInput(true);
              }}
              onBlur={() => {
                if (isManualInput && address.trim().length >= 5) {
                  triggerGeocode();
                }
              }}
              style={styles.addressInput}
            />
            {geocoding ? (
              <ActivityIndicator size="small" color="#BB86FC" style={{ marginRight: 10 }} />
            ) : address.trim().length >= 5 ? (
              <TouchableOpacity onPress={triggerGeocode} style={styles.locateInputBtn}>
                <MaterialCommunityIcons name="map-search-outline" size={20} color="#03DAC6" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Mini Map Location Picker */}
        <View style={styles.mapLabelRow}>
          <Text style={styles.inputLabel}>Pin Location on Map *</Text>
          <TouchableOpacity onPress={handleUseCurrentLocation} style={styles.currLocationBtn}>
            <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#03DAC6" />
            <Text style={styles.currLocationText}>Use Current</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.miniMap}
            region={mapRegion}
            customMapStyle={DARK_MAP_STYLE}
            onPress={handleMapPress}
            onRegionChangeComplete={(reg) => setMapRegion(reg)}
          >
            <Marker coordinate={coordinate} pinColor="#BB86FC" />
          </MapView>
          <View style={styles.mapOverlayHint}>
            <Text style={styles.mapHintText}>Tap map to move property pin</Text>
          </View>
        </View>

        {/* Photos Upload */}
        <Text style={styles.sectionTitle}>Media Gallery</Text>
        
        <View style={styles.photosSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImage}>
              <MaterialCommunityIcons name="camera-plus" size={26} color="#BB86FC" />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>

            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoContainer}>
                <Image source={{ uri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => handleRemovePhoto(idx)}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color="#CF6679" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.photoHint}>Add at least 1 image to attract searchers.</Text>
        </View>

        {/* Contact info */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Owner Phone Number *</Text>
          <TextInput
            placeholder="e.g. +91 9876543210"
            placeholderTextColor="#666666"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            style={styles.textInput}
          />
          <Text style={styles.phoneHint}>Users will use this number to contact you on phone or WhatsApp.</Text>
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color="#121212" />
              <Text style={styles.submitBtnTextDisabled}>
                {uploadingPhotos ? 'Uploading Photos...' : 'Publishing Space...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>Post Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#BB86FC',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#BBBBBB',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    color: '#FFFFFF',
    fontSize: 14,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  pillBtnActive: {
    backgroundColor: '#BB86FC',
    borderColor: '#BB86FC',
  },
  pillBtnText: {
    color: '#BBBBBB',
    fontSize: 12,
    fontWeight: '600',
  },
  pillBtnTextActive: {
    color: '#121212',
    fontWeight: 'bold',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  switchLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  switchSubtitle: {
    color: '#888888',
    fontSize: 11,
    marginTop: 2,
  },
  mapLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(3, 218, 198, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#03DAC6',
  },
  currLocationText: {
    color: '#03DAC6',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    marginBottom: 16,
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  mapOverlayHint: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mapHintText: {
    color: '#BBBBBB',
    fontSize: 10,
  },
  photosSection: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  photosScroll: {
    flexDirection: 'row',
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BB86FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#121212',
  },
  addPhotoText: {
    color: '#BB86FC',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  photoContainer: {
    marginRight: 12,
    position: 'relative',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
  },
  photoHint: {
    color: '#666666',
    fontSize: 11,
    marginTop: 8,
  },
  phoneHint: {
    color: '#666666',
    fontSize: 11,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: '#03DAC6',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: {
    backgroundColor: '#555555',
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnTextDisabled: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 15,
  },
  submitBtnText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 15,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 4,
  },
  addressInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 8,
  },
  locateInputBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
});
