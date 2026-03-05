// Load .env from project root so EXPO_PUBLIC_* are set when this config runs (Expo doesn't always load them for web).
try {
  require('dotenv').config({ path: require('path').join(__dirname, '.env') });
} catch (_) {
  // dotenv not installed or .env missing; rely on Expo having set process.env
}

const app = require('./app.json');
module.exports = {
  ...app.expo,
  extra: {
    ...(app.expo.extra || {}),
    solanaRpcUrl: process.env.EXPO_PUBLIC_SOLANA_RPC_URL || '',
  },
};
