import * as SecureStore from 'expo-secure-store';
import type { OrderQrPayload } from './qr';

const ORDERS_KEY = 'scannedOrders';
const COURIER_LABEL_KEY = 'courierLabel';

// A scanned order's own {orderId, apiUrl, token} — same shape as the QR
// payload, since scanning is what produces it.
export type OrderCredentials = OrderQrPayload;

export async function loadScannedOrders(): Promise<OrderCredentials[]> {
  const raw = await SecureStore.getItemAsync(ORDERS_KEY);
  return raw ? (JSON.parse(raw) as OrderCredentials[]) : [];
}

async function saveScannedOrders(orders: OrderCredentials[]): Promise<void> {
  await SecureStore.setItemAsync(ORDERS_KEY, JSON.stringify(orders));
}

// Adds a newly scanned order, or refreshes its token/apiUrl if it was
// already scanned before (rescanning is the recovery path).
export async function upsertScannedOrder(entry: OrderCredentials): Promise<void> {
  const orders = await loadScannedOrders();
  const next = orders.filter((o) => o.orderId !== entry.orderId);
  next.push(entry);
  await saveScannedOrders(next);
}

export async function removeScannedOrder(orderId: number): Promise<void> {
  const orders = await loadScannedOrders();
  await saveScannedOrders(orders.filter((o) => o.orderId !== orderId));
}

export async function loadCourierLabel(): Promise<string | null> {
  return SecureStore.getItemAsync(COURIER_LABEL_KEY);
}

export async function saveCourierLabel(courierLabel: string): Promise<void> {
  await SecureStore.setItemAsync(COURIER_LABEL_KEY, courierLabel);
}
