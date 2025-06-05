import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  TextInput,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../services/auth';

const LoginScreen = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  const handleGoogleLogin = async () => {
    Alert.alert(
      'Google Login',
      'This will open your browser to login with Google.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              // Open the Google OAuth URL in browser
              const authUrl = 'https://juno-backend-6eamg.ondigitalocean.app/auth/google';
              await Linking.openURL(authUrl);
              
              Alert.alert(
                'Copy Your Token',
                'After logging in, copy the JWT token from the response and paste it below.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Error', 'Could not open browser');
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
        Alert.alert('Welcome!', `Hello ${result.user.firstName}!`);
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
        <Text style={styles.subtitle}>Student rideshare made simple</Text>
      </View>

      <View style={styles.loginContainer}>
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleLogin}
        >
          <Ionicons name="logo-google" size={20} color="#FFFFFF" />
          <Text style={styles.googleButtonText}>Login with Google</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.label}>Paste JWT Token:</Text>
        <TextInput
          style={styles.tokenInput}
          placeholder="Paste your JWT token here..."
          placeholderTextColor="#666"
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
  },
  loginContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 15,
    fontSize: 14,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 10,
  },
  tokenInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginScreen;