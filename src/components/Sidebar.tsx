import React, { useState, useEffect } from 'react';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
import CustomizationControls from '@/components/CustomizationControls';
import UserProfile from '@/components/UserProfile';
import { Platform } from './PlatformSelector';
import AIGenerateToggle from './AIGenerateToggle';
import AIModelSelector, { AIModel } from './AIModelSelector';
import KeywordSettings from './KeywordSettings';
import TitleCustomization from './TitleCustomization';
import Customization from './Customization';

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
  onBaseModelChange: (model: AIModel | null) => void;
  onKeywordSettingsChange: (settings: {
    singleWord: boolean;
    doubleWord: boolean;
    mixedKeywords: boolean;
  }) => void;
  onTitleCustomizationChange?: (customization: {
    beforeTitle: string;
    afterTitle: string;
  }) => void;
  onCustomizationChange?: (settings: {
    customPrompt: boolean;
    prohibitedWords: boolean;
    transparentBackground: boolean;
  }) => void;
  onCustomPromptTextChange?: (text: string) => void;
  onProhibitedWordsChange?: (words: string) => void;
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
  onBaseModelChange,
  onKeywordSettingsChange,
  onTitleCustomizationChange,
  onCustomizationChange,
  onCustomPromptTextChange,
  onProhibitedWordsChange
}) => {
  const [aiGenerate, setAiGenerate] = useState(false);
  const [selectedAIModel, setSelectedAIModel] = useState<AIModel>('Midjourney 6');
  const isFreepikSelected = selectedPlatforms.includes('Freepik');
  const [keywordSettings, setKeywordSettings] = useState({
    singleWord: true,
    doubleWord: false,
    mixedKeywords: false
  });

  // Reset AI state when Freepik is deselected
  useEffect(() => {
    if (!isFreepikSelected) {
      setAiGenerate(false);
      onBaseModelChange(null);
    }
  }, [isFreepikSelected, onBaseModelChange]);

  const handleAIToggle = (enabled: boolean) => {
    setAiGenerate(enabled);
    if (!enabled) {
      onBaseModelChange(null);
    } else {
      // When AI is enabled, use the exact selected model
      onBaseModelChange(selectedAIModel);
    }
  };

  const handleModelChange = (model: AIModel) => {
    setSelectedAIModel(model);
    if (aiGenerate) {
      // Pass the exact selected model to parent
      onBaseModelChange(model);
    }
  };

  const handleKeywordSettingChange = (setting: keyof typeof keywordSettings) => {
    const newSettings = {
      ...keywordSettings,
      [setting]: !keywordSettings[setting]
    };
    setKeywordSettings(newSettings);
    onKeywordSettingsChange(newSettings);
  };

  const handleBeforeTitleChange = (text: string) => {
    onTitleCustomizationChange?.({
      beforeTitle: text,
      afterTitle: ''
    });
  };

  const handleAfterTitleChange = (text: string) => {
    onTitleCustomizationChange?.({
      beforeTitle: '',
      afterTitle: text
    });
  };

  return (
    <aside className="w-80 bg-secondary border-r border-gray-700 flex flex-col h-screen">
      <div className="p-3 border-b border-gray-700">
        <GenerationModeSelector selectedMode={selectedMode} onModeChange={onModeChange} />
      </div>
      
      <div className="p-4 border-b border-gray-700 flex-grow overflow-y-auto">
        {isFreepikSelected && (
          <div className="mb-6 space-y-4">
            <AIGenerateToggle 
              enabled={aiGenerate}
              onToggle={handleAIToggle}
            />
            {aiGenerate && (
              <AIModelSelector
                selectedModel={selectedAIModel}
                onModelChange={handleModelChange}
              />
            )}
          </div>
        )}

        <Customization
          onCustomizationChange={onCustomizationChange || (() => {})}
          onCustomPromptTextChange={onCustomPromptTextChange || (() => {})}
          onProhibitedWordsChange={onProhibitedWordsChange || (() => {})}
        />

        <TitleCustomization
          onBeforeTitleChange={handleBeforeTitleChange}
          onAfterTitleChange={handleAfterTitleChange}
        />

        <KeywordSettings onSettingsChange={handleKeywordSettingChange} />

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
        />
      </div>
      
      <div className="p-4 border-t border-gray-700 mt-auto">
        <UserProfile />
      </div>
    </aside>
  );
};

export default Sidebar;
