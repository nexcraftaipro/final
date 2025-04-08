
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
      <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-lg">
        <RadioGroup 
          value={selectedMode} 
          onValueChange={(value) => onModeChange(value as GenerationMode)}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="metadata" id="metadata" />
            <Label htmlFor="metadata" className="flex items-center gap-2 cursor-pointer">
              <FileImage className="h-4 w-4" />
              <span>Metadata</span>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="imageToPrompt" id="imageToPrompt" />
            <Label htmlFor="imageToPrompt" className="flex items-center gap-2 cursor-pointer">
              <MessageSquareText className="h-4 w-4" />
              <span>Image to Prompt</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default GenerationModeSelector;
