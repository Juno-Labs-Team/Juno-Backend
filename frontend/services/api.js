import AsyncStorage from '@react-native-async-storage/async-storage';

// Production-ready API URL detection
const API_BASE_URL = (() => {
  // Check for environment variable first (production)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Web browser detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production domains
    if (hostname.includes('ondigitalocean.app') || 
        hostname.includes('juno-frontend') ||
        hostname !== 'localhost') {
      return 'https://juno-backend-6eamg.ondigitalocean.app';
    }
  }
  
  // Default to production API
  return 'https://juno-backend-6eamg.ondigitalocean.app';
})();

console.log('🌐 Frontend API Base URL:', API_BASE_URL);

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  async getAuthToken() {
    if (this.authToken) {
      return this.authToken;
    }
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.authToken = token;
        return token;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    
    return null;
  }

  async request(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const fullUrl = `${this.baseURL}${endpoint}`;
    console.log(`🌐 [${options.method || 'GET'}] ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          console.log('🔑 Token expired, clearing auth state');
          await AsyncStorage.removeItem('authToken');
          this.authToken = null;
          throw new Error('Authentication expired. Please login again.');
        }
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || `HTTP ${response.status}` };
        }
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ [${options.method || 'GET'}] Success`);
      return result;
    } catch (error) {
      console.error(`❌ [${options.method || 'GET'}] ${fullUrl} failed:`, error.message);
      throw error;
    }
  }

  // Auth methods
  async login() {
    const authUrl = `${this.baseURL}/auth/google`;
    console.log('🔗 Auth URL:', authUrl);
    return authUrl;
  }

  async logout() {
    console.log('🚪 API logout request...');
    try {
      const result = await this.request('/auth/logout', { method: 'POST' });
      console.log('✅ API logout successful');
      return result;
    } catch (error) {
      console.log('⚠️ API logout failed (server might be down):', error.message);
      // Don't throw error - local logout will still work
      return { success: true };
    }
  }

  // Profile methods
  async getProfile() {
    return this.request('/api/profile');
  }

  async updateProfile(profileData) {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Friends methods
  async getFriends() {
    return this.request('/api/friends');
  }

  async addFriend(userId) {
    return this.request('/api/friends', {
      method: 'POST',
      body: JSON.stringify({ friendId: userId }),
    });
  }

  async addFriendByUsername(username) {
    return this.request('/api/friends/username', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async searchUsers(query) {
    return this.request(`/api/users/search?q=${encodeURIComponent(query)}`);
  }

  // Rides methods
  async getRides() {
    try {
      const result = await this.request('/api/rides');
      return result.rides || [];
    } catch (error) {
      console.error('Failed to get rides:', error);
      return [];
    }
  }

  async createRide(rideData) {
    return this.request('/api/rides', {
      method: 'POST',
      body: JSON.stringify(rideData),
    });
  }

  async getRideDetails(rideId) {
    return this.request(`/api/rides/${rideId}`);
  }

  async joinRide(rideId) {
    return this.request(`/api/rides/${rideId}/join`, {
      method: 'POST',
    });
  }

  async leaveRide(rideId) {
    return this.request(`/api/rides/${rideId}/leave`, {
      method: 'POST',
    });
  }

  // Location methods
  async searchLocations(query) {
    return this.request(`/api/maps/geocode?address=${encodeURIComponent(query)}`);
  }

  async getSavedLocations() {
    return this.request('/api/locations');
  }

  async saveLocation(locationData) {
    return this.request('/api/locations', {
      method: 'POST',
      body: JSON.stringify(locationData)
    });
  }

  async deleteLocation(locationId) {
    return this.request(`/api/locations/${locationId}`, {
      method: 'DELETE'
    });
  }
}

const apiClient = new ApiClient();
export default apiClient;