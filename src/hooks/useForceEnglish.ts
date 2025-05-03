
import { useEffect } from 'react';

/**
 * Hook that forces the application to use English by providing interceptors and styling
 * This is a safer approach that doesn't try to redefine non-configurable properties
 */
export const useForceEnglish = () => {
  useEffect(() => {
    // Instead of trying to redefine navigator properties (which are non-configurable),
    // we can intercept specific APIs that might use these properties
    
    // Intercept language detection via getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(element, pseudoElt) {
      const style = originalGetComputedStyle(element, pseudoElt);
      
      // Override font-related properties if they're attempting to use non-Latin fonts
      const overrideStyle = new Proxy(style, {
        get: function(target, prop) {
          if (prop === 'fontFamily') {
            return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
          }
          return target[prop];
        }
      });
      
      return overrideStyle;
    };
    
    // Set document language
    document.documentElement.lang = 'en';
    
    // Block any auto-detect language features
    if (window.Intl && window.Intl.DateTimeFormat) {
      // Instead of replacing DateTimeFormat, we'll patch the specific instances
      const originalDateTimeFormat = window.Intl.DateTimeFormat;
      window.Intl.DateTimeFormat = function(locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        // Always force English locale
        return new originalDateTimeFormat('en-US', options);
      };
      
      // Preserve the static method
      window.Intl.DateTimeFormat.supportedLocalesOf = originalDateTimeFormat.supportedLocalesOf;
    }
    
    return () => {
      // Cleanup function to restore original methods
      window.getComputedStyle = originalGetComputedStyle;
      
      if (window.Intl && window.Intl.DateTimeFormat) {
        window.Intl.DateTimeFormat = originalDateTimeFormat;
      }
    };
  }, []);
};
