import { useRef, useState } from 'react';
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
import { deliverOrder, reportIssue } from '../lib/api';
import type { ApiError } from '../lib/api';
import type { Order } from '../types/order';

interface Props {
  order: Order;
  courierLabel: string;
  onDone: () => void;
  onBack: () => void;
  onUnauthorized: () => void;
}

export function MyDeliveryScreen({ order, courierLabel, onDone, onBack, onUnauthorized }: Props) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleFailure = (error: unknown, title: string): void => {
    const err = error as ApiError;
    if (err.status === 401) {
      onUnauthorized();
      return;
    }
    Alert.alert(title, err.message, [{ text: 'OK', onPress: onDone }]);
  };

  const handleDeliver = () => {
    Alert.alert('Mark as delivered?', 'Confirm the order has been handed off.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delivered',
        onPress: async () => {
          setSubmitting(true);
          try {
            await deliverOrder(order.id);
            onDone();
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
    if (!reason.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await reportIssue(order.id, reason.trim(), courierLabel);
      onDone();
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Order List</Text>
          </Pressable>

          <Text style={styles.title}>Order #{order.id}</Text>
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

          {reporting ? (
            <View>
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
    minHeight: 80,
    textAlignVertical: 'top',
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
    backgroundColor: '#e5a8a5',
  },
  spinner: {
    marginTop: 16,
  },
});
