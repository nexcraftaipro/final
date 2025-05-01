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
  selectedPlatforms: string[];
}

interface SettingRowProps {
  label: string;
  tooltip: string;
  value: number;
  minValue: number;
  maxValue: number;
  onChange: (value: number[]) => void;
  currentValue: string;
}

const SettingRow: React.FC<SettingRowProps> = ({
  label,
  tooltip,
  value,
  minValue,
  maxValue,
  onChange,
  currentValue
}) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs text-gray-400 flex items-center">
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
        <span className="text-xs font-medium text-white bg-gray-700 px-2 py-0.5 rounded">{currentValue}</span>
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
  onMaxDescriptionWordsChange,
  selectedPlatforms
}) => {
  return (
    <div>
      <SettingRow
        label="Min Title Words"
        tooltip="Minimum number of words for the generated title"
        value={minTitleWords}
        minValue={5}
        maxValue={25}
        onChange={onMinTitleWordsChange}
        currentValue={minTitleWords.toString()}
      />
      
      <SettingRow
        label="Max Title Words"
        tooltip="Maximum number of words for the generated title"
        value={maxTitleWords}
        minValue={10}
        maxValue={25}
        onChange={onMaxTitleWordsChange}
        currentValue={maxTitleWords.toString()}
      />
      
      <SettingRow
        label="Min Keywords"
        tooltip="Minimum number of keywords to generate"
        value={minKeywords}
        minValue={5}
        maxValue={50}
        onChange={onMinKeywordsChange}
        currentValue={minKeywords.toString()}
      />
      
      <SettingRow
        label="Max Keywords"
        tooltip="Maximum number of keywords to generate"
        value={maxKeywords}
        minValue={10}
        maxValue={50}
        onChange={onMaxKeywordsChange}
        currentValue={maxKeywords.toString()}
      />
      
      <SettingRow
        label="Min Description Words"
        tooltip="Minimum number of words for the generated description"
        value={minDescriptionWords}
        minValue={5}  // Changed from 10 to 5
        maxValue={40}
        onChange={onMinDescriptionWordsChange}
        currentValue={minDescriptionWords.toString()}
      />
      
      <SettingRow
        label="Max Description Words"
        tooltip="Maximum number of words for the generated description"
        value={maxDescriptionWords}
        minValue={20}
        maxValue={40}
        onChange={onMaxDescriptionWordsChange}
        currentValue={maxDescriptionWords.toString()}
      />

      <div className={selectedPlatforms.includes('Vecteezy') ? 'block' : 'hidden'}>
        <div className="space-y-4 border border-gray-700 p-4 rounded-lg">
          <h3 className="text-md font-semibold text-amber-500">Vecteezy Output Format:</h3>
          <p className="text-sm text-gray-400">
            The output for Vecteezy platform will follow this format:
          </p>
          <div className="bg-gray-800 p-3 rounded text-xs font-mono">
            Filename,Title,Description,Keywords
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">Step-by-step guide:</h4>
            <ol className="list-decimal list-inside text-sm text-gray-300 space-y-2">
              <li>Upload your image files (JPG, PNG, EPS, etc.)</li>
              <li>Select "Vecteezy" from the platforms</li>
              <li>Click "Process" to generate metadata</li>
              <li>Download the CSV file</li>
              <li>You'll get output matching exactly this format: Filename,Title,Description,Keywords</li>
              <li>Example: Kawaii sweet Set 32.eps,Kawaii Sweet Treats Design Cute Illustrations of Candy,"charming kawaii style illustrations featuring various sweet treats","kawaii, cute, sweet, candy, dessert, bakery, illustration, design, clipart, graphics, vector, eps, set, collection, cute food, kawaii food, sweet treats, pastries, cakes, cookies, ice cream, chocolate, lollipops, macarons, donuts, cupcakes, jelly, marshmallows, whipped cream, strawberry, cherry, kawaii art, digital art, commercial use, 32 illustrations"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationControls;
