
import React from 'react';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type Platform = 'Freepik' | 'AdobeStock' | 'Shutterstock' | 'Vecteezy' | 'Canva' | '123RF' | 'Dreamstime';

interface PlatformSelectorProps {
  selectedPlatform: Platform | null;
  onPlatformChange: (platform: Platform) => void;
}

const platforms: { id: Platform; icon: string; name: string }[] = [
  {
    id: 'Freepik',
    icon: "👑",
    name: 'Freepik',
  },
  {
    id: 'AdobeStock',
    icon: "St",
    name: 'AdobeStock',
  },
  {
    id: 'Shutterstock',
    icon: "📷",
    name: 'Shutterstock',
  },
  {
    id: 'Vecteezy',
    icon: "🔶",
    name: 'Vecteezy',
  },
  {
    id: 'Canva',
    icon: "🔷",
    name: 'Canva',
  },
  {
    id: '123RF',
    icon: "📱",
    name: '123RF',
  },
  {
    id: 'Dreamstime',
    icon: "🌀",
    name: 'Dreamstime',
  },
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  onPlatformChange,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-white">Platform</h3>
      <div className="grid grid-cols-3 gap-2">
        {platforms.map((platform) => (
          <TooltipProvider key={platform.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onPlatformChange(platform.id)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded px-2 py-1.5 text-xs transition-all",
                    selectedPlatform === platform.id
                      ? "ring-1 ring-blue-500 bg-blue-500/10"
                      : "bg-gray-800 hover:bg-gray-700",
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-700">
                    <span className="text-sm">{platform.icon}</span>
                  </div>
                  <span className="mt-1 text-xs text-gray-300">{platform.name}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-800 text-gray-200 border-gray-700">
                <p>{platform.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

export default PlatformSelector;
