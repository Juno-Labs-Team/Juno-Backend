import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const NEON = '#00ffe7';

const OnboardingScreen = () => {
  const { user, completeOnboarding, onboardingStep } = useAuth();
  const [step, setStep] = useState(onboardingStep || 1);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    school: user?.school || 'Freehold High School',
    classYear: user?.classYear || '',
    major: user?.major || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    profilePicture: user?.profilePicture || '',
    hasCar: user?.hasCar || false,
    carMake: user?.carMake || '',
    carModel: user?.carModel || '',
    carColor: user?.carColor || '',
    carYear: user?.carYear || '',
    maxPassengers: user?.maxPassengers || 4,
  });

  const updateField = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        updateField('profilePicture', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
        Alert.alert('Required Fields', 'Please enter your first and last name');
        return;
      }
    }
    if (step === 2) {
      if (!profileData.school.trim() || !profileData.classYear.trim()) {
        Alert.alert('Required Fields', 'Please enter your school and class year');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const completeOnboardingFlow = async () => {
    try {
      setLoading(true);

      console.log('🚀 Completing onboarding with data:', profileData);

      // Update profile via API
      const response = await apiClient.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        username: user?.username || profileData.firstName.toLowerCase(),
        phone: profileData.phone,
        profile_picture_url: profileData.profilePicture, // Match backend field name
        school: profileData.school,
        class_year: profileData.classYear, // Match backend field name
        major: profileData.major,
        has_car: profileData.hasCar, // Match backend field name
        car_make: profileData.carMake, // Match backend field name
        car_model: profileData.carModel, // Match backend field name
        car_color: profileData.carColor, // Match backend field name
        car_year: parseInt(profileData.carYear) || 0,
        max_passengers: profileData.maxPassengers,
        bio: profileData.bio,
      });

      console.log('✅ Profile update response:', response);
      
      // Mark onboarding as complete in AuthContext
      await completeOnboarding();
      
      console.log('✅ Onboarding completed successfully');
      
      // Show brief success message
      Alert.alert(
        'Welcome to Juno! 🚗', 
        'Your profile has been set up successfully! You\'ll now be taken to the homepage.',
        [
          { 
            text: 'Get Started', 
            onPress: () => {
              console.log('🏠 User ready for homepage redirect...');
              // AuthController will automatically redirect since needsOnboarding is now false
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Onboarding error:', error);
      Alert.alert(
        'Setup Error', 
        'Failed to save your profile. Please try again.',
        [
          { text: 'Retry', onPress: completeOnboardingFlow },
          { 
            text: 'Skip for now', 
            onPress: () => {
              console.log('⏭️ User skipped onboarding completion');
              completeOnboarding();
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>Let's start with the basics</Text>

      <TouchableOpacity style={styles.profilePictureContainer} onPress={pickImage}>
        {profileData.profilePicture ? (
          <Image source={{ uri: profileData.profilePicture }} style={styles.profilePicture} />
        ) : (
          <View style={styles.profilePicturePlaceholder}>
            <Ionicons name="camera" size={40} color={NEON} />
            <Text style={styles.profilePictureText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={profileData.firstName}
          onChangeText={(value) => updateField('firstName', value)}
          placeholder="Enter your first name"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={profileData.lastName}
          onChangeText={(value) => updateField('lastName', value)}
          placeholder="Enter your last name"
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>School Information</Text>
      <Text style={styles.stepSubtitle}>Help us connect you with classmates</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>School *</Text>
        <TextInput
          style={styles.input}
          value={profileData.school}
          onChangeText={(value) => updateField('school', value)}
          placeholder="Enter your school"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Class Year *</Text>
        <TextInput
          style={styles.input}
          value={profileData.classYear}
          onChangeText={(value) => updateField('classYear', value)}
          placeholder="Enter your class year"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Major (Optional)</Text>
        <TextInput
          style={styles.input}
          value={profileData.major}
          onChangeText={(value) => updateField('major', value)}
          placeholder="Your field of study"
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Transportation</Text>
      <Text style={styles.stepSubtitle}>Do you have a vehicle for ridesharing?</Text>

      <View style={styles.vehicleToggleContainer}>
        <TouchableOpacity
          style={[
            styles.vehicleToggle,
            !profileData.hasCar && styles.selectedToggle
          ]}
          onPress={() => updateField('hasCar', false)}
        >
          <Ionicons name="walk" size={24} color={!profileData.hasCar ? '#000' : '#666'} />
          <Text style={[
            styles.toggleText,
            !profileData.hasCar && styles.selectedToggleText
          ]}>
            Need Rides
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.vehicleToggle,
            profileData.hasCar && styles.selectedToggle
          ]}
          onPress={() => updateField('hasCar', true)}
        >
          <Ionicons name="car" size={24} color={profileData.hasCar ? '#000' : '#666'} />
          <Text style={[
            styles.toggleText,
            profileData.hasCar && styles.selectedToggleText
          ]}>
            Have Vehicle
          </Text>
        </TouchableOpacity>
      </View>

      {profileData.hasCar && (
        <View style={styles.vehicleDetailsContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vehicle Make *</Text>
            <TextInput
              style={styles.input}
              value={profileData.carMake}
              onChangeText={(value) => updateField('carMake', value)}
              placeholder="e.g., Honda, Toyota"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vehicle Model *</Text>
            <TextInput
              style={styles.input}
              value={profileData.carModel}
              onChangeText={(value) => updateField('carModel', value)}
              placeholder="e.g., Civic, Corolla"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vehicle Color *</Text>
            <TextInput
              style={styles.input}
              value={profileData.carColor}
              onChangeText={(value) => updateField('carColor', value)}
              placeholder="e.g., Red, Blue"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vehicle Year (Optional)</Text>
            <TextInput
              style={styles.input}
              value={profileData.carYear}
              onChangeText={(value) => updateField('carYear', value)}
              placeholder="e.g., 2020"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Max Passengers *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalOptions}>
              {['1', '2', '3', '4', '5'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.optionChip,
                    profileData.maxPassengers === num && styles.selectedChip
                  ]}
                  onPress={() => updateField('maxPassengers', num)}
                >
                  <Text style={[
                    styles.chipText,
                    profileData.maxPassengers === num && styles.selectedChipText
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of 3</Text>
        </View>

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <Ionicons name="arrow-back" size={20} color="#666" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < 3 ? (
            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.completeButton, loading && { opacity: 0.6 }]} 
              onPress={completeOnboardingFlow}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color="#000" />
              )}
              <Text style={styles.completeButtonText}>
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: NEON,
    marginLeft: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: NEON,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 30,
    textAlign: 'center',
  },
  profilePictureContainer: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: NEON,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: NEON,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePictureText: {
    color: NEON,
    fontSize: 12,
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
  },
  optionsContainer: {
    maxHeight: 200,
  },
  optionButton: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  selectedOption: {
    borderColor: NEON,
    backgroundColor: '#001a1a',
  },
  optionText: {
    fontSize: 16,
    color: '#ccc',
  },
  selectedOptionText: {
    color: NEON,
    fontWeight: '500',
  },
  horizontalOptions: {
    marginBottom: 10,
  },
  optionChip: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  selectedChip: {
    borderColor: NEON,
    backgroundColor: NEON,
  },
  chipText: {
    fontSize: 14,
    color: '#ccc',
  },
  selectedChipText: {
    color: '#000',
    fontWeight: '500',
  },
  vehicleToggleContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 15,
  },
  vehicleToggle: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  selectedToggle: {
    borderColor: NEON,
    backgroundColor: NEON,
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  selectedToggleText: {
    color: '#000',
    fontWeight: '500',
  },
  vehicleDetailsContainer: {
    marginTop: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 5,
  },
  nextButton: {
    backgroundColor: NEON,
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 5,
  },
  completeButton: {
    backgroundColor: NEON,
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 5,
  },
});

export default OnboardingScreen;
