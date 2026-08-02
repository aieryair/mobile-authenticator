import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { OrderQrPayload } from './src/lib/qr';
import { removeScannedOrder, upsertScannedOrder } from './src/lib/storage';
import type { OrderCredentials } from './src/lib/storage';
import { AddOrderScreen } from './src/screens/AddOrderScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ManualOrderEntryScreen } from './src/screens/ManualOrderEntryScreen';
import { OrderDetailScreen } from './src/screens/OrderDetailScreen';
import { ScanOrderScreen } from './src/screens/ScanOrderScreen';

type Mode = 'home' | 'add-choice' | 'add-scan' | 'add-manual' | 'order-detail';

export default function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [selectedOrder, setSelectedOrder] = useState<OrderCredentials | null>(null);

  const handleOrderAdded = async (payload: OrderQrPayload) => {
    await upsertScannedOrder(payload);
    setSelectedOrder(payload);
    setMode('order-detail');
  };

  const handleSelectOrder = (creds: OrderCredentials) => {
    setSelectedOrder(creds);
    setMode('order-detail');
  };

  // The stored token for this order turned out to be dead (401) or the
  // order no longer exists (404). Either way there's no recovery except
  // rescanning, so drop the local entry and return to the order list.
  const forgetSelectedOrder = async () => {
    if (selectedOrder) {
      await removeScannedOrder(selectedOrder.orderId);
    }
    setSelectedOrder(null);
    setMode('home');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {mode === 'home' && (
          <HomeScreen onAddOrder={() => setMode('add-choice')} onSelectOrder={handleSelectOrder} />
        )}
        {mode === 'add-choice' && (
          <AddOrderScreen
            onScanPress={() => setMode('add-scan')}
            onScanned={handleOrderAdded}
            onManualPress={() => setMode('add-manual')}
            onCancel={() => setMode('home')}
          />
        )}
        {mode === 'add-scan' && (
          <ScanOrderScreen onScanned={handleOrderAdded} onCancel={() => setMode('add-choice')} />
        )}
        {mode === 'add-manual' && (
          <ManualOrderEntryScreen onSubmit={handleOrderAdded} onCancel={() => setMode('add-choice')} />
        )}
        {mode === 'order-detail' && selectedOrder && (
          <OrderDetailScreen
            creds={selectedOrder}
            onBack={() => setMode('home')}
            onRemoved={forgetSelectedOrder}
            onUnauthorized={forgetSelectedOrder}
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
