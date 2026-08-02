import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parseOrderQr } from '../lib/qr';
import type { OrderQrPayload } from '../lib/qr';

interface Props {
  onScanned: (payload: OrderQrPayload) => void;
  onCancel: () => void;
}

export function ScanOrderScreen({ onScanned, onCancel }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) {
      return;
    }
    setScanned(true);
    try {
      const payload = parseOrderQr(data);
      onScanned(payload);
    } catch {
      Alert.alert('Not a valid order QR code', "Ask the admin for this order's QR code and try again.", [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <Text style={styles.message}>
            Camera access is needed to scan an order's QR code.
            {!permission.canAskAgain
              ? ' Enable it for this app in your device Settings.'
              : ''}
          </Text>
          {permission.canAskAgain && (
            <Pressable style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>Grant permission</Text>
            </Pressable>
          )}
          <Pressable onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <SafeAreaView style={styles.overlay} edges={['top', 'left', 'right']}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Text style={styles.instructions}>Scan the QR code on the order&apos;s admin page</Text>
        <View style={styles.frame} pointerEvents="none" />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  message: {
    textAlign: 'center',
    fontSize: 15,
    color: '#333',
  },
  button: {
    backgroundColor: '#4a90d9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelText: {
    color: '#4a90d9',
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    alignSelf: 'flex-start',
    margin: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 15,
  },
  instructions: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    marginHorizontal: 32,
    marginTop: 20,
  },
  frame: {
    width: 240,
    height: 240,
    marginTop: 40,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
  },
});
