import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import friendsData from './ScheduledEvents.json';

const HomeScreen = ({ navigation }) => {
  const [scheduledEvents, setScheduledEvents] = useState([]);

  useEffect(() => {
    setScheduledEvents(friendsData.scheduledEvents || []);
  }, []);

  const reloadData = () => {
    setScheduledEvents([...friendsData.scheduledEvents]);
    console.log("Data reloaded!");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Rides</Text>
        <TouchableOpacity onPress={reloadData} style={styles.reloadButton}>
          <Ionicons name="reload" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={scheduledEvents}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <ExpandableItem item={item} navigation={navigation} />}
      />
    </View>
  );
};

const ExpandableItem = ({ item, navigation }) => {
  const [expanded, setExpanded] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  const numPassengersFree = item.passengers - item.currentNumPassengers;
  const hasAvailableSeats = numPassengersFree > 0;

  // Function to generate a complementary color for better contrast
  const getComplementaryColor = (hex) => {
  if (!hex) return "#4CAF50"; // Default fallback

  // Remove "#" if present
  hex = hex.replace("#", "");

  // Convert hex to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Generate the complementary color
  let compR = 255 - r;
  let compG = 255 - g;
  let compB = 255 - b;

  // Convert back to hex format
  return `#${compR.toString(16).padStart(2, "0")}${compG.toString(16).padStart(2, "0")}${compB.toString(16).padStart(2, "0")}`;
};

const getTextColor = (hex) => {
  if (!hex) return "#FFFFFF"; // Default to white text

  hex = hex.replace("#", "");
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Calculate brightness
  let brightness = (r * 0.299 + g * 0.587 + b * 0.114);

  return brightness > 130 ? "#000000" : "#FFFFFF"; // Black for bright colors, white for dark colors
};



  const bookButtonColor = getComplementaryColor(item.color);
  const bookButtonTextColor = getTextColor(bookButtonColor);

  // Adjust animation height dynamically
  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, hasAvailableSeats ? 160 : 100], // Expands more when button is present
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
      <Text style={styles.eventTitle}>{item.rideName} {item.rideEmoji}</Text>
      <Animated.View style={[styles.details, { height: animatedHeight, overflow: 'hidden' }]}>
        <Text style={styles.eventText}>📅 {item.date} at {item.time}</Text>
        <Text style={styles.eventText}>📍 {item.location}</Text>
        <Text style={styles.eventText}>🧑‍✈️ Driver: {item.driver}</Text>
        <Text style={styles.eventText}>
          👥 {item.passengers} passengers ({numPassengersFree === item.passengers ? "All spots left" : `${numPassengersFree} spots left`})
        </Text>

        {hasAvailableSeats && (
          <TouchableOpacity 
  style={[styles.bookButton, { backgroundColor: bookButtonColor }]} 
  onPress={() => navigation.navigate('BookingScreen', { rideDetails: item })}
  activeOpacity={0.7} 
>
  <Text style={[styles.bookButtonText, { color: bookButtonTextColor }]}>Book This Ride!</Text>
</TouchableOpacity>

        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Styles
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
    borderRadius: 30, // Rounded shape
    marginTop: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
