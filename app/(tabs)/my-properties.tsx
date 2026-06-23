import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyProperties, softDeleteProperty, restoreProperty } from '@/lib/supabase';
import { Property } from '@/types/property';
import LoginPromptSheet from '@/components/LoginPromptSheet';
import { useResponsive } from '@/utils/useResponsive';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';

const isWeb = Platform.OS === 'web';

type FilterTab = 'all' | 'active' | 'rented' | 'deleted';

// Inject hover CSS on web
if (Platform.OS === 'web') {
  const myPropStyle = document.createElement('style');
  myPropStyle.textContent = `
    .spotlet-my-prop-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      cursor: pointer;
    }
    .spotlet-my-prop-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(187, 134, 252, 0.15);
    }
    .spotlet-stat-card {
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      cursor: default;
    }
    .spotlet-stat-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
    .spotlet-action-btn {
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .spotlet-action-btn:hover {
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(myPropStyle);
}

export default function MyPropertiesScreen() {
  const { user } = useAuth();
  const { isDesktopWeb } = useResponsive();

  // Login Prompt for guests
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Confirm delete modal
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Restore state
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadMyProperties();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadMyProperties = async (isRefreshing = false) => {
    try {
      setHasError(false);
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (user) {
        const res = await fetchMyProperties(user.id);
        if (res.success && res.data) {
          const parsed: Property[] = res.data.map((item: any) => ({
            ...item,
            photos: Array.isArray(item.photos) ? item.photos : [],
          }));
          setProperties(parsed);
          setHasError(false);
        } else {
          setHasError(true);
          setErrorMessage(res.error || 'Failed to fetch your properties');
        }
      }
    } catch (error: any) {
      console.error('Error loading my properties:', error);
      setHasError(true);
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ─── STATISTICS ───
  const stats = useMemo(() => {
    const total = properties.length;
    const deleted = properties.filter((p) => p.is_deleted).length;
    const active = properties.filter((p) => !p.is_deleted && (p.status === 'active' || !p.status)).length;
    const rented = properties.filter((p) => !p.is_deleted && p.status === 'rented').length;
    return { total, active, rented, deleted };
  }, [properties]);

  // ─── FILTERED LIST ───
  const filteredProperties = useMemo(() => {
    switch (activeFilter) {
      case 'active':
        return properties.filter((p) => !p.is_deleted && (p.status === 'active' || !p.status));
      case 'rented':
        return properties.filter((p) => !p.is_deleted && p.status === 'rented');
      case 'deleted':
        return properties.filter((p) => p.is_deleted);
      default:
        return properties;
    }
  }, [properties, activeFilter]);

  // ─── HANDLERS ───

  const handleDeletePress = (property: Property) => {
    setDeleteTarget(property);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !user) return;
    try {
      setDeleting(true);
      const res = await softDeleteProperty(deleteTarget.id, user.id);
      if (res.success) {
        // Update local state
        setProperties((prev) =>
          prev.map((p) => (p.id === deleteTarget.id ? { ...p, is_deleted: true } : p))
        );
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
        Alert.alert('Deleted', 'Property has been removed from public listings.');
      } else {
        Alert.alert('Error', res.error || 'Failed to delete property.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (property: Property) => {
    if (!user) return;
    try {
      setRestoring(property.id);
      const res = await restoreProperty(property.id, user.id);
      if (res.success) {
        setProperties((prev) =>
          prev.map((p) => (p.id === property.id ? { ...p, is_deleted: false } : p))
        );
        Alert.alert('Restored', 'Property is now live on public listings again.');
      } else {
        Alert.alert('Error', res.error || 'Failed to restore property.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setRestoring(null);
    }
  };

  const handleEdit = (property: Property) => {
    router.push({ pathname: '/(tabs)/add', params: { edit: property.id } });
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusConfig = (property: Property) => {
    if (property.is_deleted) {
      return { label: 'Deleted', color: '#CF6679', bg: 'rgba(207, 102, 121, 0.15)', icon: 'delete-outline' as const };
    }
    switch (property.status) {
      case 'rented':
        return { label: 'Rented', color: '#FFB74D', bg: 'rgba(255, 183, 77, 0.15)', icon: 'key-variant' as const };
      case 'inactive':
        return { label: 'Inactive', color: '#888888', bg: 'rgba(136, 136, 136, 0.15)', icon: 'pause-circle-outline' as const };
      default:
        return { label: 'Active', color: '#03DAC6', bg: 'rgba(3, 218, 198, 0.15)', icon: 'check-circle-outline' as const };
    }
  };

  // ─── DELETE CONFIRMATION MODAL ───
  const renderDeleteModal = () => (
    <Modal
      visible={showDeleteConfirm}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDeleteConfirm(false)}
    >
      <TouchableWithoutFeedback onPress={() => !deleting && setShowDeleteConfirm(false)}>
        <View style={deleteStyles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={deleteStyles.modal}>
              <View style={deleteStyles.iconCircle}>
                <MaterialCommunityIcons name="delete-alert-outline" size={36} color="#CF6679" />
              </View>
              <Text style={deleteStyles.title}>Delete Property?</Text>
              <Text style={deleteStyles.subtitle}>
                "{deleteTarget?.title}" will be removed from public listings. You can restore it later from the Deleted tab.
              </Text>
              <View style={deleteStyles.actions}>
                <TouchableOpacity
                  style={deleteStyles.cancelBtn}
                  onPress={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  <Text style={deleteStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[deleteStyles.deleteBtn, deleting && { opacity: 0.6 }]}
                  onPress={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="delete-outline" size={18} color="#FFFFFF" />
                      <Text style={deleteStyles.deleteBtnText}>Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // ─── STAT CARD ───
  const renderStatCard = (label: string, value: number, icon: string, color: string) => (
    <View
      key={label}
      // @ts-ignore
      className="spotlet-stat-card"
      style={[statStyles.card, { borderColor: `${color}22` }]}
    >
      <View style={[statStyles.iconWrap, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );

  // ─── FILTER TABS ───
  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'active', label: 'Active', count: stats.active },
    { key: 'rented', label: 'Rented', count: stats.rented },
    { key: 'deleted', label: 'Deleted', count: stats.deleted },
  ];

  const renderFilterTabs = () => (
    <View style={filterStyles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterStyles.scroll}>
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[filterStyles.tab, isActive && filterStyles.tabActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={[filterStyles.tabText, isActive && filterStyles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[filterStyles.countBadge, isActive && filterStyles.countBadgeActive]}>
                <Text style={[filterStyles.countText, isActive && filterStyles.countTextActive]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ─── WEB CARD ───
  const renderWebCard = (item: Property) => {
    const imgUrl = item.photos && item.photos.length > 0 ? item.photos[0] : FALLBACK_IMAGE;
    const statusCfg = getStatusConfig(item);

    return (
      <View
        key={item.id}
        // @ts-ignore
        className="spotlet-my-prop-card"
        style={webCardStyles.card}
      >
        <View style={webCardStyles.imageContainer}>
          <Image source={{ uri: imgUrl }} style={webCardStyles.image} />
          {/* Status badge on image */}
          <View style={[webCardStyles.statusOverlay, { backgroundColor: statusCfg.bg }]}>
            <MaterialCommunityIcons name={statusCfg.icon} size={14} color={statusCfg.color} />
            <Text style={[webCardStyles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <View style={webCardStyles.content}>
          <View style={webCardStyles.topRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={webCardStyles.title} numberOfLines={1}>{item.title}</Text>
              <View style={webCardStyles.locationRow}>
                <MaterialCommunityIcons name="map-marker" size={15} color="#BB86FC" />
                <Text style={webCardStyles.locationText} numberOfLines={1}>{item.address}</Text>
              </View>
            </View>
            <View style={webCardStyles.priceBadge}>
              <Text style={webCardStyles.priceText}>₹{item.rent.toLocaleString('en-IN')}</Text>
              <Text style={webCardStyles.priceUnit}>/month</Text>
            </View>
          </View>

          <View style={webCardStyles.metaRow}>
            <View style={webCardStyles.badge}>
              <MaterialCommunityIcons name="home-outline" size={13} color="#BB86FC" />
              <Text style={webCardStyles.badgeText}>{item.type}</Text>
            </View>
            <View style={webCardStyles.badge}>
              <MaterialCommunityIcons name="sofa-single-outline" size={13} color="#03DAC6" />
              <Text style={webCardStyles.badgeText}>{item.furnished ? 'Furnished' : 'Unfurnished'}</Text>
            </View>
            <View style={webCardStyles.badge}>
              <MaterialCommunityIcons name="calendar-outline" size={13} color="#888888" />
              <Text style={webCardStyles.badgeText}>{formatDate(item.created_at)}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={webCardStyles.actionsRow}>
            {item.is_deleted ? (
              <TouchableOpacity
                // @ts-ignore
                className="spotlet-action-btn"
                style={webCardStyles.restoreBtn}
                onPress={() => handleRestore(item)}
                disabled={restoring === item.id}
              >
                {restoring === item.id ? (
                  <ActivityIndicator size="small" color="#03DAC6" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="restore" size={16} color="#03DAC6" />
                    <Text style={webCardStyles.restoreBtnText}>Restore</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  // @ts-ignore
                  className="spotlet-action-btn"
                  style={webCardStyles.editBtn}
                  onPress={() => handleEdit(item)}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#BB86FC" />
                  <Text style={webCardStyles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  // @ts-ignore
                  className="spotlet-action-btn"
                  style={webCardStyles.deleteCardBtn}
                  onPress={() => handleDeletePress(item)}
                >
                  <MaterialCommunityIcons name="delete-outline" size={16} color="#CF6679" />
                  <Text style={webCardStyles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─── MOBILE CARD ───
  const renderMobileCard = ({ item }: { item: Property }) => {
    const imgUrl = item.photos && item.photos.length > 0 ? item.photos[0] : FALLBACK_IMAGE;
    const statusCfg = getStatusConfig(item);

    return (
      <View style={mobileCardStyles.card}>
        <Image source={{ uri: imgUrl }} style={mobileCardStyles.image} />

        {/* Status badge */}
        <View style={[mobileCardStyles.statusOverlay, { backgroundColor: statusCfg.bg }]}>
          <MaterialCommunityIcons name={statusCfg.icon} size={14} color={statusCfg.color} />
          <Text style={[mobileCardStyles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>

        {/* Price overlay */}
        <View style={mobileCardStyles.priceOverlay}>
          <Text style={mobileCardStyles.priceText}>₹{item.rent.toLocaleString('en-IN')}/mo</Text>
        </View>

        <View style={mobileCardStyles.info}>
          <View style={mobileCardStyles.header}>
            <Text style={mobileCardStyles.title} numberOfLines={1}>{item.title}</Text>
            <View style={mobileCardStyles.typeBadge}>
              <Text style={mobileCardStyles.typeBadgeText}>{item.type}</Text>
            </View>
          </View>

          <View style={mobileCardStyles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#BB86FC" />
            <Text style={mobileCardStyles.locationText} numberOfLines={1}>{item.address}</Text>
          </View>

          <View style={mobileCardStyles.detailsRow}>
            <View style={mobileCardStyles.detailItem}>
              <MaterialCommunityIcons name="calendar-outline" size={14} color="#888888" />
              <Text style={mobileCardStyles.detailText}>{formatDate(item.created_at)}</Text>
            </View>
            <View style={mobileCardStyles.detailItem}>
              <MaterialCommunityIcons name="sofa-single-outline" size={14} color="#03DAC6" />
              <Text style={mobileCardStyles.detailText}>{item.furnished ? 'Furnished' : 'Unfurnished'}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={mobileCardStyles.actionsRow}>
            {item.is_deleted ? (
              <TouchableOpacity
                style={mobileCardStyles.restoreBtn}
                onPress={() => handleRestore(item)}
                disabled={restoring === item.id}
              >
                {restoring === item.id ? (
                  <ActivityIndicator size="small" color="#03DAC6" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="restore" size={16} color="#03DAC6" />
                    <Text style={mobileCardStyles.restoreBtnText}>Restore</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={mobileCardStyles.editBtn} onPress={() => handleEdit(item)}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#BB86FC" />
                  <Text style={mobileCardStyles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={mobileCardStyles.deleteCardBtn} onPress={() => handleDeletePress(item)}>
                  <MaterialCommunityIcons name="delete-outline" size={16} color="#CF6679" />
                  <Text style={mobileCardStyles.mDeleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─── EMPTY STATE ───
  const renderEmptyState = () => {
    const isFilteredEmpty = activeFilter !== 'all' && properties.length > 0;

    if (isFilteredEmpty) {
      const filterLabel = filterTabs.find((t) => t.key === activeFilter)?.label || '';
      return (
        <View style={isWeb ? emptyWebStyles.container : emptyStyles.container}>
          <MaterialCommunityIcons name="filter-remove-outline" size={isWeb ? 64 : 80} color="#3D3D3D" />
          <Text style={isWeb ? emptyWebStyles.title : emptyStyles.title}>No {filterLabel} Properties</Text>
          <Text style={isWeb ? emptyWebStyles.subtitle : emptyStyles.subtitle}>
            You don't have any {filterLabel.toLowerCase()} properties. Try a different filter.
          </Text>
          <TouchableOpacity
            style={isWeb ? emptyWebStyles.actionBtn : emptyStyles.actionBtn}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={isWeb ? emptyWebStyles.actionBtnText : emptyStyles.actionBtnText}>View All Properties</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={isWeb ? emptyWebStyles.container : emptyStyles.container}>
        <View style={isWeb ? emptyWebStyles.iconCircle : emptyStyles.iconCircle}>
          <MaterialCommunityIcons name="home-plus-outline" size={isWeb ? 52 : 60} color="#BB86FC" />
        </View>
        <Text style={isWeb ? emptyWebStyles.title : emptyStyles.title}>
          You haven't posted any properties yet.
        </Text>
        <Text style={isWeb ? emptyWebStyles.subtitle : emptyStyles.subtitle}>
          Start earning by listing your first property on SpotLet. It only takes a few minutes!
        </Text>
        <TouchableOpacity
          style={isWeb ? emptyWebStyles.primaryBtn : emptyStyles.primaryBtn}
          onPress={() => router.push('/(tabs)/add')}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#121212" />
          <Text style={isWeb ? emptyWebStyles.primaryBtnText : emptyStyles.primaryBtnText}>
            Post Your First Property
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── CENTERED STATE ───
  const renderCenteredState = (
    icon: string,
    title: string,
    subtitle: string,
    actionLabel?: string,
    onAction?: () => void
  ) => (
    <View style={isWeb ? emptyWebStyles.container : emptyStyles.container}>
      <MaterialCommunityIcons name={icon as any} size={isWeb ? 64 : 80} color="#3D3D3D" />
      <Text style={isWeb ? emptyWebStyles.title : emptyStyles.title}>{title}</Text>
      <Text style={isWeb ? emptyWebStyles.subtitle : emptyStyles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={isWeb ? emptyWebStyles.actionBtn : emptyStyles.actionBtn} onPress={onAction}>
          <Text style={isWeb ? emptyWebStyles.actionBtnText : emptyStyles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── WEB DESKTOP LAYOUT ───
  if (isDesktopWeb) {
    return (
      <View style={pageStyles.webContainer}>
        {/* Header */}
        <View style={pageStyles.webHeader}>
          <View>
            <Text style={pageStyles.webHeaderTitle}>My Properties</Text>
            <Text style={pageStyles.webHeaderSubtitle}>Manage your listed properties</Text>
          </View>
          <TouchableOpacity
            style={pageStyles.addBtn}
            onPress={() => router.push('/(tabs)/add')}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#121212" />
            <Text style={pageStyles.addBtnText}>Add Property</Text>
          </TouchableOpacity>
        </View>

        <View style={pageStyles.webContent}>
          {!user ? (
            <View style={emptyWebStyles.container}>
              <MaterialCommunityIcons name="lock-outline" size={64} color="#3D3D3D" />
              <Text style={emptyWebStyles.title}>Sign In Required</Text>
              <Text style={emptyWebStyles.subtitle}>Please log in to manage your properties.</Text>
              <TouchableOpacity style={emptyWebStyles.actionBtn} onPress={() => setShowLoginPrompt(true)}>
                <Text style={emptyWebStyles.actionBtnText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : hasError ? (
            renderCenteredState('wifi-off', 'Connection Failed', errorMessage || 'Check your internet connection.', 'Retry', () => loadMyProperties())
          ) : loading ? (
            <View style={emptyWebStyles.container}>
              <ActivityIndicator size="large" color="#BB86FC" />
              <Text style={emptyWebStyles.subtitle}>Fetching your properties...</Text>
            </View>
          ) : (
            <>
              {/* Stats Row */}
              <View style={statStyles.row}>
                {renderStatCard('Total', stats.total, 'home-group', '#BB86FC')}
                {renderStatCard('Active', stats.active, 'check-circle-outline', '#03DAC6')}
                {renderStatCard('Rented', stats.rented, 'key-variant', '#FFB74D')}
                {renderStatCard('Deleted', stats.deleted, 'delete-outline', '#CF6679')}
              </View>

              {/* Filter Tabs */}
              {renderFilterTabs()}

              {/* Property Cards */}
              {filteredProperties.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={pageStyles.webCardList}>
                  {filteredProperties.map((item) => renderWebCard(item))}
                </ScrollView>
              ) : (
                renderEmptyState()
              )}
            </>
          )}
        </View>

        {renderDeleteModal()}

        <LoginPromptSheet
          visible={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          message="Sign in to manage your properties"
        />
      </View>
    );
  }

  // ─── MOBILE LAYOUT ───
  return (
    <SafeAreaView style={pageStyles.mobileContainer}>
      {/* Header */}
      <View style={pageStyles.mobileHeader}>
        <View>
          <Text style={pageStyles.mobileHeaderTitle}>My Properties</Text>
          <Text style={pageStyles.mobileHeaderSubtitle}>Manage your listed properties</Text>
        </View>
        {user && (
          <TouchableOpacity
            style={pageStyles.mobileAddBtn}
            onPress={() => router.push('/(tabs)/add')}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#121212" />
          </TouchableOpacity>
        )}
      </View>

      {!user ? (
        <View style={emptyStyles.container}>
          <MaterialCommunityIcons name="lock-outline" size={80} color="#3D3D3D" />
          <Text style={emptyStyles.title}>Sign In Required</Text>
          <Text style={emptyStyles.subtitle}>Please log in to manage your properties.</Text>
          <TouchableOpacity style={emptyStyles.actionBtn} onPress={() => setShowLoginPrompt(true)}>
            <Text style={emptyStyles.actionBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : hasError ? (
        renderCenteredState('wifi-off', 'Connection Failed', errorMessage || 'Check your internet.', 'Retry', () => loadMyProperties())
      ) : loading ? (
        <View style={emptyStyles.container}>
          <ActivityIndicator size="large" color="#BB86FC" />
          <Text style={{ color: '#BBBBBB', marginTop: 12, fontSize: 14 }}>Fetching your properties...</Text>
        </View>
      ) : properties.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item.id}
          renderItem={renderMobileCard}
          contentContainerStyle={pageStyles.mobileListContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadMyProperties(true)}
          ListHeaderComponent={
            <View>
              {/* Stats Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={statStyles.mobileRow}>
                {renderStatCard('Total', stats.total, 'home-group', '#BB86FC')}
                {renderStatCard('Active', stats.active, 'check-circle-outline', '#03DAC6')}
                {renderStatCard('Rented', stats.rented, 'key-variant', '#FFB74D')}
                {renderStatCard('Deleted', stats.deleted, 'delete-outline', '#CF6679')}
              </ScrollView>

              {/* Filter Tabs */}
              {renderFilterTabs()}
            </View>
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {renderDeleteModal()}

      <LoginPromptSheet
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="Sign in to manage your properties"
      />
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────

const pageStyles = StyleSheet.create({
  webContainer: { flex: 1, backgroundColor: '#121212' },
  webHeader: {
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
  webHeaderTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  webHeaderSubtitle: { color: '#888888', fontSize: 14, marginTop: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#03DAC6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: '#121212', fontWeight: 'bold', fontSize: 14 },
  webContent: { flex: 1, maxWidth: 1280, width: '100%', alignSelf: 'center', paddingHorizontal: 40 },
  webCardList: { paddingVertical: 8, gap: 16, paddingBottom: 40 },

  mobileContainer: { flex: 1, backgroundColor: '#121212' },
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  mobileHeaderTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  mobileHeaderSubtitle: { color: '#BBBBBB', fontSize: 13, marginTop: 2 },
  mobileAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#03DAC6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileListContent: { paddingHorizontal: 20, paddingBottom: 40 },
});

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  mobileRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: { fontSize: 26, fontWeight: 'bold' },
  label: { color: '#888888', fontSize: 12, fontWeight: '500' },
});

const filterStyles = StyleSheet.create({
  container: { marginBottom: 16, marginTop: 8 },
  scroll: { gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  tabActive: {
    backgroundColor: 'rgba(187, 134, 252, 0.15)',
    borderColor: 'rgba(187, 134, 252, 0.4)',
  },
  tabText: { color: '#888888', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#BB86FC' },
  countBadge: {
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  countBadgeActive: { backgroundColor: 'rgba(187, 134, 252, 0.25)' },
  countText: { color: '#888888', fontSize: 11, fontWeight: 'bold' },
  countTextActive: { color: '#BB86FC' },
});

const webCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  imageContainer: { width: 260, height: 200, position: 'relative' },
  image: { width: '100%', height: '100%', backgroundColor: '#2D2D2D' },
  statusOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  content: { flex: 1, padding: 20, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  locationText: { color: '#888888', fontSize: 13, flex: 1 },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#03DAC6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: { color: '#121212', fontWeight: '900', fontSize: 16 },
  priceUnit: { color: '#121212', fontWeight: '500', fontSize: 11, marginLeft: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2D2D2D',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 12, color: '#BBBBBB', fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(187, 134, 252, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.3)',
  },
  editBtnText: { color: '#BB86FC', fontSize: 13, fontWeight: '600' },
  deleteCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(207, 102, 121, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(207, 102, 121, 0.25)',
  },
  deleteBtnText: { color: '#CF6679', fontSize: 13, fontWeight: '600' },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(3, 218, 198, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(3, 218, 198, 0.25)',
  },
  restoreBtnText: { color: '#03DAC6', fontSize: 13, fontWeight: '600' },
});

const mobileCardStyles = StyleSheet.create({
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
  image: { width: '100%', height: 180, backgroundColor: '#2D2D2D' },
  statusOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 2,
  },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  priceOverlay: {
    position: 'absolute',
    top: 130,
    right: 12,
    backgroundColor: '#03DAC6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 2,
  },
  priceText: { color: '#121212', fontWeight: '900', fontSize: 14 },
  info: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', flex: 1, marginRight: 10 },
  typeBadge: { backgroundColor: '#2D2D2D', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeText: { fontSize: 11, color: '#BB86FC', fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locationText: { color: '#888888', fontSize: 13, marginLeft: 4 },
  detailsRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { color: '#BBBBBB', fontSize: 12 },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
    paddingTop: 14,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(187, 134, 252, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.3)',
  },
  editBtnText: { color: '#BB86FC', fontSize: 13, fontWeight: '600' },
  deleteCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(207, 102, 121, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(207, 102, 121, 0.25)',
  },
  mDeleteBtnText: { color: '#CF6679', fontSize: 13, fontWeight: '600' },
  restoreBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(3, 218, 198, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(3, 218, 198, 0.25)',
  },
  restoreBtnText: { color: '#03DAC6', fontSize: 13, fontWeight: '600' },
});

const emptyStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(187, 134, 252, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  subtitle: { color: '#666666', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  actionBtn: { marginTop: 20, backgroundColor: '#BB86FC', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  actionBtnText: { color: '#121212', fontWeight: 'bold', fontSize: 14 },
  primaryBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#03DAC6',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#121212', fontWeight: 'bold', fontSize: 15 },
});

const emptyWebStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(187, 134, 252, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  subtitle: { color: '#888888', fontSize: 14, marginTop: 8, textAlign: 'center', maxWidth: 400 },
  actionBtn: { marginTop: 20, backgroundColor: '#BB86FC', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { color: '#121212', fontWeight: 'bold', fontSize: 14 },
  primaryBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#03DAC6',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#121212', fontWeight: 'bold', fontSize: 15 },
});

const deleteStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(207, 102, 121, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(207, 102, 121, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subtitle: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  cancelBtnText: { color: '#BBBBBB', fontWeight: '600', fontSize: 14 },
  deleteBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#CF6679',
  },
  deleteBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});
