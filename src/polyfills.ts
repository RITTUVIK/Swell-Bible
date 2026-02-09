// Polyfills required for @solana/web3.js in React Native
// Must be imported before any Solana code

import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// @ts-ignore - global polyfill
global.Buffer = Buffer;
