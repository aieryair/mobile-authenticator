# Authenticator

A mobile TOTP authenticator app. Built with Expo and React Native.

## Features

- Scan a QR code to add an account
- Manual secret entry as a fallback
- Rotating 6-digit codes with a countdown per account
- Long-press an account to remove it
- Secrets stored locally via `expo-secure-store` (device keychain/keystore), never sent anywhere

## Stack

- Expo (React Native) + TypeScript
- `otpauth` for TOTP generation and URI parsing
- `expo-camera` for QR scanning
- `expo-secure-store` for local secret storage

## Running it

```
npm install
npx expo start
```

Scan the QR code generated from the command inside the Expo Go app (Google Play / Apple Store).

```
npx expo start --tunnel
```