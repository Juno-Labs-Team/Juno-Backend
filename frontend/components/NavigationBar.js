import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

const NEON = '#00ffe7';

const NavigationBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const navItems = [
    { name: 'Search', icon: 'search', route: 'Main', params: { screen: 'Search' } },
    { name: 'Rides', icon: 'home', route: 'Main', params: { screen: 'Home' } },
    { name: 'Profile', icon: 'person', route: 'Main', params: { screen: 'Profile' } },
  ];

  const isActiveRoute = (routeName) => {
    const currentRoute = route.name;
    return currentRoute === routeName || 
           (routeName === 'Home' && currentRoute === 'Main') ||
           (routeName === 'Search' && route.params?.screen === 'Search') ||
           (routeName === 'Profile' && route.params?.screen === 'Profile');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <TouchableOpacity 
          style={styles.logo}
          onPress={() => navigation.navigate('Main', { screen: 'Home' })}
        >
          <View style={styles.logoContainer}>
            <Ionicons name="car" size={28} color={NEON} />
            <Text style={styles.logoText}>Juno</Text>
          </View>
        </TouchableOpacity>

        {/* Navigation Items */}
        <View style={styles.navItems}>
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.name);
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => navigation.navigate(item.route, item.params)}
              >
                <Ionicons 
                  name={isActive ? item.icon : `${item.icon}-outline`} 
                  size={20} 
                  color={isActive ? '#000' : '#fff'} 
                />
                <Text style={[
                  styles.navText,
                  isActive && styles.navTextActive
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* User Menu */}
        <View style={styles.userMenu}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>
              {user?.firstName || 'User'}
            </Text>
            <Text style={styles.userRole}>Student</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color={NEON} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10, 12, 30, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: `${NEON}44`,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    backdropFilter: 'blur(10px)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 70,
  },
  logo: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 8,
    textShadowColor: NEON,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  navItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 2,
    justifyContent: 'center',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  navItemActive: {
    backgroundColor: NEON,
    borderColor: NEON,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  navText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  userMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userRole: {
    color: '#b1f6e8',
    fontSize: 12,
    fontWeight: '500',
  },
  logoutButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 231, 0.1)',
    borderWidth: 1,
    borderColor: `${NEON}33`,
  },
});

export default NavigationBar;