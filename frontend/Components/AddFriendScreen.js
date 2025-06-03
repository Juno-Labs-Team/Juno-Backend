import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet } from 'react-native';

const allUsers = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' },
  { id: '4', name: 'David' },
  { id: '5', name: 'Emma' },
];

const AddFriendScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search for friends..."
        placeholderTextColor="#aaa"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Text style={styles.userItem}>{item.name}</Text>
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
});

export default AddFriendScreen;
