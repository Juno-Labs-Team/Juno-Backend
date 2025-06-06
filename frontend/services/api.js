import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8080' 
  : 'https://juno-backend-6eamg.ondigitalocean.app';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  async getAuthToken() {
    if (this.authToken) return this.authToken;
    return await AsyncStorage.getItem('authToken');
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

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth methods
  async login() {
    // For OAuth, redirect to backend
    const authUrl = `${this.baseURL}/auth/google`;
    return authUrl;
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
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

  async getNearbyRides() {
    return this.request('/api/rides/nearby');
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