import type { OrderCredentials } from './storage';
import type { Order } from '../types/order';

export interface ApiError extends Error {
  status?: number;
}

async function request<T>(
  creds: OrderCredentials,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${creds.apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creds.token}`,
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

export function getOrder(creds: OrderCredentials) {
  return request<{ success: true; order: Order }>(creds, `/api/courier/orders/${creds.orderId}`);
}

export function claimOrder(creds: OrderCredentials, courierLabel: string) {
  return request<{ success: true; order: Order }>(creds, `/api/courier/orders/${creds.orderId}/claim`, {
    method: 'POST',
    body: JSON.stringify({ courier_label: courierLabel }),
  });
}

export function deliverOrder(creds: OrderCredentials) {
  return request<{ success: true; order: Order }>(creds, `/api/courier/orders/${creds.orderId}/deliver`, {
    method: 'POST',
  });
}

export function reportIssue(creds: OrderCredentials, reason: string, courierLabel: string) {
  return request<{ success: true; order: Order }>(
    creds,
    `/api/courier/orders/${creds.orderId}/report-issue`,
    {
      method: 'POST',
      body: JSON.stringify({ reason, courier_label: courierLabel }),
    }
  );
}
