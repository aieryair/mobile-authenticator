import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { loadCourierLabel, saveCourierLabel } from '../lib/storage';
import type { OrderCredentials } from '../lib/storage';
import type { Order } from '../types/order';

interface Props {
  creds: OrderCredentials;
  onBack: () => void;
  onRemoved: () => void;
  onUnauthorized: () => void;
}

export function OrderDetailScreen({ creds, onBack, onRemoved, onUnauthorized }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [courierLabel, setCourierLabel] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadCourierLabel().then((label) => {
      if (label) {
        setCourierLabel(label);
      }
    });
  }, []);

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

  const persistLabel = async (label: string) => {
    setCourierLabel(label);
    await saveCourierLabel(label);
  };

  const handleClaim = async () => {
    const label = courierLabel.trim();
    if (!label) {
      Alert.alert('Your name is required', "Enter your name so the admin knows who has this order.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await claimOrder(creds, label);
      await persistLabel(label);
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
    const label = courierLabel.trim();
    if (!label || !reason.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await reportIssue(creds, reason.trim(), label);
      await persistLabel(label);
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
  const isTerminal = !isPaid && !isShipping;

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
              <Text style={styles.fieldLabel}>Your name</Text>
              <TextInput
                style={styles.input}
                value={courierLabel}
                onChangeText={setCourierLabel}
                placeholder="e.g. Juan"
                autoCapitalize="words"
                autoCorrect={false}
              />
              <Pressable
                style={[
                  styles.primaryButtonFull,
                  (!courierLabel.trim() || submitting) && styles.buttonDisabled,
                ]}
                onPress={handleClaim}
                disabled={!courierLabel.trim() || submitting}
              >
                <Text style={styles.primaryButtonText}>Claim This Order</Text>
              </Pressable>
            </View>
          )}

          {isShipping &&
            (reporting ? (
              <View>
                <Text style={styles.fieldLabel}>Your name</Text>
                <TextInput
                  style={styles.input}
                  value={courierLabel}
                  onChangeText={setCourierLabel}
                  placeholder="e.g. Juan"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
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
                    style={[
                      styles.dangerButton,
                      (!reason.trim() || !courierLabel.trim()) && styles.buttonDisabled,
                    ]}
                    onPress={handleSubmitIssue}
                    disabled={submitting || !reason.trim() || !courierLabel.trim()}
                  >
                    <Text style={styles.dangerButtonText}>Submit</Text>
                  </Pressable>
                </View>
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
