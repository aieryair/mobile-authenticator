export interface OrderQrPayload {
  apiUrl: string;
  orderId: number;
  token: string;
}

export function normalizeApiUrl(apiUrl: string): string {
  return apiUrl.trim().replace(/\/+$/, '');
}

export function parseOrderQr(data: string): OrderQrPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    throw new Error('QR code does not contain valid JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('QR code is missing apiUrl, orderId, or token.');
  }

  const obj = parsed as Record<string, unknown>;
  const orderId = typeof obj.orderId === 'string' ? Number(obj.orderId) : obj.orderId;

  if (
    typeof obj.apiUrl !== 'string' ||
    typeof obj.token !== 'string' ||
    typeof orderId !== 'number' ||
    !Number.isFinite(orderId)
  ) {
    throw new Error('QR code is missing apiUrl, orderId, or token.');
  }

  return { apiUrl: normalizeApiUrl(obj.apiUrl), orderId, token: obj.token.trim() };
}
