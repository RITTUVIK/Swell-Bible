// Expo loads .env when running this config. RPC URL is passed to the app via extra
// so it works on all platforms (including web).
const app = require('./app.json');
module.exports = {
  ...app.expo,
  extra: {
    ...(app.expo.extra || {}),
    solanaRpcUrl: process.env.EXPO_PUBLIC_SOLANA_RPC_URL || '',
  },
};
