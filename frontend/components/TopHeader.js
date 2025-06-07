import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const NEON = '#00ffe7';

const TopHeader = () => {
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left spacer */}
        <View style={styles.leftSpacer} />
        
        {/* Center - Juno Title */}
        <View style={styles.centerContainer}>
          <View style={styles.logoContainer}>
            <Ionicons name="car" size={28} color={NEON} />
            <Text style={styles.appTitle}>Juno</Text>
          </View>
        </View>
        
        {/* Right - User Info & Logout */}
        <View style={styles.rightContainer}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.firstName || 'Lamdashi'}</Text>
            <Text style={styles.userRole}>Student</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
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
    backgroundColor: '#0a0c1e',
    borderBottomWidth: 1,
    borderBottomColor: `${NEON}33`,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    minHeight: Platform.OS === 'ios' ? 90 : 65,
  },
  leftSpacer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: NEON,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 1,
    marginLeft: 8,
  },
  rightContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
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

export default TopHeader;