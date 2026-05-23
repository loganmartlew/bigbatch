import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { api } from '../src/lib/api-client';
import { getActiveHouseholdId } from '../src/lib/household-context';

interface Member {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  joinedAt: string;
}

interface Invite {
  link: string;
  code: string;
  expiresAt: string;
}

export default function HouseholdSettingsScreen() {
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveHouseholdId().then(id => {
      setHouseholdId(id);
      if (!id) {
        setLoading(false);
        return;
      }
      api
        .get<{ members: Member[] }>(`/households/${id}/members`)
        .then(data => {
          setMembers(data.members);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, []);

  async function handleGenerateInvite() {
    if (!householdId) return;
    try {
      const data = await api.post<Invite>(`/households/${householdId}/invites`);
      setInvite(data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!householdId) return;
    try {
      await api.delete(`/households/${householdId}/members/${userId}`);
      setMembers(prev => prev.filter(m => m.userId !== userId));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  if (!householdId) {
    return (
      <View style={styles.container}>
        <Text>No household selected.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Household Settings</Text>

      <Text style={styles.sectionTitle}>Members</Text>
      <FlatList
        data={members}
        keyExtractor={m => String(m.userId)}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <Text>
              {item.firstName} {item.lastName} — {item.role}
            </Text>
            {item.role !== 'owner' && (
              <Button
                title='Remove'
                onPress={() => handleRemoveMember(item.userId)}
              />
            )}
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Invite</Text>
      <Button title='Generate Invite' onPress={handleGenerateInvite} />
      {invite && (
        <View style={styles.inviteBox}>
          <Text>Code: {invite.code}</Text>
          <Text>Expires: {new Date(invite.expiresAt).toLocaleString()}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  inviteBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});
