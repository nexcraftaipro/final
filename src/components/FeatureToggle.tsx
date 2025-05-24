import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Info, ChevronDown, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
interface FeatureToggleProps {
  title: string;
  description: string;
  bullets?: string[];
  tooltipText?: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  footer?: string;
}
const FeatureToggle: React.FC<FeatureToggleProps> = ({
  title,
  description,
  bullets = [],
  tooltipText,
  enabled,
  onEnabledChange,
  footer
}) => {
  // Check if there's any content to display
  const hasContent = description || (bullets && bullets.length > 0) || footer;
  
  return <div className="space-y-4 pt-2 border-t border-gray-700">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-white">{title}</h3>
          {tooltipText && <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-gray-400 ml-1 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 text-gray-200 border-gray-700">
                  <p className="max-w-xs text-xs">{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>}
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} className="ml-auto text-[#ff0000]" />
      </div>
      
      {enabled && hasContent && <div className="p-4 bg-gray-800/50 rounded border border-gray-700 text-xs text-gray-300 space-y-2">
          {description && <p className="font-medium">{description}</p>}
          {bullets && bullets.length > 0 && <ul className="list-disc list-inside space-y-1 text-blue-300">
              {bullets.map((item, index) => <li key={index}>{item}</li>)}
            </ul>}
          {footer && <p className="text-gray-400 mt-2">{footer}</p>}
        </div>}
    </div>;
};
export default FeatureToggle;