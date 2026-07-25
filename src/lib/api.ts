import { loadCredentials } from './storage';
import type { Order } from '../types/order';

export interface ApiError extends Error {
  status?: number;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const credentials = await loadCredentials();
  if (!credentials) {
    throw new Error('Not signed in.');
  }

  let response: Response;
  try {
    response = await fetch(`${credentials.apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credentials.token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  let body: { success: boolean; error?: string } & Record<string, unknown>;
  try {
    body = await response.json();
  } catch {
    throw new Error('Unexpected response from the server.');
  }

  if (!response.ok || !body.success) {
    const error = new Error(body.error || `Request failed (${response.status}).`) as ApiError;
    error.status = response.status;
    throw error;
  }

  return body as T;
}

export function listOrders(status: 'paid' | 'shipping') {
  return request<{ success: true; orders: Order[] }>(`/api/courier/orders?status=${status}`);
}

export function getOrder(id: number) {
  return request<{ success: true; order: Order }>(`/api/courier/orders/${id}`);
}

export function claimOrder(id: number, courierLabel: string) {
  return request<{ success: true; order: Order }>(`/api/courier/orders/${id}/claim`, {
    method: 'POST',
    body: JSON.stringify({ courier_label: courierLabel }),
  });
}

export function deliverOrder(id: number) {
  return request<{ success: true }>(`/api/courier/orders/${id}/deliver`, {
    method: 'POST',
  });
}

export function reportIssue(id: number, reason: string, courierLabel: string) {
  return request<{ success: true }>(`/api/courier/orders/${id}/report-issue`, {
    method: 'POST',
    body: JSON.stringify({ reason, courier_label: courierLabel }),
  });
}
