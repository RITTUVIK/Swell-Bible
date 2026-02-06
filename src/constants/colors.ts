export const COLORS = {
  // Background
  bg: '#F9F7F2',           // Clean off-white
  bgLight: '#FCFBF7',      // Even lighter (reading surface)

  // Ink / text
  ink: '#1C1C1C',          // Soft black for high readability
  inkLight: '#666666',     // Secondary text
  inkFaint: '#999999',     // Tertiary / disabled text

  // Accent
  gold: '#A6894A',         // Subtle gold
  goldLight: '#C4A96A',    // Light gold for borders/dividers
  red: '#A62626',          // Traditional rubric red (muted)

  // Surfaces
  white: '#FCFCFC',
  card: '#FFFFFF',
  border: '#EEEEEE',       // Ledger lines, subtle separators
  borderLight: '#F2F2F2',  // Very faint separator

  // Utility
  black: '#000000',
  transparent: 'transparent',
} as const;
