import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";

interface KeywordSettingsProps {
  onSettingsChange: (settings: {
    singleWord: boolean;
    doubleWord: boolean;
    mixedKeywords: boolean;
  }) => void;
}

const KeywordSettings: React.FC<KeywordSettingsProps> = ({ onSettingsChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [singleWord, setSingleWord] = useState(true);
  const [doubleWord, setDoubleWord] = useState(false);
  const [mixedKeywords, setMixedKeywords] = useState(false);

  const handleSettingChange = (
    type: 'singleWord' | 'doubleWord' | 'mixedKeywords',
    value: boolean
  ) => {
    // If turning on one option, turn off others
    const newSettings = {
      singleWord: type === 'singleWord' ? value : false,
      doubleWord: type === 'doubleWord' ? value : false,
      mixedKeywords: type === 'mixedKeywords' ? value : false,
    };
    
    // Update local state
    setSingleWord(newSettings.singleWord);
    setDoubleWord(newSettings.doubleWord);
    setMixedKeywords(newSettings.mixedKeywords);
    
    // Notify parent component
    onSettingsChange(newSettings);
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-4 group"
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
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-200">Single-Word Keywords</div>
                <div className="text-xs text-gray-400">
                  Generates only single words, no phrases or compound terms.
                </div>
              </div>
              <Switch
                checked={singleWord}
                onCheckedChange={(checked) => handleSettingChange('singleWord', checked)}
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
                checked={doubleWord}
                onCheckedChange={(checked) => handleSettingChange('doubleWord', checked)}
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
                checked={mixedKeywords}
                onCheckedChange={(checked) => handleSettingChange('mixedKeywords', checked)}
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