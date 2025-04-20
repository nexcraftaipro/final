import React from 'react';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
}[] = [
  {
    id: 'Freepik',
    icon: <Crown className="h-5 w-5 text-yellow-400" />,
    name: 'Freepik'
  },
  {
    id: 'AdobeStock',
    iconPath: '/icons/adobe.png',
    name: 'AdobeStock'
  },
  {
    id: 'Shutterstock',
    iconPath: '/icons/shutterstock.png',
    name: 'Shutterstock'
  },
  {
    id: 'Vecteezy',
    iconPath: '/icons/vecteezy.png',
    name: 'Vecteezy'
  },
  {
    id: 'Canva',
    iconPath: '/icons/canva.png',
    name: 'Canva'
  },
  {
    id: '123RF',
    iconPath: '/icons/123rf.png',
    name: '123RF'
  },
  {
    id: 'Dreamstime',
    icon: <Circle className="h-5 w-5 text-indigo-400 fill-indigo-400" />,
    name: 'Dreamstime'
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
                  "flex items-center space-x-3 rounded-lg px-4 py-2 text-sm transition-all relative overflow-hidden",
                  selectedPlatforms.includes(platform.id)
                    ? "ring-2 ring-blue-500 bg-blue-500/10"
                    : "bg-gray-800 hover:bg-gray-700"
                )}
              >
                {/* Glow Effect Overlay */}
                <div className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-300 rounded-lg pointer-events-none",
                  selectedPlatforms.includes(platform.id)
                    ? "bg-gradient-to-r from-purple-600/30 via-blue-500/30 to-cyan-400/30 opacity-100"
                    : "bg-gradient-to-r from-purple-600/30 via-blue-500/30 to-cyan-400/30 group-hover:opacity-100"
                )}
                  style={{
                    boxShadow: "0 0 15px 2px rgba(123, 97, 255, 0.3)",
                  }}
                />
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-700/50 relative z-10">
                  {platform.icon || (
                    <img 
                      src={platform.iconPath}
                      alt={platform.name}
                      className="h-7 w-7 object-contain p-0.5"
                    />
                  )}
                </div>
                <span className="text-sm text-gray-300 relative z-10">{platform.name}</span>
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
