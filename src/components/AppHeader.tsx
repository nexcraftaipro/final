import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Video, RefreshCcw, LogIn, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import md5 from 'crypto-js/md5';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentApiProvider, setApiProvider, getDefaultOpenRouterKey } from '@/utils/geminiApi';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AppHeaderProps {
  remainingCredits: string | number;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  openaiApiKey?: string;
  onOpenaiApiKeyChange?: (key: string) => void;
  deepseekApiKey?: string;
  onDeepseekApiKeyChange?: (key: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  remainingCredits,
  apiKey,
  onApiKeyChange,
  openaiApiKey,
  onOpenaiApiKeyChange,
  deepseekApiKey,
  onDeepseekApiKeyChange
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyType, setApiKeyType] = useState<'openrouter' | 'gemini'>('gemini');
  // Track if keys have been manually cleared
  const [keyCleared, setKeyCleared] = useState({
    gemini: false,
    openrouter: false
  });
  const navigate = useNavigate();
  const {
    user,
    apiKey: authApiKey,
    profile
  } = useAuth();
  
  // Initialize only once after component mounts
  const initialized = useRef(false);
  
  // Update when authApiKey changes (e.g., when a user logs in)
  useEffect(() => {
    // Only initialize keys if they haven't been manually cleared
    if (!initialized.current) {
      initialized.current = true;

      // Set initial API key type based on current provider
      setApiKeyType(getCurrentApiProvider() === 'gemini' ? 'gemini' : 'openrouter');
      
      // Initialize Gemini API key if not set and not cleared
      if (authApiKey && !apiKey && !keyCleared.gemini) {
        onApiKeyChange(authApiKey);
      }
      
      // Initialize OpenRouter API key with the default random key if not set and not cleared
      if (onDeepseekApiKeyChange && !deepseekApiKey && !keyCleared.openrouter) {
        const savedOpenRouterKey = localStorage.getItem('openrouter-api-key');
        if (savedOpenRouterKey) {
          onDeepseekApiKeyChange(savedOpenRouterKey);
        } else {
          // Use the random default key
          const defaultKey = getDefaultOpenRouterKey();
          onDeepseekApiKeyChange(defaultKey);
          // Show a toast to inform the user about the default key
          toast.info('A random OpenRouter API key has been assigned for you', {
            description: 'You can change it anytime or use your own',
            duration: 5000
          });
        }
      }
    }
  }, [authApiKey, apiKey, onApiKeyChange, deepseekApiKey, onDeepseekApiKeyChange, keyCleared]);
  
  const openWhatsAppSupport = () => {
    window.open("https://chat.whatsapp.com/HN6dQ5HfU2w5xQtvlE6YcT", "_blank");
  };
  
  const openTutorialVideo = () => {
    window.open("https://youtu.be/MZ17lLPe9mE?si=Ep8U175PzODWq4G3", "_blank");
  };

  // Get user profile photo URL
  const getAvatarUrl = () => {
    if (!user || !user.email) return '';
    
    // Use Gravatar which will display Gmail profile photos if connected
    const emailHash = md5(user.email.trim().toLowerCase());
    
    // Using 404 as the fallback means it will show no image if not found
    // This will trigger the AvatarFallback component to show the first letter
    return `https://www.gravatar.com/avatar/${emailHash}?d=404&s=200`;
  };
  
  const navigateToHome = () => {
    navigate('/');
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };
  
  const handleSaveApiKey = () => {
    if (apiKeyType === 'openrouter') {
      if (deepseekApiKey) {
        localStorage.setItem('openrouter-api-key', deepseekApiKey);
        if (onDeepseekApiKeyChange) onDeepseekApiKeyChange(deepseekApiKey);
        setApiProvider('openrouter');
        // Reset the cleared state when saving a key
        setKeyCleared(prev => ({ ...prev, openrouter: false }));
        toast.success('OpenRouter API key saved successfully');
      } else {
        toast.error('Please enter an OpenRouter API key');
      }
    } else {
      if (apiKey) {
        localStorage.setItem('gemini-api-key', apiKey);
        onApiKeyChange(apiKey);
        setApiProvider('gemini');
        // Reset the cleared state when saving a key
        setKeyCleared(prev => ({ ...prev, gemini: false }));
        toast.success('Gemini API key saved successfully');
      } else {
        toast.error('Please enter a Gemini API key');
      }
    }
  };
  
  const handleClearApiKey = () => {
    if (apiKeyType === 'openrouter') {
      localStorage.removeItem('openrouter-api-key');
      // Mark as cleared to prevent auto-reassignment
      setKeyCleared(prev => ({ ...prev, openrouter: true }));
      // Clear the OpenRouter API key field completely
      if (onDeepseekApiKeyChange) {
        onDeepseekApiKeyChange('');
        toast.success('OpenRouter API key cleared');
      }
    } else {
      localStorage.removeItem('gemini-api-key');
      // Mark as cleared to prevent auto-reassignment
      setKeyCleared(prev => ({ ...prev, gemini: true }));
      onApiKeyChange('');
      toast.success('Gemini API key cleared');
    }
  };
  
  const handleApiKeyTypeChange = (type: 'openrouter' | 'gemini') => {
    setApiKeyType(type);
    if (type === 'gemini') {
      // When switching to Gemini, ensure Gemini is set as the provider
      setApiProvider('gemini');
    } else {
      // When switching to OpenRouter, set OpenRouter as the provider
      setApiProvider('openrouter');
      
      // Initialize with default key if not set and not cleared
      if (!deepseekApiKey && onDeepseekApiKeyChange && !keyCleared.openrouter) {
        const defaultKey = getDefaultOpenRouterKey();
        onDeepseekApiKeyChange(defaultKey);
      }
    }
  };
  
  // Get information about the API key status
  const getApiKeyInfo = () => {
    if (apiKeyType === 'openrouter') {
      const isSavedKey = localStorage.getItem('openrouter-api-key') === deepseekApiKey;
      const isDefaultKey = !isSavedKey && deepseekApiKey && !keyCleared.openrouter;
      return {
        placeholder: isDefaultKey ? "Using default OpenRouter API key" : "Enter OpenRouter API key",
        infoText: isDefaultKey ? "Random default key assigned" : undefined
      };
    } else {
      return {
        placeholder: "Enter Gemini API key",
        infoText: undefined
      };
    }
  };
  
  const apiKeyInfo = getApiKeyInfo();
  
  return <>
    {/* Static centered banner */}
    <div className="bg-yellow-400 w-full py-2">
      <div className="flex justify-center items-center h-6">
        <span className="text-black font-bold text-lg text-center">
          ঈদ মানে আনন্দ! এখন থেকে ইয়ারলি প্যাকেজ এর ওপরে থাকছে ৭২% ডিসকাউন্ট (Limited time offer) 🌙✨
        </span>
      </div>
    </div>
  
    <header className="bg-secondary border-b border-gray-700 py-2 px-4">
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <div className="flex items-center">
          <h1 onClick={navigateToHome} className="text-xl font-bold flex items-center cursor-pointer hover:opacity-80 transition-opacity">
            <img src="/new-logo.png" alt="Pixcraftai" className="h-10 w-auto mr-2" />
            <span className="text-[#f14010] text-xl font-bold">Pixcraftai</span>
          </h1>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-amber-500 border-amber-700 hover:bg-amber-900/50 hover:text-amber-400 transition-all duration-300"
            onClick={() => navigate('/pricing')}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Pricing
            <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold rounded-full px-1 transform scale-90 animate-pulse">-72%</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-green-500 border-green-700 hover:bg-green-900/50 hover:text-green-400 transition-all duration-300"
            onClick={openTutorialVideo}
          >
            <Video className="h-4 w-4 mr-1" />
            Tutorial
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-green-500 border-green-700 hover:bg-green-900/50 hover:text-green-400 transition-all duration-300"
            onClick={openWhatsAppSupport}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
            </svg>
            Community
          </Button>
          
          {/* API Key Input */}
          <div className="flex items-center ml-4">
            <span className="text-sm font-medium text-gray-400 mr-2">API Key:</span>
            
            <div className="flex flex-col">
              <Tabs 
                value={apiKeyType} 
                onValueChange={(val) => handleApiKeyTypeChange(val as 'openrouter' | 'gemini')} 
                className="mb-1"
              >
                <TabsList className="h-7 bg-gray-700/50">
                  <TabsTrigger value="gemini" className="text-xs h-5 px-2">Gemini</TabsTrigger>
                  <TabsTrigger value="openrouter" className="text-xs h-5 px-2">OpenRouter</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  placeholder={apiKeyInfo.placeholder}
                  value={apiKeyType === 'openrouter' ? (deepseekApiKey || '') : (apiKey || '')}
                  onChange={(e) => {
                    if (apiKeyType === 'openrouter') {
                      onDeepseekApiKeyChange && onDeepseekApiKeyChange(e.target.value);
                    } else {
                      onApiKeyChange(e.target.value);
                    }
                  }}
                  className="w-48 h-8 text-xs"
                />
                {apiKeyInfo.infoText && (
                  <div className="absolute -bottom-4 left-0 text-xs text-blue-400">
                    {apiKeyInfo.infoText}
                  </div>
                )}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
                  onClick={toggleShowApiKey}
                >
                  {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            
            <div className="flex ml-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={handleSaveApiKey}
              >
                Save API
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="ml-1 h-8"
                onClick={handleClearApiKey}
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="link"
                className="ml-1 h-8 text-blue-400"
                onClick={() => window.open(apiKeyType === 'openrouter' ? "https://openrouter.ai/keys" : "https://aistudio.google.com/app/apikey", "_blank")}
              >
                Get API
              </Button>
            </div>
          </div>
          
          {/* User Profile */}
          {user && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="relative h-8 w-8 rounded-full flex items-center justify-center cursor-pointer overflow-hidden ml-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl()} alt={user.email} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {profile?.is_premium && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full p-0.5 border border-black shadow-md">
                      <Diamond size={10} className="text-black" fill="black" />
                    </div>
                  )}
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <UserProfile />
              </HoverCardContent>
            </HoverCard>
          )}
          
          {/* Login Button */}
          {!user && (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700 ml-2" 
              onClick={() => navigate('/auth')}
            >
              <LogIn className="h-4 w-4 mr-1" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  </>;
};

export default AppHeader;
