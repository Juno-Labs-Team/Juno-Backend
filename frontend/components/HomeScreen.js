import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/api';
import MapWidget from '../../frontend/components/MapWidget';

const NEON = '#00ffe7';
const SCREEN_WIDTH = Dimensions.get('window').width;

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const ridesData = await apiClient.getRides();
      setRides(ridesData);
    } catch (error) {
      console.error('Failed to fetch rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRides();
    setRefreshing(false);
  };

  const getComplementaryColor = (hex) => {
    if (!hex) return NEON;
    hex = hex.replace("#", "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    let compR = 255 - r;
    let compG = 255 - g;
    let compB = 255 - b;
    return `#${compR.toString(16).padStart(2, "0")}${compG.toString(16).padStart(2, "0")}${compB.toString(16).padStart(2, "0")}`;
  };

  const getTextColor = (hex) => {
    if (!hex) return "#FFFFFF";
    hex = hex.replace("#", "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    let brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    return brightness > 130 ? "#000000" : "#FFFFFF";
  };

  const RideCard = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const animation = useState(new Animated.Value(0))[0];

    const availableSeats = (item.maxPassengers || 4) - (item.currentPassengers || 0);
    const hasAvailableSeats = availableSeats > 0;
    const cardColor = item.color || '4285F4';
    const buttonColor = getComplementaryColor(cardColor);
    const buttonTextColor = getTextColor(buttonColor);

    const animatedHeight = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, hasAvailableSeats ? 160 : 120],
    });

    const toggleExpand = () => {
      Animated.timing(animation, {
        toValue: expanded ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setExpanded(!expanded);
    };

    const handleBookRide = () => {
      navigation.navigate('BookRide', { rideId: item.id, rideDetails: item });
    };

    return (
      <TouchableOpacity
        onPress={toggleExpand}
        style={[
          styles.rideCard,
          {
            backgroundColor: `#${cardColor}`,
            shadowColor: `#${cardColor}`,
          },
        ]}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.rideTitle}>
            {item.destination} {item.emoji || '🚗'}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {hasAvailableSeats ? 'OPEN' : 'FULL'}
            </Text>
          </View>
        </View>
        <Animated.View style={[styles.expandedContent, { height: animatedHeight, overflow: 'hidden' }]}>
          <View style={styles.rideDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={styles.detailText}>
                {item.date} at {item.time}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#fff" />
              <Text style={styles.detailText}>{item.origin} → {item.destination}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#fff" />
              <Text style={styles.detailText}>Driver: {item.driverName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={16} color="#fff" />
              <Text style={styles.detailText}>
                {item.maxPassengers} seats ({availableSeats} available)
              </Text>
            </View>
            {item.pricePerSeat && (
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#fff" />
                <Text style={styles.detailText}>${item.pricePerSeat} per seat</Text>
              </View>
            )}
          </View>
          {hasAvailableSeats && (
            <TouchableOpacity
              style={[
                styles.bookButton,
                { backgroundColor: buttonColor },
              ]}
              onPress={handleBookRide}
              activeOpacity={0.8}
            >
              <Ionicons name="car-outline" size={18} color={buttonTextColor} />
              <Text style={[styles.bookButtonText, { color: buttonTextColor }]}>
                Book This Ride
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Rides</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={NEON} />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <View style={styles.leftColumn}>
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => <RideCard item={item} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={NEON}
                colors={[NEON]}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="car-outline" size={64} color="#666" />
                <Text style={styles.emptyTitle}>No rides available</Text>
                <Text style={styles.emptyText}>
                  Check back later for upcoming rides or create your own!
                </Text>
                <TouchableOpacity
                  style={styles.createRideButton}
                  onPress={() => navigation.navigate('CreateRide')}
                >
                  <Ionicons name="add" size={20} color="#000" />
                  <Text style={styles.createRideText}>Create Ride</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
        <MapWidget />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0c1e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textShadowColor: NEON, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  refreshButton: { padding: 8 },
  row: { flexDirection: 'row', flex: 1 },
  leftColumn: { width: SCREEN_WIDTH * 0.5, paddingLeft: 20, paddingRight: 8 },
  listContainer: { paddingBottom: 20 },
  rideCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rideTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    overflow: 'hidden',
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  rideDetails: {
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.9,
    textAlign: 'left',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createRideText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default HomeScreen;