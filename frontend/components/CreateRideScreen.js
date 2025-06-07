import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/api';

// Conditional import for DateTimePicker
let DateTimePicker;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const NEON = '#00ffe7';

const LocationPicker = ({ visible, onClose, onSelect, title }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSavedLocations();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchLocations();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadSavedLocations = async () => {
    try {
      const response = await apiClient.getSavedLocations();
      setSavedLocations(response.locations || []);
    } catch (error) {
      console.error('Failed to load saved locations:', error);
    }
  };

  const searchLocations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.searchLocations(searchQuery);
      setSearchResults(response.locations || []);
    } catch (error) {
      console.error('Location search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (location) => {
    onSelect(location);
    onClose();
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderLocation = ({ item }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => selectLocation(item)}
    >
      <View style={styles.locationIcon}>
        <Ionicons 
          name={item.location_type === 'home' ? 'home' : 
                item.location_type === 'work' ? 'briefcase' :
                item.location_type === 'school' ? 'school' : 'location'} 
          size={20} 
          color={NEON} 
        />
      </View>
      <View style={styles.locationDetails}>
        <Text style={styles.locationName}>{item.name || item.address}</Text>
        <Text style={styles.locationAddress}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={NEON} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={NEON} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <FlatList
          data={searchQuery.length > 2 ? searchResults : savedLocations}
          keyExtractor={(item, index) => `${item.id || index}`}
          renderItem={renderLocation}
          ListHeaderComponent={() => (
            <Text style={styles.sectionTitle}>
              {searchQuery.length > 2 ? 'Search Results' : 'Saved Locations'}
            </Text>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>
                {searchQuery.length > 2 ? 'No locations found' : 'No saved locations'}
              </Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

// Web-compatible Date Input Component
const WebDateInput = ({ value, onChange, placeholder }) => {
  const handleChange = (e) => {
    const newDate = new Date(e.target.value);
    onChange(newDate);
  };

  const formatForInput = (date) => {
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };

  if (Platform.OS === 'web') {
    return (
      <input
        type="datetime-local"
        value={formatForInput(value)}
        onChange={handleChange}
        style={{
          flex: 1,
          fontSize: 16,
          color: '#fff',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          marginLeft: 12,
          fontFamily: 'inherit',
        }}
      />
    );
  }

  return (
    <Text style={styles.dateTimeText}>
      {value.toLocaleDateString()} {value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </Text>
  );
};

const CreateRideScreen = ({ navigation }) => {
  const [rideData, setRideData] = useState({
    origin: null,
    destination: null,
    departureTime: new Date(),
    maxPassengers: 4,
    pricePerSeat: '',
    description: '',
    onlyFriends: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState('origin');
  const [loading, setLoading] = useState(false);

  const openLocationPicker = (type) => {
    setLocationPickerType(type);
    setLocationPickerVisible(true);
  };

  const handleLocationSelect = (location) => {
    setRideData(prev => ({
      ...prev,
      [locationPickerType]: location
    }));
  };

  const handleDateTimeChange = (newDateTime) => {
    setRideData(prev => ({ ...prev, departureTime: newDateTime }));
  };

  const openDateTimePicker = () => {
    if (Platform.OS === 'web') {
      // Web doesn't need a separate picker, it's handled inline
      return;
    }
    setShowDatePicker(true);
  };

  const handleCreateRide = async () => {
    if (!rideData.origin || !rideData.destination) {
      Alert.alert('Error', 'Please select both origin and destination');
      return;
    }

    try {
      setLoading(true);
      
      const ridePayload = {
        origin_address: rideData.origin.address,
        origin_lat: rideData.origin.latitude,
        origin_lng: rideData.origin.longitude,
        destination_address: rideData.destination.address,
        destination_lat: rideData.destination.latitude,
        destination_lng: rideData.destination.longitude,
        departure_time: rideData.departureTime.toISOString(),
        max_passengers: rideData.maxPassengers,
        price_per_seat: parseFloat(rideData.pricePerSeat) || 0,
        description: rideData.description,
        only_friends: rideData.onlyFriends,
        school_related: true,
      };

      await apiClient.createRide(ridePayload);
      Alert.alert('Success', 'Ride created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={NEON} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Ride</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        {/* Origin */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => openLocationPicker('origin')}
        >
          <Ionicons name="radio-button-on" size={20} color="#4CAF50" />
          <View style={styles.locationButtonContent}>
            <Text style={styles.locationLabel}>From</Text>
            <Text style={styles.locationValue}>
              {rideData.origin ? rideData.origin.name || rideData.origin.address : 'Select pickup location'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* Destination */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => openLocationPicker('destination')}
        >
          <Ionicons name="location" size={20} color="#FF5722" />
          <View style={styles.locationButtonContent}>
            <Text style={styles.locationLabel}>To</Text>
            <Text style={styles.locationValue}>
              {rideData.destination ? rideData.destination.name || rideData.destination.address : 'Select destination'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* Date & Time */}
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={openDateTimePicker}
          disabled={Platform.OS === 'web'}
        >
          <Ionicons name="calendar" size={20} color={NEON} />
          <WebDateInput
            value={rideData.departureTime}
            onChange={handleDateTimeChange}
            placeholder="Select date and time"
          />
        </TouchableOpacity>

        {/* Passengers & Price */}
        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Ionicons name="people" size={20} color={NEON} />
            <TextInput
              style={styles.input}
              placeholder="Max passengers"
              placeholderTextColor="#666"
              value={rideData.maxPassengers.toString()}
              onChangeText={(text) => setRideData(prev => ({ ...prev, maxPassengers: parseInt(text) || 1 }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="cash" size={20} color={NEON} />
            <TextInput
              style={styles.input}
              placeholder="Price per seat"
              placeholderTextColor="#666"
              value={rideData.pricePerSeat}
              onChangeText={(text) => setRideData(prev => ({ ...prev, pricePerSeat: text }))}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <Ionicons name="document-text" size={20} color={NEON} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add a description (optional)"
            placeholderTextColor="#666"
            value={rideData.description}
            onChangeText={(text) => setRideData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Friends Only Toggle */}
        <TouchableOpacity
          style={styles.toggleContainer}
          onPress={() => setRideData(prev => ({ ...prev, onlyFriends: !prev.onlyFriends }))}
        >
          <View style={styles.toggleContent}>
            <Ionicons name="people" size={20} color={NEON} />
            <Text style={styles.toggleText}>Friends only</Text>
          </View>
          <Ionicons 
            name={rideData.onlyFriends ? "checkbox" : "square-outline"} 
            size={24} 
            color={rideData.onlyFriends ? NEON : "#666"} 
          />
        </TouchableOpacity>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && { opacity: 0.6 }]}
          onPress={handleCreateRide}
          disabled={loading}
        >
          <Ionicons name={loading ? "hourglass" : "car"} size={24} color="#000" />
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Ride'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Native Date/Time Pickers (Mobile only) */}
      {Platform.OS !== 'web' && showDatePicker && DateTimePicker && (
        <DateTimePicker
          value={rideData.departureTime}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setRideData(prev => ({ ...prev, departureTime: selectedDate }));
            }
          }}
        />
      )}

      {/* Location Picker Modal */}
      <LocationPicker
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onSelect={handleLocationSelect}
        title={locationPickerType === 'origin' ? 'Select Pickup Location' : 'Select Destination'}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: NEON,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 37, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${NEON}33`,
  },
  locationButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 37, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${NEON}33`,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 37, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${NEON}33`,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(24, 24, 37, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${NEON}33`,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEON,
    borderRadius: 25,
    padding: 18,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0c1e',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 37, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${NEON}33`,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: NEON,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#b1f6e8',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

export default CreateRideScreen;