
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

interface ContentSettingsProps {
  titleLength: number;
  onTitleLengthChange: (value: number[]) => void;
  descriptionLength: number;
  onDescriptionLengthChange: (value: number[]) => void;
  keywordsCount: number;
  onKeywordsCountChange: (value: number[]) => void;
}

const ContentSettings: React.FC<ContentSettingsProps> = ({
  titleLength,
  onTitleLengthChange,
  descriptionLength,
  onDescriptionLengthChange,
  keywordsCount,
  onKeywordsCountChange
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-6 rounded-xl shadow-lg text-white">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-center w-full">Customize Metadata Settings</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <div className="text-lg font-medium">
            Minimum Title Length (characters)
          </div>
          <div className="bg-blue-300/30 backdrop-blur rounded-lg p-4 flex items-center">
            <div className="text-3xl font-bold mr-auto">
              {titleLength}
            </div>
            <button className="bg-white/20 rounded p-2">
              <Info className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-lg font-medium">
            Maximum Title Length (characters)
          </div>
          <div className="bg-blue-300/30 backdrop-blur rounded-lg p-4 flex items-center">
            <div className="text-3xl font-bold mr-auto">
              30
            </div>
            <button className="bg-white/20 rounded p-2">
              <Info className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-lg font-medium">
            Minimum Number of Keywords
          </div>
          <div className="bg-blue-300/30 backdrop-blur rounded-lg p-4 flex items-center">
            <div className="text-3xl font-bold mr-auto">
              1
            </div>
            <button className="bg-white/20 rounded p-2">
              <Info className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-lg font-medium">
            Maximum Number of Keywords
          </div>
          <div className="bg-blue-300/30 backdrop-blur rounded-lg p-4 flex items-center">
            <div className="text-3xl font-bold mr-auto">
              {keywordsCount}
            </div>
            <button className="bg-white/20 rounded p-2">
              <Info className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Title Length</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-5 w-5 text-white/70" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">Adjust the length of generated titles</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-white font-medium">{titleLength} words • {titleLength > 20 ? "Long" : "Short"}</span>
          </div>
          <Slider
            value={[titleLength]}
            min={5}
            max={30}
            step={1}
            onValueChange={onTitleLengthChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white/80">
            <span>5</span>
            <span>15</span>
            <span>30</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Keywords Count</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-5 w-5 text-white/70" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">Number of keywords to generate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-white font-medium">{keywordsCount} keys • {keywordsCount > 25 ? "Comprehensive" : "Basic"}</span>
          </div>
          <Slider
            value={[keywordsCount]}
            min={1}
            max={50}
            step={1}
            onValueChange={onKeywordsCountChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white/80">
            <span>1</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Description Length</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-5 w-5 text-white/70" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">Adjust the length of generated descriptions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-white font-medium">{descriptionLength} words • {descriptionLength > 30 ? "Complete" : "Brief"}</span>
          </div>
          <Slider
            value={[descriptionLength]}
            min={15}
            max={50}
            step={1}
            onValueChange={onDescriptionLengthChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white/80">
            <span>15</span>
            <span>32</span>
            <span>50</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentSettings;
