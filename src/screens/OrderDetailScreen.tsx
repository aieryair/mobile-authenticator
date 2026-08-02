import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { claimOrder, deliverOrder, getOrder, reportIssue } from '../lib/api';
import type { ApiError } from '../lib/api';
import type { OrderCredentials } from '../lib/storage';
import type { Order, OrderStatus } from '../types/order';

const POLL_INTERVAL_MS = 10000;

function isTerminalStatus(status: OrderStatus): boolean {
  return status !== 'paid' && status !== 'shipping';
}

interface Props {
  creds: OrderCredentials;
  courierLabel: string | null;
  onEditName: () => void;
  onBack: () => void;
  onRemoved: () => void;
  onUnauthorized: () => void;
}

export function OrderDetailScreen({
  creds,
  courierLabel,
  onEditName,
  onBack,
  onRemoved,
  onUnauthorized,
}: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const orderRef = useRef<Order | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  const handleFailure = (error: unknown, title: string) => {
    const err = error as ApiError;
    if (err.status === 401) {
      Alert.alert(
        'Access no longer valid',
        "This order needs to be rescanned from its admin page to continue.",
        [{ text: 'OK', onPress: onUnauthorized }]
      );
      return;
    }
    if (err.status === 404) {
      Alert.alert('Order not found', 'This order no longer exists.', [
        { text: 'OK', onPress: onUnauthorized },
      ]);
      return;
    }
    Alert.alert(title, err.message);
  };

  const fetchOrder = async () => {
    try {
      const result = await getOrder(creds);
      setOrder(result.order);
    } catch (error) {
      handleFailure(error, 'Could not load order');
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOrder().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds.orderId]);

  // Polls the admin-owned status while this order is open, since the admin
  // dashboard can reassign, cancel, or complete an order out from under the
  // app at any time. Self-cancels once the order reaches a terminal state.
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const tick = async () => {
      const current = orderRef.current;
      if (!current || isTerminalStatus(current.status)) {
        clearInterval(intervalId);
        return;
      }
      // Skip while a claim/deliver/report-issue call is in flight, or the
      // app is backgrounded — nothing to sync with a screen no one sees.
      if (submittingRef.current || AppState.currentState !== 'active') {
        return;
      }

      let fetched: Order;
      try {
        const result = await getOrder(creds);
        fetched = result.order;
      } catch {
        // Transient failure (network blip, etc.) — just try again next tick.
        return;
      }

      const previousStatus = current.status;
      setOrder(fetched);

      if (fetched.status === previousStatus) {
        // No change, or a change this screen's own action already applied
        // and this poll simply confirmed — nothing to announce.
        if (isTerminalStatus(fetched.status)) {
          clearInterval(intervalId);
        }
        return;
      }

      if (previousStatus === 'shipping' && fetched.status === 'paid') {
        Alert.alert(
          'Order reassigned',
          "This order was reassigned by the store — you're no longer delivering it.",
          [{ text: 'OK', onPress: onBack }]
        );
      } else if (previousStatus === 'shipping' && fetched.status === 'cancelled') {
        Alert.alert(
          'Order cancelled',
          "This order was cancelled by the store — please don't deliver it.",
          [{ text: 'OK', onPress: onBack }]
        );
      }
      // shipping -> completed (marked delivered from the admin side) and any
      // other transition: the setOrder above already synced the UI, no alert.

      if (isTerminalStatus(fetched.status)) {
        clearInterval(intervalId);
      }
    };

    intervalId = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [creds, onBack]);

  const handleClaim = async () => {
    const label = courierLabel?.trim();
    if (!label) {
      onEditName();
      return;
    }
    setSubmitting(true);
    try {
      const result = await claimOrder(creds, label);
      setOrder(result.order);
    } catch (error) {
      const err = error as ApiError;
      if (err.status === 409) {
        Alert.alert('Too late', 'This order was already claimed.');
        fetchOrder();
      } else {
        handleFailure(error, 'Could not claim order');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeliver = () => {
    Alert.alert('Mark as delivered?', 'Confirm the order has been handed off.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delivered',
        onPress: async () => {
          setSubmitting(true);
          try {
            const result = await deliverOrder(creds);
            setOrder(result.order);
          } catch (error) {
            handleFailure(error, 'Could not mark delivered');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const handleSubmitIssue = async () => {
    const label = courierLabel?.trim();
    if (!label) {
      onEditName();
      return;
    }
    if (!reason.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await reportIssue(creds, reason.trim(), label);
      setOrder(result.order);
      setReporting(false);
    } catch (error) {
      handleFailure(error, 'Could not report issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportPress = () => {
    setReporting(true);
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleRemove = () => {
    Alert.alert('Remove from My Orders?', "You can get it back by rescanning its QR code.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onRemoved },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <Pressable onPress={onBack}>
            <Text style={styles.backButtonText}>‹ My Orders</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = order.status === 'paid';
  const isShipping = order.status === 'shipping';
  const isTerminal = isTerminalStatus(order.status);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ My Orders</Text>
          </Pressable>

          <Text style={styles.title}>Order #{order.id}</Text>
          <Text style={styles.statusBadge}>{order.status.toUpperCase()}</Text>
          <Text style={styles.address}>{order.shipping_address}</Text>
          <Text style={styles.meta}>{order.contact_phone}</Text>
          {order.notes ? <Text style={styles.notes}>{order.notes}</Text> : null}

          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.card_name} ({item.set_code})
                {item.foil ? ' ✦' : ''}
              </Text>
              <Text style={styles.itemMeta}>
                {item.condition} · x{item.quantity} · ₱{item.price.toFixed(2)}
              </Text>
            </View>
          ))}
          <Text style={styles.total}>Total: ₱{order.total_amount.toFixed(2)}</Text>

          {isPaid && (
            <View>
              {courierLabel ? (
                <Text style={styles.fieldLabel}>Claiming as {courierLabel}</Text>
              ) : (
                <Text style={styles.fieldLabel}>
                  Set your name before claiming an order.
                </Text>
              )}
              <Pressable
                style={[styles.primaryButtonFull, submitting && styles.buttonDisabled]}
                onPress={handleClaim}
                disabled={submitting}
              >
                <Text style={styles.primaryButtonText}>
                  {courierLabel ? 'Claim This Order' : 'Set Your Name'}
                </Text>
              </Pressable>
            </View>
          )}

          {isShipping &&
            (reporting ? (
              <View>
                {courierLabel ? (
                  <>
                    <Text style={styles.fieldLabel}>What went wrong?</Text>
                    <TextInput
                      style={styles.input}
                      value={reason}
                      onChangeText={setReason}
                      placeholder="e.g. Address not found"
                      multiline
                      autoFocus
                    />
                    <View style={styles.buttonRow}>
                      <Pressable
                        style={styles.secondaryButton}
                        onPress={() => setReporting(false)}
                        disabled={submitting}
                      >
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.dangerButton, !reason.trim() && styles.buttonDisabled]}
                        onPress={handleSubmitIssue}
                        disabled={submitting || !reason.trim()}
                      >
                        <Text style={styles.dangerButtonText}>Submit</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.fieldLabel}>Set your name before reporting an issue.</Text>
                    <View style={styles.buttonRow}>
                      <Pressable
                        style={styles.secondaryButton}
                        onPress={() => setReporting(false)}
                        disabled={submitting}
                      >
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                      </Pressable>
                      <Pressable style={styles.primaryButton} onPress={onEditName}>
                        <Text style={styles.primaryButtonText}>Set Your Name</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleReportPress}
                  disabled={submitting}
                >
                  <Text style={styles.secondaryButtonText}>Report a Problem</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={handleDeliver} disabled={submitting}>
                  <Text style={styles.primaryButtonText}>Mark Delivered</Text>
                </Pressable>
              </View>
            ))}

          {isTerminal && (
            <View>
              <Text style={styles.doneText}>This order is no longer active.</Text>
              <Pressable style={styles.secondaryButtonFull} onPress={handleRemove}>
                <Text style={styles.secondaryButtonText}>Remove from My Orders</Text>
              </Pressable>
            </View>
          )}

          {submitting ? <ActivityIndicator style={styles.spinner} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    gap: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backButtonText: {
    color: '#4a90d9',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4a90d9',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  meta: {
    fontSize: 14,
    color: '#666',
  },
  notes: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 4,
  },
  itemRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  itemName: {
    fontSize: 15,
    color: '#333',
  },
  itemMeta: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'right',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 20,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4a90d9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonFull: {
    backgroundColor: '#4a90d9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonFull: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    flex: 1,
    backgroundColor: '#d9534f',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  doneText: {
    fontSize: 15,
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 16,
  },
});
