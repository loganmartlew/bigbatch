import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'bigbatch_active_household_id';

export async function getActiveHouseholdId(): Promise<number | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  const parsed = parseInt(stored, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function setActiveHouseholdId(id: number): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, String(id));
}

export async function clearActiveHouseholdId(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
