
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileImage, MessageSquareText } from "lucide-react";

export type GenerationMode = 'metadata' | 'imageToPrompt';

interface GenerationModeSelectorProps {
  selectedMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
}

const GenerationModeSelector: React.FC<GenerationModeSelectorProps> = ({
  selectedMode,
  onModeChange
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-white">Mode Selection</h3>
      <RadioGroup 
        value={selectedMode} 
        onValueChange={(value) => onModeChange(value as GenerationMode)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className={`flex flex-col p-4 rounded-lg cursor-pointer transition-colors ${
          selectedMode === 'metadata' 
            ? 'bg-amber-900/20 border border-amber-800' 
            : 'bg-gray-800 border border-gray-700 hover:bg-gray-800/70'
        }`}>
          <RadioGroupItem value="metadata" id="metadata" className="sr-only" />
          <Label htmlFor="metadata" className="flex items-center gap-3 cursor-pointer mb-2">
            <div className="p-2 rounded-full bg-amber-900/30 text-amber-400">
              <FileImage className="h-5 w-5" />
            </div>
            <span className="text-lg font-medium text-white">Metadata</span>
          </Label>
          <p className="text-sm text-gray-400 ml-10">
            Generate SEO-friendly titles, descriptions, and keywords
          </p>
        </div>
        
        <div className={`flex flex-col p-4 rounded-lg cursor-pointer transition-colors ${
          selectedMode === 'imageToPrompt' 
            ? 'bg-orange-900/20 border border-orange-800' 
            : 'bg-gray-800 border border-gray-700 hover:bg-gray-800/70'
        }`}>
          <RadioGroupItem value="imageToPrompt" id="imageToPrompt" className="sr-only" />
          <Label htmlFor="imageToPrompt" className="flex items-center gap-3 cursor-pointer mb-2">
            <div className="p-2 rounded-full bg-orange-900/30 text-orange-400">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <span className="text-lg font-medium text-white">Image to Prompt</span>
          </Label>
          <p className="text-sm text-gray-400 ml-10">
            Convert images into detailed text prompts for AI image generators
          </p>
        </div>
      </RadioGroup>
    </div>
  );
};

export default GenerationModeSelector;
