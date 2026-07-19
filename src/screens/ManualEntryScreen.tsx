import * as Crypto from 'expo-crypto';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildAccountFromSecret } from '../lib/otp';
import type { Account } from '../types/account';

interface Props {
  onSave: (account: Account) => void;
  onCancel: () => void;
}

export function ManualEntryScreen({ onSave, onCancel }: Props) {
  const [issuer, setIssuer] = useState('');
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');

  const canSave = issuer.trim().length > 0 && secret.trim().length > 0;

  const handleSave = () => {
    try {
      const account = buildAccountFromSecret({ issuer, label, secret });
      onSave({ id: Crypto.randomUUID(), ...account });
    } catch {
      Alert.alert('Invalid secret', 'That secret key is not valid base32. Double-check it and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={onCancel}>
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Add account</Text>
          <Pressable onPress={handleSave} disabled={!canSave}>
            <Text style={[styles.headerAction, !canSave && styles.headerActionDisabled]}>Save</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Issuer</Text>
          <TextInput
            style={styles.input}
            value={issuer}
            onChangeText={setIssuer}
            placeholder="e.g. GitHub"
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>Account name (optional)</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.fieldLabel}>Secret key</Text>
          <TextInput
            style={styles.input}
            value={secret}
            onChangeText={setSecret}
            placeholder="Base32 secret key"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
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
  headerActionDisabled: {
    color: '#bbb',
  },
  form: {
    paddingHorizontal: 20,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 14,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});
