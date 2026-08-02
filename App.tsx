import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { OrderQrPayload } from './src/lib/qr';
import { loadCourierLabel, removeScannedOrder, saveCourierLabel, upsertScannedOrder } from './src/lib/storage';
import type { OrderCredentials } from './src/lib/storage';
import { AddOrderScreen } from './src/screens/AddOrderScreen';
import { EditNameScreen } from './src/screens/EditNameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OrderDetailScreen } from './src/screens/OrderDetailScreen';
import { ScanOrderScreen } from './src/screens/ScanOrderScreen';

type Mode = 'home' | 'add-choice' | 'add-scan' | 'order-detail' | 'edit-name';

export default function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [selectedOrder, setSelectedOrder] = useState<OrderCredentials | null>(null);
  const [courierLabel, setCourierLabel] = useState<string | null>(null);

  useEffect(() => {
    loadCourierLabel().then(setCourierLabel);
  }, []);

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

  // Wherever "edit name" was opened from is still intact (the order detail
  // screen doesn't lose its selected order just because settings is open),
  // so both save and cancel return to it instead of always going home.
  const returnFromNameEdit = () => setMode(selectedOrder ? 'order-detail' : 'home');

  const handleNameSaved = async (label: string) => {
    await saveCourierLabel(label);
    setCourierLabel(label);
    returnFromNameEdit();
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {mode === 'home' && (
          <HomeScreen
            courierLabel={courierLabel}
            onAddOrder={() => setMode('add-choice')}
            onSelectOrder={handleSelectOrder}
            onEditName={() => setMode('edit-name')}
          />
        )}
        {mode === 'add-choice' && (
          <AddOrderScreen
            onScanPress={() => setMode('add-scan')}
            onScanned={handleOrderAdded}
            onCancel={() => setMode('home')}
          />
        )}
        {mode === 'add-scan' && (
          <ScanOrderScreen onScanned={handleOrderAdded} onCancel={() => setMode('add-choice')} />
        )}
        {mode === 'order-detail' && selectedOrder && (
          <OrderDetailScreen
            creds={selectedOrder}
            courierLabel={courierLabel}
            onEditName={() => setMode('edit-name')}
            onBack={() => setMode('home')}
            onRemoved={forgetSelectedOrder}
            onUnauthorized={forgetSelectedOrder}
          />
        )}
        {mode === 'edit-name' && (
          <EditNameScreen
            currentName={courierLabel}
            onSave={handleNameSaved}
            onCancel={returnFromNameEdit}
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
