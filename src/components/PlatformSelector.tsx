import React from 'react';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Camera, Crown, Diamond, Box, CircleIcon } from 'lucide-react';

export type Platform = 'Freepik' | 'AdobeStock' | 'Shutterstock' | 'Vecteezy' | 'Depositphotos' | '123RF' | 'Alamy' | 'Dreamstime';

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onPlatformChange: (platforms: Platform[]) => void;
}

const platforms: {
  id: Platform;
  icon: React.ReactNode;
  name: string;
  colors: {
    ring: string;
    bg: string;
    glow: string;
  };
}[] = [
  {
    id: 'Freepik',
    icon: <Crown className="h-5 w-5 text-yellow-400" />,
    name: 'Freepik',
    colors: {
      ring: "ring-yellow-500",
      bg: "bg-yellow-500/10",
      glow: "from-yellow-600/30 via-yellow-500/30 to-yellow-400/30"
    }
  },
  {
    id: 'AdobeStock',
    icon: <span className="text-sm font-bold">St</span>,
    name: 'AdobeStock',
    colors: {
      ring: "ring-purple-500",
      bg: "bg-purple-500/10",
      glow: "from-purple-600/30 via-purple-500/30 to-purple-400/30"
    }
  },
  {
    id: 'Shutterstock',
    icon: <Camera className="h-5 w-5 text-blue-400" />,
    name: 'Shutterstock',
    colors: {
      ring: "ring-blue-400",
      bg: "bg-blue-400/10",
      glow: "from-blue-600/30 via-blue-400/30 to-cyan-500/30"
    }
  },
  {
    id: '123RF',
    icon: <Box className="h-5 w-5 text-purple-400" />,
    name: '123RF',
    colors: {
      ring: "ring-purple-400",
      bg: "bg-purple-400/10",
      glow: "from-purple-600/30 via-purple-400/30 to-fuchsia-400/30"
    }
  },
  {
    id: 'Vecteezy',
    icon: <Diamond className="h-5 w-5 text-orange-500" />,
    name: 'Vecteezy',
    colors: {
      ring: "ring-orange-500",
      bg: "bg-orange-500/10",
      glow: "from-orange-600/30 via-orange-500/30 to-amber-400/30"
    }
  },
  {
    id: 'Depositphotos',
    icon: <Diamond className="h-5 w-5 text-blue-500" />,
    name: 'Depositphotos',
    colors: {
      ring: "ring-blue-500",
      bg: "bg-blue-500/10",
      glow: "from-blue-600/30 via-blue-500/30 to-cyan-400/30"
    }
  },
  {
    id: 'Alamy',
    icon: <CircleIcon className="h-5 w-5 text-indigo-400" />,
    name: 'Alamy',
    colors: {
      ring: "ring-indigo-400",
      bg: "bg-indigo-400/10",
      glow: "from-indigo-600/30 via-indigo-400/30 to-blue-400/30"
    }
  },
  {
    id: 'Dreamstime',
    icon: <CircleIcon className="h-5 w-5 text-green-400" />,
    name: 'Dreamstime',
    colors: {
      ring: "ring-green-500",
      bg: "bg-green-500/10",
      glow: "from-green-600/30 via-green-500/30 to-emerald-400/30"
    }
  }
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatforms,
  onPlatformChange
}) => {
  const togglePlatform = (platform: Platform) => {
    // Allow multiple platform selection
    if (selectedPlatforms.includes(platform)) {
      // Don't allow deselecting if it would result in no platforms selected
      if (selectedPlatforms.length > 1) {
        onPlatformChange(selectedPlatforms.filter(p => p !== platform));
      }
    } else {
      onPlatformChange([...selectedPlatforms, platform]);
    }
  };

  return (
    <div className="flex space-x-2 overflow-x-auto px-[6px] mx-0 my-0 py-[8px]">
      {platforms.map(platform => {
        const isSelected = selectedPlatforms.includes(platform.id);
        return (
          <TooltipProvider key={platform.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    "flex items-center space-x-2 rounded-lg px-4 py-2 text-sm transition-all relative overflow-hidden",
                    isSelected
                      ? `ring-2 ${platform.colors.ring} ${platform.colors.bg}`
                      : "bg-gray-800 hover:bg-gray-700"
                  )}
                >
                  {/* Glow Effect Overlay */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 transition-opacity duration-300 rounded-lg pointer-events-none",
                    isSelected
                      ? `bg-gradient-to-r ${platform.colors.glow} opacity-100`
                      : `bg-gradient-to-r ${platform.colors.glow} group-hover:opacity-100`
                  )}
                    style={{
                      boxShadow: isSelected ? `0 0 15px 2px rgba(${platform.id === 'Dreamstime' ? '34, 197, 94' : '123, 97, 255'}, 0.3)` : undefined,
                    }}
                  />
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-700 relative z-10">
                    {platform.icon}
                  </div>
                  <span className="text-sm text-gray-300 relative z-10">{platform.name}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-800 text-gray-200 border-gray-700">
                <p>{platform.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

export default PlatformSelector;
