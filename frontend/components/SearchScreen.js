import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import friendsData from './PlayerDatabase.json'; // Import JSON file

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addingFriend, setAddingFriend] = useState(false); // Track "Add Friend" mode
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setAddingFriend(prev => !prev)}>
          <Text style={styles.addButton}>{addingFriend ? 'Cancel' : '+ Add Friend'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, addingFriend]);

  const filteredUsers = addingFriend
  ? friendsData.filter(user =>
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    ) 
  : friendsData.filter(friend =>
      friend.online && friend.distance === "Nearby" &&
      (friend.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
    ); 



  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder={addingFriend ? "Search for friends..." : "Find friends..."}
        placeholderTextColor="#aaa"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredUsers}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.userItem}>
            {item.firstName} {item.lastName} 
          </Text>
        )}
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
    height: 40,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 10,
    paddingLeft: 10,
    color: '#fff',
    marginBottom: 20,
  },
  userItem: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  addButton: {
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 15,
  },
});

export default SearchScreen;
