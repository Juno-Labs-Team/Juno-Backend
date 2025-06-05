import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import apiService from './api';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'juno_auth_token';
const USER_KEY = 'juno_user_data';

const BACKEND_AUTH_URL = 'http://localhost:8080/auth/google'; // Update for local development

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

  // Google OAuth Login - Updated for web and mobile
  async loginWithGoogle() {
    try {
      console.log('Starting Google OAuth...');
      
      // Check if we're on web or mobile
      if (typeof window !== 'undefined' && window.opener !== undefined) {
        // Web platform - use popup
        return this.loginWithGoogleWeb();
      } else {
        // Mobile platform - use WebBrowser
        return this.loginWithGoogleMobile();
      }
    } catch (error) {
      console.error('OAuth error:', error);
      return { success: false, error: error.message };
    }
  }

  async loginWithGoogleWeb() {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        BACKEND_AUTH_URL,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Authentication cancelled'));
        }
      }, 1000);

      const handleMessage = (event) => {
        if (event.origin !== 'http://localhost:8080') return;
        
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', handleMessage);

        if (event.data.success) {
          this.saveAuthData(event.data.token, event.data.user).then(() => {
            resolve({ success: true, user: event.data.user });
          });
        } else {
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', handleMessage);
    });
  }

  async loginWithGoogleMobile() {
    const result = await WebBrowser.openAuthSessionAsync(
      BACKEND_AUTH_URL,
      'exp://127.0.0.1:8081'
    );

    if (result.type === 'success') {
      console.log('OAuth result:', result);
      return await this.handleOAuthCallback(result.url);
    } else {
      return { success: false, error: 'OAuth cancelled' };
    }
  }

  // Sign up method
  async signUp(userData) {
    try {
      const response = await fetch('http://localhost:8080/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        await this.saveAuthData(data.token, data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Sign up failed' };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Network error. Please try again.' };
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
    try {
      // For mobile, we might need to extract token from URL or make additional API call
      console.log('Handling OAuth callback:', url);
      
      // If your backend redirects with token in URL
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const token = urlParams.get('token');
      
      if (token) {
        const user = await this.getUserFromToken(token);
        await this.saveAuthData(token, user);
        return { success: true, user };
      }
      
      return { success: false, error: 'No token received from OAuth' };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserFromToken(token) {
    try {
      apiService.setAuthToken(token);
      const response = await apiService.getProfile();
      return response.profile || response.user;
    } catch (error) {
      console.error('Error getting user from token:', error);
      throw error;
    }
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