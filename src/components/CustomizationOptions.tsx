import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronRight } from 'lucide-react';
import FeatureToggle from './FeatureToggle';
import { useText } from '@/hooks/useText';

interface CustomizationOptionsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
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

const CustomizationOptions: React.FC<CustomizationOptionsProps> = ({
  enabled,
  onEnabledChange,
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
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  
  const handleResetToDefault = () => {
    onCustomPromptChange('');
  };
  
  const handleProhibitedWordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onProhibitedWordsChange(e.target.value);
  };
  
  const toggleSettings = () => {
    setSettingsExpanded(!settingsExpanded);
  };
  
  return <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded cursor-pointer hover:bg-gray-700/40 transition-colors" onClick={toggleSettings}>
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4 text-[#f68003]" />
          <h2 className="text-sm font-medium text-[#f68003]">{t('sidebar.settings')}</h2>
        </div>
        {settingsExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
      </div>

      {settingsExpanded && <div className="space-y-6 ml-2">
          {/* Silhouette */}
          <FeatureToggle 
            title={t('features.silhouette')} 
            description={t('features.silhouetteDesc')} 
            bullets={["Add \"silhouette\" to the end of the title", "Include \"silhouette\" as a keyword", "Mention silhouette in the description"]} 
            tooltipText="Use this for silhouette-style images to improve their discoverability in marketplaces." 
            enabled={silhouetteEnabled} 
            onEnabledChange={onSilhouetteEnabledChange} 
            footer="Use this for silhouette-style images to improve their discoverability in marketplaces." 
          />
          
          {/* Custom Prompt */}
          <FeatureToggle 
            title={t('features.customPrompt')} 
            description={t('features.customPromptDesc')} 
            tooltipText="Create your own custom prompt for AI-generated metadata. This will override the default prompts while still ensuring proper formatting and keyword count." 
            enabled={enabled} 
            onEnabledChange={onEnabledChange} 
          />
          
          {enabled && <div className="space-y-2 ml-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Enter your custom prompt:</span>
                <button onClick={handleResetToDefault} className="text-xs text-blue-400 hover:text-blue-300">
                  {t('general.cancel')}
                </button>
              </div>
              <textarea 
                value={customPrompt} 
                onChange={e => onCustomPromptChange(e.target.value)} 
                placeholder="Enter your custom prompt here. For example: 'Create Valentine's Day themed metadata for this image.'" 
                className="w-full h-32 px-3 py-2 text-sm rounded-md bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
              />
            </div>}
          
          {/* Transparent Background */}
          <FeatureToggle 
            title={t('features.transparentBg')} 
            description={t('features.silhouetteDesc')} 
            bullets={["Add \"on transparent background\" to the end of the title", "Include \"transparent background\" as a keyword", "Mention transparent background in the description"]} 
            tooltipText="Optimize metadata for images with transparent backgrounds to improve their discoverability in search results." 
            enabled={transparentBgEnabled} 
            onEnabledChange={onTransparentBgEnabledChange} 
            footer="Use this for PNG images with transparent backgrounds to improve their discoverability." 
          />
          
          {/* Prohibited Words */}
          <FeatureToggle 
            title={t('features.prohibitedWords')} 
            description="Words that should be avoided in the generated metadata." 
            tooltipText="Words that should be avoided in the generated metadata. The AI will try to exclude these terms from titles, descriptions, and keywords." 
            enabled={prohibitedWordsEnabled} 
            onEnabledChange={onProhibitedWordsEnabledChange} 
          />
          
          {prohibitedWordsEnabled && <div className="space-y-2 ml-4">
              <input 
                type="text" 
                value={prohibitedWords} 
                onChange={handleProhibitedWordsChange} 
                placeholder="Enter words to avoid, separated by commas (e.g., vector, clipart, cartoon)" 
                className="w-full px-3 py-2 text-sm rounded-md bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
              <p className="text-xs text-gray-400">
                Gemini will avoid using these words in the generated metadata. Separate multiple words with commas.
              </p>
            </div>}
        </div>}
    </div>;
};

export default CustomizationOptions;