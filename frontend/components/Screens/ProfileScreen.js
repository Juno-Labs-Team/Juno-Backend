import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  ImageBackground,
  TouchableWithoutFeedback,
} from 'react-native';
import userData from '../UserProfile.json'; // Import user data
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { Svg, Defs, RadialGradient, Stop, Rect } from 'react-native-svg'


const ProfileScreen = () => {
  const {
    username,
    firstName,
    lastName,
    profilePic,
    accountCreated,
    classYear,
    school,
    car,
    badges,
    schoolAbreviation,
    numberOfRides,
    averageRating,
    numRatings,
    description,
    userMood,
  } = userData;

  const accountDate = new Date(accountCreated);
  const currentDate = new Date();
  const accountAgeDays = Math.floor(
    (currentDate - accountDate) / (1000 * 60 * 60 * 24)
  );

  const fadeAnim = useState(new Animated.Value(0))[0];



const GradientContainer = ({ children }) => (
  <View style={styles.container}>
    <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="grad" cx="50%" cy="50%" r="100%" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#330033" />  
  <Stop offset="0.6" stopColor="#000022" /> 
  <Stop offset="1" stopColor="#000000" /> 
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grad)" />
    </Svg>
    {children}
  </View>
);
  const badgeData = [
    {
      name: 'Top-Rated',
      icon: 'star',
      description: 'Awarded for maintaining a 5-star rating!',
      color: '#FF007F',
    },
    {
      name: 'Elite Rider',
      icon: 'car-sport',
      description: 'Recognized for completing 100 rides!',
      color: '#03ffd5',
    },
    {
      name: 'Community Builder',
      icon: 'people-circle',
      description: 'Given to those who help others connect!',
      color: '#ff0324',
    },
  ];
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [isBadgeVisible, setIsBadgeVisible] = useState(false);
  const fadeAnimBadge = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

