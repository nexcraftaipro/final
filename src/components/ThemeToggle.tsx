
import React, { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toggle } from '@/components/ui/toggle';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  // Initialize theme based on system preference 
  useEffect(() => {
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    if (!theme || theme === 'system') {
      setTheme(systemPreference);
    }
  }, [theme, setTheme]);

  return (
    <div className="flex items-center gap-2">
      <Toggle
        aria-label="Toggle theme"
        pressed={theme === 'dark'}
        onPressedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="p-2 group transition-colors duration-200 hover:bg-primary/10 rounded-md data-[state=on]:bg-transparent"
      >
        {theme === 'dark' ? (
          <Moon className="h-5 w-5 text-yellow-300 glow-yellow" />
        ) : (
          <Sun className="h-5 w-5 text-amber-500 glow-amber" />
        )}
      </Toggle>
    </div>
  );
};

export default ThemeToggle;
