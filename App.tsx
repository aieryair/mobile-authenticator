import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getOrder } from './src/lib/api';
import type { ApiError } from './src/lib/api';
import type { SignInPayload } from './src/lib/qr';
import {
  clearAll,
  clearClaimedOrderId,
  clearCredentials,
  loadClaimedOrderId,
  loadCourierLabel,
  loadCredentials,
  saveClaimedOrderId,
  saveCourierLabel,
  saveCredentials,
} from './src/lib/storage';
import { AvailableOrdersScreen } from './src/screens/AvailableOrdersScreen';
import { CourierNameScreen } from './src/screens/CourierNameScreen';
import { ManualSignInScreen } from './src/screens/ManualSignInScreen';
import { MyDeliveryScreen } from './src/screens/MyDeliveryScreen';
import { SignInChoiceScreen } from './src/screens/SignInChoiceScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import type { Order } from './src/types/order';

type Mode =
  | 'loading'
  | 'sign-in-choice'
  | 'sign-in-scan'
  | 'sign-in-manual'
  | 'name-entry'
  | 'orders'
  | 'delivery';

export default function App() {
  const [mode, setMode] = useState<Mode>('loading');
  const [courierLabel, setCourierLabel] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const handleUnauthorized = async () => {
    await clearCredentials();
    setMode('sign-in-choice');
    Alert.alert(
      'Signed out',
      activeOrder
        ? 'Your access was reset by the admin. Sign in again to pick up where you left off.'
        : 'Your access was reset by the admin. Sign in again to continue.'
    );
  };

  // Decides which screen to land on once credentials + courier name are
  // known: resume a claimed order if one is still active, otherwise the list.
  const resumeActiveOrderOrGoToList = async () => {
    const claimedId = await loadClaimedOrderId();
    if (!claimedId) {
      setMode('orders');
      return;
    }
    try {
      const { order } = await getOrder(claimedId);
      if (order.status === 'shipping') {
        setActiveOrder(order);
        setMode('delivery');
        return;
      }
      // Delivered or reported from elsewhere; this local claim is stale.
      await clearClaimedOrderId();
      setActiveOrder(null);
    } catch (error) {
      const err = error as ApiError;
      if (err.status === 401) {
        await handleUnauthorized();
        return;
      }
      if (err.status === 404) {
        await clearClaimedOrderId();
        setActiveOrder(null);
      }
      // Any other error (network, 5xx, etc.): leave the local claim in
      // place so the next successful check can still pick it back up.
    }
    setMode('orders');
  };

  useEffect(() => {
    (async () => {
      const credentials = await loadCredentials();
      if (!credentials) {
        setMode('sign-in-choice');
        return;
      }

      const label = await loadCourierLabel();
      if (!label) {
        setMode('name-entry');
        return;
      }
      setCourierLabel(label);

      await resumeActiveOrderOrGoToList();
    })();
  }, []);

  const handleSignedIn = async (payload: SignInPayload) => {
    await saveCredentials(payload);

    const label = await loadCourierLabel();
    if (!label) {
      setMode('name-entry');
      return;
    }
    setCourierLabel(label);
    await resumeActiveOrderOrGoToList();
  };

  const handleNameSaved = async (label: string) => {
    await saveCourierLabel(label);
    setCourierLabel(label);
    await resumeActiveOrderOrGoToList();
  };

  const handleClaimed = async (order: Order) => {
    await saveClaimedOrderId(order.id);
    setActiveOrder(order);
    setMode('delivery');
  };

  const handleDeliveryDone = async () => {
    await clearClaimedOrderId();
    setActiveOrder(null);
    setMode('orders');
  };

  const handleBackToList = () => {
    setMode('orders');
  };

  const handleResumeDelivery = () => {
    setMode('delivery');
  };

  const handleLogout = async () => {
    await clearAll();
    setCourierLabel(null);
    setActiveOrder(null);
    setMode('sign-in-choice');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {mode === 'sign-in-choice' && (
          <SignInChoiceScreen
            onScanPress={() => setMode('sign-in-scan')}
            onManualPress={() => setMode('sign-in-manual')}
          />
        )}
        {mode === 'sign-in-scan' && (
          <SignInScreen onScanned={handleSignedIn} onCancel={() => setMode('sign-in-choice')} />
        )}
        {mode === 'sign-in-manual' && (
          <ManualSignInScreen onSubmit={handleSignedIn} onCancel={() => setMode('sign-in-choice')} />
        )}
        {mode === 'name-entry' && <CourierNameScreen onSave={handleNameSaved} />}
        {mode === 'orders' && courierLabel && (
          <AvailableOrdersScreen
            courierLabel={courierLabel}
            activeOrder={activeOrder}
            onClaimed={handleClaimed}
            onResumeDelivery={handleResumeDelivery}
            onUnauthorized={handleUnauthorized}
            onLogout={handleLogout}
          />
        )}
        {mode === 'delivery' && activeOrder && courierLabel && (
          <MyDeliveryScreen
            order={activeOrder}
            courierLabel={courierLabel}
            onDone={handleDeliveryDone}
            onBack={handleBackToList}
            onUnauthorized={handleUnauthorized}
          />
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
