
import React from 'react';
import { Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

interface AppHeaderProps {
  remainingCredits: string | number;
}

const AppHeader: React.FC<AppHeaderProps> = ({ remainingCredits }) => {
  return (
    <header className="bg-secondary border-b border-gray-700 py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-white flex items-center">
            <Image className="h-5 w-5 mr-2 text-blue-500" />
            Meta Master
          </h1>
          <div className="ml-4 text-xs text-gray-400">
            Developed by Jayed Ahmed
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-400 mr-2">API Key:</span>
            <div className="bg-gray-700 rounded-md px-4 py-1">
              <span className="text-sm text-gray-300">••••••••••••••••••••••••••••••••</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-green-500 hover:text-green-400 hover:bg-gray-700"
            >
              Save API
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-blue-500 hover:text-blue-400 hover:bg-gray-700"
            >
              Get API
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
