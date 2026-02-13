// API Configuration
// API key is loaded from .env file (EXPO_PUBLIC_BIBLE_API_KEY)
// Get your free API key from: https://scripture.api.bible/

const apiKey = process.env.EXPO_PUBLIC_BIBLE_API_KEY || '';

if (!apiKey) {
  console.warn('BIBLE API KEY is missing! Set EXPO_PUBLIC_BIBLE_API_KEY in your .env file.');
}

export const BIBLE_API_CONFIG = {
  API_KEY: apiKey,
  BASE_URL: 'https://rest.api.bible/v1',

  // Default Bible version (ESV - English Standard Version)
  DEFAULT_BIBLE_ID: '06125adad2d5898a-01', // ESV

  // Common Bible IDs:
  // ESV: '06125adad2d5898a-01'
  // KJV: 'de4e12af7f28f599-02'
  // NIV: '9879dbb7cfe39e4d-01'
  // NASB: 'f72b840c855f362c-04'
};

// Helper function to get API headers
export const getApiHeaders = () => ({
  'api-key': BIBLE_API_CONFIG.API_KEY,
  'Content-Type': 'application/json',
});
