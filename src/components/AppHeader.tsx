import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Video, RefreshCcw, LogIn, Diamond, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, API_KEYS } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import md5 from 'crypto-js/md5';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentApiProvider, setApiProvider, getDefaultOpenRouterKey } from '@/utils/geminiApi';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountdownTimer from '@/components/CountdownTimer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppHeaderProps {
  remainingCredits: string | number;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  openaiApiKey?: string;
  onOpenaiApiKeyChange?: (key: string) => void;
  deepseekApiKey?: string;
  onDeepseekApiKeyChange?: (key: string) => void;
}

// Default Gemini API keys - used to detect if a premium user is using a default key
const DEFAULT_GEMINI_API_KEYS = [
  'AIzaSyDml9XSTLPg83r9LYJytVWzB225PGjjZms',
  'AIzaSyD6UM2-DYAcHWDk005-HAzBAFmZfus9fSA',
  'AIzaSyCPBg14R8PY7rh48ovIoKmpT3LHyOiPvLI',
  'AIzaSyAIstbYpqJ09epoUw_Mf1IX3ilslqW7KKc',
  'AIzaSyA_ALrz_Dq_Ng3NcIbMB1hO52xEoVtLsSw',
  'AIzaSyAMiWClJZRIQFsPktNVXWKiKN-MSF4gQXY',
  'AIzaSyBt-xmLLYomUmnlTRE1-NNyh4dpUHaDDlU',
  'AIzaSyAGheV4z8nhuVtAIF9Skfg4xkVM1-ML638',
  'AIzaSyD6wzrV3TGP6H2F0zBouHr0j3rWtC0HJ1k',
  'AIzaSyAj5cj6uFO1lZqI6cPfc8s1nQFQs03PxAA',
  'AIzaSyD3q-TvESGAf0UngLyh-H7sbieh3kUxHiI'
];

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
  // Add state to track if profile dropdown is open
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const {
    user,
    apiKey: authApiKey,
    profile
  } = useAuth();
  
  // Check if user is premium
  const isPremiumUser = profile?.is_premium ?? false;
  
  // Initialize only once after component mounts
  const initialized = useRef(false);
  
  // State to track if the countdown has expired
  const [isCountdownExpired, setIsCountdownExpired] = useState(false);
  
  // Create a target date for the countdown that persists across refreshes
  const targetDate = useRef<Date>(new Date());
  
  // Initialize the target dates from localStorage or create new ones
  useEffect(() => {
    // For the main countdown
    const storedTargetDate = localStorage.getItem('countdownTargetDate');
    
    if (storedTargetDate) {
      const targetTimestamp = parseInt(storedTargetDate, 10);
      const now = Date.now();
      
      // Check if the stored date is in the future
      if (targetTimestamp > now) {
        targetDate.current = new Date(targetTimestamp);
        setIsCountdownExpired(false); // Ensure it's not marked as expired
      } else {
        // If the stored date is in the past, the countdown has expired
        setIsCountdownExpired(true);
      }
    } else {
      // Set a new target date (7 days from now) if none exists
      const newTargetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      targetDate.current = newTargetDate;
      localStorage.setItem('countdownTargetDate', newTargetDate.getTime().toString());
      setIsCountdownExpired(false); // Ensure it's not marked as expired
    }
    
    // Log for debugging
    console.log('Countdown target date:', targetDate.current);
    console.log('Is countdown expired:', isCountdownExpired);
  }, []);
  
  // Function to handle countdown expiration
  const handleCountdownExpired = () => {
    setIsCountdownExpired(true);
  };
  
  // Function to handle pricing countdown expiration
  const handlePricingCountdownExpired = () => {
    console.log('Pricing countdown expired, will reset automatically');
  };
  
  // Update when authApiKey changes (e.g., when a user logs in)
  useEffect(() => {
    // Only initialize keys if they haven't been manually cleared
    if (!initialized.current) {
      initialized.current = true;

      // Set initial API key type based on current provider
      setApiKeyType(getCurrentApiProvider() === 'gemini' ? 'gemini' : 'openrouter');
      
      // Initialize Gemini API key if not set and not cleared
      // Only for free users - premium users must set their own key
      if (authApiKey && !apiKey && !keyCleared.gemini && !isPremiumUser) {
        onApiKeyChange(authApiKey);
      }
      
      // If user is premium and using a default key, clear it and show a message
      if (isPremiumUser) {
        const storedGeminiKey = localStorage.getItem('gemini-api-key');
        // Check if the key is likely a default key (from the auth context)
        if (storedGeminiKey && DEFAULT_GEMINI_API_KEYS.includes(storedGeminiKey)) {
          // Clear the default key for premium users
          localStorage.removeItem('gemini-api-key');
          onApiKeyChange('');
          setKeyCleared(prev => ({ ...prev, gemini: true }));
          toast.info('Premium users need to use their own Gemini API key', {
            description: 'Please set your personal Gemini API key in the profile settings',
            duration: 6000
          });
        }
      }
      
      // Initialize OpenRouter API key from localStorage if available
      if (onDeepseekApiKeyChange) {
        const savedOpenRouterKey = localStorage.getItem('openrouter-api-key');
        if (savedOpenRouterKey) {
          onDeepseekApiKeyChange(savedOpenRouterKey);
        } else {
          // Show a toast to inform the user they need to set their own key
          toast.info('OpenRouter API key required', {
            description: 'Please set your OpenRouter API key to use the service',
            duration: 5000
          });
        }
      }
    }
  }, [authApiKey, apiKey, onApiKeyChange, deepseekApiKey, onDeepseekApiKeyChange, keyCleared, isPremiumUser]);
  
  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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
    window.location.href = '/';
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
        toast.success('OpenRouter API key saved', {
          description: 'Your API key has been saved and will be used for future sessions',
          duration: 3000
        });
      } else {
        toast.error('Please enter an OpenRouter API key', {
          description: 'A valid API key is required',
          duration: 3000
        });
      }
    } else {
      if (apiKey) {
        localStorage.setItem('gemini-api-key', apiKey);
        toast.success('Gemini API key saved', {
          description: 'Your API key has been saved and will be used for future sessions',
          duration: 3000
        });
      } else {
        toast.error('Please enter a Gemini API key', {
          description: 'A valid API key is required',
          duration: 3000
        });
      }
    }
    
    // Update the current API provider
    setApiProvider(apiKeyType);
  };
  
  const handleClearApiKey = () => {
    if (apiKeyType === 'openrouter') {
      onDeepseekApiKeyChange && onDeepseekApiKeyChange('');
      localStorage.removeItem('openrouter-api-key');
      setKeyCleared(prev => ({ ...prev, openrouter: true }));
      toast.info('OpenRouter API key cleared', {
        description: 'You will need to set a new key for OpenRouter models',
        duration: 3000
      });
    } else {
      onApiKeyChange('');
      localStorage.removeItem('gemini-api-key');
      setKeyCleared(prev => ({ ...prev, gemini: true }));
      toast.info('Gemini API key cleared', {
        description: 'You will need to set a new key for Gemini models',
        duration: 3000
      });
    }
  };
  
  const handleApiKeyTypeChange = (type: 'openrouter' | 'gemini') => {
    setApiKeyType(type);
    // Also update the current API provider
    setApiProvider(type);
    
    // Show a toast about the change
    toast.info(`Switched to ${type === 'gemini' ? 'Gemini' : 'OpenRouter'} API`, {
      description: `Now using ${type === 'gemini' ? 'Google Gemini' : 'OpenRouter'} as the AI provider`,
      duration: 3000
    });
  };
  
  const getApiKeyInfo = () => {
    if (apiKeyType === 'openrouter') {
      return {
        placeholder: "Enter your OpenRouter API key (required)",
        infoText: deepseekApiKey ? "Using custom OpenRouter key" : "OpenRouter API key required"
      };
    } else {
      // Gemini
      if (isPremiumUser) {
        return {
          placeholder: "Enter your Gemini API key (required for premium)",
          infoText: apiKey ? "Valid premium Gemini key" : "Premium users must set their own key"
        };
      } else {
        // Free user
        return {
          placeholder: "Enter your Gemini API key (optional)",
          infoText: apiKey ? "Using custom Gemini key" : "Using shared Gemini key"
        };
      }
    }
  };
  
  const hasPersonalOpenRouterKey = () => {
    return !!deepseekApiKey;
  };
  
  const hasPersonalGeminiKey = () => {
    return !!apiKey;
  };
  
  const apiKeyInfo = getApiKeyInfo();
  
  return <>
    {/* Banner removed */}
  
    <header className="bg-secondary border-b border-gray-700 py-2 px-4">
      <div className="grid grid-cols-3 items-center w-full">
        {/* Logo - Left Section */}
        <div className="flex items-center">
          <h1 onClick={navigateToHome} className="text-xl font-bold flex items-center cursor-pointer hover:opacity-80 transition-opacity">
            <img src="/new-logo.png" alt="Pixcraftai" className="h-10 w-auto mr-2" />
            <span className="text-[#f14010] text-xl font-bold">Pixcraftai</span>
          </h1>
        </div>
        
        {/* Navigation buttons - Center Section */}
        <div className="flex items-center justify-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="text-amber-500 border-amber-700 hover:bg-amber-900/50 hover:text-amber-400 transition-all duration-300"
            onClick={() => navigate('/pricing')}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Pricing
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
        </div>
        
        {/* Right Section - User Profile */}
        <div className="flex items-center justify-end">
          {/* User Profile */}
          {user && (
            <div className="relative" ref={profileRef}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`relative h-8 w-8 rounded-full flex items-center justify-center cursor-pointer overflow-hidden ml-2 ${
                        (hasPersonalOpenRouterKey() && hasPersonalGeminiKey()) 
                          ? 'ring-2 ring-green-500' 
                          : 'ring-2 ring-red-500'
                      }`}
                      onClick={() => setProfileOpen(!profileOpen)}
                    >
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
                  </TooltipTrigger>
                  {!hasPersonalOpenRouterKey() && (
                    <TooltipContent>
                      <p>Set your OPEN ROUTER API key</p>
                    </TooltipContent>
                  )}
                  {isPremiumUser && !hasPersonalGeminiKey() && (
                    <TooltipContent>
                      <p>Premium users must set their own Gemini API key</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-50">
                  <div className="p-1 flex justify-end">
                    <button 
                      className="p-1 hover:bg-gray-800 rounded-full" 
                      onClick={() => setProfileOpen(false)}
                    >
                      <X size={16} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="px-2 pb-2">
                    <UserProfile />
                    
                    {/* API Key Section */}
                    <div className="mt-4 bg-gray-800 rounded-lg p-2 border border-gray-700 shadow-inner">
                      <h3 className="text-sm font-medium text-gray-300 mb-2">API Settings</h3>
                      <div className="flex flex-col">
                        <Tabs 
                          value={apiKeyType} 
                          onValueChange={(val) => handleApiKeyTypeChange(val as 'openrouter' | 'gemini')} 
                          className="mb-1"
                        >
                          <TabsList className="h-8 bg-gray-700/70 p-1 rounded-md">
                            <TabsTrigger 
                              value="gemini" 
                              className={`text-sm h-6 px-3 font-medium ${apiKeyType === 'gemini' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                            >
                              Gemini
                            </TabsTrigger>
                            <TabsTrigger 
                              value="openrouter" 
                              className={`text-sm h-6 px-3 font-medium ${apiKeyType === 'openrouter' ? 'bg-orange-600 text-white' : 'text-gray-300'}`}
                            >
                              OpenRouter
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                        
                        <div className="relative">
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
                              className={`w-full h-9 text-sm bg-gray-900 border-gray-700 focus:border-blue-500 pr-12 ${
                                isPremiumUser && apiKeyType === 'gemini' && !apiKey 
                                  ? 'border-red-500' 
                                  : ''
                              }`}
                            />
                            <div 
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md bg-gray-800 cursor-pointer hover:bg-gray-700"
                              onClick={toggleShowApiKey}
                            >
                              {showApiKey ? <EyeOff className="h-4 w-4 text-gray-300" /> : <Eye className="h-4 w-4 text-gray-300" />}
                            </div>
                          </div>
                          {apiKeyInfo.infoText && (
                            <div className={`absolute -bottom-5 left-0 text-xs ${
                              isPremiumUser && apiKeyType === 'gemini' 
                                ? 'text-amber-400' 
                                : 'text-blue-400'
                            }`}>
                              {apiKeyInfo.infoText}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                            onClick={handleSaveApiKey}
                          >
                            Save
                          </Button>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-gray-400 hover:text-white px-2"
                              onClick={handleClearApiKey}
                            >
                              Clear
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-blue-400 hover:text-blue-300 px-2"
                              onClick={() => window.open(apiKeyType === 'openrouter' ? "https://openrouter.ai/keys" : "https://aistudio.google.com/app/apikey", "_blank")}
                            >
                              Get Key
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
