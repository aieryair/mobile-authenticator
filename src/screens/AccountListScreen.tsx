import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountListItem } from '../components/AccountListItem';
import type { Account } from '../types/account';

interface Props {
  accounts: Account[];
  onAddPress: () => void;
  onDelete: (account: Account) => void;
}

export function AccountListScreen({ accounts, onAddPress, onDelete }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const confirmDelete = (account: Account) => {
    Alert.alert(
      'Remove account',
      `Remove ${account.issuer}${account.label ? ` (${account.label})` : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDelete(account) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Authenticator</Text>
        <Pressable style={styles.addButton} onPress={onAddPress}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>
      {accounts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No accounts yet. Tap + to add one.</Text>
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(account) => account.id}
          renderItem={({ item }) => (
            <AccountListItem account={item} now={now} onLongPress={confirmDelete} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4a90d9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
  },
});
