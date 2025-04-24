
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
  value: number;
  minValue: number;
  maxValue: number;
  suffix: string;
  onChange: (value: number[]) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
  label,
  value,
  minValue,
  maxValue,
  suffix,
  onChange
}) => {
  return (
    <div className="relative bg-gray-800/50 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{value} {suffix}</span>
      </div>
      <Slider 
        value={[value]} 
        min={minValue} 
        max={maxValue} 
        step={1} 
        onValueChange={onChange}
        className="w-full"
      />
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
    <div className="space-y-4">
      <SettingRow 
        label="Title Length" 
        value={titleLength} 
        minValue={5} 
        maxValue={200} 
        suffix="chars"
        onChange={onTitleLengthChange} 
      />
      
      <SettingRow 
        label="Keywords Count" 
        value={keywordsCount} 
        minValue={1} 
        maxValue={50} 
        suffix="keys"
        onChange={onKeywordsCountChange} 
      />
      
      <SettingRow 
        label="Description Length" 
        value={descriptionLength} 
        minValue={15} 
        maxValue={200} 
        suffix="chars"
        onChange={onDescriptionLengthChange} 
      />
    </div>
  );
};

export default ContentSettings;
