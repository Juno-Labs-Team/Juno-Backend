import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import ApiClient from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('🔍 Checking auth status, token exists:', !!token);
      
      if (token) {
        // Set the token in API client
        ApiClient.setAuthToken(token);
        const profile = await ApiClient.getProfile();
        console.log('✅ Profile loaded:', profile.profile.username);
        setUser(profile.profile);
      }
    } catch (error) {
      console.log('❌ Auth check failed:', error);
      await AsyncStorage.removeItem('authToken');
      ApiClient.setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (token) => {
    try {
      console.log('🔑 Logging in with token...');
      
      // Store the token
      await AsyncStorage.setItem('authToken', token);
      
      // Set it in the API client
      ApiClient.setAuthToken(token);
      
      // Get user profile
      const profile = await ApiClient.getProfile();
      setUser(profile.profile);
      
      console.log('✅ Login successful:', profile.profile.username);
      return { success: true, user: profile.profile };
    } catch (error) {
      console.error('❌ Token login failed:', error);
      await AsyncStorage.removeItem('authToken');
      ApiClient.setAuthToken(null);
      return { success: false, error: error.message };
    }
  };

  const login = async () => {
    try {
      const authUrl = 'https://juno-backend-6eamg.ondigitalocean.app/auth/google';
      
      if (Platform.OS === 'web') {
        // For web, open in new tab
        window.open(authUrl, '_blank');
        return { 
          success: false, 
          message: 'A new tab has opened. Copy the JWT token from there and paste it in Dev Mode below.' 
        };
      } else {
        // For mobile
        const result = await WebBrowser.openAuthSessionAsync(authUrl, 'exp://');
        
        if (result.type === 'success') {
          return { 
            success: false, 
            message: 'Please copy the JWT token from the browser and paste it in Dev Mode below.' 
          };
        } else {
          return { 
            success: false, 
            message: 'Login was cancelled. Please try again or use Dev Mode with a token.' 
          };
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Login failed. Please enable Dev Mode and paste your token manually.'
      };
    }
  };

  const logout = async () => {
    console.log('🚪 Starting logout process...');
    
    try {
      // Always clear local state first (immediate logout)
      setUser(null);
      await AsyncStorage.removeItem('authToken');
      ApiClient.setAuthToken(null);
      
      console.log('✅ Local logout completed');
      
      // Then try API logout (but don't fail if it doesn't work)
      try {
        await ApiClient.logout();
        console.log('✅ API logout successful');
      } catch (apiError) {
        console.log('⚠️ API logout failed, but user is already logged out locally:', apiError.message);
      }
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Force clear everything even if there's an error
      setUser(null);
      try {
        await AsyncStorage.removeItem('authToken');
        ApiClient.setAuthToken(null);
      } catch (forceError) {
        console.error('❌ Force logout failed:', forceError);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithToken,
      logout,
      loading,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};