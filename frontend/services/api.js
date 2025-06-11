import AsyncStorage from '@react-native-async-storage/async-storage';

// Production-ready API URL detection
const getApiBaseUrl = () => {
  // Always use your deployed backend
  return 'https://juno-backend-587837548118.us-east4.run.app';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🌐 Frontend API Base URL:', API_BASE_URL);

class ApiClient {
  constructor() {
    this.baseURL = getApiBaseUrl();
    this.authToken = null;
  }

  async getAuthToken() {
    if (!this.authToken) {
      try {
        this.authToken = await AsyncStorage.getItem('authToken');
      } catch (error) {
        console.error('Failed to get auth token from storage:', error);
        return null;
      }
    }
    return this.authToken;
  }

  setAuthToken(token) {
    this.authToken = token;
    console.log('🔑 API Client token set:', token ? 'YES' : 'NO');
  }

  async request(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Request includes auth token');
    } else {
      console.log('⚠️ No auth token for request');
    }

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
      console.log(`✅ [${options.method || 'GET'}] Success:`, result);
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
      console.log('✅ API logout successful:', result);
      return result;
    } catch (error) {
      console.log('⚠️ API logout failed:', error.message);
      // Don't throw error - local logout will still work
      return { 
        success: true, 
        message: 'Logged out locally (server unreachable)',
        localOnly: true 
      };
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

  async getFriendRequests() {
    return this.request('/api/friends/requests');
  }

  // Rides methods
  async getRides() {
    try {
      const result = await this.request('/api/rides');
      // Your backend returns { rides: [...], count: 2, message: "..." }
      return result.rides || [];
    } catch (error) {
      console.error('Failed to get rides:', error);
      return [];
    }
  }

  async createRide(rideData) {
    // Transform frontend data to match your backend schema
    const backendData = {
      origin_address: rideData.origin?.address || rideData.origin,
      destination_address: rideData.destination?.address || rideData.destination,
      departure_time: rideData.departureTime,
      max_passengers: rideData.maxPassengers,
      price_per_seat: rideData.pricePerSeat,
      description: rideData.description,
      origin_lat: rideData.origin?.lat,
      origin_lng: rideData.origin?.lng,
      destination_lat: rideData.destination?.lat,
      destination_lng: rideData.destination?.lng,
      only_friends: rideData.onlyFriends || false,
      school_related: rideData.schoolRelated || false,
    };
    
    return this.request('/api/rides', {
      method: 'POST',
      body: JSON.stringify(backendData),
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
      method: 'DELETE',  // Your backend expects DELETE, not POST
    });
  }

  async cancelRide(rideId) {
    return this.request(`/api/rides/${rideId}/cancel`, {
      method: 'POST',
    });
  }

  // Location methods (for future)
  async searchLocations(query) {
    // Placeholder for location search
    return { locations: [] };
  }

  async getSavedLocations() {
    // Placeholder for saved locations
    return { locations: [] };
  }

  async saveLocation(locationData) {
    // Placeholder for save location
    return { success: true };
  }
}

const apiClient = new ApiClient();
export default apiClient;