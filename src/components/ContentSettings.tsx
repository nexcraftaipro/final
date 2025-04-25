
import React from 'react';
import { Progress } from '@/components/ui/progress';

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
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.min(Math.max(x / rect.width, 0), 1);
    const newValue = Math.round(minValue + percentage * (maxValue - minValue));
    onChange([newValue]);
  };

  const percentage = ((value - minValue) / (maxValue - minValue)) * 100;

  return (
    <div className="bg-[#2C2C2C] rounded-xl p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-300 text-sm">{label}</span>
        <span className="text-white text-sm font-medium">{value} {suffix}</span>
      </div>
      <div 
        className="relative h-2 rounded-full cursor-pointer"
        onClick={handleClick}
      >
        <Progress
          value={percentage}
          className="h-2 rounded-full"
          indicatorClassName="bg-green-500"
        />
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
    <div className="space-y-3">
      <SettingRow 
        label="Title Length" 
        value={titleLength} 
        minValue={5} 
        maxValue={50} 
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
        maxValue={100} 
        suffix="chars"
        onChange={onDescriptionLengthChange} 
      />
    </div>
  );
};

export default ContentSettings;