const handleEditProfile = () => {
  navigation.navigate('EditProfile'); // Assuming you're using React Navigation
};
const getEmoji = (mood) => {
  const emojiMap = {
    "chill": "😊",
    "focused": "🚀",
    "creative": "💡",
    "hyped": "🔥",
    "thinking": "🤔",
    "neutral": "😐"
  };
  return emojiMap[mood] || "😎"; // Default to sunglasses emoji
}

  const toggleBadge = (badge) => {
    if (selectedBadge?.name === badge.name) {
      // Close animation
      Animated.timing(fadeAnimBadge, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(heightAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setSelectedBadge(null);
        setIsOverlayVisible(false);
      });
    } else {
      setSelectedBadge(badge);
      setIsOverlayVisible(true);
      // Open animation
      Animated.timing(fadeAnimBadge, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(heightAnim, {
        toValue: 120,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const getContrastingColor = (bgColor) => {
    // Convert hex color to RGB
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate luminance
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;

    return brightness > 150 ? '#000000' : '#FFFFFF'; // Use black for light backgrounds, white for dark
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, // Fully visible
      duration: 500, // Smooth fade-in duration
      useNativeDriver: true,
    }).start();
  }, []);

  return (
      <GradientContainer>
    <View style={styles.container}>
      <View style={styles.gradientOverlay} />
      <ScrollView>
        {/* Header Section */}
        <Animated.View
          style={[styles.header, selectedBadge && styles.expandedHeader]}>
          <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{getEmoji(userMood)}</Text>
            </View>
          <Image source={{ uri: profilePic }} style={styles.profileImage} />

          <View style={styles.userInfo}>
            <Text style={styles.username}>{firstName} {lastName}</Text>
            <Text style={styles.name}>
              {username}
            </Text>
          </View>
          <View style={styles.badgeContainer}>
  {badgeData.map((badge, index) => (
    <TouchableOpacity
      key={index}
      style={[styles.smallBadge, { backgroundColor: badge.color }]}
      onPress={() => toggleBadge(badge)}
    >
      <Ionicons name={badge.icon} size={10} color={getContrastingColor(badge.color)} />
    </TouchableOpacity>
  ))}
</View>
<TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
  <Ionicons name="pencil" size={18} color="#fff" style={styles.icon} />
  <Text style={styles.editButtonText}>Edit Profile</Text>
</TouchableOpacity>
          {/* Badge Description Display */}
          {isOverlayVisible && selectedBadge && (
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
              <View style={styles.overlayContent}>
                <Text style={styles.badgeDescTitle}>{selectedBadge.name}</Text>
                <Text style={styles.badgeDescText}>
                  {selectedBadge.description}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Description Section */}
          <View>
            <Text style={[styles.aboutMe, {textAlign: 'center'}]}>About Me</Text>
          </View>
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              {description.length === 0 ? '' : description}
            </Text>
          </View>

          {/* Badges Inside Header */}
        </Animated.View>

        {/* Profile Info */}
        <Animated.View
          style={[
            styles.infoContainer,
            { opacity: fadeAnim },
            styles.centeredContainer,
          ]}>
          <Text style={styles.sectionTitle}>Profile Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member for:</Text>
            <Text style={styles.infoValue}>{accountAgeDays} days</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>School:</Text>
            <Text style={styles.infoValue}>
              {schoolAbreviation.length == 0 ? school : schoolAbreviation}{' '}
              {classYear}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Number of Rides:</Text>
            <Text style={styles.infoValue}>
              {numberOfRides == '' || numberOfRides == '0'
                ? 'None'
                : numberOfRides}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValueRating}>
              {averageRating == ''
                ? 'N/A'
                : averageRating + `⭐ with ${numRatings} Ratings`}
            </Text>
          </View>
        </Animated.View>
        
        {/*Car Info */}
        <Animated.View style={[styles.carContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Car Details</Text>
          <View style={styles.carCard}>
            <Image source={{ uri: car.picture }} style={styles.carImage} />

            <View>
              <Text style={styles.carText}>
                {car.year} {car.make} {car.model}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
    </GradientContainer>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    padding: 0, // Make sure this isn't restricting the gradient
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundImage:
      'radial-gradient(circle, rgba(255,0,127,0.6) 10%, rgba(98,0,234,0.4) 40%, rgba(0,191,255,0) 90%)',
  },

  header: {
    flexDirection: 'row',
    backgroundColor: '#292929',
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    minHeight: 80, // Ensures baseline size but allows expansion
    flexWrap: 'wrap', // Enables dynamic text wrapping
    opacity: 0.8,
  },

  profileImage: {
    width: 95,
    height: 95,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FF007F',
    shadowOpacity: 0.8,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
  },
  emojiContainer: {
    position: 'absolute',
    top: 30,
    right: 30, // Position next to the settings icon
    zIndex: 10,
  },
  emoji: {
    fontSize: 60, // Large enough to be visible
  },

  description: {
    fontWeight: 'normal',
    textAlign: 'center',
    fontStyle: 'oblique',
    right: 3,
    paddingLeft: 0,
    paddingTop: 192,
    fontSize: 17,
    color: '#D3D3D3',
    maxWidth: 300, // Limits text width properly
    overflow: 'hidden', // Prevents overspill
    flexWrap: 'wrap',
  },

  userInfo: {
    marginLeft: 15,
    flex: 1, // Ensures text uses available space
    flexWrap: 'wrap', // Prevents unnecessary shrinking
    textAlign: 'center', // Centers within header
  },
  username: {
    position: 'absolute',
    top: 105,
    right: 120,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1, // Ensures text uses available space

  },
  name: {
    position: 'absolute',
    top: 130,
    right: 195,
    fontSize: 20,
    color: '#AAAAAA',
    textAlign: 'left',

    
  },
  badgeContainer: {
    position: 'absolute',
    flexDirection: 'row',
    paddingTop: 17,
    justifyContent: 'center',
    left: 25,
    top: 162,
  },

  smallBadge: {
    padding: 4, // Small padding to reduce overall size
    marginHorizontal: 6, // Adjust spacing between badges
    backgroundColor: '#222222',
    borderRadius: 10,
  },
  aboutMe: {
    position: 'absolute',
    fontWeight: 'bold',
    color: "#D3D3D3",
    fontSize: 17,
    top: 255,
    right: 115,
    textAlign: 'center',
    justifyContent: 'center',
    
      },

  overlay: {
    position: 'absolute',
    top: 150, // Ensures it's lower but not blocked
    left: 0,
    right: 0,
    zIndex: 1, // Highest priority to keep it visible
    backgroundColor: 'rgba(0, 0, 0, 1)', // Fully opaque
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  overlayContent: {
    backgroundColor: 'rgba(0, 0, 0, 1)',
    paddingVertical: 20,
    paddingHorizontal: 40, // Wider padding to form an oval
    borderRadius: 50, // Ensures curvature is strong enough
    width: 280, // Set a fixed width for better proportions
    height: 100, // Taller to make it oval
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeDescTitle: {
    color: '#FFFFFF',
    fontSize: 22, // Increased size for emphasis
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textAlign: 'center', // Centers the text
  },
  editButton: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row', // Align icon & text
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    top: 205,
    left: 22,
    backgroundColor: '#00AEEF',
    borderRadius: 20,
    marginTop: 8,
  },
  icon: {
    marginRight: 8, // Spacing between icon & text
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgeDescText: {
    color: '#AAAAAA',
    fontSize: 16, // Slightly smaller than title
    lineHeight: 22,
    textAlign: 'center', // Keeps everything visually aligned
  },
  infoContainer: {
    backgroundColor: '#353535A0',
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#00BFFF',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    overflow: 'hidden',
  },
  carContainer: {
    backgroundColor: '#42424290',
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#FF007F',
    shadowOpacity: 0.9,
    shadowRadius: 25,
    overflow: 'hidden',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center', // Ensures text stays vertically aligned
    justifyContent: 'flex-start', // Keeps text close together
    gap: 6, // Adds slight space without pushing text too far apart
  },
  infoLabel: {
    color: '#AAAAAA',
    fontSize: 18,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoValueRating: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    gap: 15,
  },
  centeredContainer: {
    alignItems: 'center', // Centers horizontally
    justifyContent: 'center', // Centers vertically
  },
  carCard: {
    flexDirection: 'row',
    backgroundColor: '#535353',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    alignItems: 'center',
  },
  carImage: {
    width: 120,
    height: 70,
    marginRight: 15,
    borderRadius: 8,
  },
  carText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
