import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOrder } from '../lib/api';
import { loadScannedOrders, removeScannedOrder } from '../lib/storage';
import type { OrderCredentials } from '../lib/storage';
import type { Order } from '../types/order';

interface Entry {
  creds: OrderCredentials;
  order: Order | null;
}

interface Props {
  onAddOrder: () => void;
  onSelectOrder: (creds: OrderCredentials) => void;
}

export function HomeScreen({ onAddOrder, onSelectOrder }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const creds = await loadScannedOrders();
    const results = await Promise.all(
      creds.map(async (c) => {
        try {
          const { order } = await getOrder(c);
          return { creds: c, order };
        } catch {
          return { creds: c, order: null };
        }
      })
    );
    setEntries(results);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const handleRemove = (orderId: number) => {
    Alert.alert('Remove from My Orders?', "You can get it back by rescanning its QR code.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeScannedOrder(orderId);
          fetchAll();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Pressable style={styles.scanButton} onPress={onAddOrder}>
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </Pressable>
      </View>
      <FlatList
        data={entries}
        keyExtractor={(entry) => String(entry.creds.orderId)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={entries.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.emptyText}>
                No orders yet. Scan the QR code on an order&apos;s admin page to get started.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
              onPress={() => onSelectOrder(item.creds)}
            >
              <Text style={styles.orderTitle}>Order #{item.creds.orderId}</Text>
              {item.order ? (
                <>
                  <Text style={styles.address} numberOfLines={1}>
                    {item.order.shipping_address}
                  </Text>
                  <Text style={styles.status}>{item.order.status.toUpperCase()}</Text>
                </>
              ) : (
                <Text style={styles.invalidText}>Could not load — tap to retry</Text>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
              onPress={() => handleRemove(item.creds.orderId)}
            >
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        )}
      />
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
  scanButton: {
    backgroundColor: '#4a90d9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  rowMain: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.5,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  address: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  status: {
    fontSize: 12,
    color: '#4a90d9',
    fontWeight: '600',
    marginTop: 4,
  },
  invalidText: {
    fontSize: 13,
    color: '#d9534f',
    marginTop: 4,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  removeText: {
    color: '#d9534f',
    fontSize: 13,
  },
});
