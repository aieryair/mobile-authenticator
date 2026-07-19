import * as OTPAuth from 'otpauth';
import type { Account, OtpAlgorithm } from '../types/account';

const SUPPORTED_ALGORITHMS: OtpAlgorithm[] = ['SHA1', 'SHA256', 'SHA512'];

function normalizeAlgorithm(algorithm: string): OtpAlgorithm {
  const upper = algorithm.toUpperCase();
  const match = SUPPORTED_ALGORITHMS.find((a) => a === upper);
  if (!match) {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
  return match;
}

export function parseOtpauthUri(uri: string): Omit<Account, 'id'> {
  const parsed = OTPAuth.URI.parse(uri);
  if (!(parsed instanceof OTPAuth.TOTP)) {
    throw new Error('Only TOTP (time-based) accounts are supported.');
  }
  return {
    issuer: parsed.issuer || 'Unknown',
    label: parsed.label || '',
    secret: parsed.secret.base32,
    algorithm: normalizeAlgorithm(parsed.algorithm),
    digits: parsed.digits,
    period: parsed.period,
  };
}

export function buildAccountFromSecret(params: {
  issuer: string;
  label: string;
  secret: string;
  algorithm?: OtpAlgorithm;
  digits?: number;
  period?: number;
}): Omit<Account, 'id'> {
  // Throws if the secret contains invalid base32 characters.
  const secret = OTPAuth.Secret.fromBase32(params.secret.trim());
  return {
    issuer: params.issuer.trim(),
    label: params.label.trim(),
    secret: secret.base32,
    algorithm: params.algorithm ?? 'SHA1',
    digits: params.digits ?? 6,
    period: params.period ?? 30,
  };
}

function toTotp(account: Account): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: account.issuer,
    label: account.label,
    secret: OTPAuth.Secret.fromBase32(account.secret),
    algorithm: account.algorithm,
    digits: account.digits,
    period: account.period,
  });
}

export function generateCode(account: Account, timestamp = Date.now()): string {
  return toTotp(account).generate({ timestamp });
}

export function getRemainingMillis(account: Account, timestamp = Date.now()): number {
  return OTPAuth.TOTP.remaining({ period: account.period, timestamp });
}
