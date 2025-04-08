
import React, { useState, useEffect } from 'react';
import { Image, Eye, EyeOff, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  remainingCredits: string | number;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  remainingCredits, 
  apiKey, 
  onApiKeyChange
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [inputKey, setInputKey] = useState(apiKey);
  const navigate = useNavigate();

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  const handleSaveKey = () => {
    if (inputKey) {
      localStorage.setItem('gemini-api-key', inputKey);
      onApiKeyChange(inputKey);
      toast.success('API key saved successfully');
    } else {
      toast.error('Please enter an API key');
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini-api-key');
    setInputKey('');
    onApiKeyChange('');
    toast.success('API key cleared');
  };

  return (
    <header className="bg-secondary border-b border-gray-700 py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-white flex items-center">
            <Image className="h-5 w-5 mr-2 text-blue-500" />
            Meta CSV Generator Pro
          </h1>
          <div className="ml-4 text-xs text-gray-400">
            Developed by Freepikscipts
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            className="text-amber-500 border-amber-700 hover:bg-amber-900/20"
            onClick={() => navigate('/pricing')}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Pricing
          </Button>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-400 mr-2">API Key:</span>
            <div className="relative flex-1">
              <Input
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your Gemini API key"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="h-8 bg-gray-800 border-gray-700 text-gray-200 w-60"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-white"
                onClick={toggleShowApiKey}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showApiKey ? "Hide API Key" : "Show API Key"}
                </span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-green-500 hover:text-green-400 hover:bg-gray-700"
              onClick={handleSaveKey}
            >
              Save API
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-blue-500 hover:text-blue-400 hover:bg-gray-700"
              onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}
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
