import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import apiService from './api';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'juno_auth_token';
const USER_KEY = 'juno_user_data';

const BACKEND_AUTH_URL = 'https://juno-backend-6eamg.ondigitalocean.app/auth/google';

class AuthService {
  constructor() {
    this.user = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    const token = await this.getStoredToken();
    if (token) {
      apiService.setAuthToken(token);
      this.user = await this.getStoredUser();
    }
  }

  // Google OAuth Login
  async loginWithGoogle() {
    try {
      console.log('Starting Google OAuth...');
      
      // Open browser to your backend's Google OAuth endpoint
      const result = await WebBrowser.openAuthSessionAsync(
        BACKEND_AUTH_URL,
        'exp://127.0.0.1:8081' // Expo redirect scheme
      );

      if (result.type === 'success') {
        // Extract token from the result URL if your backend redirects with it
        // For now, we'll use a different approach since your backend redirects to JSON
        console.log('OAuth result:', result);
        
        // For production OAuth, you might need to modify your backend to handle mobile redirects
        // For now, let's implement a workaround
        return await this.handleOAuthCallback(result.url);
      } else {
        return { success: false, error: 'OAuth cancelled' };
      }
    } catch (error) {
      console.error('OAuth error:', error);
      return { success: false, error: error.message };
    }
  }

  // Manual token login (for development/testing)
  async loginWithToken(token) {
    try {
      apiService.setAuthToken(token);
      const response = await apiService.getProfile();
      
      if (response.profile) {
        await this.saveAuthData(token, response.profile);
        return { success: true, user: response.profile };
      }
      
      return { success: false, error: 'Invalid token' };
    } catch (error) {
      console.error('Token login error:', error);
      return { success: false, error: error.message };
    }
  }

  async handleOAuthCallback(url) {
    // This would parse the callback URL for tokens
    // Implementation depends on how your backend handles mobile redirects
    console.log('Handling OAuth callback:', url);
    return { success: false, error: 'OAuth callback handling not implemented' };
  }

  async saveAuthData(token, user) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      apiService.setAuthToken(token);
      this.user = user;
      return true;
    } catch (error) {
      console.error('Error saving auth data:', error);
      return false;
    }
  }

  async getStoredToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  async getStoredUser() {
    try {
      const userData = await SecureStore.getItemAsync(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async logout() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      apiService.setAuthToken(null);
      this.user = null;
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }

  async isAuthenticated() {
    const token = await this.getStoredToken();
    return !!token;
  }

  getCurrentUser() {
    return this.user;
  }
}

export default new AuthService();