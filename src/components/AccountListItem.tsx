import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { generateCode, getRemainingMillis } from '../lib/otp';
import type { Account } from '../types/account';

interface Props {
  account: Account;
  now: number;
  onLongPress: (account: Account) => void;
}

function formatCode(code: string): string {
  const half = Math.ceil(code.length / 2);
  return `${code.slice(0, half)} ${code.slice(half)}`;
}

export function AccountListItem({ account, now, onLongPress }: Props) {
  const code = useMemo(() => generateCode(account, now), [account, now]);
  const remainingMillis = getRemainingMillis(account, now);
  const remainingSeconds = Math.ceil(remainingMillis / 1000);
  const progress = remainingMillis / (account.period * 1000);

  return (
    <Pressable
      style={styles.container}
      onLongPress={() => onLongPress(account)}
      delayLongPress={400}
    >
      <View style={styles.info}>
        <Text style={styles.issuer}>{account.issuer}</Text>
        {account.label ? <Text style={styles.label}>{account.label}</Text> : null}
        <Text style={styles.code}>{formatCode(code)}</Text>
      </View>
      <View style={styles.countdown}>
        <Text style={styles.countdownText}>{remainingSeconds}s</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  info: {
    flex: 1,
  },
  issuer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  code: {
    fontSize: 28,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
    letterSpacing: 1,
  },
  countdown: {
    alignItems: 'center',
    width: 44,
  },
  countdownText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressTrack: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a90d9',
  },
});
