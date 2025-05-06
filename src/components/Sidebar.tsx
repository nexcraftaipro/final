
import React, { useState, useEffect } from 'react';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
import CustomizationControls from '@/components/CustomizationControls';
import CustomizationOptions from '@/components/CustomizationOptions';
import UserProfile from '@/components/UserProfile';
import { Platform } from './PlatformSelector';
import { useText } from '@/hooks/useText';
import { Settings } from 'lucide-react';

interface SidebarProps {
  selectedMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  minTitleWords: number;
  onMinTitleWordsChange: (value: number[]) => void;
  maxTitleWords: number;
  onMaxTitleWordsChange: (value: number[]) => void;
  minKeywords: number;
  onMinKeywordsChange: (value: number[]) => void;
  maxKeywords: number;
  onMaxKeywordsChange: (value: number[]) => void;
  minDescriptionWords: number;
  onMinDescriptionWordsChange: (value: number[]) => void;
  maxDescriptionWords: number;
  onMaxDescriptionWordsChange: (value: number[]) => void;
  selectedPlatforms: Platform[];
  onPlatformChange: (platforms: Platform[]) => void;
  customPromptEnabled: boolean;
  onCustomPromptEnabledChange: (enabled: boolean) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  prohibitedWords: string;
  onProhibitedWordsChange: (words: string) => void;
  prohibitedWordsEnabled: boolean;
  onProhibitedWordsEnabledChange: (enabled: boolean) => void;
  transparentBgEnabled: boolean;
  onTransparentBgEnabledChange: (enabled: boolean) => void;
  silhouetteEnabled?: boolean;
  onSilhouetteEnabledChange?: (enabled: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedMode,
  onModeChange,
  minTitleWords,
  onMinTitleWordsChange,
  maxTitleWords,
  onMaxTitleWordsChange,
  minKeywords,
  onMinKeywordsChange,
  maxKeywords,
  onMaxKeywordsChange,
  minDescriptionWords,
  onMinDescriptionWordsChange,
  maxDescriptionWords,
  onMaxDescriptionWordsChange,
  selectedPlatforms,
  onPlatformChange,
  customPromptEnabled,
  onCustomPromptEnabledChange,
  customPrompt,
  onCustomPromptChange,
  prohibitedWords,
  onProhibitedWordsChange,
  prohibitedWordsEnabled,
  onProhibitedWordsEnabledChange,
  transparentBgEnabled,
  onTransparentBgEnabledChange,
  silhouetteEnabled = false,
  onSilhouetteEnabledChange = () => {}
}) => {
  const t = useText();
  const [isVisible, setIsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Load sidebar visibility state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-visible');
    if (savedState !== null) {
      setIsVisible(savedState === 'true');
    }
  }, []);
  
  // Listen for toggle events from the header
  useEffect(() => {
    const handleToggleSidebar = (event: CustomEvent) => {
      setIsVisible(event.detail.visible);
    };
    
    window.addEventListener('toggle-sidebar', handleToggleSidebar as EventListener);
    
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleSidebar as EventListener);
    };
  }, []);
  
  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <aside className="w-80 bg-pixcraft-navy border-r border-gray-700/50 flex flex-col h-screen overflow-auto">
      <div className="p-3 border-b border-gray-700/50">
        <GenerationModeSelector selectedMode={selectedMode} onModeChange={onModeChange} />
      </div>
      
      <div className="p-4 border-b border-gray-700/50 py-[8px]">
        <h3 className="text-sm font-medium mb-4 text-pixcraft-accent">{t('sidebar.customization')}</h3>
        <CustomizationControls 
          minTitleWords={minTitleWords} 
          onMinTitleWordsChange={onMinTitleWordsChange} 
          maxTitleWords={maxTitleWords} 
          onMaxTitleWordsChange={onMaxTitleWordsChange} 
          minKeywords={minKeywords} 
          onMinKeywordsChange={onMinKeywordsChange} 
          maxKeywords={maxKeywords} 
          onMaxKeywordsChange={onMaxKeywordsChange} 
          minDescriptionWords={minDescriptionWords} 
          onMinDescriptionWordsChange={onMinDescriptionWordsChange} 
          maxDescriptionWords={maxDescriptionWords} 
          onMaxDescriptionWordsChange={onMaxDescriptionWordsChange} 
          selectedPlatforms={selectedPlatforms} 
        />
      </div>
      
      <div className="p-4 border-b border-gray-700/50 flex-1 overflow-auto py-[8px]">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={toggleSettings}
            className="flex items-center text-pixcraft-accent hover:text-pixcraft-orange transition-colors"
          >
            <Settings className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium uppercase">Settings</span>
            <span className={`ml-1 transform transition-transform ${settingsOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>
        {settingsOpen && (
          <CustomizationOptions 
            enabled={customPromptEnabled} 
            onEnabledChange={onCustomPromptEnabledChange} 
            customPrompt={customPrompt} 
            onCustomPromptChange={onCustomPromptChange} 
            prohibitedWords={prohibitedWords} 
            onProhibitedWordsChange={onProhibitedWordsChange} 
            prohibitedWordsEnabled={prohibitedWordsEnabled} 
            onProhibitedWordsEnabledChange={onProhibitedWordsEnabledChange} 
            transparentBgEnabled={transparentBgEnabled} 
            onTransparentBgEnabledChange={onTransparentBgEnabledChange} 
            silhouetteEnabled={silhouetteEnabled} 
            onSilhouetteEnabledChange={onSilhouetteEnabledChange} 
          />
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
