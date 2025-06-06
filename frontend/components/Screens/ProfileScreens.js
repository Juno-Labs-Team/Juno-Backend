import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Alert,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import ApiClient from '../../services/api';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await ApiClient.getProfile();
      setProfile(response.profile);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const profileData = profile || user;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri: profileData.profilePicture || 
                   'https://media.istockphoto.com/id/1201144328/photo/smiling-black-man-in-suit-posing-on-studio-background.jpg?s=2048x2048&w=is&k=20&c=Lj8Y55gIOg2IFkwk6PaFlPIqCshgt7L8EX8g9MySPkY='
            }}
            style={styles.profileImage}
          />
        </View>
        <Text style={styles.userName}>
          {profileData.firstName} {profileData.lastName}
        </Text>
        <Text style={styles.userHandle}>@{profileData.username}</Text>
        <Text style={styles.userBio}>
          {profileData.bio || "This guy is so sick and cool and hot! Living life to the fullest! 🚗✨"}
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>120</Text>
          <Text style={styles.statLabel}>Rides</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.95⭐</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>110</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>

      {/* School Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="school-outline" size={20} color="#4285F4" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>School</Text>
            <Text style={styles.infoValue}>
              {profileData.school || 'Freehold High School'} • Class of {profileData.classYear || '2027'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#4285F4" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profileData.email}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#4285F4" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {new Date(profileData.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Car Info */}
      {(profileData.hasCar || profileData.carMake) && (
        <View style={styles.carSection}>
          <Text style={styles.sectionTitle}>🚗 My Car</Text>
          <View style={styles.carCard}>
            <Image
              source={{
                uri: 'https://unpluggedperformance.com/wp-content/uploads/2023/02/Unplugged-Performance-Tesla-Model-3-UP-03-18in-9-square-Satin-Grey-Image-4-450x450.jpg'
              }}
              style={styles.carImage}
            />
            <View style={styles.carInfo}>
              <Text style={styles.carTitle}>
                {profileData.carMake || 'Tesla'} {profileData.carModel || 'Model 3'}
              </Text>
              <Text style={styles.carDetails}>
                Year: 2024 • Color: {profileData.carColor || 'Midnight Silver'}
              </Text>
              <Text style={styles.carSeats}>
                Max Passengers: {profileData.maxPassengers || 4}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={20} color="#4285F4" />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#4285F4',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userHandle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  userBio: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 10,
    paddingVertical: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  infoSection: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  carSection: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  carCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  carImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  carInfo: {
    marginLeft: 15,
    flex: 1,
    justifyContent: 'center',
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  carDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  carSeats: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '500',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 10,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4285F4',
  },
  settingsButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 30,
  },
});

export default ProfileScreen;