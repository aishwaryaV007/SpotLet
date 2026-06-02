/**
 * Custom entry point for SpotLet.
 * Polyfills MUST run before require('expo-router/entry') loads Supabase.
 * Using require() instead of import to prevent hoisting.
 */

// Polyfill DOMException for Hermes (React Native JS engine)
if (typeof globalThis.DOMException === 'undefined') {
  function DOMExceptionPolyfill(message, name) {
    var err = new Error(message || '');
    err.name = name || 'DOMException';
    return err;
  }
  DOMExceptionPolyfill.prototype = Object.create(Error.prototype);
  DOMExceptionPolyfill.prototype.constructor = DOMExceptionPolyfill;
  globalThis.DOMException = DOMExceptionPolyfill;
}

// Now load Expo Router — must use require() to prevent hoisting
require('expo-router/entry');
