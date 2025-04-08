
import React from 'react';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
import CustomizationControls from '@/components/CustomizationControls';
import { Platform } from '@/components/PlatformSelector';

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
  onMaxKeywordsChange
}) => {
  return (
    <aside className="w-80 bg-secondary border-r border-gray-700 flex flex-col h-screen overflow-auto">
      <div className="p-4">
        <GenerationModeSelector selectedMode={selectedMode} onModeChange={onModeChange} />
      </div>
      
      <CustomizationControls 
        minTitleWords={minTitleWords}
        onMinTitleWordsChange={onMinTitleWordsChange}
        maxTitleWords={maxTitleWords}
        onMaxTitleWordsChange={onMaxTitleWordsChange}
        minKeywords={minKeywords}
        onMinKeywordsChange={onMinKeywordsChange}
        maxKeywords={maxKeywords}
        onMaxKeywordsChange={onMaxKeywordsChange}
      />
    </aside>
  );
};

export default Sidebar;
