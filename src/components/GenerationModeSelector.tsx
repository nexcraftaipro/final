
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
      <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg flex gap-2">
        <div 
          className={`flex-1 p-1 rounded-md cursor-pointer ${
            selectedMode === 'metadata' ? 'bg-blue-600' : ''
          }`}
          onClick={() => onModeChange('metadata')}
        >
          <div className="flex items-center">
            <input
              type="radio"
              id="metadata"
              checked={selectedMode === 'metadata'}
              onChange={() => onModeChange('metadata')}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full mr-2 border ${
              selectedMode === 'metadata' 
                ? 'border-white bg-white' 
                : 'border-gray-400'
            }`}>
              {selectedMode === 'metadata' && (
                <div className="w-2 h-2 bg-blue-600 rounded-full m-auto mt-1"></div>
              )}
            </div>
            <Label htmlFor="metadata" className="cursor-pointer text-white">
              Metadata
            </Label>
          </div>
        </div>
        
        <div 
          className={`flex-1 p-1 rounded-md cursor-pointer ${
            selectedMode === 'imageToPrompt' ? 'bg-blue-600' : ''
          }`}
          onClick={() => onModeChange('imageToPrompt')}
        >
          <div className="flex items-center">
            <input
              type="radio" 
              id="imageToPrompt"
              checked={selectedMode === 'imageToPrompt'}
              onChange={() => onModeChange('imageToPrompt')}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full mr-2 border ${
              selectedMode === 'imageToPrompt' 
                ? 'border-white bg-white' 
                : 'border-gray-400'
            }`}>
              {selectedMode === 'imageToPrompt' && (
                <div className="w-2 h-2 bg-blue-600 rounded-full m-auto mt-1"></div>
              )}
            </div>
            <Label htmlFor="imageToPrompt" className="cursor-pointer text-white">
              Image to Prompt
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationModeSelector;
