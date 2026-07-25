import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  onScanPress: () => void;
  onManualPress: () => void;
}

export function SignInChoiceScreen({ onScanPress, onManualPress }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>Deckonomics Courier</Text>
        <Text style={styles.subtitle}>
          Sign in with the code from the admin to see available orders.
        </Text>
        <Pressable style={styles.primaryButton} onPress={onScanPress}>
          <Text style={styles.primaryButtonText}>Scan QR Code</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onManualPress}>
          <Text style={styles.secondaryButtonText}>Enter Manually</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
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
});
