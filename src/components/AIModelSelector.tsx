import React from 'react';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AIModel = 
  | 'Freepik Flux'
  | 'Freepik Flux Fast'
  | 'Freepik Flux Realism'
  | 'Freepik Mystic 1.0'
  | 'Freepik Mystic 2.5'
  | 'Freepik Mystic 2.5 Flexible'
  | 'Freepik Pikaso'
  | 'Ideogram 1.0'
  | 'Midjourney 1'
  | 'Midjourney 2'
  | 'Midjourney 3'
  | 'Midjourney 4'
  | 'Midjourney 5'
  | 'Midjourney 5.1'
  | 'Midjourney 5.2'
  | 'Midjourney 6';

interface AIModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModel,
  onModelChange
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">AI Model</label>
      <Select value={selectedModel} onValueChange={(value) => onModelChange(value as AIModel)}>
        <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-gray-200">
          <SelectValue placeholder="Select AI Model" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          <SelectItem value="Freepik Flux">Freepik Flux</SelectItem>
          <SelectItem value="Freepik Flux Fast">Freepik Flux Fast</SelectItem>
          <SelectItem value="Freepik Flux Realism">Freepik Flux Realism</SelectItem>
          <SelectItem value="Freepik Mystic 1.0">Freepik Mystic 1.0</SelectItem>
          <SelectItem value="Freepik Mystic 2.5">Freepik Mystic 2.5</SelectItem>
          <SelectItem value="Freepik Mystic 2.5 Flexible">Freepik Mystic 2.5 Flexible</SelectItem>
          <SelectItem value="Freepik Pikaso">Freepik Pikaso</SelectItem>
          <SelectItem value="Ideogram 1.0">Ideogram 1.0</SelectItem>
          <SelectItem value="Midjourney 1">Midjourney 1</SelectItem>
          <SelectItem value="Midjourney 2">Midjourney 2</SelectItem>
          <SelectItem value="Midjourney 3">Midjourney 3</SelectItem>
          <SelectItem value="Midjourney 4">Midjourney 4</SelectItem>
          <SelectItem value="Midjourney 5">Midjourney 5</SelectItem>
          <SelectItem value="Midjourney 5.1">Midjourney 5.1</SelectItem>
          <SelectItem value="Midjourney 5.2">Midjourney 5.2</SelectItem>
          <SelectItem value="Midjourney 6">Midjourney 6</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default AIModelSelector; 