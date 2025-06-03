import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme } from 'react-native';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import SearchScreen from './components/SearchScreen';
import AddFriendScreen from './components/AddFriendScreen';
import friendsData from './components/PlayerDatabase.json'
const HomeScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Home Screen</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Profile Screen</Text>
  </View>
);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const SearchStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Search" component={SearchScreen} />
    <Stack.Screen name="AddFriend" component={AddFriendScreen} />
  </Stack.Navigator>
);

const App = () => {
  const scheme = useColorScheme();

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: scheme === 'dark' ? '#121212' : '#fff',
          },
          headerTintColor: scheme === 'dark' ? '#fff' : '#000',
          tabBarStyle: {
            backgroundColor: scheme === 'dark' ? '#121212' : '#fff',
          },
          tabBarInactiveTintColor: scheme === 'dark' ? '#aaa' : '#666',
          tabBarActiveTintColor: scheme === 'dark' ? '#fff' : '#000',
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Search') {
              iconName = 'search';
            } else if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Profile') {
              iconName = 'person';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}>
        <Tab.Screen name="Search" component={SearchStack} />
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  text: {
    color: '#FFFFFF',
  },
});

export default App;
