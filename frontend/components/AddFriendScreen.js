import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/api';

const NEON = '#00ffe7';

const AddFriendScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAddFriend = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    try {
      setLoading(true);
      await apiClient.addFriendByUsername(username.trim());
      Alert.alert('Success', 'Friend request sent!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      setUsername('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View 
          style={[
            styles.animatedContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={NEON} />
            </TouchableOpacity>
            <Text style={styles.title}>Add Friend</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Icon with Glow Effect */}
          <View style={styles.iconContainer}>
            <View style={styles.iconGlow}>
              <View style={styles.iconInner}>
                <Ionicons name="person-add" size={64} color={NEON} />
              </View>
            </View>
          </View>

          {/* Instructions */}
          <Text style={styles.instructions}>
            Enter your friend's username to send them a friend request
          </Text>

          {/* Input Container */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="at" size={20} color={NEON} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
              />
            </View>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleAddFriend}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons 
                name={loading ? "hourglass" : "paper-plane"} 
                size={20} 
                color="#000" 
              />
              <Text style={styles.sendButtonText}>
                {loading ? 'Sending...' : 'Send Request'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tips Section */}
          <View style={styles.tipsContainer}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color={NEON} />
              <Text style={styles.tipsTitle}>Quick Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>
                  Ask your friends for their Juno username
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>
                  Check the search tab to find classmates
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>
                  Share rides safely with people you know
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c1e',
  },
  content: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20, // Reduced from 40 since we have top header now
    paddingBottom: 30,
  },
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 231, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: NEON,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    letterSpacing: 1,
  },
  placeholder: {
    width: 48,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 255, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(24, 24, 37, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${NEON}44`,
  },
  instructions: {
    fontSize: 16,
    color: '#b1f6e8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 37, 0.8)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: `${NEON}44`,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIconContainer: {
    padding: 18,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#fff',
    paddingVertical: 18,
    paddingRight: 18,
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: NEON,
    borderRadius: 25,
    marginBottom: 30,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
  },
  sendButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  tipsContainer: {
    backgroundColor: 'rgba(24, 24, 37, 0.6)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: `${NEON}22`,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NEON,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: NEON,
    marginTop: 7,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#b1f6e8',
    lineHeight: 20,
    flex: 1,
  },
});

export default AddFriendScreen;
