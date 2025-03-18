
import React from 'react';
import { Moon, Sun } from 'lucide-react';
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
