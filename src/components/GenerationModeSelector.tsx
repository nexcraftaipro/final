
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
      <h2 className="text-xl font-medium text-gray-200">Mode Selection</h2>
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
        <RadioGroup 
          value={selectedMode} 
          onValueChange={(value) => onModeChange(value as GenerationMode)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className={`flex flex-col p-4 rounded-lg cursor-pointer transition-colors ${
            selectedMode === 'metadata' ? 'bg-green-900/20 border border-green-800' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700/70'
          }`}>
            <RadioGroupItem value="metadata" id="metadata" className="sr-only" />
            <Label htmlFor="metadata" className="flex items-center gap-3 cursor-pointer mb-2">
              <div className="p-2 rounded-full bg-green-900/30 text-green-400">
                <FileImage className="h-5 w-5" />
              </div>
              <span className="text-lg font-medium">Metadata</span>
            </Label>
            <p className="text-sm text-gray-400 ml-10">
              Generate SEO-friendly titles, descriptions, and keywords
            </p>
          </div>
          
          <div className={`flex flex-col p-4 rounded-lg cursor-pointer transition-colors ${
            selectedMode === 'imageToPrompt' ? 'bg-blue-900/20 border border-blue-800' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700/70'
          }`}>
            <RadioGroupItem value="imageToPrompt" id="imageToPrompt" className="sr-only" />
            <Label htmlFor="imageToPrompt" className="flex items-center gap-3 cursor-pointer mb-2">
              <div className="p-2 rounded-full bg-blue-900/30 text-blue-400">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <span className="text-lg font-medium">Image to Prompt</span>
            </Label>
            <p className="text-sm text-gray-400 ml-10">
              Convert images into detailed text prompts for AI image generators
            </p>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default GenerationModeSelector;
