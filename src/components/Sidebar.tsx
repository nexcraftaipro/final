
import React from 'react';
import PlatformSelector, { Platform } from '@/components/PlatformSelector';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
import CustomizationControls from '@/components/CustomizationControls';
import ContentSettings from '@/components/ContentSettings';

interface SidebarProps {
  titleLength: number;
  onTitleLengthChange: (value: number[]) => void;
  descriptionLength: number;
  onDescriptionLengthChange: (value: number[]) => void;
  keywordsCount: number;
  onKeywordsCountChange: (value: number[]) => void;
  selectedMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  selectedPlatform: Platform | null;
  onPlatformChange: (platform: Platform) => void;
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
  titleLength,
  onTitleLengthChange,
  descriptionLength,
  onDescriptionLengthChange,
  keywordsCount,
  onKeywordsCountChange,
  selectedMode,
  onModeChange,
  selectedPlatform,
  onPlatformChange,
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

        <div className="mt-6">
          <PlatformSelector selectedPlatform={selectedPlatform} onPlatformChange={onPlatformChange} />
        </div>

        <div className="mt-6">
          <ContentSettings
            titleLength={titleLength}
            onTitleLengthChange={onTitleLengthChange}
            descriptionLength={descriptionLength}
            onDescriptionLengthChange={onDescriptionLengthChange}
            keywordsCount={keywordsCount}
            onKeywordsCountChange={onKeywordsCountChange}
          />
        </div>
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
