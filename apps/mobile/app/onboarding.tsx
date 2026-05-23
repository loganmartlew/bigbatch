import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TextInput } from 'react-native';
import { api } from '../src/lib/api-client';
import { useAuth } from '../src/lib/auth-context';
import { setActiveHouseholdId } from '../src/lib/household-context';

export default function OnboardingScreen() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setError('');
    setLoading(true);
    try {
      const data = await api.post<{ household: { id: number } }>(
        '/households',
        { name },
      );
      await setActiveHouseholdId(data.household.id);
      await refreshUser();
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  }

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

  if (mode === 'choose') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to BigBatch!</Text>
        <Text style={styles.subtitle}>
          Create a new household or join an existing one.
        </Text>
        <Button title='Create a Household' onPress={() => setMode('create')} />
        <View style={{ height: 12 }} />
        <Button title='Join with Code' onPress={() => setMode('join')} />
      </View>
    );
  }

  if (mode === 'create') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Create a Household</Text>
        <TextInput
          style={styles.input}
          placeholder='Household Name'
          value={name}
          onChangeText={setName}
          maxLength={100}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title={loading ? 'Creating…' : 'Create'}
          onPress={handleCreate}
          disabled={loading}
        />
        <Text style={styles.link} onPress={() => setMode('choose')}>
          Back
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Household</Text>
      <TextInput
        style={styles.input}
        placeholder='Invite Code (e.g. ABC123)'
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
      <Text style={styles.link} onPress={() => setMode('choose')}>
        Back
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  error: { color: 'red', marginBottom: 12 },
  link: { color: '#007AFF', marginTop: 12, textAlign: 'center' },
});
