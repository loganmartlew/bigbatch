import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../src/lib/api-client';
import { useAuth } from '../src/lib/auth-context';
import { setActiveHouseholdId } from '../src/lib/household-context';

export default function JoinCodeScreen() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setError('');
    setLoading(true);
    try {
      const data = await api.post<{ household: { id: number } }>(
        '/households/join/code',
        { code },
      );
      await setActiveHouseholdId(data.household.id);
      await refreshUser();
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Failed to join household');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Household</Text>
      <TextInput
        style={styles.input}
        placeholder='Enter 6-character invite code'
        value={code}
        onChangeText={setCode}
        maxLength={6}
        autoCapitalize='characters'
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title={loading ? 'Joining…' : 'Join'}
        onPress={handleJoin}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
  },
  error: { color: 'red', marginBottom: 12 },
});
