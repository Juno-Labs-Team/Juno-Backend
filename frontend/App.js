import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import SearchScreen from './components/SearchScreen';
import AddFriendScreen from './components/AddFriendScreen';
import HomeScreen from './components/HomeScreen';
import ProfileScreen from './components/Screens/ProfileScreen';
import EditProfileScreen from './components/Screens/EditProfileScreen';
import NavigationBar from './components/NavigationBar';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const NEON = '#00ffe7';

const SearchStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SearchMain" component={SearchScreen} />
    <Stack.Screen 
      name="AddFriend" 
      component={AddFriendScreen}
      options={{ presentation: 'modal' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{ presentation: 'modal' }}
    />
  </Stack.Navigator>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let shadowProps = {};

          if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          if (focused) {
            shadowProps = {
              shadowColor: NEON,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 8,
            };
          }

          return (
            <Ionicons 
              name={iconName} 
              size={size} 
              color={color}
              style={shadowProps}
            />
          );
        },
        tabBarActiveTintColor: NEON,
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#0a0c1e',
          borderTopColor: `${NEON}44`,
          borderTopWidth: 2,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
          shadowColor: NEON,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Search" 
        component={SearchStack}
        options={{ title: 'Find' }}
      />
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Rides' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ title: 'Me' }}
      />
    </Tab.Navigator>
  );
};

const AuthenticatedApp = () => {
  const scheme = useColorScheme();

  const linking = {
    prefixes: ['http://localhost:19006', 'https://yourapp.com'],
    config: {
      screens: {
        Main: {
          screens: {
            Home: '/rides',
            Search: {
              screens: {
                SearchMain: '/search',
                AddFriend: '/add-friend',
              }
            },
            Profile: {
              screens: {
                ProfileMain: '/profile',
                EditProfile: '/edit-profile',
              }
            },
          }
        },
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
            backgroundColor: '#0a0c1e',
            shadowColor: NEON,
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          },
          headerTintColor: '#fff',
          header: Platform.OS === 'web' ? () => <NavigationBar /> : undefined,
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={TabNavigator}
          options={{ headerShown: Platform.OS === 'web' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const UnauthenticatedApp = () => {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <AuthenticatedApp /> : <UnauthenticatedApp />;
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
