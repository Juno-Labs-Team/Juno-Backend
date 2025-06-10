import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
  SafeAreaView,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/api';

const NEON = '#00ffe7';

const GlassCard = ({ children, style, onPress }) => (
  <TouchableOpacity 
    style={[styles.glassCard, style]} 
    onPress={onPress}
    activeOpacity={0.9}
  >
    {children}
  </TouchableOpacity>
);

const SearchScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'locations'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [locationResults, setLocationResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      if (activeTab === 'friends') {
        searchUsers();
      } else {
        searchLocations();
      }
    } else {
      setSearchResults([]);
      setLocationResults([]);
    }
  }, [searchQuery, activeTab]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadFriends(),
        loadSavedLocations()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await apiClient.getFriends();
      // Your backend returns { friends: [...], count: 0, message: "..." }
      setFriends(response.friends || []);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadSavedLocations = async () => {
    try {
      const response = await apiClient.getSavedLocations();
      setSavedLocations(response.locations || []);
    } catch (error) {
      console.error('Failed to load saved locations:', error);
    }
  };

  const searchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.searchUsers(searchQuery);
      // Your backend returns { users: [...], count: 0, query: "...", message: "..." }
      setSearchResults(response.users || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchLocations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.searchLocations(searchQuery);
      setLocationResults(response.locations || []);
    } catch (error) {
      console.error('Location search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (userId) => {
    try {
      await apiClient.addFriend(userId);
      Alert.alert('Success', 'Friend request sent!');
      loadFriends();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const saveLocation = async (location) => {
    try {
      await apiClient.saveLocation({
        name: location.name || location.address,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        location_type: 'other'
      });
      Alert.alert('Success', 'Location saved!');
      loadSavedLocations();
    } catch (error) {
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderUser = ({ item }) => {
    const isFriend = friends.some(friend => friend.id === item.id);
    
    return (
      <GlassCard style={styles.userCard}>
        <Image
          source={{ uri: item.profilePicture || 'https://via.placeholder.com/60' }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.userHandle}>@{item.username}</Text>
          {item.school && (
            <Text style={styles.userSchool}>{item.school}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isFriend ? styles.friendButton : styles.addButton
          ]}
          onPress={() => !isFriend && addFriend(item.id)}
          disabled={isFriend}
        >
          <Ionicons 
            name={isFriend ? "checkmark-circle" : "person-add"} 
            size={20} 
            color={isFriend ? "#4CAF50" : "#000"} 
          />
          <Text style={[
            styles.actionButtonText,
            isFriend ? { color: "#4CAF50" } : { color: "#000" }
          ]}>
            {isFriend ? "Friends" : "Add"}
          </Text>
        </TouchableOpacity>
      </GlassCard>
    );
  };

  const renderLocation = ({ item }) => (
    <GlassCard style={styles.locationCard}>
      <View style={styles.locationIcon}>
        <Ionicons name="location" size={24} color={NEON} />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name || item.address}</Text>
        <Text style={styles.locationAddress}>{item.address}</Text>
        {item.distance && (
          <Text style={styles.locationDistance}>{item.distance} away</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.saveLocationButton}
        onPress={() => saveLocation(item)}
      >
        <Ionicons name="bookmark-outline" size={20} color={NEON} />
      </TouchableOpacity>
    </GlassCard>
  );

  const renderSavedLocation = ({ item }) => (
    <GlassCard style={styles.savedLocationCard}>
      <View style={styles.locationIcon}>
        <Ionicons 
          name={item.location_type === 'home' ? 'home' : 
                item.location_type === 'work' ? 'briefcase' :
                item.location_type === 'school' ? 'school' : 'location'} 
          size={24} 
          color={NEON} 
        />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationAddress}>{item.address}</Text>
      </View>
      <TouchableOpacity style={styles.useLocationButton}>
        <Text style={styles.useLocationText}>Use</Text>
      </TouchableOpacity>
    </GlassCard>
  );

  const renderFriend = ({ item }) => (
    <GlassCard style={styles.friendCard}>
      <Image
        source={{ uri: item.profilePicture || 'https://via.placeholder.com/50' }}
        style={styles.friendAvatar}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.friendHandle}>@{item.username}</Text>
      </View>
      <View style={styles.friendStatus}>
        <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50' }]} />
        <Text style={styles.statusText}>Online</Text>
      </View>
    </GlassCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Find & Explore</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddFriend')}
          >
            <Ionicons name="person-add" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={activeTab === 'friends' ? '#000' : NEON} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'friends' && styles.activeTabText
            ]}>
              Friends
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'locations' && styles.activeTab]}
            onPress={() => setActiveTab('locations')}
          >
            <Ionicons 
              name="location" 
              size={20} 
              color={activeTab === 'locations' ? '#000' : NEON} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'locations' && styles.activeTabText
            ]}>
              Locations
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={NEON} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'friends' ? "Search by name or username..." : "Search locations..."}
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'friends' ? (
          <>
            {/* Search Results */}
            {searchQuery.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Search Results {searchResults.length > 0 && `(${searchResults.length})`}
                </Text>
                {loading ? (
                  <GlassCard style={styles.loadingCard}>
                    <Ionicons name="hourglass" size={32} color={NEON} />
                    <Text style={styles.loadingText}>Searching...</Text>
                  </GlassCard>
                ) : (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderUser}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                      <GlassCard style={styles.emptyCard}>
                        <Ionicons name="person-outline" size={48} color="#666" />
                        <Text style={styles.emptyText}>
                          {searchQuery.length > 2 ? "No users found" : "Type to search"}
                        </Text>
                      </GlassCard>
                    )}
                  />
                )}
              </View>
            )}

            {/* Friends List */}
            <View style={[styles.section, { flex: 1 }]}>
              <Text style={styles.sectionTitle}>
                Your Friends ({friends.length})
              </Text>
              <FlatList
                data={friends}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderFriend}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={NEON}
                    colors={[NEON]}
                  />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <GlassCard style={styles.emptyCard}>
                    <Ionicons name="people-outline" size={48} color="#666" />
                    <Text style={styles.emptyText}>No friends yet</Text>
                    <Text style={styles.emptySubText}>
                      Search for classmates to start carpooling!
                    </Text>
                  </GlassCard>
                )}
              />
            </View>
          </>
        ) : (
          <>
            {/* Location Search Results */}
            {searchQuery.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Location Results {locationResults.length > 0 && `(${locationResults.length})`}
                </Text>
                {loading ? (
                  <GlassCard style={styles.loadingCard}>
                    <Ionicons name="hourglass" size={32} color={NEON} />
                    <Text style={styles.loadingText}>Searching locations...</Text>
                  </GlassCard>
                ) : (
                  <FlatList
                    data={locationResults}
                    keyExtractor={(item, index) => `location-${index}`}
                    renderItem={renderLocation}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                      <GlassCard style={styles.emptyCard}>
                        <Ionicons name="location-outline" size={48} color="#666" />
                        <Text style={styles.emptyText}>
                          {searchQuery.length > 2 ? "No locations found" : "Type to search"}
                        </Text>
                      </GlassCard>
                    )}
                  />
                )}
              </View>
            )}

            {/* Saved Locations */}
            <View style={[styles.section, { flex: 1 }]}>
              <Text style={styles.sectionTitle}>
                Saved Locations ({savedLocations.length})
              </Text>
              <FlatList
                data={savedLocations}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderSavedLocation}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={NEON}
                    colors={[NEON]}
                  />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <GlassCard style={styles.emptyCard}>
                    <Ionicons name="bookmark-outline" size={48} color="#666" />
                    <Text style={styles.emptyText}>No saved locations</Text>
                    <Text style={styles.emptySubText}>
                      Search and save frequently used places!
                    </Text>
                  </GlassCard>
                )}
              />
            </View>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c1e',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: NEON,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    letterSpacing: 1,
  },
  addButton: {
    backgroundColor: NEON,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(24, 24, 37, 0.8)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 21,
    gap: 8,
  },
  activeTab: {
    backgroundColor: NEON,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: NEON,
  },
  activeTabText: {
    color: '#000',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 37, 0.8)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: `${NEON}44`,
    backdropFilter: 'blur(10px)',
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: NEON,
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  glassCard: {
    backgroundColor: 'rgba(24, 24, 37, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${NEON}33`,
    backdropFilter: 'blur(10px)',
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: NEON,
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: '#b1f6e8',
    marginBottom: 2,
  },
  userSchool: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  addButton: {
    backgroundColor: NEON,
    borderColor: NEON,
  },
  friendButton: {
    backgroundColor: 'transparent',
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  savedLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
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
    marginBottom: 2,
  },
  locationDistance: {
    fontSize: 12,
    color: '#666',
  },
  saveLocationButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 231, 0.1)',
  },
  useLocationButton: {
    backgroundColor: NEON,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  useLocationText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  friendHandle: {
    fontSize: 14,
    color: '#b1f6e8',
  },
  friendStatus: {
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  loadingCard: {
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SearchScreen;
