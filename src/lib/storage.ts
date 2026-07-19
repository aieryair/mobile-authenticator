import * as SecureStore from 'expo-secure-store';
import type { Account } from '../types/account';

const ACCOUNTS_KEY = 'accounts';

export async function loadAccounts(): Promise<Account[]> {
  const raw = await SecureStore.getItemAsync(ACCOUNTS_KEY);
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as Account[];
}

async function saveAccounts(accounts: Account[]): Promise<void> {
  await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function addAccount(account: Account): Promise<Account[]> {
  const accounts = await loadAccounts();
  const next = [...accounts, account];
  await saveAccounts(next);
  return next;
}

export async function removeAccount(id: string): Promise<Account[]> {
  const accounts = await loadAccounts();
  const next = accounts.filter((account) => account.id !== id);
  await saveAccounts(next);
  return next;
}
