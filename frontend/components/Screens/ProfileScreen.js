import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';

const NEON = '#00ffe7';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await apiClient.getProfile();
      
      // Merge with any local storage data
      const storedData = await AsyncStorage.getItem('profileData');
      if (storedData) {
        const localProfile = JSON.parse(storedData);
        setUserProfile({ ...profile, ...localProfile });
      } else {
        setUserProfile(profile);
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const badgeData = [
    {
      name: 'Top-Rated',
      icon: 'star',
      description: 'Awarded for maintaining a 5-star rating!',
      color: '#FF007F',
    },
    {
      name: 'Elite Rider',
      icon: 'car-sport',
      description: 'Recognized for completing 100 rides!',
      color: '#03ffd5',
    },
    {
      name: 'Community Builder',
      icon: 'people-circle',
      description: 'Given to those who help others connect!',
      color: '#ff0324',
    },
  ];

  const emojiMap = {
    "chill": "😊",
    "focused": "🚀", 
    "creative": "💡",
    "hyped": "🔥",
    "thinking": "🤔",
    "neutral": "😐"
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={NEON} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    firstName = '',
    lastName = '',
    username = '',
    profilePic = '',
    description = '',
    userMood = 'neutral',
    school = '',
    classYear = '',
    numberOfRides = 0,
    averageRating = 0,
    numRatings = 0,
    car = {}
  } = userProfile || {};

  const emoji = emojiMap[userMood] || "😎";

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        // Web Layout (Two Column)
        <View style={styles.webContainer}>
          <View style={styles.leftColumn}>
            {/* Avatar Section */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatarGlow}>
                <Image
                  source={{ uri: profilePic || 'https://via.placeholder.com/150' }}
                  style={styles.profileImage}
                />
              </View>
              <View style={styles.emojiOverlay}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </View>
            </View>

            {/* Badges Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitleLeft}>Badges</Text>
              <View style={styles.badgesColumn}>
                {badgeData.map((badge, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.badgeCard, { borderColor: badge.color }]}
                    onPress={() => setSelectedBadge(badge)}
                  >
                    <Ionicons name={badge.icon} size={44} color={badge.color} />
                    <Text style={styles.badgeName}>{badge.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Car Section */}
            {(car.make || car.model) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitleLeft}>Car</Text>
                <View style={styles.carCard}>
                  {car.picture && (
                    <Image source={{ uri: car.picture }} style={styles.carImage} />
                  )}
                  <View>
                    <Text style={styles.carText}>
                      {car.year} {car.make} {car.model}
                    </Text>
                    {car.color && (
                      <Text style={styles.carText}>{car.color}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Header */}
            <View style={styles.headerBar}>
              <Text style={styles.displayName}>
                {firstName} {lastName}
              </Text>
              <Text style={styles.username}>@{username}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Ionicons name="pencil" size={22} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* About Me */}
            <View style={styles.section}>
              <Text style={styles.sectionTitleRight}>About Me</Text>
              <Text style={styles.description}>{description || 'No description yet.'}</Text>
            </View>

            {/* Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitleRight}>Profile Info</Text>
              <View style={styles.statsGrid}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>School</Text>
                  <Text style={styles.statValue}>
                    {school} {classYear}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Rides</Text>
                  <Text style={styles.statValue}>
                    {numberOfRides || 'None'}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Rating</Text>
                  <Text style={styles.statValue}>
                    {averageRating ? `${averageRating}⭐ (${numRatings})` : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        // Mobile Layout (Single Column)
        <ScrollView style={styles.mobileContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarGlow}>
                <Image
                  source={{ uri: profilePic || 'https://via.placeholder.com/150' }}
                  style={styles.profileImage}
                />
              </View>
              <View style={styles.emojiOverlay}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </View>
            </View>
            <Text style={styles.displayName}>{firstName} {lastName}</Text>
            <Text style={styles.username}>@{username}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statMobile}>
              <Text style={styles.statValue}>{numberOfRides || '0'}</Text>
              <Text style={styles.statLabel}>Rides</Text>
            </View>
            <View style={styles.statMobile}>
              <Text style={styles.statValue}>
                {averageRating ? `${averageRating}⭐` : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statMobile}>
              <Text style={styles.statValue}>{school}</Text>
              <Text style={styles.statLabel}>School</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.mobileSection}>
            <Text style={styles.mobileSectionTitle}>About Me</Text>
            <Text style={styles.description}>{description || 'No description yet.'}</Text>
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            style={styles.mobileEditButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Badge Popup Modal */}
      {selectedBadge && (
        <View style={styles.badgePopupOverlay}>
          <View style={[styles.badgePopup, { borderColor: selectedBadge.color }]}>
            <Ionicons name={selectedBadge.icon} size={60} color={selectedBadge.color} />
            <Text style={styles.badgePopupTitle}>{selectedBadge.name}</Text>
            <Text style={styles.badgePopupDesc}>{selectedBadge.description}</Text>
            <TouchableOpacity
              style={styles.badgePopupClose}
              onPress={() => setSelectedBadge(null)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181825',
  },
  webContainer: {
    flexDirection: 'row',
    flex: 1,
    maxWidth: 1400,
    alignSelf: 'center',
    backgroundColor: 'rgba(24, 24, 37, 0.97)',
    margin: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: NEON,
    overflow: 'hidden',
  },
  leftColumn: {
    flex: 1.25,
    padding: 36,
    borderRightWidth: 2,
    borderRightColor: `${NEON}33`,
    alignItems: 'center',
  },
  rightColumn: {
    flex: 2,
    padding: 36,
  },
  mobileContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181825',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181825',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: NEON,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  header: {
    paddingTop: 20, // Reduced from 60 since we have top header now
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoutButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrap: {
    position: 'relative',
    width: 150,
    height: 150,
    marginBottom: 15,
  },
  avatarGlow: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#292950',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  profileImage: {
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 2.5,
    borderColor: NEON,
  },
  emojiOverlay: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    backgroundColor: '#181825cc',
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: NEON,
  },
  emojiText: {
    fontSize: 20,
  },
  displayName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: Platform.OS === 'web' ? 52 : 28,
    letterSpacing: 2,
    textAlign: 'center',
  },
  username: {
    color: '#b1f6e8',
    fontWeight: '500',
    fontSize: Platform.OS === 'web' ? 25 : 18,
    letterSpacing: 1.3,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitleLeft: {
    fontSize: 30,
    fontWeight: '700',
    color: NEON,
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitleRight: {
    fontSize: 38,
    fontWeight: '700',
    color: NEON,
    letterSpacing: 2.6,
    marginBottom: 14,
    textAlign: 'center',
  },
  mobileSectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: NEON,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  badgesColumn: {
    gap: 13,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181825',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2.5,
    gap: 16,
  },
  badgeName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
  },
  carCard: {
    backgroundColor: '#181825',
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: `${NEON}77`,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  carImage: {
    width: 58,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: NEON,
  },
  carText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerBar: {
    marginBottom: 24,
    paddingBottom: 18,
    borderBottomWidth: 1.5,
    borderBottomColor: `${NEON}33`,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginTop: 15,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  mobileEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON,
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    margin: 20,
    justifyContent: 'center',
  },
  description: {
    color: '#fff',
    fontSize: Platform.OS === 'web' ? 28 : 16,
    lineHeight: Platform.OS === 'web' ? 42 : 24,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 50,
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  stat: {
    backgroundColor: '#181825',
    borderRadius: 10,
    padding: 18,
    minWidth: 120,
    alignItems: 'center',
  },
  statMobile: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#b1f6e8',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: Platform.OS === 'web' ? 24 : 18,
  },
  mobileSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  badgePopupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,12,30,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  badgePopup: {
    backgroundColor: '#181825',
    borderRadius: 28,
    borderWidth: 3,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    maxWidth: 400,
  },
  badgePopupTitle: {
    fontSize: 28,
    color: NEON,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  badgePopupDesc: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  badgePopupClose: {
    position: 'absolute',
    top: 14,
    right: 16,
    padding: 8,
  },
});

export default ProfileScreen;