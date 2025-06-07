import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, Platform, View, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import OnboardingScreen from './components/OnboardingScreen';
import SearchScreen from './components/SearchScreen';
import AddFriendScreen from './components/AddFriendScreen';
import HomeScreen from './components/HomeScreen';
import ProfileScreen from './components/Screens/ProfileScreen';
import EditProfileScreen from './components/Screens/EditProfileScreen';
import CreateRideScreen from './components/CreateRideScreen';
import TopHeader from './components/TopHeader';

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

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen 
      name="CreateRide" 
      component={CreateRideScreen}
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
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
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
              size={focused ? size + 4 : size} 
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
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
          shadowColor: NEON,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.5,
          marginTop: 4,
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
        component={HomeStack}
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

// Main App component - SINGLE NavigationContainer
const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer theme={DarkTheme}>
        <AuthController />
      </NavigationContainer>
    </AuthProvider>
  );
};

// Auth Controller - handles authenticated vs unauthenticated screens
const AuthController = () => {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#0a0c1e' 
      }}>
        <ActivityIndicator size="large" color={NEON} />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        needsOnboarding ? (
          // User is authenticated but needs onboarding
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          // User is authenticated and onboarded - show main app with TopHeader
          <Stack.Screen 
            name="AuthenticatedApp" 
            component={AuthenticatedTabs}
            options={{
              headerShown: true,
              header: () => <TopHeader />,
            }}
          />
        )
      ) : (
        // User is not authenticated - show login
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

// Authenticated app with TopHeader
const AuthenticatedTabs = () => {
  return <TabNavigator />;
};

export default App;
