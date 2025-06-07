import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const NEON = '#00ffe7';

const TopHeader = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              console.log('🚪 TopHeader logout clicked');
              
              // Call logout from AuthContext
              await logout();
              
              console.log('✅ Logout completed, user state cleared');
              
              // No need to navigate - AuthController will handle the transition
              // when user becomes null, it will automatically show Login screen
              
            } catch (error) {
              console.error('❌ Logout failed:', error);
              
              // Force logout anyway by clearing everything
              if (Platform.OS === 'web') {
                window.location.href = '/';
              }
            }
          }
        },
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
            <Text style={styles.userName}>{user?.firstName || user?.username || 'Student'}</Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 15,
    minHeight: Platform.OS === 'ios' ? 100 : 70,
  },
  leftSpacer: {
    width: 80,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: NEON,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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