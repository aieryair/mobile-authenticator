import * as Crypto from 'expo-crypto';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parseOtpauthUri } from '../lib/otp';
import type { Account } from '../types/account';

interface Props {
  onSave: (account: Account) => void;
  onCancel: () => void;
}

export function ScanScreen({ onSave, onCancel }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) {
      return;
    }
    setScanned(true);
    try {
      const account = parseOtpauthUri(data);
      onSave({ id: Crypto.randomUUID(), ...account });
    } catch {
      Alert.alert('Not a valid authenticator QR code', 'Try scanning again.', [
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
            Camera access is needed to scan QR codes.
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
  frame: {
    width: 240,
    height: 240,
    marginTop: 40,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
  },
});
