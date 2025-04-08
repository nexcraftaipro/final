
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CustomizationControlsProps {
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
}

interface SettingRowProps {
  label: string;
  tooltip: string;
  value: number;
  minValue: number;
  maxValue: number;
  onChange: (value: number[]) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
  label,
  tooltip,
  value,
  minValue,
  maxValue,
  onChange
}) => {
  return (
    <div className="mb-3">
      <div className="text-xs text-gray-400 mb-1 flex items-center">
        {label}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-gray-400 ml-1 cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 text-gray-200 border-gray-700">
              <p className="max-w-xs text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center">
        <Slider
          value={[value]} 
          min={minValue}
          max={maxValue}
          step={1}
          className="flex-1"
          onValueChange={onChange}
        />
        <span className="ml-2 text-xs text-white bg-gray-700 px-2 py-1 rounded">{value}</span>
      </div>
    </div>
  );
};

const CustomizationControls: React.FC<CustomizationControlsProps> = ({
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
  onMaxDescriptionWordsChange
}) => {
  return (
    <div>
      <SettingRow
        label="Min Title Words:"
        tooltip="Minimum number of words for the generated title"
        value={minTitleWords}
        minValue={5}
        maxValue={30}
        onChange={onMinTitleWordsChange}
      />
      
      <SettingRow
        label="Max Title Words:"
        tooltip="Maximum number of words for the generated title"
        value={maxTitleWords}
        minValue={10}
        maxValue={50}
        onChange={onMaxTitleWordsChange}
      />
      
      <SettingRow
        label="Min Description Words:"
        tooltip="Minimum number of words for the generated description"
        value={minDescriptionWords}
        minValue={10}
        maxValue={100}
        onChange={onMinDescriptionWordsChange}
      />
      
      <SettingRow
        label="Max Description Words:"
        tooltip="Maximum number of words for the generated description"
        value={maxDescriptionWords}
        minValue={20}
        maxValue={200}
        onChange={onMaxDescriptionWordsChange}
      />
      
      <SettingRow
        label="Min Keywords:"
        tooltip="Minimum number of keywords to generate"
        value={minKeywords}
        minValue={5}
        maxValue={25}
        onChange={onMinKeywordsChange}
      />
      
      <SettingRow
        label="Max Keywords:"
        tooltip="Maximum number of keywords to generate"
        value={maxKeywords}
        minValue={10}
        maxValue={100}
        onChange={onMaxKeywordsChange}
      />
    </div>
  );
};

export default CustomizationControls;
