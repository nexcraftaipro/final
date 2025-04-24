import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { KeywordSettings as KeywordSettingsType } from "@/utils/geminiApi";
import { useSettingsPanel } from '@/context/SettingsPanelContext';

interface KeywordSettingsProps {
  onSettingsChange: (settings: KeywordSettingsType) => void;
}

const DEFAULT_SETTINGS: KeywordSettingsType = {
  singleWord: true,
  doubleWord: false,
  mixedKeywords: false
};

const KeywordSettings: React.FC<KeywordSettingsProps> = ({ onSettingsChange }) => {
  const { expandedPanel, togglePanel } = useSettingsPanel();
  const isExpanded = expandedPanel === 'keyword';
  const [settings, setSettings] = useState<KeywordSettingsType>(DEFAULT_SETTINGS);

  const handleSettingChange = (type: keyof KeywordSettingsType) => {
    // If turning on one option, turn off others
    const newValue = !settings[type];
    
    // Create new settings object with only the selected option turned on
    const newSettings: KeywordSettingsType = {
      singleWord: type === 'singleWord' ? newValue : false,
      doubleWord: type === 'doubleWord' ? newValue : false,
      mixedKeywords: type === 'mixedKeywords' ? newValue : false
    };
    
    // Update local state
    setSettings(newSettings);
    
    // Notify parent component
    onSettingsChange(newSettings);
  };

  return (
    <div className="mb-6 rounded-md border border-blue-600 bg-[#111111] overflow-hidden">
      <button
        onClick={() => togglePanel('keyword')}
        className="flex items-center justify-between w-full p-3 group"
      >
        <h3 className="text-sm font-medium text-[#f68003]">KEYWORD SETTINGS</h3>
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
                <div className="text-sm text-gray-200">Single-Word Keywords</div>
                <div className="text-xs text-gray-400">
                  Generates only single words, no phrases or compound terms.
                </div>
              </div>
              <Switch
                checked={settings.singleWord}
                onCheckedChange={() => handleSettingChange('singleWord')}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-200">Double-Word Keywords</div>
                <div className="text-xs text-gray-400">
                  Generates keyword pairs and compound terms.
                </div>
              </div>
              <Switch
                checked={settings.doubleWord}
                onCheckedChange={() => handleSettingChange('doubleWord')}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-200">Mixed Keywords</div>
                <div className="text-xs text-gray-400">
                  Combines both single and multi-word keywords.
                </div>
              </div>
              <Switch
                checked={settings.mixedKeywords}
                onCheckedChange={() => handleSettingChange('mixedKeywords')}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordSettings;
