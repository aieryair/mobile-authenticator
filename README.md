# Authenticator

A mobile TOTP authenticator app, similar to Google Authenticator or Authy. Built with Expo and React Native.

## Features

- Scan a QR code to add an account (parses `otpauth://` URIs)
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

Scan the QR code from inside the Expo Go app (not your phone's regular camera or browser). If your dev machine and phone can't reach each other on the same network (for example, running inside WSL2), use tunnel mode instead:

```
npx expo start --tunnel
```

This project is pinned to Expo SDK 54 to match the currently installed Expo Go client. If Expo Go reports an incompatible SDK version, check its supported SDK in Settings before assuming the project needs an upgrade.

## Project structure

```
App.tsx                    Composition root, switches between screens
src/types/account.ts        Account type
src/lib/otp.ts               TOTP parsing, generation, countdown
src/lib/storage.ts           SecureStore-backed persistence
src/screens/                 List, add-choice, scan, and manual entry screens
src/components/              Shared UI pieces (account list item)
```
