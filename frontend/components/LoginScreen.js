import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const NEON = '#00ffe7';

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [token, setToken] = useState('');
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await login();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      Alert.alert('Login Failed', 'Unable to sign in. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter a token');
      return;
    }
    
    try {
      setLoading(true);
      // For development - bypass normal auth
      await login(token);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🚗</Text>
          <View style={styles.iconGlow} />
        </View>
        
        {/* Title */}
        <Text style={styles.title}>Juno</Text>
        <Text style={styles.subtitle}>Rideshare made simple</Text>
        
        {/* Dev Mode Toggle */}
        <TouchableOpacity 
          style={styles.devToggle}
          onPress={() => setDevMode(!devMode)}
        >
          <Ionicons 
            name={devMode ? "code-slash" : "code"} 
            size={16} 
            color="#666" 
          />
          <Text style={styles.devToggleText}>
            {devMode ? 'Exit Dev Mode' : 'Dev Mode'}
          </Text>
        </TouchableOpacity>

        {devMode && (
          <>
            <Text style={styles.hintText}>
              Enter your auth token for development
            </Text>
            <TextInput
              style={styles.tokenInput}
              placeholder="Paste your auth token here..."
              placeholderTextColor="#666"
              value={token}
              onChangeText={setToken}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.devButton, loading && { opacity: 0.6 }]}
              onPress={handleDevLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="flash" size={18} color="white" />
              )}
              <Text style={styles.devButtonText}>
                {loading ? 'Signing in...' : 'Dev Login'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.orText}>or</Text>
          </>
        )}

        {/* Google Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && { opacity: 0.6 }]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="logo-google" size={20} color="white" />
          )}
          <Text style={styles.loginButtonText}>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Students helping students carpool
          </Text>
          <View style={styles.footerGlow} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c1e',
    background: 'radial-gradient(ellipse at top, #1a1a30 70%, #0a0c1e 100%)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  icon: {
    fontSize: 80,
    textAlign: 'center',
  },
  iconGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: NEON,
    borderRadius: 50,
    opacity: 0.1,
    transform: [{ scale: 1.5 }],
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: NEON,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 50,
  },
  devToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 8,
  },
  devToggleText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 5,
    fontStyle: 'italic',
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
    textAlign: 'center',
  },
  tokenInput: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  devButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  orText: {
    color: '#666',
    fontSize: 14,
    marginVertical: 15,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 40,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  footer: {
    position: 'relative',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footerGlow: {
    position: 'absolute',
    top: -10,
    left: -20,
    right: -20,
    bottom: -10,
    backgroundColor: NEON,
    borderRadius: 20,
    opacity: 0.05,
  },
});

export default LoginScreen;