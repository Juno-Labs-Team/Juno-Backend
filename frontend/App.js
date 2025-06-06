import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme, Platform } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import SearchScreen from './components/SearchScreen';
import AddFriendScreen from './components/AddFriendScreen';
import HomeScreen from './components/HomeScreen';
import ProfileScreen from './components/Screens/ProfileScreen';
import RidesScreen from './components/RidesScreen';
import NavigationBar from './components/NavigationBar';

const Stack = createStackNavigator();

const AuthenticatedApp = () => {
  const scheme = useColorScheme();

  // Web-style linking configuration
  const linking = {
    prefixes: ['http://localhost:19006', 'https://yourapp.com'],
    config: {
      screens: {
        Home: '/home',
        Profile: '/profile', 
        Search: '/search',
        Rides: '/rides',
        AddFriend: '/add-friend',
      },
    },
  };

  return (
    <NavigationContainer 
      theme={scheme === 'dark' ? DarkTheme : DefaultTheme}
      linking={Platform.OS === 'web' ? linking : undefined}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: scheme === 'dark' ? '#121212' : '#fff',
          },
          headerTintColor: scheme === 'dark' ? '#fff' : '#000',
          header: () => <NavigationBar />, // Custom navigation bar with logout
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Juno - Home' }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: 'Juno - Profile' }}
        />
        <Stack.Screen 
          name="Search" 
          component={SearchScreen}
          options={{ title: 'Juno - Search Friends' }}
        />
        <Stack.Screen 
          name="Rides" 
          component={RidesScreen}
          options={{ title: 'Juno - My Rides' }}
        />
        <Stack.Screen 
          name="AddFriend" 
          component={AddFriendScreen}
          options={{ title: 'Juno - Add Friend' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const UnauthenticatedApp = () => {
  const scheme = useColorScheme();

  const linking = {
    prefixes: ['http://localhost:19006', 'https://yourapp.com'],
    config: {
      screens: {
        Login: '/login',
      },
    },
  };

  return (
    <NavigationContainer 
      theme={scheme === 'dark' ? DarkTheme : DefaultTheme}
      linking={Platform.OS === 'web' ? linking : undefined}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // No header for login
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: 'Juno - Login' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />;
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
