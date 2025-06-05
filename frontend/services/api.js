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
    return this.makeRequest('/profile');
  }

  async updateProfile(profileData) {
    return this.makeRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Ride Management
  async getRides() {
    return this.makeRequest('/rides');
  }

  async createRide(rideData) {
    return this.makeRequest('/rides', {
      method: 'POST',
      body: JSON.stringify(rideData),
    });
  }

  async searchNearbyRides(lat, lng, radius = 10) {
    return this.makeRequest(`/rides/nearby?pickup_lat=${lat}&pickup_lng=${lng}&radius=${radius}`);
  }

  async joinRide(rideId) {
    return this.makeRequest(`/rides/${rideId}/join`, {
      method: 'POST',
    });
  }

  // Friends Management
  async searchUsers(query) {
    return this.makeRequest(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async getFriends() {
    return this.makeRequest('/friends');
  }

  async sendFriendRequest(userId) {
    return this.makeRequest(`/friends/request/${userId}`, {
      method: 'POST',
    });
  }

  // Google Maps Integration
  async geocodeAddress(address) {
    return this.makeRequest(`/maps/geocode?address=${encodeURIComponent(address)}`);
  }
}

export default new ApiService();