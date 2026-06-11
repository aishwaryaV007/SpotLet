import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Property } from '@/types/property';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

interface PropertyDetailsModalProps {
  visible: boolean;
  property: Property | null;
  onClose: () => void;
  isSaved: boolean;
  onSaveToggle: (propertyId: string) => void;
  onCall: (phoneNumber: string) => void;
  onWhatsApp: (phoneNumber: string, title: string) => void;
  /** If true, contact info is hidden behind a login prompt */
  isGuest?: boolean;
}

export default function PropertyDetailsModal({
  visible,
  property,
  onClose,
  isSaved,
  onSaveToggle,
  onCall,
  onWhatsApp,
  isGuest = false,
}: PropertyDetailsModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && windowWidth >= 768;

  if (!property) return null;

  // Photo Grid Gallery for Desktop Web (Goibibo/Airbnb Style)
  const renderPhotoGalleryGrid = () => {
    const photos = property.photos || [];
    if (photos.length === 0) {
      return (
        <View style={styles.webPhotoGrid}>
          <Image source={{ uri: FALLBACK_IMAGE }} style={styles.webPhotoMain} />
        </View>
      );
    }
    
    if (photos.length === 1) {
      return (
        <View style={styles.webPhotoGrid}>
          <Image source={{ uri: photos[0] }} style={styles.webPhotoMain} />
        </View>
      );
    }

    if (photos.length === 2) {
      return (
        <View style={styles.webPhotoGrid}>
          <Image source={{ uri: photos[0] }} style={[styles.webPhotoHalf, { marginRight: 8 }]} />
          <Image source={{ uri: photos[1] }} style={styles.webPhotoHalf} />
        </View>
      );
    }

    // 3 or more photos
    return (
      <View style={styles.webPhotoGrid}>
        <View style={styles.webPhotoLeftColumn}>
          <Image source={{ uri: photos[0] }} style={styles.webPhotoMain} />
        </View>
        <View style={styles.webPhotoRightColumn}>
          <Image source={{ uri: photos[1] || FALLBACK_IMAGE }} style={[styles.webPhotoSub, { marginBottom: 8 }]} />
          <Image source={{ uri: photos[2] || FALLBACK_IMAGE }} style={styles.webPhotoSub} />
        </View>
      </View>
    );
  };

  if (isLargeScreen) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlayWeb}>
          <View style={styles.modalContentWeb}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
              >
                <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Property Details</Text>
              <TouchableOpacity
                onPress={() => onSaveToggle(property.id)}
                style={styles.modalFavBtn}
              >
                <MaterialCommunityIcons
                  name={isSaved ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isSaved ? '#CF6679' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.webScrollContent}>
              {/* Photo Grid Gallery */}
              {renderPhotoGalleryGrid()}

              {/* Split Layout */}
              <View style={styles.webSplitLayout}>
                {/* Left Column: Info & Details */}
                <View style={styles.webLeftColumn}>
                  <Text style={styles.modalTitleText}>{property.title}</Text>
                  
                  <View style={styles.modalLocationRow}>
                    <MaterialCommunityIcons name="map-marker" size={18} color="#BB86FC" />
                    <Text style={styles.modalLocationText}>{property.address}</Text>
                  </View>

                  {/* Description */}
                  {property.description && (
                    <View style={styles.sectionContainer}>
                      <Text style={styles.sectionTitle}>Description</Text>
                      <Text style={styles.sectionText}>{property.description}</Text>
                    </View>
                  )}

                  {/* Amenities */}
                  {property.amenities && property.amenities.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <Text style={styles.sectionTitle}>Amenities</Text>
                      <View style={styles.amenitiesContainer}>
                        {property.amenities.map((item, idx) => (
                          <View key={idx} style={styles.amenityPill}>
                            <MaterialCommunityIcons name="check-circle-outline" size={14} color="#03DAC6" style={{ marginRight: 6 }} />
                            <Text style={styles.amenityText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Right Column: Pricing & Owner Contact sticky panel */}
                <View style={styles.webRightColumn}>
                  <View style={styles.stickyPanel}>
                    <View style={styles.panelPricingRow}>
                      <View>
                        <Text style={styles.modalPriceText}>
                          ₹{property.rent.toLocaleString('en-IN')}
                          <Text style={styles.priceSub}> / month</Text>
                        </Text>
                        <Text style={styles.modalDepositText}>
                          Deposit: ₹{property.deposit.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.modalTypeBadge}>
                        <Text style={styles.modalTypeBadgeText}>{property.type}</Text>
                      </View>
                    </View>

                    <View style={styles.panelDivider} />

                    <View style={styles.panelHighlightsList}>
                      <View style={styles.panelHighlightItem}>
                        <MaterialCommunityIcons name="sofa-single" size={20} color="#03DAC6" />
                        <View style={styles.panelHighlightTextContainer}>
                          <Text style={styles.panelHighlightVal}>
                            {property.furnished ? 'Furnished' : 'Unfurnished'}
                          </Text>
                          <Text style={styles.panelHighlightLbl}>Furnishing</Text>
                        </View>
                      </View>
                      
                      <View style={styles.panelHighlightItem}>
                        <MaterialCommunityIcons name="account-group" size={20} color="#03DAC6" />
                        <View style={styles.panelHighlightTextContainer}>
                          <Text style={styles.panelHighlightVal}>{property.for_whom}</Text>
                          <Text style={styles.panelHighlightLbl}>Preferred Tenant</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.panelDivider} />

                    {/* Owner Info & Actions */}
                    {isGuest ? (
                      <View style={styles.ownerSectionWeb}>
                        <View style={styles.guestContactGate}>
                          <MaterialCommunityIcons name="lock-outline" size={28} color="#BB86FC" />
                          <Text style={styles.guestContactTitle}>Sign in to contact owner</Text>
                          <Text style={styles.guestContactSubtitle}>
                            Log in to see the owner's phone number and contact them via call or WhatsApp.
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.ownerSectionWeb}>
                        <View style={styles.ownerHeader}>
                          <MaterialCommunityIcons name="account-circle" size={40} color="#BBBBBB" />
                          <View style={styles.ownerInfo}>
                            <Text style={styles.ownerName}>Property Owner</Text>
                            <Text style={styles.ownerPhone}>{property.owner_phone || 'Contact Info Available'}</Text>
                          </View>
                        </View>

                        {property.owner_phone && (
                          <View style={styles.contactActionsVertical}>
                            <TouchableOpacity
                              style={[styles.contactBtn, styles.callBtn]}
                              onPress={() => onCall(property.owner_phone)}
                            >
                              <MaterialCommunityIcons name="phone" size={18} color="#FFFFFF" />
                              <Text style={styles.contactBtnText}>Call Owner</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.contactBtn, styles.waBtn]}
                              onPress={() => onWhatsApp(property.owner_phone, property.title)}
                            >
                              <MaterialCommunityIcons name="whatsapp" size={18} color="#FFFFFF" />
                              <Text style={styles.contactBtnText}>WhatsApp</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  // Mobile viewport layout
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close and Favorite Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
            >
              <MaterialCommunityIcons name="chevron-down" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Property Details</Text>
            <TouchableOpacity
              onPress={() => onSaveToggle(property.id)}
              style={styles.modalFavBtn}
            >
              <MaterialCommunityIcons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={26}
                color={isSaved ? '#CF6679' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Images view */}
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {property.photos && property.photos.length > 0 ? (
                property.photos.map((photo, i) => (
                  <View key={i} style={styles.mobileImageContainer}>
                    <Image source={{ uri: photo }} style={styles.modalImage} />
                  </View>
                ))
              ) : (
                <View style={styles.mobileImageContainer}>
                  <Image source={{ uri: FALLBACK_IMAGE }} style={styles.modalImage} />
                </View>
              )}
            </ScrollView>

            {/* Details Section */}
            <View style={styles.modalDetails}>
              <View style={styles.modalPricing}>
                <View>
                  <Text style={styles.modalPriceText}>
                    ₹{property.rent.toLocaleString('en-IN')}
                    <Text style={styles.priceSub}> / month</Text>
                  </Text>
                  <Text style={styles.modalDepositText}>
                    Deposit: ₹{property.deposit.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.modalTypeBadge}>
                  <Text style={styles.modalTypeBadgeText}>{property.type}</Text>
                </View>
              </View>

              <Text style={styles.modalTitleText}>{property.title}</Text>
              
              <View style={styles.modalLocationRow}>
                <MaterialCommunityIcons name="map-marker" size={18} color="#BB86FC" />
                <Text style={styles.modalLocationText}>{property.address}</Text>
              </View>

              {/* Highlights Grid */}
              <View style={styles.highlightsGrid}>
                <View style={styles.highlightCard}>
                  <MaterialCommunityIcons name="sofa-single" size={20} color="#03DAC6" />
                  <Text style={styles.highlightVal}>
                    {property.furnished ? 'Furnished' : 'Unfurnished'}
                  </Text>
                  <Text style={styles.highlightLbl}>Furnishing</Text>
                </View>
                <View style={styles.highlightCard}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#03DAC6" />
                  <Text style={styles.highlightVal}>{property.for_whom}</Text>
                  <Text style={styles.highlightLbl}>Preferred Tenant</Text>
                </View>
                <View style={styles.highlightCard}>
                  <MaterialCommunityIcons name="home-circle" size={20} color="#03DAC6" />
                  <Text style={styles.highlightVal}>{property.type}</Text>
                  <Text style={styles.highlightLbl}>Property Type</Text>
                </View>
              </View>

              {/* Description */}
              {property.description && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.sectionText}>{property.description}</Text>
                </View>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Amenities</Text>
                  <View style={styles.amenitiesContainer}>
                    {property.amenities.map((item, idx) => (
                      <View key={idx} style={styles.amenityPill}>
                        <MaterialCommunityIcons name="check-circle-outline" size={14} color="#03DAC6" style={{ marginRight: 6 }} />
                        <Text style={styles.amenityText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Owner Contact */}
              {isGuest ? (
                <View style={styles.ownerSection}>
                  <View style={styles.guestContactGate}>
                    <MaterialCommunityIcons name="lock-outline" size={28} color="#BB86FC" />
                    <Text style={styles.guestContactTitle}>Sign in to contact owner</Text>
                    <Text style={styles.guestContactSubtitle}>
                      Log in to see the owner's phone number and contact them.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.ownerSection}>
                  <View style={styles.ownerHeader}>
                    <MaterialCommunityIcons name="account-circle" size={40} color="#BBBBBB" />
                    <View style={styles.ownerInfo}>
                      <Text style={styles.ownerName}>Property Owner</Text>
                      <Text style={styles.ownerPhone}>{property.owner_phone || 'Contact Info Available'}</Text>
                    </View>
                  </View>

                  {property.owner_phone && (
                    <View style={styles.contactActions}>
                      <TouchableOpacity
                        style={[styles.contactBtn, styles.callBtn]}
                        onPress={() => onCall(property.owner_phone)}
                      >
                        <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
                        <Text style={styles.contactBtnText}>Call Owner</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.contactBtn, styles.waBtn]}
                        onPress={() => onWhatsApp(property.owner_phone, property.title)}
                      >
                        <MaterialCommunityIcons name="whatsapp" size={20} color="#FFFFFF" />
                        <Text style={styles.contactBtnText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Web specific Modal Styles
  modalOverlayWeb: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContentWeb: {
    backgroundColor: '#121212',
    borderRadius: 20,
    width: '100%',
    maxWidth: 1080,
    height: '90%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  webScrollContent: {
    padding: 28,
    gap: 24,
  },
  webPhotoGrid: {
    flexDirection: 'row',
    height: 360,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  webPhotoLeftColumn: {
    flex: 1.5,
    marginRight: 8,
    height: '100%',
  },
  webPhotoRightColumn: {
    flex: 1,
    height: '100%',
  },
  webPhotoMain: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  webPhotoHalf: {
    flex: 1,
    height: '100%',
    resizeMode: 'cover',
  },
  webPhotoSub: {
    width: '100%',
    height: 176,
    resizeMode: 'cover',
  },
  webSplitLayout: {
    flexDirection: 'row',
    width: '100%',
    gap: 28,
    marginTop: 8,
  },
  webLeftColumn: {
    flex: 1.6,
    gap: 20,
  },
  webRightColumn: {
    flex: 1,
    maxWidth: 360,
  },
  stickyPanel: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    padding: 24,
    gap: 20,
  },
  panelPricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelDivider: {
    height: 1,
    backgroundColor: '#2D2D2D',
  },
  panelHighlightsList: {
    gap: 16,
  },
  panelHighlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  panelHighlightTextContainer: {
    flex: 1,
  },
  panelHighlightVal: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  panelHighlightLbl: {
    color: '#888888',
    fontSize: 11,
    marginTop: 1,
  },
  ownerSectionWeb: {
    gap: 16,
  },
  contactActionsVertical: {
    gap: 10,
    width: '100%',
  },

  // Mobile and Shared Styles
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
    backgroundColor: '#121212',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
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
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  mobileImageContainer: {
    width: Dimensions.get('window').width,
    height: 240,
  },
  modalImage: {
    width: '100%',
    height: '100%',
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
    marginBottom: 20,
  },
  modalPriceText: {
    fontSize: 28,
    fontWeight: 'bold',
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
    marginTop: 4,
  },
  modalTypeBadge: {
    backgroundColor: 'rgba(187, 134, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalTypeBadgeText: {
    color: '#BB86FC',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 32,
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingRight: 10,
  },
  modalLocationText: {
    color: '#BBBBBB',
    fontSize: 14,
    marginLeft: 6,
    flexWrap: 'wrap',
    flex: 1,
    lineHeight: 20,
  },
  highlightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
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
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  sectionText: {
    color: '#BBBBBB',
    fontSize: 14,
    lineHeight: 22,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  ownerSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    padding: 18,
    marginTop: 10,
    marginBottom: 30,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
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
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
  // Guest contact gate styles
  guestContactGate: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  guestContactTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  guestContactSubtitle: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
