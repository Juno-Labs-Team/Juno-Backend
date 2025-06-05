import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import your existing screens
import HomeScreen from './HomeScreen';
import SearchScreen from './SearchScreen';
import AddFriendScreen from './AddFriendScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create stack navigators for each tab if needed
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#121212',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen} 
      options={{ title: 'Upcoming Rides' }}
    />
  </Stack.Navigator>
);

const SearchStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#121212',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="SearchMain" 
      component={SearchScreen} 
      options={{ title: 'Friends' }}
    />
    <Stack.Screen 
      name="AddFriend" 
      component={AddFriendScreen} 
      options={{ title: 'Add Friend' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#121212',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen} 
      options={{ title: 'Profile' }}
    />
  </Stack.Navigator>
);

const MainTabs = ({ user }) => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: '#666666',
          tabBarStyle: {
            backgroundColor: '#1E1E1E',
            borderTopColor: '#333333',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerShown: false, // Hide tab headers since we're using stack headers
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStack}
          options={{
            tabBarLabel: 'Rides',
          }}
        />
        <Tab.Screen 
          name="Search" 
          component={SearchStack}
          options={{
            tabBarLabel: 'Friends',
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileStack}
          options={{
            tabBarLabel: 'Profile',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default MainTabs;