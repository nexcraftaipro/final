import React, { useState, useEffect } from 'react';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
import CustomizationControls from '@/components/CustomizationControls';
import CustomizationOptions from '@/components/CustomizationOptions';
import UserProfile from '@/components/UserProfile';
import { Platform } from './PlatformSelector';
import { useText } from '@/hooks/useText';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { setSidebarCollapsed, getSidebarCollapsed } from '@/utils/sidebarStorage';
import { toast } from 'sonner';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load sidebar state from localStorage on component mount
  useEffect(() => {
    setIsSidebarCollapsed(getSidebarCollapsed());
  }, []);
  
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    setSidebarCollapsed(newState);
    
    // Show a toast notification for mobile users
    if (window.innerWidth < 768) {
      if (newState) {
        toast.info("Sidebar hidden for better mobile view");
      } else {
        toast.info("Sidebar expanded");
      }
    }
  };
  
  if (isSidebarCollapsed) {
    return (
      <div className="bg-secondary border-r border-gray-700 flex flex-col h-screen transition-all duration-300" 
           style={{ width: '48px' }}>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="m-2 hover:bg-gray-700"
          title="Expand Sidebar"
          aria-label="Expand Sidebar"
        >
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </Button>
      </div>
    );
  }
  
  return (
    <aside className="w-80 bg-secondary border-r border-gray-700 flex flex-col h-screen overflow-auto transition-all duration-300 md:w-80 sm:w-72">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <GenerationModeSelector selectedMode={selectedMode} onModeChange={onModeChange} />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="hover:bg-gray-700"
          title="Hide Sidebar"
          aria-label="Hide Sidebar"
        >
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </Button>
      </div>
      
      <div className="p-4 border-b border-gray-700 py-[8px]">
        <h3 className="text-sm font-medium mb-4 text-[#f68003]">{t('sidebar.customization')}</h3>
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
      
      <div className="p-4 border-b border-gray-700 flex-1 overflow-auto py-[8px]">
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
      </div>
    </aside>
  );
};

export default Sidebar;
