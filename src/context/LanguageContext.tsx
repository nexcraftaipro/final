import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define language type
type Language = 'en'; // Currently only English supported

// Context interface
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
});

// Custom hook for using the language context
export const useLanguage = () => useContext(LanguageContext);

// Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Always initialize with English
  const [language] = useState<Language>('en');

  // On mount, ensure English is forced and stored
  useEffect(() => {
    // Force English language regardless of browser settings
    document.documentElement.lang = 'en';
    
    // Store in localStorage to persist
    localStorage.setItem('app-language', 'en');
    
    // Prevent auto-translation by browsers
    if (document.head) {
      // Remove any existing meta tag for content language
      const existingMeta = document.head.querySelector('meta[http-equiv="Content-Language"]');
      if (existingMeta) {
        document.head.removeChild(existingMeta);
      }
      
      // Add meta tag to specify English
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Language';
      meta.content = 'en';
      document.head.appendChild(meta);
      
      // Add meta tag to prevent translation
      const noTranslateMeta = document.createElement('meta');
      noTranslateMeta.name = 'google';
      noTranslateMeta.content = 'notranslate';
      document.head.appendChild(noTranslateMeta);
    }
  }, []);

  // Always use English - this application doesn't support language switching
  const setLanguage = () => {
    // This is a no-op since we only support English
    console.warn('Language switching is not supported. Only English is available.');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}; 