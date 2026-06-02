/**
 * Polyfills for React Native / Hermes environment.
 * Must be imported before any library that uses Web APIs (e.g. Supabase).
 */

// DOMException polyfill — Supabase internals reference this Web API
if (typeof globalThis.DOMException === 'undefined') {
  class DOMException extends Error {
    constructor(message?: string, name?: string) {
      super(message);
      this.name = name || 'DOMException';
    }
  }
  (globalThis as any).DOMException = DOMException;
}
