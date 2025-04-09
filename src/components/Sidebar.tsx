import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import GenerationModeSelector, { GenerationMode } from "@/components/GenerationModeSelector";
import { Platform } from "@/components/PlatformSelector";

interface SidebarProps {
  selectedMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
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
  selectedPlatforms: Platform[];
  onPlatformChange: (platforms: Platform[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedMode,
  onModeChange,
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
  selectedPlatforms,
  onPlatformChange
}) => {
  return (
    <aside className="w-64 border-r border-gray-700 py-4 flex flex-col">
      <ScrollArea className="flex-1 space-y-4 p-4">
        <GenerationModeSelector selectedMode={selectedMode} onModeChange={onModeChange} />
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="min-title-words" className="text-sm">Min Title Words ({minTitleWords})</Label>
          <Slider
            id="min-title-words"
            min={1}
            max={30}
            step={1}
            defaultValue={[minTitleWords]}
            onValueChange={onMinTitleWordsChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-title-words" className="text-sm">Max Title Words ({maxTitleWords})</Label>
          <Slider
            id="max-title-words"
            min={1}
            max={30}
            step={1}
            defaultValue={[maxTitleWords]}
            onValueChange={onMaxTitleWordsChange}
          />
        </div>
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="min-keywords" className="text-sm">Min Keywords ({minKeywords})</Label>
          <Slider
            id="min-keywords"
            min={1}
            max={100}
            step={1}
            defaultValue={[minKeywords]}
            onValueChange={onMinKeywordsChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-keywords" className="text-sm">Max Keywords ({maxKeywords})</Label>
          <Slider
            id="max-keywords"
            min={1}
            max={100}
            step={1}
            defaultValue={[maxKeywords]}
            onValueChange={onMaxKeywordsChange}
          />
        </div>
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="min-description-words" className="text-sm">Min Description Words ({minDescriptionWords})</Label>
          <Slider
            id="min-description-words"
            min={1}
            max={50}
            step={1}
            defaultValue={[minDescriptionWords]}
            onValueChange={onMinDescriptionWordsChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-description-words" className="text-sm">Max Description Words ({maxDescriptionWords})</Label>
          <Slider
            id="max-description-words"
            min={1}
            max={50}
            step={1}
            defaultValue={[maxDescriptionWords]}
            onValueChange={onMaxDescriptionWordsChange}
          />
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
