import React, { useEffect, useState } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme, StatusBar, ActivityIndicator } from 'react-native';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

import SearchScreen from './Components/SearchScreen';
import HomeScreen from './Components/HomeScreen';
import LoginScreen from './Components/LoginScreen';
import authService from './services/auth';

const ProfileScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Profile Screen</Text>
    <Text style={{ color: '#AAAAAA', fontSize: 14, marginTop: 5 }}>Coming soon...</Text>
  </View>
);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#4CAF50',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
  },
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: '#121212',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopColor: '#333333',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarInactiveTintColor: '#666666',
        tabBarActiveTintColor: '#4CAF50',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          const iconSize = focused ? size + 2 : size;
          
          if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Rides' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ title: 'Friends' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const scheme = useColorScheme();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const userData = await authService.getStoredUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <Text style={styles.logo}>🚗</Text>
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Loading Juno...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <NavigationContainer theme={CustomDarkTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="MainTabs" component={MainTabs} />
          ) : (
            <Stack.Screen name="Login">
              {() => <LoginScreen onAuthSuccess={handleAuthSuccess} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  logo: {
    fontSize: 64,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default App;
