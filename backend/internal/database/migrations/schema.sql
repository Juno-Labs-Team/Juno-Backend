-- Users table (main authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    google_id VARCHAR(100) UNIQUE, -- Essential for Google OAuth
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    profile_picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table (extended information)
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school VARCHAR(255),
    class_year VARCHAR(50),
    major VARCHAR(255),
    has_car BOOLEAN DEFAULT FALSE,
    car_make VARCHAR(100),
    car_model VARCHAR(100),
    car_color VARCHAR(50),
    max_passengers INTEGER DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Friendships table
CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

-- Rides table (with Google Maps coordinates)
CREATE TABLE rides (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    pickup_location VARCHAR(255) NOT NULL,
    pickup_latitude DECIMAL(10, 8), -- For Google Maps
    pickup_longitude DECIMAL(11, 8), -- For Google Maps
    destination VARCHAR(255) NOT NULL,
    destination_latitude DECIMAL(10, 8), -- For Google Maps
    destination_longitude DECIMAL(11, 8), -- For Google Maps
    departure_time TIMESTAMP NOT NULL,
    max_passengers INTEGER NOT NULL DEFAULT 4,
    current_passengers INTEGER DEFAULT 0,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ride requests table (for passengers joining rides)
CREATE TABLE ride_requests (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
    passenger_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, passenger_id)
);

-- Notifications table (NEW - for ride updates, friend requests)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- ride_request, ride_update, friend_request
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Popular locations table (NEW - for common destinations)
CREATE TABLE popular_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_type VARCHAR(50), -- school, mall, restaurant, etc
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add performance indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_departure_time ON rides(departure_time);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_ride_requests_ride_id ON ride_requests(ride_id);
CREATE INDEX idx_ride_requests_passenger_id ON ride_requests(passenger_id);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Insert common Freehold area locations for easy testing
INSERT INTO popular_locations (name, address, latitude, longitude, location_type) VALUES
('Freehold Township High School', 'Freehold Township High School, Freehold, NJ', 40.2677, -74.2682, 'school'),
('Monmouth Mall', 'Monmouth Mall, Eatontown, NJ', 40.2962, -74.0454, 'mall'),
('Rutgers University', 'Rutgers University, New Brunswick, NJ', 40.5008, -74.4474, 'school'),
('Six Flags Great Adventure', 'Six Flags Great Adventure, Jackson, NJ', 40.1465, -74.4416, 'entertainment'),
('Freehold Raceway Mall', 'Freehold Raceway Mall, Freehold, NJ', 40.2590, -74.2973, 'mall');