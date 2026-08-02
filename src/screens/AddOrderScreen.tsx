import { scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { parseOrderQr } from '../lib/qr';
import type { OrderQrPayload } from '../lib/qr';

interface Props {
  onScanPress: () => void;
  onScanned: (payload: OrderQrPayload) => void;
  onCancel: () => void;
}

export function AddOrderScreen({ onScanPress, onScanned, onCancel }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleUploadPress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to upload a QR code image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }

    setUploading(true);
    try {
      const scans = await scanFromURLAsync(result.assets[0].uri, ['qr']);
      if (scans.length === 0) {
        throw new Error('No QR code found in that image.');
      }
      const payload = parseOrderQr(scans[0].data);
      onScanned(payload);
    } catch {
      Alert.alert(
        'Not a valid order QR code',
        "Make sure the image clearly shows the order's QR code and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Pressable style={styles.primaryButton} onPress={onScanPress} disabled={uploading}>
          <Text style={styles.primaryButtonText}>Scan QR</Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, uploading && styles.buttonDisabled]}
          onPress={handleUploadPress}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.secondaryButtonText}>Upload QR Image</Text>
          )}
        </Pressable>
        <Pressable style={styles.cancelLink} onPress={onCancel} disabled={uploading}>
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryButton: {
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
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelLinkText: {
    color: '#4a90d9',
    fontSize: 15,
  },
});
