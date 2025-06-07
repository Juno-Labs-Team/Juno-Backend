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
    console.log('🌐 Making request to:', fullUrl);

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
      console.log('✅ API Response:', result);
      return result;
    } catch (error) {
      console.error('❌ API Request failed:', error);
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

  async searchRides(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/rides/search?${params}`);
  }

  // Location-related methods
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

  async getNearbyRides(latitude, longitude, radius = 10) {
    return this.request(`/api/maps/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`);
  }

  async calculateDistance(origin, destination) {
    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`
    });
    return this.request(`/api/maps/distance?${params}`);
  }

  // Upload methods
  async uploadImage(imageUri, type = 'profile') {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `${type}.jpg`,
      });

      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseURL}/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;