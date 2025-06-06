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
      if (token) {
        // Set the token in API client
        ApiClient.setAuthToken(token);
        const profile = await ApiClient.getProfile();
        setUser(profile.profile);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      await AsyncStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (token) => {
    try {
      // Store the token
      await AsyncStorage.setItem('authToken', token);
      
      // Set it in the API client
      ApiClient.setAuthToken(token);
      
      // Get user profile
      const profile = await ApiClient.getProfile();
      setUser(profile.profile);
      
      return { success: true, user: profile.profile };
    } catch (error) {
      console.error('Token login failed:', error);
      await AsyncStorage.removeItem('authToken');
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
          message: 'Please copy the JWT token from the new tab and paste it in the login form.' 
        };
      } else {
        // For mobile
        const result = await WebBrowser.openAuthSessionAsync(authUrl, 'exp://');
        
        if (result.type === 'success') {
          // Handle callback URL parsing here if needed
          console.log('Auth result:', result);
          return { 
            success: false, 
            message: 'Please copy the JWT token and paste it in the login form.' 
          };
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await ApiClient.logout();
      await AsyncStorage.removeItem('authToken');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      await AsyncStorage.removeItem('authToken');
      setUser(null);
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