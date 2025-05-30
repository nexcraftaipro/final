import React, { useState, useEffect } from 'react';
import { FileType, Eye, EyeOff, CreditCard, Video, FileVideo, RefreshCcw, PanelLeftClose, PanelLeftOpen, LogIn, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import md5 from 'crypto-js/md5';

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
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const navigate = useNavigate();
  const {
    user,
    apiKey: authApiKey,
    profile
  } = useAuth();
  
  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-visible');
    if (savedState !== null) {
      setSidebarVisible(savedState === 'true');
    }
    
    // Apply the sidebar visibility class to the body
    document.body.classList.toggle('sidebar-hidden', !sidebarVisible);
  }, []);

  useEffect(() => {
    // Initialize from props apiKey
    setInputKey(apiKey);
  }, [apiKey]);

  // Update when authApiKey changes (e.g., when a user logs in)
  useEffect(() => {
    if (authApiKey && !apiKey) {
      setInputKey(authApiKey);
      onApiKeyChange(authApiKey);
    }
  }, [authApiKey, apiKey, onApiKeyChange]);
  
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
  
  const openWhatsAppSupport = () => {
    window.open("https://chat.whatsapp.com/HN6dQ5HfU2w5xQtvlE6YcT", "_blank");
  };
  
  const openTutorialVideo = () => {
    window.open("https://youtu.be/MZ17lLPe9mE?si=Ep8U175PzODWq4G3", "_blank");
  };
  
  const openEpsProcessVideo = () => {
    window.open("https://youtu.be/FJL8F1vn55Q?si=dUpFZQlYSFg6Xvi8", "_blank");
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
  
  const toggleSidebar = () => {
    const newState = !sidebarVisible;
    setSidebarVisible(newState);
    localStorage.setItem('sidebar-visible', String(newState));
    document.body.classList.toggle('sidebar-hidden', !newState);
    
    // Dispatch a custom event to notify Sidebar component
    window.dispatchEvent(new CustomEvent('toggle-sidebar', { detail: { visible: newState } }));
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  return <>
    {/* Static centered banner */}
    <div className="bg-black w-full py-2">
      <div className="flex justify-center items-center h-6">
        <span className="text-white font-bold text-lg text-center">
          আপডেট: ইপিএস প্রসেসিংসহ ঈদ উপলক্ষে, কাল ইয়ারলি প্যাকেজ এর উপর একটি ডিসকাউন্ট অফার থাকছে!
        </span>
      </div>
    </div>
  
    <header className="bg-secondary border-b border-gray-700 py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 onClick={navigateToHome} className="text-xl font-bold flex items-center cursor-pointer hover:opacity-80 transition-opacity">
            <img src="/new-logo.png" alt="META CSV GENERATOR PRO" className="h-12 w-auto mr-3" />
            <span className="text-[#f14010] text-xl font-bold">Pixcraftai</span>
          </h1>
          
          {/* Sidebar toggle button - Modified to only show the icon */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="ml-4 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
            title={sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
          >
            {sidebarVisible ? 
              <PanelLeftClose className="h-4 w-4" /> : 
              <PanelLeftOpen className="h-4 w-4" />
            }
          </Button>
          
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="ml-2 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
            title="Refresh page"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Show the login button for non-authenticated users */}
          {!user && (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1" 
              onClick={() => navigate('/auth')}
            >
              <LogIn className="h-4 w-4 mr-1" />
              Login / Sign Up
            </Button>
          )}
        
          {user && <>
              <Button variant="outline" size="sm" className="text-amber-500 border-amber-700 hover:bg-amber-900/50 hover:text-amber-400 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1" onClick={() => navigate('/pricing')}>
                <CreditCard className="h-4 w-4 mr-1" />
                Pricing
              </Button>
              
              <Button variant="outline" size="sm" className="text-green-500 border-green-700 hover:bg-green-900/50 hover:text-green-400 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1" onClick={openTutorialVideo}>
                <Video className="h-4 w-4 mr-1" />
                Tutorial
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-green-500 border-green-700 hover:bg-green-900/50 hover:text-green-400 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1" 
                onClick={openWhatsAppSupport}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
                  <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                </svg>
                Community
              </Button>
            </>}
          
          <div className="flex items-center">
            <span className="text-sm mr-2 text-[#ff0000]">API Key:</span>
            <div className="relative flex-1">
              <Input 
                type={showApiKey ? "text" : "password"} 
                placeholder="Enter your Gemini API key" 
                value={inputKey} 
                onChange={e => setInputKey(e.target.value)} 
                className="h-8 bg-gray-800 border-2 border-green-500 focus:border-green-400 text-gray-200 w-60 pr-10"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-white bg-transparent"
                style={{ pointerEvents: 'auto' }}
                onClick={toggleShowApiKey}
                tabIndex={-1}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">
                  {showApiKey ? "Hide API Key" : "Show API Key"}
                </span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-400 hover:bg-gray-700 transition-all duration-300 hover:-translate-y-1" onClick={handleSaveKey}>
              Save API
            </Button>
            <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-400 hover:bg-gray-700 transition-all duration-300 hover:-translate-y-1" onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}>
              Get API
            </Button>
          </div>
          
          {user && <HoverCard>
              <HoverCardTrigger asChild>
                <div className="relative h-8 w-8 rounded-full flex items-center justify-center cursor-pointer overflow-hidden">
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
            </HoverCard>}
        </div>
      </div>
    </header>
  </>;
};

export default AppHeader;
