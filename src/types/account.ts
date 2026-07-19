export type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface Account {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  algorithm: OtpAlgorithm;
  digits: number;
  period: number;
}
