
import React from 'react';
import { Slider } from '@/components/ui/slider';
import PlatformSelector, { Platform } from '@/components/PlatformSelector';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';

interface SidebarProps {
  titleLength: number;
  onTitleLengthChange: (value: number[]) => void;
  descriptionLength: number;
  onDescriptionLengthChange: (value: number[]) => void;
  keywordsCount: number;
  onKeywordsCountChange: (value: number[]) => void;
  selectedMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  selectedPlatform: Platform | null;
  onPlatformChange: (platform: Platform) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  titleLength,
  onTitleLengthChange,
  descriptionLength,
  onDescriptionLengthChange,
  keywordsCount,
  onKeywordsCountChange,
  selectedMode,
  onModeChange,
  selectedPlatform,
  onPlatformChange
}) => {
  return (
    <aside className="w-80 bg-secondary border-r border-gray-700 flex flex-col h-screen overflow-auto">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-1/2">
            <div className="text-xs text-gray-400 mb-1">Select Theme:</div>
            <div className="flex rounded overflow-hidden">
              <div className="bg-gray-700 text-white px-3 py-1 text-xs">Dark</div>
              <div className="bg-transparent text-gray-400 px-3 py-1 text-xs">Light</div>
              <div className="bg-transparent text-gray-400 px-3 py-1 text-xs">System</div>
            </div>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Min Title Words:</div>
          <div className="flex items-center">
            <Slider
              value={[12]} 
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="ml-2 text-xs text-white bg-gray-700 px-2 py-1 rounded">12</span>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Min Title Words:</div>
          <div className="flex items-center">
            <Slider
              value={[20]} 
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="ml-2 text-xs text-white bg-gray-700 px-2 py-1 rounded">20</span>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Max Keywords:</div>
          <div className="flex items-center">
            <Slider
              value={[25]} 
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="ml-2 text-xs text-white bg-gray-700 px-2 py-1 rounded">25</span>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Max Keywords:</div>
          <div className="flex items-center">
            <Slider
              value={[30]} 
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="ml-2 text-xs text-white bg-gray-700 px-2 py-1 rounded">30</span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <GenerationModeSelector selectedMode={selectedMode} onModeChange={onModeChange} />

        <div className="mt-6">
          <PlatformSelector selectedPlatform={selectedPlatform} onPlatformChange={onPlatformChange} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
