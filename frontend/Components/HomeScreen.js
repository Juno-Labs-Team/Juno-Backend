import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  RefreshControl,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load rides when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRides();
    }, [])
  );

  const loadRides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getRides();
      
      // Transform backend data to your existing format
      const transformedRides = (response.rides || []).map(ride => ({
        rideName: ride.title,
        rideEmoji: '🚗',
        date: new Date(ride.departureTime).toLocaleDateString(),
        time: new Date(ride.departureTime).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        location: ride.pickupLocation,
        destination: ride.destination,
        driver: ride.driverName || 'Unknown Driver',
        passengers: ride.maxPassengers || 4,
        currentNumPassengers: ride.currentPassengers || 0,
        color: generateRideColor(ride.id),
        // Add fields for your existing UI
        id: ride.id,
        isMyRide: ride.isDriver || false,
      }));

      setScheduledEvents(transformedRides);
    } catch (err) {
      console.error('Failed to load rides:', err);
      setError(err.message);
      // Keep existing data if API fails
      if (scheduledEvents.length === 0) {
        setScheduledEvents([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  const handleJoinRide = async (rideId, rideName) => {
    try {
      Alert.alert(
        'Join Ride',
        `Request to join "${rideName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Request', 
            onPress: async () => {
              try {
                await apiService.joinRide(rideId);
                Alert.alert('Success', 'Ride request sent!');
                loadRides(); // Refresh rides
              } catch (error) {
                Alert.alert('Error', `Failed to join ride: ${error.message}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const generateRideColor = (id) => {
    const colors = ['1E1E1E', '2C3E50', '8E44AD', '3498DB', 'E67E22', '27AE60'];
    return colors[id % colors.length];
  };

  const reloadData = () => {
    loadRides();
  };

  if (loading && scheduledEvents.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Loading rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Rides</Text>
        <TouchableOpacity onPress={reloadData} style={styles.reloadButton}>
          <Ionicons name="reload" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {scheduledEvents.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="car" size={64} color="#666" />
          <Text style={{ color: '#FFFFFF', fontSize: 18, marginTop: 10 }}>No rides available</Text>
          <Text style={{ color: '#AAAAAA', fontSize: 14, marginTop: 5 }}>Check back later or create a ride!</Text>
        </View>
      ) : (
        <FlatList
          data={scheduledEvents}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={({ item }) => (
            <ExpandableItem 
              item={item} 
              navigation={navigation}
              onJoinRide={() => handleJoinRide(item.id, item.rideName)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const ExpandableItem = ({ item, navigation, onJoinRide }) => {
  const [expanded, setExpanded] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  const numPassengersFree = item.passengers - item.currentNumPassengers;
  const hasAvailableSeats = numPassengersFree > 0;

  // Keep your existing color logic
  const getComplementaryColor = (hex) => {
    if (!hex) return "#4CAF50";
    hex = hex.replace("#", "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    let compR = 255 - r;
    let compG = 255 - g;
    let compB = 255 - b;
    return `#${compR.toString(16).padStart(2, '0')}${compG.toString(16).padStart(2, '0')}${compB.toString(16).padStart(2, '0')}`;
  };

  const getTextColor = (bgColor) => {
    if (!bgColor) return "#FFFFFF";
    bgColor = bgColor.replace("#", "");
    let r = parseInt(bgColor.substring(0, 2), 16);
    let g = parseInt(bgColor.substring(2, 4), 16);
    let b = parseInt(bgColor.substring(4, 6), 16);
    let brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#FFFFFF";
  };

  const bookButtonColor = getComplementaryColor(item.color);
  const bookButtonTextColor = getTextColor(bookButtonColor);

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, hasAvailableSeats && !item.isMyRide ? 160 : 100],
  });

  const toggleExpand = () => {
    Animated.timing(animation, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity 
      onPress={toggleExpand} 
      style={[styles.eventCard, { backgroundColor: item.color ? `#${item.color}` : '#1E1E1E' }]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.eventTitle}>{item.rideName} {item.rideEmoji}</Text>
        {item.isMyRide && (
          <View style={{ backgroundColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>MY RIDE</Text>
          </View>
        )}
      </View>
      
      <Animated.View style={[styles.details, { height: animatedHeight, overflow: 'hidden' }]}>
        <Text style={styles.eventText}>📅 {item.date} at {item.time}</Text>
        <Text style={styles.eventText}>📍 From: {item.location}</Text>
        <Text style={styles.eventText}>🎯 To: {item.destination}</Text>
        <Text style={styles.eventText}>🧑‍✈️ Driver: {item.driver}</Text>
        <Text style={styles.eventText}>
          👥 {item.passengers} passengers ({numPassengersFree === item.passengers ? "All spots left" : `${numPassengersFree} spots left`})
        </Text>

        {hasAvailableSeats && !item.isMyRide && (
          <TouchableOpacity 
            style={[styles.bookButton, { backgroundColor: bookButtonColor }]} 
            onPress={onJoinRide}
            activeOpacity={0.7} 
          >
            <Text style={[styles.bookButtonText, { color: bookButtonTextColor }]}>Request to Join!</Text>
          </TouchableOpacity>
        )}

        {item.isMyRide && (
          <View style={{ 
            backgroundColor: 'rgba(76, 175, 80, 0.2)', 
            padding: 10, 
            borderRadius: 8, 
            marginTop: 12, 
            alignItems: 'center' 
          }}>
            <Text style={{ color: '#4CAF50', fontSize: 14, fontWeight: '600' }}>
              You're driving this ride
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Keep your existing styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reloadButton: {
    padding: 10,
  },
  eventCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    marginTop: 10,
  },
  eventText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  bookButton: {
    padding: 12,
    borderRadius: 30,
    marginTop: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
