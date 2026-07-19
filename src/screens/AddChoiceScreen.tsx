import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  onScanPress: () => void;
  onManualPress: () => void;
  onCancel: () => void;
}

export function AddChoiceScreen({ onScanPress, onManualPress, onCancel }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={onCancel}>
          <Text style={styles.headerAction}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Add account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.options}>
        <Pressable style={styles.option} onPress={onScanPress}>
          <Text style={styles.optionText}>Scan QR code</Text>
        </Pressable>
        <Pressable style={styles.option} onPress={onManualPress}>
          <Text style={styles.optionText}>Enter secret manually</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerAction: {
    fontSize: 16,
    color: '#4a90d9',
  },
  headerSpacer: {
    minWidth: 50,
  },
  options: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 12,
  },
  option: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
