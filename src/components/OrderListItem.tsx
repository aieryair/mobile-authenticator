import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Order } from '../types/order';

interface Props {
  order: Order;
  disabled: boolean;
  onPress: () => void;
}

export function OrderListItem({ order, disabled, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, (disabled || pressed) && styles.pressed]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.info}>
        <Text style={styles.address}>{order.shipping_address}</Text>
        <Text style={styles.meta}>
          {order.item_count} item{order.item_count === 1 ? '' : 's'} · ₱{order.total_amount.toFixed(2)}
        </Text>
        {order.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {order.notes}
          </Text>
        ) : null}
      </View>
      <Text style={styles.claimText}>Claim</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  pressed: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  address: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  meta: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  notes: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  claimText: {
    color: '#4a90d9',
    fontSize: 15,
    fontWeight: '600',
  },
});
