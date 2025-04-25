
import React from 'react';
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown, Circle } from 'lucide-react';

export type Platform = 'Freepik' | 'AdobeStock' | 'Shutterstock' | 'Vecteezy' | 'Canva' | '123RF' | 'Dreamstime';

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onPlatformChange: (platforms: Platform[]) => void;
}

const platforms: {
  id: Platform;
  icon?: React.ReactNode;
  iconPath?: string;
  name: string;
  iconBg?: string;
}[] = [
  {
    id: 'Freepik',
    icon: <Crown className="h-5 w-5 text-yellow-400" />,
    name: 'Freepik',
    iconBg: 'bg-gray-800'
  },
  {
    id: 'AdobeStock',
    iconPath: '/icons/adobe.png',
    name: 'AdobeStock',
    iconBg: 'bg-blue-900'
  },
  {
    id: 'Shutterstock',
    iconPath: '/icons/shutterstock.png',
    name: 'Shutterstock',
    iconBg: 'bg-gray-800'
  },
  {
    id: 'Vecteezy',
    iconPath: '/icons/vecteezy.png',
    name: 'Vecteezy',
    iconBg: 'bg-gray-800'
  },
  {
    id: 'Canva',
    iconPath: '/icons/canva.png',
    name: 'Canva',
    iconBg: 'bg-gray-800'
  },
  {
    id: '123RF',
    iconPath: '/icons/123rf.png',
    name: '123RF',
    iconBg: 'bg-gray-800'
  },
  {
    id: 'Dreamstime',
    icon: <Circle className="h-5 w-5 text-indigo-400 fill-indigo-400" />,
    name: 'Dreamstime',
    iconBg: 'bg-gray-800'
  }
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onPlatformChange
}) => {
  const togglePlatform = (platform: Platform) => {
    onPlatformChange([platform]);
  };

  return (
    <div className="flex space-x-2 overflow-x-auto px-[6px] mx-0 my-0 py-[8px]">
      {platforms.map(platform => (
        <TooltipProvider key={platform.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className={cn(
                  "flex items-center space-x-2 rounded-lg px-4 py-2 transition-all relative",
                  selectedPlatforms.includes(platform.id)
                    ? "ring-2 ring-blue-500 bg-blue-500/10"
                    : "bg-gray-800/50 hover:bg-gray-700/50"
                )}
              >
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md",
                  platform.iconBg || 'bg-gray-800'
                )}>
                  {platform.icon || (
                    <img 
                      src={platform.iconPath}
                      alt={platform.name}
                      className="h-5 w-5 object-contain"
                    />
                  )}
                </div>
                <span className="text-sm text-gray-300">{platform.name}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-800 text-gray-200 border-gray-700">
              <p>{platform.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};

export default PlatformSelector;
