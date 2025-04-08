
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContentSettingsProps {
  titleLength: number;
  onTitleLengthChange: (value: number[]) => void;
  descriptionLength: number;
  onDescriptionLengthChange: (value: number[]) => void;
  keywordsCount: number;
  onKeywordsCountChange: (value: number[]) => void;
}

interface SettingRowProps {
  label: string;
  tooltip: string;
  value: number;
  minValue: number;
  maxValue: number;
  suffix: string;
  description: string;
  onChange: (value: number[]) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
  label,
  tooltip,
  value,
  minValue,
  maxValue,
  suffix,
  description,
  onChange
}) => {
  const getMidValue = () => Math.floor((maxValue + minValue) / 2);
  
  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center gap-2">
        <div className="text-gray-200 font-medium">{label}</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="ml-auto text-green-400 font-medium">
          {value} {suffix} • {description}
        </div>
      </div>
      <Slider 
        value={[value]} 
        min={minValue} 
        max={maxValue} 
        step={1} 
        onValueChange={onChange}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{minValue}</span>
        <span>{getMidValue()}</span>
        <span>{maxValue}</span>
      </div>
    </div>
  );
};

const ContentSettings: React.FC<ContentSettingsProps> = ({
  titleLength,
  onTitleLengthChange,
  descriptionLength,
  onDescriptionLengthChange,
  keywordsCount,
  onKeywordsCountChange
}) => {
  return (
    <div className="space-y-4 p-6 rounded-xl bg-gray-900 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">Content Settings</h2>
        <div className="px-4 py-1 bg-green-900/30 text-green-400 rounded-full text-sm font-medium">
          Gemini AI
        </div>
      </div>
      
      <SettingRow 
        label="Title Length" 
        tooltip="Maximum length for the generated titles" 
        value={titleLength} 
        minValue={5} 
        maxValue={200} 
        suffix="chars" 
        description={titleLength > 100 ? "Long" : "Short"} 
        onChange={onTitleLengthChange} 
      />
      
      <SettingRow 
        label="Keywords Count" 
        tooltip="Number of keywords to generate" 
        value={keywordsCount} 
        minValue={1} 
        maxValue={50} 
        suffix="keys" 
        description={keywordsCount > 25 ? "Comprehensive" : "Basic"} 
        onChange={onKeywordsCountChange} 
      />
      
      <SettingRow 
        label="Description Length" 
        tooltip="Minimum number of characters for the generated description" 
        value={descriptionLength} 
        minValue={15} 
        maxValue={200} 
        suffix="chars" 
        description={descriptionLength > 100 ? "Complete" : "Brief"} 
        onChange={onDescriptionLengthChange} 
      />
    </div>
  );
};

export default ContentSettings;
