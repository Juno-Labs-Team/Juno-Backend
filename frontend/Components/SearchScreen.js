import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Load friends when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [])
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setAddingFriend(prev => !prev)}>
          <Text style={styles.addButton}>{addingFriend ? 'Cancel' : '+ Add Friend'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, addingFriend]);

  // Search users or filter friends based on mode
  useEffect(() => {
    if (addingFriend && searchQuery.trim()) {
      searchUsers();
    } else if (!addingFriend) {
      filterFriends();
    }
  }, [searchQuery, addingFriend, friends]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFriends();
      setFriends(response.friends || []);
    } catch (error) {
      console.error('Failed to load friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.searchUsers(searchQuery);
      setSearchResults(response.users || []);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filterFriends = () => {
    if (!searchQuery.trim()) {
      setSearchResults(friends);
      return;
    }

    const filtered = friends.filter(friend =>
      friend.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleSendFriendRequest = async (userId, userName) => {
    try {
      Alert.alert(
        'Send Friend Request',
        `Send friend request to ${userName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: async () => {
              try {
                await apiService.sendFriendRequest(userId);
                Alert.alert('Success', 'Friend request sent!');
                // Remove from search results
                setSearchResults(prev => prev.filter(user => user.id !== userId));
              } catch (error) {
                Alert.alert('Error', `Failed to send friend request: ${error.message}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderUserItem = ({ item }) => {
    const isOnline = item.online || Math.random() > 0.5; // Mock online status
    const distance = item.distance || (Math.random() * 10).toFixed(1) + ' km away';

    return (
      <TouchableOpacity style={styles.userItem}>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.userName}>
              {item.firstName} {item.lastName}
            </Text>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#666' }]} />
          </View>
          <Text style={styles.userDetails}>@{item.username}</Text>
          <Text style={styles.userDetails}>{item.school || 'School not set'}</Text>
          {!addingFriend && (
            <Text style={styles.userDistance}>{distance}</Text>
          )}
        </View>
        
        {addingFriend && (
          <TouchableOpacity
            style={styles.addButton2}
            onPress={() => handleSendFriendRequest(item.id, `${item.firstName} ${item.lastName}`)}
          >
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const displayData = addingFriend ? searchResults : (searchQuery ? searchResults : friends);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder={addingFriend ? "Search for new friends..." : "Search your friends..."}
        placeholderTextColor="#aaa"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4CAF50" />
        </View>
      )}

      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUserItem}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={addingFriend ? "search" : "people"} 
              size={48} 
              color="#666" 
            />
            <Text style={styles.emptyText}>
              {addingFriend 
                ? (searchQuery ? 'No users found' : 'Search for new friends')
                : (friends.length === 0 ? 'No friends yet' : 'No friends match your search')
              }
            </Text>
            {!addingFriend && friends.length === 0 && (
              <Text style={styles.emptySubtext}>
                Tap "+ Add Friend" to find friends!
              </Text>
            )}
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  searchBar: {
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 25,
    paddingHorizontal: 20,
    color: '#fff',
    backgroundColor: '#1E1E1E',
    marginBottom: 20,
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  userDetails: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 2,
  },
  userDistance: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 15,
  },
  addButton2: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default SearchScreen;
