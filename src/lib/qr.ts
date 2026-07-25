export interface SignInPayload {
  apiUrl: string;
  token: string;
}

export function normalizeApiUrl(apiUrl: string): string {
  return apiUrl.trim().replace(/\/+$/, '');
}

export function parseSignInQr(data: string): SignInPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    throw new Error('QR code does not contain valid JSON.');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).apiUrl !== 'string' ||
    typeof (parsed as Record<string, unknown>).token !== 'string'
  ) {
    throw new Error('QR code is missing apiUrl or token.');
  }

  const { apiUrl, token } = parsed as { apiUrl: string; token: string };
  return { apiUrl: normalizeApiUrl(apiUrl), token: token.trim() };
}
