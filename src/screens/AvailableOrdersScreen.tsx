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
import { OrderListItem } from '../components/OrderListItem';
import { claimOrder, listOrders } from '../lib/api';
import type { ApiError } from '../lib/api';
import type { Order } from '../types/order';

interface Props {
  courierLabel: string;
  activeOrder: Order | null;
  onClaimed: (order: Order) => void;
  onResumeDelivery: () => void;
  onUnauthorized: () => void;
  onLogout: () => void;
}

export function AvailableOrdersScreen({
  courierLabel,
  activeOrder,
  onClaimed,
  onResumeDelivery,
  onUnauthorized,
  onLogout,
}: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const result = await listOrders('paid');
      setOrders(result.orders);
    } catch (error) {
      if ((error as ApiError).status === 401) {
        onUnauthorized();
        return;
      }
      Alert.alert('Could not load orders', (error as Error).message);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const confirmLogout = () => {
    Alert.alert(
      'Log out?',
      activeOrder
        ? `You have an active delivery (Order #${activeOrder.id}). Logging out won't cancel it, but this device will forget it's yours.`
        : "You'll need to scan or enter the sign-in code again.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  const handleClaim = async (order: Order) => {
    if (claimingId !== null || activeOrder) {
      return;
    }
    setClaimingId(order.id);
    try {
      const result = await claimOrder(order.id, courierLabel);
      onClaimed(result.order);
    } catch (error) {
      const err = error as ApiError;
      if (err.status === 401) {
        onUnauthorized();
        return;
      }
      if (err.status === 409) {
        Alert.alert('Too late', 'Someone else already claimed that order.');
      } else {
        Alert.alert('Could not claim order', err.message);
      }
      fetchOrders();
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Orders</Text>
        <Pressable onPress={confirmLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>
      {activeOrder && (
        <Pressable style={styles.activeBanner} onPress={onResumeDelivery}>
          <View style={styles.activeBannerText}>
            <Text style={styles.activeBannerTitle}>Active Delivery — Order #{activeOrder.id}</Text>
            <Text style={styles.activeBannerSubtitle} numberOfLines={1}>
              {activeOrder.shipping_address}
            </Text>
          </View>
          <Text style={styles.activeBannerAction}>Resume</Text>
        </Pressable>
      )}
      <FlatList
        data={orders}
        keyExtractor={(order) => String(order.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={orders.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.emptyText}>No orders ready to deliver right now.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <OrderListItem
            order={item}
            disabled={claimingId !== null || !!activeOrder}
            onPress={() => handleClaim(item)}
          />
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
  logoutText: {
    color: '#4a90d9',
    fontSize: 15,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eaf2fb',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeBannerText: {
    flex: 1,
    marginRight: 12,
  },
  activeBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2a5d8f',
  },
  activeBannerSubtitle: {
    fontSize: 13,
    color: '#4a729e',
    marginTop: 2,
  },
  activeBannerAction: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4a90d9',
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
});
