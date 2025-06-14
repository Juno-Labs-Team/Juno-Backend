import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiClient from '../../services/api';

const RidesScreen = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const response = await ApiClient.getRides();
      setRides(response.rides || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load rides');
      console.error('Load rides error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  const joinRide = async (rideId) => {
    try {
      await ApiClient.joinRide(rideId);
      Alert.alert('Success', 'Successfully joined ride!');
      loadRides(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to join ride');
    }
  };

  const renderRide = ({ item }) => (
    <View style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <Text style={styles.rideTitle}>{item.title || 'Untitled Ride'}</Text>
        <Text style={styles.rideStatus}>{item.status || 'active'}</Text>
      </View>
      
      <View style={styles.rideDetails}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText}>From: {item.origin}</Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.locationText}>To: {item.destination}</Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.locationText}>
            {new Date(item.departureTime).toLocaleString()}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.locationText}>
            {item.availableSeats} seats available
          </Text>
        </View>
      </View>

      {item.availableSeats > 0 && (
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={() => joinRide(item.id)}
        >
          <Text style={styles.joinButtonText}>Join Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Available Rides</Text>
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.createButtonText}>Create Ride</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rides}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRide}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No rides available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  rideCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  rideStatus: {
    fontSize: 12,
    color: '#4CAF50',
    textTransform: 'uppercase',
  },
  rideDetails: {
    marginBottom: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  locationText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  joinButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default RidesScreen;