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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Property } from '@/types/property';

const { width } = Dimensions.get('window');
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

interface PropertyDetailsModalProps {
  visible: boolean;
  property: Property | null;
  onClose: () => void;
  isSaved: boolean;
  onSaveToggle: (propertyId: string) => void;
  onCall: (phoneNumber: string) => void;
  onWhatsApp: (phoneNumber: string, title: string) => void;
}

export default function PropertyDetailsModal({
  visible,
  property,
  onClose,
  isSaved,
  onSaveToggle,
  onCall,
  onWhatsApp,
}: PropertyDetailsModalProps) {
  if (!property) return null;

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
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
