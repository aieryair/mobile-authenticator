import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizeApiUrl } from '../lib/qr';
import type { SignInPayload } from '../lib/qr';

interface Props {
  onSubmit: (payload: SignInPayload) => void;
  onCancel: () => void;
}

export function ManualSignInScreen({ onSubmit, onCancel }: Props) {
  const [apiUrl, setApiUrl] = useState('');
  const [token, setToken] = useState('');

  const canSave = apiUrl.trim().length > 0 && token.trim().length > 0;

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    onSubmit({ apiUrl: normalizeApiUrl(apiUrl), token: token.trim() });
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
          <Text style={styles.title}>Sign In</Text>
          <Pressable onPress={handleSave} disabled={!canSave}>
            <Text style={[styles.headerAction, !canSave && styles.headerActionDisabled]}>Save</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Text style={styles.fieldLabel}>API URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="https://deckonomics.example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.fieldLabel}>Token</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder="Shared courier token"
            autoCapitalize="none"
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
