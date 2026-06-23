import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyProperties } from '@/lib/supabase';
import LoginPromptSheet from '@/components/LoginPromptSheet';
import { useResponsive } from '@/utils/useResponsive';
import { router } from 'expo-router';
import { Property } from '@/types/property';

// Inject hover CSS on web
if (Platform.OS === 'web') {
  const profileStyle = document.createElement('style');
  profileStyle.textContent = `
    .spotlet-profile-link {
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .spotlet-profile-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(187, 134, 252, 0.15);
    }
    .spotlet-profile-stat {
      transition: transform 0.15s ease;
      cursor: default;
    }
    .spotlet-profile-stat:hover {
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(profileStyle);
}

export default function ProfileScreen() {
  const { user, signOut, isLoading } = useAuth();
  const { isDesktopWeb } = useResponsive();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    try {
      setLoadingStats(true);
      const res = await fetchMyProperties(user.id);
      if (res.success && res.data) {
        setProperties(res.data.map((item: any) => ({
          ...item,
          photos: Array.isArray(item.photos) ? item.photos : [],
        })));
      }
    } catch (err) {
      console.error('Failed to load profile stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const stats = useMemo(() => {
    const total = properties.length;
    const active = properties.filter((p) => !p.is_deleted && (p.status === 'active' || !p.status)).length;
    const rented = properties.filter((p) => !p.is_deleted && p.status === 'rented').length;
    const deleted = properties.filter((p) => p.is_deleted).length;
    return { total, active, rented, deleted };
  }, [properties]);

  const handleSignOut = async () => {
    try {
      const success = await signOut();
      if (success) {
        Alert.alert('Signed Out', 'You have been signed out successfully.');
      } else {
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign out.');
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'Not available';
    // Format +91XXXXXXXXXX → +91 XXXXX XXXXX
    if (phone.length >= 12 && phone.startsWith('91')) {
      return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`;
    }
    if (phone.length >= 13 && phone.startsWith('+91')) {
      return `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`;
    }
    return phone;
  };

  const memberSince = useMemo(() => {
    if (!user) return '';
    // Supabase user has created_at in metadata
    try {
      const meta = (user as any)?.created_at;
      if (meta) {
        return new Date(meta).toLocaleDateString('en-IN', {
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {}
    return 'Recently joined';
  }, [user]);

  // ─── QUICK LINKS ───
  const quickLinks = [
    {
      label: 'My Properties',
      subtitle: 'Manage your listings',
      icon: 'home-city-outline' as const,
      color: '#BB86FC',
      route: '/(tabs)/my-properties',
    },
    {
      label: 'Saved Listings',
      subtitle: 'Your favorites',
      icon: 'heart-outline' as const,
      color: '#CF6679',
      route: '/(tabs)/saved',
    },
    {
      label: 'Add Property',
      subtitle: 'List a new space',
      icon: 'plus-circle-outline' as const,
      color: '#03DAC6',
      route: '/(tabs)/add',
    },
    {
      label: 'Explore Map',
      subtitle: 'Find nearby rooms',
      icon: 'map-marker-radius-outline' as const,
      color: '#FFB74D',
      route: '/(tabs)/map',
    },
  ];

  // Guest gate: show login prompt if not logged in
  if (!user) {
    return (
      <View style={isDesktopWeb ? s.webContainer : s.mobileContainer}>
        <View style={s.guestCenter}>
          <View style={s.guestIconCircle}>
            <MaterialCommunityIcons name="account-circle" size={80} color="#3D3D3D" />
          </View>
          <Text style={s.guestTitle}>Sign In Required</Text>
          <Text style={s.guestSubtitle}>
            Sign in to view your profile, manage listings, and more.
          </Text>
          <TouchableOpacity
            style={s.guestSignInBtn}
            onPress={() => setShowLoginPrompt(true)}
          >
            <Text style={s.guestSignInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <LoginPromptSheet
          visible={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          message="Sign in to view your profile"
        />
      </View>
    );
  }

  // ─── SHARED CONTENT (used by both web and mobile) ───

  const renderProfileHeader = () => (
    <View style={s.profileHeader}>
      <View style={s.avatarOuter}>
        <View style={s.avatarInner}>
          <MaterialCommunityIcons name="account" size={48} color="#BB86FC" />
        </View>
        <View style={s.onlineDot} />
      </View>
      <Text style={s.userName}>
        {(user as any)?.user_metadata?.name || 'SpotLet User'}
      </Text>
      <Text style={s.userPhone}>{formatPhone(user?.phone || '')}</Text>
      {memberSince ? (
        <View style={s.memberRow}>
          <MaterialCommunityIcons name="calendar-check-outline" size={14} color="#888888" />
          <Text style={s.memberText}>Member since {memberSince}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderStatsRow = () => (
    <View style={s.statsRow}>
      {[
        { label: 'Total', value: stats.total, color: '#BB86FC' },
        { label: 'Active', value: stats.active, color: '#03DAC6' },
        { label: 'Rented', value: stats.rented, color: '#FFB74D' },
        { label: 'Deleted', value: stats.deleted, color: '#CF6679' },
      ].map((stat) => (
        <View
          key={stat.label}
          // @ts-ignore
          className="spotlet-profile-stat"
          style={s.statItem}
        >
          <Text style={[s.statValue, { color: stat.color }]}>
            {loadingStats ? '–' : stat.value}
          </Text>
          <Text style={s.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderInfoSection = () => (
    <View style={s.infoSection}>
      <Text style={s.sectionTitle}>Account Info</Text>
      <View style={s.infoCard}>
        <View style={s.infoRow}>
          <View style={s.infoIconWrap}>
            <MaterialCommunityIcons name="phone" size={18} color="#03DAC6" />
          </View>
          <View style={s.infoTextCol}>
            <Text style={s.infoLabel}>Phone</Text>
            <Text style={s.infoValue}>{formatPhone(user?.phone || '')}</Text>
          </View>
        </View>
        {user?.email && (
          <>
            <View style={s.infoRowDivider} />
            <View style={s.infoRow}>
              <View style={s.infoIconWrap}>
                <MaterialCommunityIcons name="email-outline" size={18} color="#03DAC6" />
              </View>
              <View style={s.infoTextCol}>
                <Text style={s.infoLabel}>Email</Text>
                <Text style={s.infoValue}>{user.email}</Text>
              </View>
            </View>
          </>
        )}
        <View style={s.infoRowDivider} />
        <View style={s.infoRow}>
          <View style={s.infoIconWrap}>
            <MaterialCommunityIcons name="identifier" size={18} color="#03DAC6" />
          </View>
          <View style={s.infoTextCol}>
            <Text style={s.infoLabel}>User ID</Text>
            <Text style={[s.infoValue, { fontSize: 11 }]} numberOfLines={1}>
              {user?.id || 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderQuickLinks = () => (
    <View style={s.linksSection}>
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.linksGrid}>
        {quickLinks.map((link) => (
          <TouchableOpacity
            key={link.label}
            // @ts-ignore
            className="spotlet-profile-link"
            style={s.linkCard}
            onPress={() => router.push(link.route as any)}
            activeOpacity={0.85}
          >
            <View style={[s.linkIconWrap, { backgroundColor: `${link.color}18` }]}>
              <MaterialCommunityIcons name={link.icon} size={24} color={link.color} />
            </View>
            <Text style={s.linkLabel}>{link.label}</Text>
            <Text style={s.linkSubtitle}>{link.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSignOutSection = () => (
    <View style={s.signOutSection}>
      <TouchableOpacity
        style={s.signOutBtn}
        onPress={handleSignOut}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#CF6679" />
        ) : (
          <>
            <MaterialCommunityIcons name="logout" size={18} color="#CF6679" />
            <Text style={s.signOutBtnText}>Sign Out</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={s.versionText}>SpotLet v1.0.0</Text>
    </View>
  );

  // ─── WEB DESKTOP LAYOUT ───
  if (isDesktopWeb) {
    return (
      <View style={s.webContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.webScrollContent}
        >
          <View style={s.webInner}>
            {/* Left column — Profile card */}
            <View style={s.webLeftCol}>
              <View style={s.webProfileCard}>
                {renderProfileHeader()}
                <View style={s.webCardDivider} />
                {renderStatsRow()}
              </View>
              {renderSignOutSection()}
            </View>

            {/* Right column — Info + Quick Links */}
            <View style={s.webRightCol}>
              {renderInfoSection()}
              {renderQuickLinks()}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── MOBILE LAYOUT ───
  const Wrapper = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Wrapper style={s.mobileContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.mobileScrollContent}
      >
        {renderProfileHeader()}
        {renderStatsRow()}
        {renderInfoSection()}
        {renderQuickLinks()}
        {renderSignOutSection()}
      </ScrollView>
    </Wrapper>
  );
}

// ────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────

const s = StyleSheet.create({
  // ─── CONTAINERS ───
  webContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  webScrollContent: {
    paddingVertical: 32,
    paddingHorizontal: 40,
  },
  webInner: {
    flexDirection: 'row',
    gap: 28,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  webLeftCol: {
    width: 340,
    gap: 20,
  },
  webRightCol: {
    flex: 1,
    gap: 24,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  mobileScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },

  // ─── GUEST GATE ───
  guestCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  guestIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  guestSubtitle: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  guestSignInBtn: {
    marginTop: 24,
    backgroundColor: '#BB86FC',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  guestSignInBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // ─── PROFILE HEADER ───
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarOuter: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(187, 134, 252, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(187, 134, 252, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#03DAC6',
    borderWidth: 3,
    borderColor: '#121212',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  userPhone: {
    color: '#BBBBBB',
    fontSize: 14,
    marginTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  memberText: {
    color: '#888888',
    fontSize: 12,
  },

  // ─── STATS ROW ───
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '500',
  },

  // ─── WEB PROFILE CARD ───
  webProfileCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    padding: 24,
  },
  webCardDivider: {
    height: 1,
    backgroundColor: '#2D2D2D',
    marginVertical: 20,
  },

  // ─── INFO SECTION ───
  infoSection: {
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#BB86FC',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  infoRowDivider: {
    height: 1,
    backgroundColor: '#2D2D2D',
    marginHorizontal: 16,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(3, 218, 198, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // ─── QUICK LINKS ───
  linksSection: {
    marginBottom: 8,
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  linkCard: {
    width: '47%',
    minWidth: 140,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    padding: 18,
    gap: 10,
  },
  linkIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  linkSubtitle: {
    color: '#888888',
    fontSize: 11,
    lineHeight: 15,
  },

  // ─── SIGN OUT ───
  signOutSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
    gap: 12,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(207, 102, 121, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(207, 102, 121, 0.25)',
  },
  signOutBtnText: {
    color: '#CF6679',
    fontWeight: 'bold',
    fontSize: 15,
  },
  versionText: {
    color: '#3D3D3D',
    fontSize: 11,
  },
});
