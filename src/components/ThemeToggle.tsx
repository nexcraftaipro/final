
import React from 'react';
import { Moon, Sun, Stars } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toggle } from '@/components/ui/toggle';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  // Handle theme toggle
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex items-center gap-2">
      <Toggle
        aria-label="Toggle theme"
        pressed={theme === 'dark'}
        onPressedChange={toggleTheme}
        className="p-2.5 group relative overflow-hidden transition-colors duration-500 hover:bg-primary/10 rounded-full data-[state=on]:bg-transparent"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-yellow-400 dark:from-blue-700 dark:to-indigo-900 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full" />
        <div className="relative">
          {theme === 'dark' ? (
            <div className="flex flex-col items-center">
              <Stars className="h-5 w-5 text-yellow-300 glow-yellow transition-all duration-500 animate-pulse-subtle" />
              <Moon className="h-6 w-6 -mt-1 text-yellow-300 glow-yellow transition-all duration-500 hover:scale-110" />
            </div>
          ) : (
            <Sun className="h-6 w-6 text-amber-500 glow-amber transition-all duration-500 hover:scale-110 animate-spin-slow" />
          )}
        </div>
      </Toggle>
    </div>
  );
};

export default ThemeToggle;
