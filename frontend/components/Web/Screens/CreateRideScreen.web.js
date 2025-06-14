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
  KeyboardAvoidingView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

// Conditional import for DateTimePicker
let DateTimePicker;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (error) {
    console.warn('DateTimePicker not available:', error);
  }
}

const NEON = '#00ffe7';

// Enhanced Location Picker with better UX
const LocationPicker = ({ visible, onClose, onSelect, title }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      loadSavedLocations();
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
    }
  }, [visible]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length > 2) {
        searchLocations();
      } else {
        setSearchResults([]);
        setError(null);
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadSavedLocations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSavedLocations();
      setSavedLocations(response.locations || []);
    } catch (error) {
      console.error('Failed to load saved locations:', error);
      setSavedLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const searchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.searchLocations(searchQuery);
      setSearchResults(response.locations || []);
      
      if (response.locations?.length === 0) {
        setError('No locations found. Try a different search term.');
      }
    } catch (error) {
      console.error('Location search failed:', error);
      setError('Failed to search locations. Please check your connection.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (location) => {
    if (!location.latitude || !location.longitude) {
      Alert.alert('Invalid Location', 'This location doesn\'t have valid coordinates.');
      return;
    }
    
    onSelect(location);
    onClose();
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  const renderLocation = ({ item }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => selectLocation(item)}
      activeOpacity={0.7}
    >
      <View style={styles.locationIcon}>
        <Ionicons 
          name={
            item.location_type === 'home' ? 'home' : 
            item.location_type === 'work' ? 'briefcase' :
            item.location_type === 'school' ? 'school' : 'location'
          } 
          size={20} 
          color={NEON} 
        />
      </View>
      <View style={styles.locationDetails}>
        <Text style={styles.locationName} numberOfLines={1}>
          {item.name || item.address}
        </Text>
        <Text style={styles.locationAddress} numberOfLines={2}>
          {item.address}
        </Text>
        {item.distance && (
          <Text style={styles.locationDistance}>{item.distance}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#666" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={NEON} />
          <Text style={styles.emptyText}>Searching locations...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
          <Text style={[styles.emptyText, { color: '#ff6b6b' }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => searchQuery.length > 2 ? searchLocations() : loadSavedLocations()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const isEmpty = searchQuery.length > 2 ? searchResults.length === 0 : savedLocations.length === 0;
    
    if (isEmpty) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>
            {searchQuery.length > 2 ? 'No locations found' : 'No saved locations'}
          </Text>
          {searchQuery.length <= 2 && (
            <Text style={styles.emptySubtext}>
              Start typing to search for locations
            </Text>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.modalContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={searchQuery.length > 2 ? searchResults : savedLocations}
          keyExtractor={(item, index) => `${item.id || item.place_id || index}`}
          renderItem={renderLocation}
          ListHeaderComponent={() => (
            <Text style={styles.sectionTitle}>
              {searchQuery.length > 2 ? 'Search Results' : 'Saved Locations'}
            </Text>
          )}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Enhanced Web Date Input with better validation
const WebDateInput = ({ value, onChange, placeholder, minDate }) => {
  const handleChange = (e) => {
    const newDate = new Date(e.target.value);
    if (newDate < minDate) {
      Alert.alert('Invalid Date', 'Please select a future date and time.');
      return;
    }
    onChange(newDate);
  };

  const formatForInput = (date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  if (Platform.OS === 'web') {
    return (
      <input
        type="datetime-local"
        value={formatForInput(value)}
        onChange={handleChange}
        min={formatForInput(minDate)}
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
  const { user } = useAuth();
  const [rideData, setRideData] = useState({
    origin: null,
    destination: null,
    departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // Default to 2 hours from now
    maxPassengers: 4,
    pricePerSeat: '',
    description: '',
    onlyFriends: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState('origin');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const minDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

  const openLocationPicker = (type) => {
    setLocationPickerType(type);
    setLocationPickerVisible(true);
  };

  const handleLocationSelect = (location) => {
    setRideData(prev => ({
      ...prev,
      [locationPickerType]: location
    }));
    
    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [locationPickerType]: null
    }));
  };

  const handleDateTimeChange = (newDateTime) => {
    if (newDateTime < minDate) {
      Alert.alert('Invalid Time', 'Please select a time at least 30 minutes in the future.');
      return;
    }
    
    setRideData(prev => ({ ...prev, departureTime: newDateTime }));
    setValidationErrors(prev => ({ ...prev, departureTime: null }));
  };

  const openDateTimePicker = () => {
    if (Platform.OS === 'web') {
      return; // Web input handles this inline
    }
    setShowDatePicker(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!rideData.origin) {
      errors.origin = 'Please select a pickup location';
    }
    
    if (!rideData.destination) {
      errors.destination = 'Please select a destination';
    }
    
    if (rideData.origin && rideData.destination) {
      // Check if origin and destination are too close (less than 0.5 miles)
      const distance = calculateDistance(
        rideData.origin.latitude, rideData.origin.longitude,
        rideData.destination.latitude, rideData.destination.longitude
      );
      
      if (distance < 0.5) {
        errors.destination = 'Destination must be at least 0.5 miles from pickup location';
      }
    }
    
    if (rideData.departureTime < minDate) {
      errors.departureTime = 'Departure time must be at least 30 minutes in the future';
    }
    
    if (rideData.maxPassengers < 1 || rideData.maxPassengers > 8) {
      errors.maxPassengers = 'Number of passengers must be between 1 and 8';
    }
    
    if (rideData.pricePerSeat && (isNaN(parseFloat(rideData.pricePerSeat)) || parseFloat(rideData.pricePerSeat) < 0)) {
      errors.pricePerSeat = 'Price must be a valid positive number';
    }
    
    if (rideData.pricePerSeat && parseFloat(rideData.pricePerSeat) > 100) {
      errors.pricePerSeat = 'Price per seat cannot exceed $100';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleCreateRide = async () => {
    if (!validateForm()) {
      Alert.alert('Please Fix Errors', 'Please correct the highlighted fields and try again.');
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
        max_passengers: parseInt(rideData.maxPassengers),
        price_per_seat: parseFloat(rideData.pricePerSeat) || 0,
        description: rideData.description.trim(),
        only_friends: rideData.onlyFriends,
        school_related: true,
      };

      console.log('🚗 Creating ride:', ridePayload);
      const response = await apiClient.createRide(ridePayload);
      
      Alert.alert(
        'Ride Created Successfully! 🎉', 
        `Your ride from ${rideData.origin.name || rideData.origin.address} to ${rideData.destination.name || rideData.destination.address} has been posted.`,
        [
          { 
            text: 'View Rides', 
            onPress: () => {
              navigation.goBack();
              // Navigate to rides tab
              navigation.navigate('Home');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Create ride error:', error);
      Alert.alert(
        'Failed to Create Ride', 
        error.message || 'Something went wrong. Please try again.',
        [
          { text: 'Retry', onPress: handleCreateRide },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const updateRideData = (field, value) => {
    setRideData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
            style={[
              styles.locationButton,
              validationErrors.origin && styles.errorBorder
            ]}
            onPress={() => openLocationPicker('origin')}
            activeOpacity={0.7}
          >
            <Ionicons name="radio-button-on" size={20} color="#4CAF50" />
            <View style={styles.locationButtonContent}>
              <Text style={styles.locationLabel}>From</Text>
              <Text style={[
                styles.locationValue,
                !rideData.origin && styles.placeholderText
              ]}>
                {rideData.origin ? (rideData.origin.name || rideData.origin.address) : 'Select pickup location'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          {validationErrors.origin && (
            <Text style={styles.errorText}>{validationErrors.origin}</Text>
          )}

          {/* Destination */}
          <TouchableOpacity
            style={[
              styles.locationButton,
              validationErrors.destination && styles.errorBorder
            ]}
            onPress={() => openLocationPicker('destination')}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={20} color="#FF5722" />
            <View style={styles.locationButtonContent}>
              <Text style={styles.locationLabel}>To</Text>
              <Text style={[
                styles.locationValue,
                !rideData.destination && styles.placeholderText
              ]}>
                {rideData.destination ? (rideData.destination.name || rideData.destination.address) : 'Select destination'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          {validationErrors.destination && (
            <Text style={styles.errorText}>{validationErrors.destination}</Text>
          )}

          {/* Date & Time */}
          <TouchableOpacity
            style={[
              styles.dateTimeButton,
              validationErrors.departureTime && styles.errorBorder
            ]}
            onPress={openDateTimePicker}
            disabled={Platform.OS === 'web'}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar" size={20} color={NEON} />
            <WebDateInput
              value={rideData.departureTime}
              onChange={handleDateTimeChange}
              placeholder="Select date and time"
              minDate={minDate}
            />
          </TouchableOpacity>
          {validationErrors.departureTime && (
            <Text style={styles.errorText}>{validationErrors.departureTime}</Text>
          )}

          {/* Passengers & Price */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Ionicons name="people" size={20} color={NEON} />
              <TextInput
                style={[
                  styles.input,
                  validationErrors.maxPassengers && styles.errorInput
                ]}
                placeholder="Max passengers"
                placeholderTextColor="#666"
                value={rideData.maxPassengers.toString()}
                onChangeText={(text) => updateRideData('maxPassengers', parseInt(text) || 1)}
                keyboardType="numeric"
                maxLength={1}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
              <Ionicons name="cash" size={20} color={NEON} />
              <TextInput
                style={[
                  styles.input,
                  validationErrors.pricePerSeat && styles.errorInput
                ]}
                placeholder="Price per seat ($)"
                placeholderTextColor="#666"
                value={rideData.pricePerSeat}
                onChangeText={(text) => updateRideData('pricePerSeat', text)}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>
          </View>
          
          <View style={styles.row}>
            {validationErrors.maxPassengers && (
              <Text style={[styles.errorText, { flex: 1, marginRight: 10 }]}
                accessibilityRole="alert"
              >
                {validationErrors.maxPassengers}
              </Text>
            )}
            {validationErrors.pricePerSeat && (
              <Text style={[styles.errorText, { flex: 1, marginLeft: 10 }]}
                accessibilityRole="alert"
              >
                {validationErrors.pricePerSeat}
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Ionicons name="document-text" size={20} color={NEON} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a description (optional)"
              placeholderTextColor="#666"
              value={rideData.description}
              onChangeText={(text) => updateRideData('description', text)}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>
          
          {rideData.description.length > 0 && (
            <Text style={styles.characterCount}>
              {rideData.description.length}/500 characters
            </Text>
          )}

          {/* Friends Only Toggle */}
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => updateRideData('onlyFriends', !rideData.onlyFriends)}
            activeOpacity={0.7}
          >
            <View style={styles.toggleContent}>
              <Ionicons name="people" size={20} color={NEON} />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleText}>Friends only</Text>
                <Text style={styles.toggleSubtext}>
                  Only your friends can see and join this ride
                </Text>
              </View>
            </View>
            <Ionicons 
              name={rideData.onlyFriends ? "checkbox" : "square-outline"} 
              size={24} 
              color={rideData.onlyFriends ? NEON : "#666"} 
            />
          </TouchableOpacity>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={handleCreateRide}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="car" size={24} color="#000" />
            )}
            <Text style={styles.createButtonText}>
              {loading ? 'Creating Ride...' : 'Create Ride'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Native Date/Time Pickers (Mobile only) */}
      {Platform.OS !== 'web' && showDatePicker && DateTimePicker && (
        <DateTimePicker
          value={rideData.departureTime}
          mode="datetime"
          display="default"
          minimumDate={minDate}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              handleDateTimeChange(selectedDate);
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c1e',
  },
  scrollView: {
    flex: 1,
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
    marginBottom: 8,
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
  placeholderText: {
    color: '#666',
    fontStyle: 'italic',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 37, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
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
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 37, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
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
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginBottom: 16,
    marginTop: -4,
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
    flex: 1,
  },
  toggleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  toggleText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 12,
  },
  errorBorder: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  errorInput: {
    color: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
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
    borderBottomWidth: 1,
    borderBottomColor: `${NEON}33`,
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
    paddingVertical: 20,
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
  locationDistance: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: NEON,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: '600',
  },
});

export default CreateRideScreen;