import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccountListScreen } from './src/screens/AccountListScreen';
import { AddChoiceScreen } from './src/screens/AddChoiceScreen';
import { ManualEntryScreen } from './src/screens/ManualEntryScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { addAccount, loadAccounts, removeAccount } from './src/lib/storage';
import type { Account } from './src/types/account';

type Mode = 'list' | 'add-choice' | 'scan' | 'manual';

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mode, setMode] = useState<Mode>('list');

  useEffect(() => {
    loadAccounts()
      .then(setAccounts)
      .catch((error) => console.error('Failed to load accounts', error));
  }, []);

  const handleSaveAccount = async (account: Account) => {
    setAccounts(await addAccount(account));
    setMode('list');
  };

  const handleDelete = async (account: Account) => {
    setAccounts(await removeAccount(account.id));
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {mode === 'list' && (
          <AccountListScreen
            accounts={accounts}
            onAddPress={() => setMode('add-choice')}
            onDelete={handleDelete}
          />
        )}
        {mode === 'add-choice' && (
          <AddChoiceScreen
            onScanPress={() => setMode('scan')}
            onManualPress={() => setMode('manual')}
            onCancel={() => setMode('list')}
          />
        )}
        {mode === 'scan' && (
          <ScanScreen onSave={handleSaveAccount} onCancel={() => setMode('list')} />
        )}
        {mode === 'manual' && (
          <ManualEntryScreen onSave={handleSaveAccount} onCancel={() => setMode('list')} />
        )}
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
