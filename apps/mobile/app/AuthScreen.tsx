import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) onAuthenticated();
    });
    return unsubscribe;
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthenticated();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8fafc' }}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <View style={{ width: 60, height: 60, backgroundColor: '#3b82f6', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>CA</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>ClubOps AI</Text>
        <Text style={{ color: '#64748b', marginTop: 4 }}>Sign in to your workspace</Text>
      </View>

      {isSignup && (
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={displayName}
          onChangeText={setDisplayName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={{ backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 }}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '600' }}>{isSignup ? 'Create Account' : 'Sign In'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignup(!isSignup)} style={{ marginTop: 16, alignItems: 'center' }}>
        <Text style={{ color: '#3b82f6' }}>{isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
};