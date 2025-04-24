import React, { useState, useEffect } from 'react';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
import ContentSettings from '@/components/ContentSettings';
import UserProfile from '@/components/UserProfile';
import { Platform } from './PlatformSelector';
import AIGenerateToggle from './AIGenerateToggle';
import AIModelSelector, { AIModel } from './AIModelSelector';
import KeywordSettings from './KeywordSettings';
import TitleCustomization from './TitleCustomization';
import { KeywordSettings as KeywordSettingsType } from '@/utils/geminiApi';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { SettingsPanelProvider } from '@/context/SettingsPanelContext';

interface SidebarProps {
  selectedMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  titleLength: number;
  onTitleLengthChange: (value: number[]) => void;
  descriptionLength: number;
  onDescriptionLengthChange: (value: number[]) => void;
  keywordsCount: number;
  onKeywordsCountChange: (value: number[]) => void;
  selectedPlatforms: Platform[];
  onPlatformChange: (platforms: Platform[]) => void;
  onBaseModelChange: (model: AIModel | null) => void;
  onKeywordSettingsChange: (settings: KeywordSettingsType) => void;
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
  titleLength,
  onTitleLengthChange,
  descriptionLength,
  onDescriptionLengthChange,
  keywordsCount,
  onKeywordsCountChange,
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
  const [keywordSettings, setKeywordSettings] = useState<KeywordSettingsType>({
    singleWord: true,
    doubleWord: false,
    mixedKeywords: false
  });

  // State for section visibility
  const [metadataCustomizationExpanded, setMetadataCustomizationExpanded] = useState(false);

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

  const handleKeywordSettingChange = (newSettings: KeywordSettingsType) => {
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

        <div className="mb-6 rounded-md border border-blue-600 bg-[#111111] overflow-hidden">
          <button
            onClick={() => setMetadataCustomizationExpanded(!metadataCustomizationExpanded)}
            className="flex items-center justify-between w-full p-3 group"
            type="button"
          >
            <h3 className="text-sm font-medium text-[#f68003]">METADATA CUSTOMIZATION</h3>
            <ChevronDown 
              className={cn(
                "h-4 w-4 text-[#f68003] transition-transform duration-200",
                metadataCustomizationExpanded ? "transform rotate-180" : ""
              )}
            />
          </button>

          {metadataCustomizationExpanded && (
            <div className="p-3 pt-0">
              <ContentSettings
                titleLength={titleLength}
                onTitleLengthChange={onTitleLengthChange}
                descriptionLength={descriptionLength}
                onDescriptionLengthChange={onDescriptionLengthChange}
                keywordsCount={keywordsCount}
                onKeywordsCountChange={onKeywordsCountChange}
              />
            </div>
          )}
        </div>

        <SettingsPanelProvider>
          <TitleCustomization
            onBeforeTitleChange={handleBeforeTitleChange}
            onAfterTitleChange={handleAfterTitleChange}
          />

          <KeywordSettings onSettingsChange={handleKeywordSettingChange} />
        </SettingsPanelProvider>
      </div>
      
      <div className="p-4 border-t border-gray-700 mt-auto">
        <UserProfile />
      </div>
    </aside>
  );
};

export default Sidebar;
