import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Alert,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = () => {
  const { login, loginWithToken } = useAuth();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showQuickTest, setShowQuickTest] = useState(false);
  const [logoAnimation] = useState(new Animated.Value(1));

  const handleGoogleLogin = async () => {
    const result = await login();
    if (result.message) {
      Alert.alert('Google Login', result.message);
    }
  };

  const handleTokenLogin = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter your JWT token');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithToken(token.trim());
      
      if (result.success) {
        Alert.alert('Welcome!', `Hello ${result.user.firstName || result.user.username}!`);
      } else {
        Alert.alert('Login Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please check your token.');
    } finally {
      setLoading(false);
    }
  };

  // Secret tap logo feature
  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    // Animate logo on tap
    Animated.sequence([
      Animated.timing(logoAnimation, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (newCount >= 5) {
      setShowQuickTest(true);
      Alert.alert('🔧 Developer Mode', 'Quick test login enabled!', [
        { text: 'Sweet!', style: 'default' }
      ]);
      setTapCount(0);
    }
    
    // Reset counter after 3 seconds of no taps
    setTimeout(() => {
      if (tapCount === newCount - 1) setTapCount(0);
    }, 3000);
  };

  // Quick test with your working token
  const quickTest = () => {
    const workingToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6Im9yYW5nZWp1aWNlcGx6ZGV2QGdtYWlsLmNvbSIsImV4cCI6MTc0OTg0OTEzNCwiaWF0IjoxNzQ5MjQ0MzM0fQ.lbC_Xd0k68ncr-oujzdcCqTzA2HVq2UlT2qBsFNSkCQ';
    setToken(workingToken);
    loginWithToken(workingToken);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Tappable Logo */}
        <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.8}>
          <Animated.View style={{ transform: [{ scale: logoAnimation }] }}>
            <Ionicons name="car" size={100} color="#4285F4" style={styles.icon} />
          </Animated.View>
        </TouchableOpacity>
        
        <Text style={styles.title}>Welcome to Juno</Text>
        <Text style={styles.subtitle}>Your rideshare companion</Text>
        
        {/* Developer hint */}
        {tapCount > 0 && tapCount < 5 && (
          <Text style={styles.hintText}>
            {5 - tapCount} more taps...
          </Text>
        )}
        
        {/* Quick Test Button - Only shown after secret tap */}
        {showQuickTest && (
          <>
            <TouchableOpacity style={styles.devButton} onPress={quickTest}>
              <Ionicons name="flash" size={20} color="white" />
              <Text style={styles.devButtonText}>🔧 Dev Quick Login</Text>
            </TouchableOpacity>
            <Text style={styles.orText}>or</Text>
          </>
        )}
        
        {/* Google OAuth Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleGoogleLogin}>
          <Ionicons name="logo-google" size={24} color="white" />
          <Text style={styles.loginButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>or paste your token</Text>

        {/* Token Input */}
        <TextInput
          style={styles.tokenInput}
          placeholder="Paste JWT token here..."
          placeholderTextColor="#666"
          value={token}
          onChangeText={setToken}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={[styles.tokenButton, { opacity: token.trim() ? 1 : 0.5 }]} 
          onPress={handleTokenLogin}
          disabled={!token.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.tokenButtonText}>Login with Token</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark theme like your other screens
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    width: '100%',
  },
  icon: {
    marginBottom: 30,
    textShadowColor: 'rgba(66, 133, 244, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff', // White text for dark theme
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa', // Light gray for subtitle
    textAlign: 'center',
    marginBottom: 30,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  devButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  orText: {
    color: '#666',
    fontSize: 14,
    marginVertical: 15,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  tokenInput: {
    width: '100%',
    backgroundColor: '#1e1e1e', // Darker input for dark theme
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    marginBottom: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff', // White text
  },
  tokenButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tokenButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;