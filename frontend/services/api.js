import AsyncStorage from '@react-native-async-storage/async-storage';

// Fix the API URL detection
const API_BASE_URL = (() => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Running in web development
    return 'https://juno-backend-6eamg.ondigitalocean.app';
  } else if (__DEV__) {
    // Running in Expo development
    return 'https://juno-backend-6eamg.ondigitalocean.app';
  } else {
    // Production build
    return 'https://juno-backend-6eamg.ondigitalocean.app';
  }
})();

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.authToken = null;
    console.log('🔗 API Base URL:', this.baseURL); // Debug log
  }

  setAuthToken(token) {
    this.authToken = token;
    console.log('🔑 Token set:', token ? 'Yes' : 'No'); // Debug log
  }

  async getAuthToken() {
    if (this.authToken) return this.authToken;
    const token = await AsyncStorage.getItem('authToken');
    console.log('🔍 Retrieved token from storage:', token ? 'Yes' : 'No'); // Debug log
    return token;
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
    console.log('🌐 Making request to:', fullUrl); // Debug log

    try {
      const response = await fetch(fullUrl, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || `HTTP ${response.status}` };
        }
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ API Success:', endpoint, result); // Debug log
      return result;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
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
    console.log('🚪 Logging out...');
    try {
      const result = await this.request('/auth/logout', { method: 'POST' });
      console.log('✅ Logout successful');
      return result;
    } catch (error) {
      console.log('⚠️ Logout API failed, but clearing local data anyway');
      // Don't throw error - still clear local state
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

  async getFriendRequests() {
    return this.request('/api/friends/requests');
  }

  async sendFriendRequest(friendId) {
    return this.request(`/api/friends/request/${friendId}`, {
      method: 'POST',
    });
  }

  async acceptFriendRequest(friendshipId) {
    return this.request(`/api/friends/accept/${friendshipId}`, {
      method: 'POST',
    });
  }

  async searchUsers(query) {
    return this.request(`/api/users/search?q=${encodeURIComponent(query)}`);
  }

  // Rides methods
  async getRides() {
    return this.request('/api/rides');
  }

  async createRide(rideData) {
    return this.request('/api/rides', {
      method: 'POST',
      body: JSON.stringify(rideData),
    });
  }

  async joinRide(rideId) {
    return this.request(`/api/rides/${rideId}/join`, {
      method: 'POST',
    });
  }

  async getNearbyRides(lat, lng, radius = 10) {
    return this.request(`/api/rides/nearby?pickup_lat=${lat}&pickup_lng=${lng}&radius=${radius}`);
  }

  // Notifications methods
  async getNotifications() {
    return this.request('/api/notifications');
  }

  async markNotificationRead(notificationId) {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }
}

export default new ApiClient();