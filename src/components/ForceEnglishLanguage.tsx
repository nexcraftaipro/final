import { useEffect } from 'react';
import { useForceEnglish } from '@/hooks/useForceEnglish';
import { useBlockChinese } from '@/hooks/useBlockChinese';

/**
 * A component that forces the application to use English
 * regardless of browser or system settings
 */
const ForceEnglishLanguage = () => {
  // Apply our aggressive English forcing hook
  useForceEnglish();
  
  // Apply specific Chinese blocking
  useBlockChinese();
  
  useEffect(() => {
    // Set the HTML lang attribute
    document.documentElement.lang = 'en';

    // Set the content language
    if (document.head) {
      // Remove any previous meta tags
      const existingMetaTags = document.head.querySelectorAll(
        'meta[http-equiv="Content-Language"], meta[name="google"]'
      );
      existingMetaTags.forEach(tag => document.head.removeChild(tag));

      // Set the content language to English
      const contentLanguage = document.createElement('meta');
      contentLanguage.setAttribute('http-equiv', 'Content-Language');
      contentLanguage.setAttribute('content', 'en');
      document.head.appendChild(contentLanguage);

      // Prevent automatic translation
      const noTranslate = document.createElement('meta');
      noTranslate.setAttribute('name', 'google');
      noTranslate.setAttribute('content', 'notranslate');
      document.head.appendChild(noTranslate);
    }

    // Force CSS to use English font rules
    const style = document.createElement('style');
    style.textContent = `
      * {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        unicode-bidi: plaintext;
        direction: ltr;
        text-align: left;
      }
      
      /* Ensure all text elements follow Latin text rules */
      body, div, span, p, h1, h2, h3, h4, h5, h6, button, input, textarea, select, a {
        font-language-override: "ENG";
        -webkit-locale: "en";
        writing-mode: horizontal-tb !important;
      }
    `;
    document.head.appendChild(style);

    // Clean up on unmount
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default ForceEnglishLanguage; 