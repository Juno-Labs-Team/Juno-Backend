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
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkIfOnboardingNeeded = (userData) => {
    console.log('🔍 Checking onboarding for user:', userData);
    
    // Your backend returns different field names
    const hasBasicInfo = userData.firstName && userData.lastName && userData.username;
    const hasSchoolInfo = userData.school && userData.classYear;
    
    // Check if backend says onboarding is complete
    if (userData.onboardingCompleted) {
      return false;
    }
    
    // Determine onboarding step based on missing data
    if (!hasBasicInfo) {
      setOnboardingStep(1);
      return true;
    } else if (!hasSchoolInfo) {
      setOnboardingStep(2);
      return true;
    }
    
    return false;
  };

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('🔍 Checking auth status, token exists:', !!token);
      
      if (token) {
        ApiClient.setAuthToken(token);
        const response = await ApiClient.getProfile();
        const userData = response.profile || response; // Handle both formats
        
        console.log('✅ Profile loaded:', userData.username);
        setUser(userData);

        // Check if user needs onboarding
        const needsOnboarding = checkIfOnboardingNeeded(userData);
        setNeedsOnboarding(needsOnboarding);
        
        if (needsOnboarding) {
          console.log('👋 User needs onboarding, step:', onboardingStep);
        } else {
          console.log('✅ User onboarding complete');
          setOnboardingStep(0);
        }
      }
    } catch (error) {
      console.log('❌ Auth check failed:', error);
      await AsyncStorage.removeItem('authToken');
      ApiClient.setAuthToken(null);
      setUser(null);
      setNeedsOnboarding(false);
      setOnboardingStep(0);
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (token) => {
    try {
      console.log('🔑 Logging in with token...', token.substring(0, 20) + '...');
      
      // Set the token first
      await AsyncStorage.setItem('authToken', token);
      ApiClient.setAuthToken(token);
      
      console.log('🌐 Making profile request to verify token...');
      
      // Try to get profile to verify token works
      const response = await ApiClient.getProfile();
      console.log('✅ Profile response:', response);
      
      const userData = response.profile || response;
      
      if (!userData) {
        throw new Error('No user data received');
      }
      
      setUser(userData);
      
      // Check if user needs onboarding
      const needsOnboarding = checkIfOnboardingNeeded(userData);
      setNeedsOnboarding(needsOnboarding);
      
      if (needsOnboarding) {
        console.log('👋 New user needs onboarding, step:', onboardingStep);
      } else {
        console.log('✅ User onboarding complete');
        setOnboardingStep(0);
      }
      
      console.log('✅ Login successful:', userData.username);
      return { success: true, user: userData };
      
    } catch (error) {
      console.error('❌ Token login failed:', error);
      
      // Clear invalid token
      await AsyncStorage.removeItem('authToken');
      ApiClient.setAuthToken(null);
      
      return { success: false, error: error.message };
    }
  };

  const login = async () => {
    try {
      const authUrl = 'https://juno-backend-587837548118.us-east4.run.app/auth/google';
      
      if (Platform.OS === 'web') {
        window.open(authUrl, '_blank');
        return { 
          success: false, 
          message: 'A new tab has opened. Copy the JWT token from there and paste it in Dev Mode below.' 
        };
      } else {
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
    console.log('🚪 Starting complete logout process...');
    
    try {
      // Step 1: Clear local state IMMEDIATELY (user loses access instantly)
      setUser(null);
      setNeedsOnboarding(false);
      setOnboardingStep(0);
      
      // Step 2: Clear all stored authentication data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('onboardingComplete');
      await AsyncStorage.removeItem('profileData');
      
      // Step 3: Clear API client token
      ApiClient.setAuthToken(null);
      
      console.log('✅ Local state cleared - user is now logged out');
      
      // Step 4: Try to notify server (optional - graceful if it fails)
      try {
        const result = await ApiClient.logout();
        console.log('✅ Server logout successful:', result.message);
      } catch (serverError) {
        console.log('⚠️ Server logout failed (but local logout succeeded):', serverError.message);
        // Don't throw - local logout is sufficient
      }
      
      console.log('🎉 Complete logout process finished');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Force clear everything even if there's an error
      setUser(null);
      setNeedsOnboarding(false);
      setOnboardingStep(0);
      
      try {
        await AsyncStorage.clear();
        ApiClient.setAuthToken(null);
      } catch (forceError) {
        console.error('❌ Force clear failed:', forceError);
      }
      
      console.log('🔄 Emergency logout completed');
    }
  };

  const completeOnboarding = async () => {
    console.log('✅ Marking onboarding as complete');
    setNeedsOnboarding(false);
    setOnboardingStep(0);
    
    // Refresh user data to get updated profile
    try {
      const response = await ApiClient.getProfile();
      setUser(response.profile);
    } catch (error) {
      console.error('Failed to refresh profile after onboarding:', error);
    }
  };

  const updateOnboardingStep = (step) => {
    setOnboardingStep(step);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithToken,
      logout,
      loading,
      needsOnboarding,
      onboardingStep,
      completeOnboarding,
      updateOnboardingStep,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};