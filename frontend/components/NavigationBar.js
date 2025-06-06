import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const NavigationBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Home', icon: 'home-outline', route: 'Home' },
    { name: 'Rides', icon: 'car-outline', route: 'Rides' },
    { name: 'Search', icon: 'search-outline', route: 'Search' },
    { name: 'Profile', icon: 'person-outline', route: 'Profile' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            console.log('🚪 Logout button pressed');
            try {
              await logout();
              console.log('✅ Logout completed successfully');
            } catch (error) {
              console.error('❌ Logout error:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.navbar}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.logo}>🚗 Juno</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.centerSection}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.navItem,
              route.name === item.route && styles.activeNavItem
            ]}
            onPress={() => navigation.navigate(item.route)}
          >
            <Ionicons 
              name={item.icon} 
              size={20} 
              color={route.name === item.route ? '#4285F4' : '#666'} 
            />
            <Text style={[
              styles.navText,
              route.name === item.route && styles.activeNavText
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.rightSection}>
        <Text style={styles.userText}>Hi, {user?.firstName || user?.username}!</Text>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftSection: {
    flex: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  centerSection: {
    flexDirection: 'row',
    flex: 2,
    justifyContent: 'center',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeNavItem: {
    backgroundColor: '#E3F2FD',
  },
  navText: {
    marginLeft: 5,
    color: '#666',
    fontWeight: '500',
  },
  activeNavText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  userText: {
    marginRight: 15,
    color: '#333',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  logoutText: {
    marginLeft: 5,
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default NavigationBar;