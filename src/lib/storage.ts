import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'credentials';
const COURIER_LABEL_KEY = 'courierLabel';
const CLAIMED_ORDER_KEY = 'claimedOrderId';

export interface Credentials {
  apiUrl: string;
  token: string;
}

export async function loadCredentials(): Promise<Credentials | null> {
  const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  return raw ? (JSON.parse(raw) as Credentials) : null;
}

export async function saveCredentials(credentials: Credentials): Promise<void> {
  await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
}

// Clears only the token/apiUrl. Used when the admin rotates the token (401):
// the courier's name and any in-progress delivery are still valid and should
// survive so the app can resume straight into it once they re-authenticate.
export async function clearCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
}

export async function loadCourierLabel(): Promise<string | null> {
  return SecureStore.getItemAsync(COURIER_LABEL_KEY);
}

export async function saveCourierLabel(courierLabel: string): Promise<void> {
  await SecureStore.setItemAsync(COURIER_LABEL_KEY, courierLabel);
}

export async function loadClaimedOrderId(): Promise<number | null> {
  const raw = await SecureStore.getItemAsync(CLAIMED_ORDER_KEY);
  return raw ? Number(raw) : null;
}

export async function saveClaimedOrderId(id: number): Promise<void> {
  await SecureStore.setItemAsync(CLAIMED_ORDER_KEY, String(id));
}

export async function clearClaimedOrderId(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAIMED_ORDER_KEY);
}

// Full reset for an explicit Log Out: forgets the courier's name and any
// claimed order too, unlike clearCredentials().
export async function clearAll(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
  await SecureStore.deleteItemAsync(COURIER_LABEL_KEY);
  await SecureStore.deleteItemAsync(CLAIMED_ORDER_KEY);
}
