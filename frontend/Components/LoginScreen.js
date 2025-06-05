import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import authService from '../services/auth'; // Updated import

const LoginScreen = ({ onAuthSuccess, onSwitchToSignUp }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    Alert.alert(
      'Google Login',
      'This will open your browser to login with Google. After logging in, you\'ll be redirected back to the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await authService.loginWithGoogle();
              
              if (result.success) {
                Alert.alert('Welcome!', `Hello ${result.user.firstName || result.user.username}!`);
                onAuthSuccess(result.user);
              } else {
                Alert.alert('Login Failed', result.error);
                // Show manual token input as fallback
                Alert.alert(
                  'Alternative Login',
                  'Google OAuth had issues. You can manually copy your token from the browser response and paste it below.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Login failed: ' + error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleTokenLogin = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter your JWT token');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.loginWithToken(token.trim());
      
      if (result.success) {
        Alert.alert('Welcome!', `Hello ${result.user.firstName || result.user.username}!`);
        onAuthSuccess(result.user);
      } else {
        Alert.alert('Login Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please check your token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🚗</Text>
        <Text style={styles.title}>Juno</Text>
        <Text style={styles.subtitle}>Your rideshare companion</Text>
      </View>

      <View style={styles.loginSection}>
        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.tokenLabel}>Manual Token Login (Development)</Text>
        <TextInput
          style={styles.tokenInput}
          placeholder="Paste your JWT token here..."
          value={token}
          onChangeText={setToken}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleTokenLogin}
          disabled={loading || !token.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Login with Token</Text>
          )}
        </TouchableOpacity>

        {onSwitchToSignUp && (
          <TouchableOpacity
            style={styles.switchButton}
            onPress={onSwitchToSignUp}
          >
            <Text style={styles.switchButtonText}>
              Don't have an account? <Text style={styles.linkText}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Secure authentication via Google OAuth
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'space-between',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  loginSection: {
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
  },
  dividerText: {
    color: '#B0B0B0',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  tokenLabel: {
    color: '#B0B0B0',
    fontSize: 14,
    marginBottom: 8,
  },
  tokenInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333333',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  switchButtonText: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  linkText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default LoginScreen;