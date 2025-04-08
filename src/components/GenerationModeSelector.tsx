
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
      <h3 className="text-sm font-medium text-white">Mode Selection</h3>
      <RadioGroup 
        value={selectedMode} 
        onValueChange={(value) => onModeChange(value as GenerationMode)}
        className="grid grid-cols-1 gap-3"
      >
        <div className={`flex items-center p-3 rounded cursor-pointer transition-colors ${
          selectedMode === 'metadata' 
            ? 'bg-blue-900/20 border border-blue-800' 
            : 'bg-gray-800 border border-gray-700 hover:bg-gray-800/70'
        }`}>
          <RadioGroupItem value="metadata" id="metadata" className="sr-only" />
          <Label htmlFor="metadata" className="flex items-center cursor-pointer">
            <div className="p-1.5 rounded-full bg-blue-900/30 text-blue-400 mr-2">
              <FileImage className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-medium text-white">Metadata</span>
              <p className="text-xs text-gray-400">
                Generate SEO-friendly titles, descriptions, and keywords
              </p>
            </div>
          </Label>
        </div>
        
        <div className={`flex items-center p-3 rounded cursor-pointer transition-colors ${
          selectedMode === 'imageToPrompt' 
            ? 'bg-blue-900/20 border border-blue-800' 
            : 'bg-gray-800 border border-gray-700 hover:bg-gray-800/70'
        }`}>
          <RadioGroupItem value="imageToPrompt" id="imageToPrompt" className="sr-only" />
          <Label htmlFor="imageToPrompt" className="flex items-center cursor-pointer">
            <div className="p-1.5 rounded-full bg-blue-900/30 text-blue-400 mr-2">
              <MessageSquareText className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-medium text-white">Image to Prompt</span>
              <p className="text-xs text-gray-400">
                Convert images into detailed text prompts for AI image generators
              </p>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default GenerationModeSelector;
