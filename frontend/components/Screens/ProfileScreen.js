import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import ApiClient from '../../services/api';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await ApiClient.getProfile();
      setProfile(response.profile);
      
      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout 
        }
      ]
    );
  };

  const getEmoji = (mood) => {
    const moods = {
      happy: '😊',
      focused: '🎯',
      excited: '🚀',
      chill: '😎',
      default: '🙂'
    };
    return moods[mood] || moods.default;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>

        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{getEmoji(profile.userMood)}</Text>
        </View>

        <Image 
          source={{ uri: profile.profilePic || 'https://via.placeholder.com/150' }} 
          style={styles.profileImage} 
        />

        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Text style={styles.name}>@{profile.username}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.infoContainer, { opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>Profile Info</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{profile.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since:</Text>
          <Text style={styles.infoValue}>
            {new Date(profile.accountCreated).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>School:</Text>
          <Text style={styles.infoValue}>
            {profile.school || 'Not set'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Class Year:</Text>
          <Text style={styles.infoValue}>
            {profile.classYear || 'Not set'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Number of Rides:</Text>
          <Text style={styles.infoValue}>
            {profile.numberOfRides || '0'}
          </Text>
        </View>

        {profile.car && (
          <>
            <Text style={styles.sectionTitle}>Vehicle Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Car:</Text>
              <Text style={styles.infoValue}>
                {profile.car.year} {profile.car.make} {profile.car.model}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Color:</Text>
              <Text style={styles.infoValue}>{profile.car.color}</Text>
            </View>
          </>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    position: 'relative',
  },
  logoutButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  emojiContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  emoji: {
    fontSize: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  userInfo: {
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
});

export default ProfileScreen;
