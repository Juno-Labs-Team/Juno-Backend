import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const NEON = '#00ffe7';

const TopHeader = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    console.log('🚪 TopHeader logout button pressed');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('🚪 User confirmed logout');
    
    try {
      setLoggingOut(true);
      setShowLogoutModal(false);
      
      // Call logout from AuthContext
      await logout();
      console.log('✅ Logout completed successfully');
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      
      // For web, we'll use a simple alert or console log
      if (Platform.OS === 'web') {
        console.error('Logout warning: Server logout failed, but local logout succeeded');
      }
    } finally {
      setLoggingOut(false);
    }
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
            disabled={loggingOut}
          >
            <Ionicons 
              name={loggingOut ? "hourglass-outline" : "log-out-outline"} 
              size={22} 
              color={NEON} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="log-out-outline" size={32} color="#ff6b6b" />
              <Text style={styles.modalTitle}>Sign Out</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Are you sure you want to sign out of your account?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0c1e',
    borderBottomWidth: 1,
    borderBottomColor: `${NEON}33`,
    ...(Platform.OS === 'web' ? {
      boxShadow: `0 2px 8px ${NEON}33`,
    } : {
      shadowColor: NEON,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    minHeight: 70,
  },
  leftSpacer: {
    flex: 1,
  },
  centerContainer: {
    flex: 2,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: NEON,
    marginLeft: 8,
    ...(Platform.OS === 'web' ? {
      textShadow: `0 0 10px ${NEON}`,
    } : {
      textShadowColor: NEON,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    }),
  },
  rightContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 15,
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
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 231, 0.15)',
    borderWidth: 1,
    borderColor: `${NEON}33`,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#181825',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    minWidth: 320,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: `${NEON}33`,
    ...(Platform.OS === 'web' ? {
      boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5)`,
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 20,
    }),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#666',
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TopHeader;