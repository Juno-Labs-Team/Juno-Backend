const BASE_URL = 'https://juno-backend-6eamg.ondigitalocean.app/api';

class ApiService {
  constructor() {
    this.token = null;
  }

  setAuthToken(token) {
    this.token = token;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`API Request: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error.message);
      throw error;
    }
  }

  // Profile Management
  async getProfile() {
    return this.makeRequest('/api/profile'); // Add /api prefix
  }

  async updateProfile(profileData) {
    return this.makeRequest('/api/profile', { // Add /api prefix
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Ride Management
  async getRides() {
    return this.makeRequest('/api/rides'); // Add /api prefix
  }

  async createRide(rideData) {
    return this.makeRequest('/api/rides', { // Add /api prefix
      method: 'POST',
      body: JSON.stringify(rideData),
    });
  }

  async joinRide(rideId) {
    return this.makeRequest(`/api/rides/${rideId}/join`, { // Add /api prefix
      method: 'POST',
    });
  }

  // Friends Management
  async searchUsers(query) {
    return this.makeRequest(`/api/users/search?q=${encodeURIComponent(query)}`); // Add /api prefix
  }

  async getFriends() {
    return this.makeRequest('/api/friends'); // Add /api prefix
  }

  async sendFriendRequest(userId) {
    return this.makeRequest(`/api/friends/request/${userId}`, { // Add /api prefix
      method: 'POST',
    });
  }

  // Google Maps Integration
  async geocodeAddress(address) {
    return this.makeRequest(`/maps/geocode?address=${encodeURIComponent(address)}`);
  }
}

export default new ApiService();