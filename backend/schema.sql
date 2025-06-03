CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Made optional for Google OAuth users
  google_id VARCHAR(100) UNIQUE, -- Add this for Google OAuth
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Friends table (many-to-many relationship)
CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id)
);

-- Rides table
CREATE TABLE rides (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  pickup_location VARCHAR(255) NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  destination VARCHAR(255) NOT NULL,
  destination_latitude DECIMAL(10, 8),
  destination_longitude DECIMAL(11, 8),
  departure_time TIMESTAMP NOT NULL,
  max_passengers INTEGER DEFAULT 4,
  current_passengers INTEGER DEFAULT 0,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50), -- weekly, daily, etc.
  status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ride participants table
CREATE TABLE ride_participants (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'joined', -- joined, requested, declined
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ride_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_departure_time ON rides(departure_time);
CREATE INDEX idx_ride_participants_ride_id ON ride_participants(ride_id);
CREATE INDEX idx_ride_participants_user_id ON ride_participants(user_id);