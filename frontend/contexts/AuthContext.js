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
    // If backend explicitly says onboarding is complete, trust it
    if (userData.onboardingCompleted === true) {
      return false;
    }
    
    // Check for missing essential fields
    const hasBasicInfo = userData.firstName && userData.lastName && userData.username;
    const hasSchoolInfo = userData.school && userData.classYear;
    
    // Determine onboarding step
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
        const userData = response.profile;
        
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
      console.log('🔑 Logging in with token...');
      
      await AsyncStorage.setItem('authToken', token);
      ApiClient.setAuthToken(token);
      
      const response = await ApiClient.getProfile();
      const userData = response.profile;
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
      await AsyncStorage.removeItem('authToken');
      ApiClient.setAuthToken(null);
      return { success: false, error: error.message };
    }
  };

  const login = async () => {
    try {
      const authUrl = 'https://juno-backend-6eamg.ondigitalocean.app/auth/google';
      
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
    console.log('🚪 Starting logout process...');
    
    try {
      // Step 1: Clear local state immediately
      setUser(null);
      setNeedsOnboarding(false);
      setOnboardingStep(0);
      
      // Step 2: Clear stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('onboardingComplete');
      await AsyncStorage.removeItem('profileData');
      
      // Step 3: Clear API client token
      ApiClient.setAuthToken(null);
      
      console.log('✅ Local logout completed');
      
      // Step 4: Try API logout (but don't fail if this fails)
      try {
        await ApiClient.logout();
        console.log('✅ API logout successful');
      } catch (apiError) {
        console.log('⚠️ API logout failed, but user is logged out locally:', apiError.message);
      }
      
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
        console.error('❌ Force logout failed:', forceError);
      }
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