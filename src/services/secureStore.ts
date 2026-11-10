// [MILESTONE 2 prep / Sub-CPMK 8] Encrypted storage via expo-secure-store.
// Stores credentials/tokens in the hardware-backed keychain/keystore —
// never in plain AsyncStorage.

import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'foodrescue.auth.token';

export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
