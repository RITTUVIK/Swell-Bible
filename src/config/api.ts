// API Configuration
// Get your free API key from: https://scripture.api.bible/

export const BIBLE_API_CONFIG = {
  // TODO: Replace with your actual API key from https://scripture.api.bible/
  API_KEY: 'QsMTeT91wdxIwx2DVlXcB',
  BASE_URL: 'https://api.scripture.api.bible/v1',
  
  // Default Bible version (ESV - English Standard Version)
  // You can change this to other versions like 'de4e12af7f28f599-02' (KJV)
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
