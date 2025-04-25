import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useSettingsPanel } from '@/context/SettingsPanelContext';

interface CustomizationProps {
  onCustomizationChange: (settings: {
    customPrompt: boolean;
    prohibitedWords: boolean;
    transparentBackground: boolean;
  }) => void;
  onCustomPromptTextChange: (text: string) => void;
  onProhibitedWordsChange: (words: string) => void;
}

const Customization: React.FC<CustomizationProps> = ({
  onCustomizationChange,
  onCustomPromptTextChange,
  onProhibitedWordsChange
}) => {
  const { expandedPanel, togglePanel } = useSettingsPanel();
  const isExpanded = expandedPanel === 'customization';
  const [customPrompt, setCustomPrompt] = useState(false);
  const [prohibitedWords, setProhibitedWords] = useState(false);
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');
  const [prohibitedWordsText, setProhibitedWordsText] = useState('');

  const handleSettingChange = (
    setting: 'customPrompt' | 'prohibitedWords' | 'transparentBackground',
    value: boolean
  ) => {
    const newSettings = {
      customPrompt: setting === 'customPrompt' ? value : customPrompt,
      prohibitedWords: setting === 'prohibitedWords' ? value : prohibitedWords,
      transparentBackground: setting === 'transparentBackground' ? value : transparentBackground
    };

    if (setting === 'customPrompt') setCustomPrompt(value);
    if (setting === 'prohibitedWords') setProhibitedWords(value);
    if (setting === 'transparentBackground') setTransparentBackground(value);

    onCustomizationChange(newSettings);
  };

  const handleCustomPromptTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomPromptText(e.target.value);
    onCustomPromptTextChange(e.target.value);
  };

  const handleProhibitedWordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProhibitedWordsText(e.target.value);
    onProhibitedWordsChange(e.target.value);
  };

  return (
    <div className="mb-6 rounded-md border border-blue-600 bg-[#111111] overflow-hidden">
      <button
        onClick={() => togglePanel('customization')}
        className="flex items-center justify-between w-full p-3 group"
        type="button"
      >
        <h3 className="text-sm font-medium text-[#f68003]">CUSTOMIZATION</h3>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-[#f68003] transition-transform duration-200",
            isExpanded ? "transform rotate-180" : ""
          )}
        />
      </button>

      {isExpanded && (
        <div className="space-y-4 p-3 pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-200">Custom Prompt</div>
                <div className="text-xs text-gray-400">
                  Use your own custom prompt for generation
                </div>
              </div>
              <Switch
                checked={customPrompt}
                onCheckedChange={(checked) => handleSettingChange('customPrompt', checked)}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
            {customPrompt && (
              <Textarea
                placeholder="Enter your custom prompt..."
                value={customPromptText}
                onChange={handleCustomPromptTextChange}
                className="mt-2 bg-[#1a1a1a] border-gray-700 min-h-[100px]"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-200">Prohibited Words</div>
                <div className="text-xs text-gray-400">
                  Words to exclude from generation
                </div>
              </div>
              <Switch
                checked={prohibitedWords}
                onCheckedChange={(checked) => handleSettingChange('prohibitedWords', checked)}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
            {prohibitedWords && (
              <Textarea
                placeholder="Enter prohibited words (one per line)..."
                value={prohibitedWordsText}
                onChange={handleProhibitedWordsChange}
                className="mt-2 bg-[#1a1a1a] border-gray-700"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-200">Transparent Background</div>
                <div className="text-xs text-gray-400">
                  When enabled, Gemini will:
                </div>
              </div>
              <Switch
                checked={transparentBackground}
                onCheckedChange={(checked) => handleSettingChange('transparentBackground', checked)}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
            {transparentBackground && (
              <div className="mt-2 text-xs text-gray-400 space-y-1 pl-4">
                <p>• Add "on transparent background" to the end of the title</p>
                <p>• Include "transparent background" as a keyword</p>
                <p>• Mention transparent background in the description</p>
                <p className="mt-2 italic">Use this for PNG images with transparent backgrounds to improve their discoverability.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Customization;
