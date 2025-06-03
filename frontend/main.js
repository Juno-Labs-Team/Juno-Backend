import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Home Screen</Text>
  </View>
);

const SearchScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Search Screen</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.text}>Profile Screen</Text>
  </View>
);

const Tab = createBottomTabNavigator();

const App = () => {
  const scheme = useColorScheme(); // Detects system theme

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: scheme === 'dark' ? '#121212' : '#fff' },
          headerTintColor: scheme === 'dark' ? '#fff' : '#000',
          tabBarStyle: { backgroundColor: scheme === 'dark' ? '#121212' : '#fff' },
          tabBarInactiveTintColor: scheme === 'dark' ? '#aaa' : '#666',
          tabBarActiveTintColor: scheme === 'dark' ? '#fff' : '#000',
        }}
      >
        <Tab.Screen name="Search" component={HomeScreen} />
        <Tab.Screen name="Home" component={SearchScreen} /> {/*Put interactive map here*/}
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
    backgroundColor: '#121212', // Dark background always
  },
  text: {
    color: '#FFFFFF', // White text always
  },
});

export default App;
