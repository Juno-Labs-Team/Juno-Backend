import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/api';

const NEON = '#00ffe7';

const inputFields = [
  { icon: 'at', key: 'username', placeholder: 'Username' },
  { icon: 'person-circle-outline', key: 'firstName', placeholder: 'First Name' },
  { icon: 'person-outline', key: 'lastName', placeholder: 'Last Name' },
  { icon: 'document-text-outline', key: 'description', placeholder: 'About Me' },
  { icon: 'happy-outline', key: 'userMood', placeholder: 'Mood (chill, focused, etc.)' },
  { icon: 'school-outline', key: 'school', placeholder: 'School' },
  { icon: 'calendar-outline', key: 'classYear', placeholder: 'Class Year' },
  { icon: 'car-sport-outline', key: 'carMake', placeholder: 'Car Make' },
  { icon: 'speedometer-outline', key: 'carModel', placeholder: 'Car Model' },
  { icon: 'calendar-outline', key: 'carYear', placeholder: 'Car Year' },
  { icon: 'color-palette-outline', key: 'carColor', placeholder: 'Car Color' },
];

const EditProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    profilePic: '',
    description: '',
    userMood: '',
    school: '',
    classYear: '',
    carMake: '',
    carModel: '',
    carYear: '',
    carColor: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Load from API first
      const apiProfile = await apiClient.getProfile();
      
      // Then merge with local storage
      const storedData = await AsyncStorage.getItem('profileData');
      if (storedData) {
        const localProfile = JSON.parse(storedData);
        setProfileData(prev => ({ 
          ...prev, 
          ...apiProfile, 
          ...localProfile,
          carMake: localProfile.carMake || (apiProfile.car?.make) || '',
          carModel: localProfile.carModel || (apiProfile.car?.model) || '',
          carYear: localProfile.carYear || (apiProfile.car?.year) || '',
          carColor: localProfile.carColor || (apiProfile.car?.color) || '',
        }));
      } else {
        setProfileData(prev => ({ 
          ...prev, 
          ...apiProfile,
          carMake: apiProfile.car?.make || '',
          carModel: apiProfile.car?.model || '',
          carYear: apiProfile.car?.year || '',
          carColor: apiProfile.car?.color || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const updateProfileData = (key, value) => {
    setProfileData(prev => {
      const updated = { ...prev, [key]: value };
      // Save to local storage immediately
      AsyncStorage.setItem('profileData', JSON.stringify(updated)).catch(console.error);
      return updated;
    });
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
        updateProfileData('profilePic', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare data for API
      const apiData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        username: profileData.username,
        description: profileData.description,
        school: profileData.school,
        classYear: profileData.classYear,
        userMood: profileData.userMood,
        car: {
          make: profileData.carMake,
          model: profileData.carModel,
          year: profileData.carYear,
          color: profileData.carColor,
        }
      };

      // Save to API
      await apiClient.updateProfile(apiData);
      
      // Save to local storage as backup
      await AsyncStorage.setItem('profileData', JSON.stringify(profileData));
      
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save profile. Changes saved locally.');
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={NEON} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarGlow}>
                <Image
                  source={{ 
                    uri: profileData.profilePic || 'https://via.placeholder.com/150'
                  }}
                  style={styles.profileImage}
                />
              </View>
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={20} color={NEON} />
              </View>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.displayName}>
            {profileData.firstName || 'First'} {profileData.lastName || 'Last'}
          </Text>
          <Text style={styles.username}>@{profileData.username || 'username'}</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {inputFields.map(({ icon, key, placeholder }, index) => (
            <View key={index} style={styles.inputContainer}>
              <Ionicons name={icon} size={20} color={NEON} />
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#666"
                value={profileData[key]}
                onChangeText={text => updateProfileData(key, text)}
                autoCapitalize={key === 'username' ? 'none' : 'words'}
                multiline={key === 'description'}
                numberOfLines={key === 'description' ? 3 : 1}
              />
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={saving ? "hourglass" : "checkmark-circle"} 
            size={24} 
            color="#000" 
          />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c1e',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: NEON,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: NEON,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#181825',
    borderRadius: 15,
    padding: 8,
    borderWidth: 2,
    borderColor: NEON,
  },
  displayName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
    letterSpacing: 1,
    textAlign: 'center',
  },
  username: {
    color: '#b1f6e8',
    fontWeight: '500',
    fontSize: 16,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a30',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: `${NEON}33`,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
    minHeight: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEON,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});

export default EditProfileScreen;