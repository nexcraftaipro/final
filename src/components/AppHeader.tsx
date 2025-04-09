
import React, { useState, useEffect } from 'react';
import { FileType, Eye, EyeOff, CreditCard, Facebook, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const { user } = useAuth();

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

  const openSupportPage = () => {
    window.open("https://www.facebook.com/FreepikScripts", "_blank");
  };
  
  const openTutorialVideo = () => {
    window.open("https://youtu.be/IgxtKon5brg?si=06vUvl4yM58SDUph", "_blank");
  };
  
  // Generate consistent avatar URL
  const getAvatarUrl = () => {
    if (!user) return '';
    const avatarSeed = user.email || 'default';
    return `https://api.dicebear.com/7.x/personas/svg?seed=${avatarSeed}`;
  };

  return (
    <header className="bg-secondary border-b border-gray-700 py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold flex items-center">
            <FileType className="h-5 w-5 mr-2" style={{ color: '#f14010' }} />
            <span style={{ color: '#f14010' }}>Meta CSV Generator Pro</span>
          </h1>
          <div className="ml-4 text-xs text-gray-400">
            Developed by Freepikscipts
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-amber-500 border-amber-700 hover:bg-amber-900/20 transition-all duration-300 hover:shadow-md" 
                onClick={() => navigate('/pricing')}
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Pricing
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-blue-500 border-blue-700 hover:bg-blue-900/20 transition-all duration-300 hover:shadow-md" 
                onClick={openSupportPage}
              >
                <Facebook className="h-4 w-4 mr-1" />
                Support
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-green-500 border-green-700 hover:bg-green-900/20 transition-all duration-300 hover:shadow-md" 
                onClick={openTutorialVideo}
              >
                <Play className="h-4 w-4 mr-1" />
                Tutorial
              </Button>
            </>
          )}
          
          <div className="flex items-center">
            <span className="text-sm mr-2 text-[#ff0000]">API Key:</span>
            <div className="relative flex-1">
              <Input 
                type={showApiKey ? "text" : "password"} 
                placeholder="Enter your Gemini API key" 
                value={inputKey} 
                onChange={e => setInputKey(e.target.value)} 
                className="h-8 bg-gray-800 border-gray-700 text-gray-200 w-60" 
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-white" 
                onClick={toggleShowApiKey}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              className="text-green-500 hover:text-green-400 hover:bg-gray-700 transition-all duration-300 hover:-translate-y-1" 
              onClick={handleSaveKey}
            >
              Save API
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-500 hover:text-blue-400 hover:bg-gray-700 transition-all duration-300 hover:-translate-y-1" 
              onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}
            >
              Get API
            </Button>
          </div>
          
          {user && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer overflow-hidden">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl()} alt={user.email} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <UserProfile />
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
