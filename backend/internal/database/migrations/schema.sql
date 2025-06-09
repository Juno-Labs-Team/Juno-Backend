-- Now apply the clean schema
-- Users table (core user information)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_picture_url TEXT,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'google_oauth',
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles (extended user information)
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    school VARCHAR(255) DEFAULT 'Freehold High School',
    class_year VARCHAR(10),
    major VARCHAR(255),
    bio TEXT,
    has_car BOOLEAN DEFAULT FALSE,
    car_make VARCHAR(100),
    car_model VARCHAR(100),
    car_color VARCHAR(50),
    car_year INTEGER,
    license_plate VARCHAR(20),
    max_passengers INTEGER DEFAULT 4 CHECK (max_passengers >= 1 AND max_passengers <= 8),
    driving_experience_years INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_rides_given INTEGER DEFAULT 0,
    total_rides_taken INTEGER DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMP NULL,
    onboarding_step INTEGER DEFAULT 0,
    UNIQUE(user_id)
);

-- Friendships table
CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked', 'declined')),
    requested_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id),
    CHECK (user_id <> friend_id)
);

-- Schools table
CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rides table (removed duplicate car fields - will reference user_profiles)
CREATE TABLE rides (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    origin_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    origin_lat DECIMAL(10, 8),
    origin_lng DECIMAL(11, 8),
    destination_lat DECIMAL(10, 8),
    destination_lng DECIMAL(11, 8),
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP,
    max_passengers INTEGER NOT NULL CHECK (max_passengers >= 1 AND max_passengers <= 8),
    current_passengers INTEGER DEFAULT 0,
    price_per_seat DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'full', 'completed', 'cancelled')),
    ride_type VARCHAR(20) DEFAULT 'one_time' CHECK (ride_type IN ('one_time', 'recurring')),
    recurring_pattern JSONB,
    school_related BOOLEAN DEFAULT TRUE,
    only_friends BOOLEAN DEFAULT FALSE,
    auto_accept BOOLEAN DEFAULT FALSE,
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ride passengers table
CREATE TABLE ride_passengers (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE,
    passenger_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'declined', 'cancelled', 'completed')),
    seat_number INTEGER,
    pickup_location TEXT,
    dropoff_location TEXT,
    pickup_lat DECIMAL(10, 8),
    pickup_lng DECIMAL(11, 8),
    dropoff_lat DECIMAL(10, 8),
    dropoff_lng DECIMAL(11, 8),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    amount_paid DECIMAL(10, 2) DEFAULT 0.00,
    rating_given INTEGER CHECK (rating_given >= 1 AND rating_given <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, passenger_id)
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('friend_request', 'ride_request', 'ride_accepted', 'ride_declined', 'ride_cancelled', 'ride_reminder', 'system', 'payment')),
    related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    related_ride_id INTEGER REFERENCES rides(id) ON DELETE SET NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_type VARCHAR(20) NOT NULL CHECK (review_type IN ('driver', 'passenger')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, reviewer_id, reviewee_id)
);

-- Saved locations table
CREATE TABLE saved_locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    location_type VARCHAR(20) DEFAULT 'other' CHECK (location_type IN ('home', 'work', 'school', 'other')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency contacts table
CREATE TABLE emergency_contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ride invitations table
CREATE TABLE ride_invitations (
    id SERIAL PRIMARY KEY,
    ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    UNIQUE(ride_id, recipient_id)
);

-- User badges table
CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL CHECK (badge_type IN ('top_rated', 'elite_rider', 'community_builder', 'safe_driver', 'eco_warrior', 'helpful_passenger')),
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_visible BOOLEAN DEFAULT TRUE
);

-- Track profile completion and onboarding metrics
CREATE TABLE IF NOT EXISTS profile_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    onboarding_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    onboarding_completed_at TIMESTAMP NULL,
    steps_completed JSONB DEFAULT '[]',
    time_to_complete_seconds INTEGER NULL,
    profile_completion_percentage INTEGER DEFAULT 0,
    last_profile_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_profile_analytics_user_id ON profile_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_analytics_completion ON profile_analytics(onboarding_completed_at);

-- Create all indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_school ON user_profiles(school);
CREATE INDEX idx_user_profiles_has_car ON user_profiles(has_car);
CREATE INDEX idx_user_profiles_onboarding ON user_profiles(onboarding_completed, onboarding_step);

CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_requested_by ON friendships(requested_by);

CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_departure_time ON rides(departure_time);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_school_related ON rides(school_related);
CREATE INDEX idx_rides_created_at ON rides(created_at);

CREATE INDEX idx_ride_passengers_ride_id ON ride_passengers(ride_id);
CREATE INDEX idx_ride_passengers_passenger_id ON ride_passengers(passenger_id);
CREATE INDEX idx_ride_passengers_status ON ride_passengers(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_ride_id ON reviews(ride_id);

CREATE INDEX idx_saved_locations_user_id ON saved_locations(user_id);
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX idx_ride_invitations_recipient_id ON ride_invitations(recipient_id);
CREATE INDEX idx_ride_invitations_ride_id ON ride_invitations(ride_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at 
    BEFORE UPDATE ON friendships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at 
    BEFORE UPDATE ON rides 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ride_passengers_updated_at 
    BEFORE UPDATE ON ride_passengers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Passenger count function
CREATE OR REPLACE FUNCTION update_ride_passenger_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
        UPDATE rides 
        SET current_passengers = current_passengers + 1 
        WHERE id = NEW.ride_id;
        
        UPDATE rides 
        SET status = 'full' 
        WHERE id = NEW.ride_id 
            AND current_passengers >= max_passengers
            AND status = 'active';
            
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
            UPDATE rides 
            SET current_passengers = current_passengers + 1 
            WHERE id = NEW.ride_id;
            
            UPDATE rides 
            SET status = 'full' 
            WHERE id = NEW.ride_id 
                AND current_passengers >= max_passengers
                AND status = 'active';
                
        ELSIF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
            UPDATE rides 
            SET current_passengers = GREATEST(0, current_passengers - 1) 
            WHERE id = NEW.ride_id;
            
            UPDATE rides 
            SET status = 'active' 
            WHERE id = NEW.ride_id 
                AND status = 'full' 
                AND current_passengers < max_passengers;
        END IF;
        
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
        UPDATE rides 
        SET current_passengers = GREATEST(0, current_passengers - 1) 
        WHERE id = OLD.ride_id;
        
        UPDATE rides 
        SET status = 'active' 
        WHERE id = OLD.ride_id 
            AND status = 'full' 
            AND current_passengers < max_passengers;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ride_passenger_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ride_passengers
    FOR EACH ROW EXECUTE FUNCTION update_ride_passenger_count();

-- Rating calculation function
CREATE OR REPLACE FUNCTION calculate_user_rating(user_id_param INTEGER)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT COALESCE(AVG(rating::DECIMAL), 0.00)
    INTO avg_rating
    FROM reviews
    WHERE reviewee_id = user_id_param;
    
    UPDATE user_profiles 
    SET rating = avg_rating 
    WHERE user_id = user_id_param;
    
    RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    total_possible INTEGER := 100;
BEGIN
    SELECT 
        CASE WHEN u.first_name IS NOT NULL AND u.first_name != '' THEN 15 ELSE 0 END +
        CASE WHEN u.last_name IS NOT NULL AND u.last_name != '' THEN 15 ELSE 0 END +
        CASE WHEN u.phone IS NOT NULL AND u.phone != '' THEN 10 ELSE 0 END +
        CASE WHEN u.profile_picture_url IS NOT NULL AND u.profile_picture_url != '' THEN 10 ELSE 0 END +
        CASE WHEN up.school IS NOT NULL AND up.school != '' THEN 20 ELSE 0 END +
        CASE WHEN up.class_year IS NOT NULL AND up.class_year != '' THEN 20 ELSE 0 END +
        CASE WHEN up.major IS NOT NULL AND up.major != '' THEN 5 ELSE 0 END +
        CASE WHEN up.bio IS NOT NULL AND up.bio != '' THEN 5 ELSE 0 END
    INTO completion_score
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE u.id = user_id_param;
    
    -- Update analytics table
    INSERT INTO profile_analytics (user_id, profile_completion_percentage, last_profile_update)
    VALUES (user_id_param, COALESCE(completion_score, 0), CURRENT_TIMESTAMP)
    ON CONFLICT (user_id)
    DO UPDATE SET
        profile_completion_percentage = EXCLUDED.profile_completion_percentage,
        last_profile_update = CURRENT_TIMESTAMP;
    
    RETURN COALESCE(completion_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Create views
CREATE VIEW user_friends AS
SELECT 
    f.user_id,
    f.friend_id,
    u.username as friend_username,
    u.first_name as friend_first_name,
    u.last_name as friend_last_name,
    u.profile_picture_url as friend_profile_picture,
    f.status,
    f.created_at
FROM friendships f
JOIN users u ON f.friend_id = u.id
WHERE f.status = 'accepted';

CREATE VIEW active_rides_with_driver AS
SELECT 
    r.*,
    u.first_name as driver_first_name,
    u.last_name as driver_last_name,
    u.profile_picture_url as driver_profile_picture,
    up.rating as driver_rating,
    up.total_rides_given,
    up.has_car,
    up.car_make,
    up.car_model,
    up.car_color,
    up.car_year,
    up.license_plate,
    (r.max_passengers - r.current_passengers) as available_seats
FROM rides r
JOIN users u ON r.driver_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE r.status IN ('active', 'full') 
    AND r.departure_time > CURRENT_TIMESTAMP;

CREATE VIEW user_full_profiles AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.google_id,
    u.first_name,
    u.last_name,
    u.phone,
    u.profile_picture_url,
    u.email_verified,
    u.is_active,
    u.created_at,
    u.updated_at,
    up.school,
    up.class_year,
    up.major,
    up.bio,
    up.has_car,
    up.car_make,
    up.car_model,
    up.car_color,
    up.car_year,
    up.license_plate,
    up.max_passengers,
    up.rating,
    up.total_rides_given,
    up.total_rides_taken,
    up.verification_status
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.is_active = true;

-- Insert initial school data
INSERT INTO schools (name, domain, address, latitude, longitude) VALUES 
    ('Freehold High School', 'frhsd.com', '11 Pine St, Freehold, NJ 07728', 40.2551, -74.2771),
    ('Freehold Township High School', 'frhsd.com', '281 Casino Dr, Freehold, NJ 07728', 40.2298, -74.2551),
    ('Marlboro High School', 'marlboro.k12.nj.us', '1979 Township Dr, Marlboro, NJ 07746', 40.3151, -74.2429);

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

-- Add onboarding tracking columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Update existing users who have complete profiles
UPDATE user_profiles 
SET onboarding_completed = TRUE, 
    onboarding_completed_at = CURRENT_TIMESTAMP,
    onboarding_step = 3
WHERE school IS NOT NULL 
AND school != '' 
AND class_year IS NOT NULL 
AND class_year != '';

-- Create index for faster onboarding queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(onboarding_completed, onboarding_step);

-- Add utility functions for onboarding
CREATE OR REPLACE FUNCTION check_onboarding_complete(user_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    is_complete BOOLEAN := FALSE;
BEGIN
    SELECT 
        CASE 
            WHEN up.onboarding_completed = TRUE THEN TRUE
            WHEN u.first_name IS NOT NULL 
                AND u.last_name IS NOT NULL 
                AND up.school IS NOT NULL 
                AND up.class_year IS NOT NULL 
                AND up.school != '' 
                AND up.class_year != '' THEN TRUE
            ELSE FALSE
        END
    INTO is_complete
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE u.id = user_id_param;
    
    -- Auto-update if conditions are met but flag is false
    IF is_complete = TRUE THEN
        UPDATE user_profiles 
        SET onboarding_completed = TRUE,
            onboarding_completed_at = COALESCE(onboarding_completed_at, CURRENT_TIMESTAMP)
        WHERE user_id = user_id_param 
        AND onboarding_completed = FALSE;
    END IF;
    
    RETURN COALESCE(is_complete, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update onboarding status
CREATE OR REPLACE FUNCTION auto_update_onboarding_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if basic required fields are now complete
    IF NEW.school IS NOT NULL 
        AND NEW.school != '' 
        AND NEW.class_year IS NOT NULL 
        AND NEW.class_year != ''
        AND (OLD.onboarding_completed = FALSE OR OLD.onboarding_completed IS NULL) THEN
        
        NEW.onboarding_completed := TRUE;
        NEW.onboarding_completed_at := CURRENT_TIMESTAMP;
        NEW.onboarding_step := 3;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_onboarding
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_onboarding_status();

