
import React from 'react';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type Platform = 'Freepik' | 'AdobeStock' | 'Shutterstock' | 'Vecteezy' | 'Canva' | '123RF' | 'Dreamstime';

interface PlatformSelectorProps {
  selectedPlatform: Platform | null;
  onPlatformChange: (platform: Platform) => void;
}

const platforms: {
  id: Platform;
  imgSrc: string;
  name: string;
}[] = [
  {
    id: 'Freepik',
    imgSrc: '/lovable-uploads/43c64a45-f810-4126-873a-a8d5344a4fea.png',
    name: 'Freepik'
  },
  {
    id: 'AdobeStock',
    imgSrc: '/lovable-uploads/43c64a45-f810-4126-873a-a8d5344a4fea.png',
    name: 'AdobeStock'
  },
  {
    id: 'Shutterstock',
    imgSrc: '/lovable-uploads/43c64a45-f810-4126-873a-a8d5344a4fea.png',
    name: 'Shutterstock'
  },
  {
    id: 'Vecteezy',
    imgSrc: '/lovable-uploads/43c64a45-f810-4126-873a-a8d5344a4fea.png',
    name: 'Vecteezy'
  },
  {
    id: 'Canva',
    imgSrc: '/lovable-uploads/43c64a45-f810-4126-873a-a8d5344a4fea.png',
    name: 'Canva'
  },
  {
    id: '123RF',
    imgSrc: '/lovable-uploads/43c64a45-f810-4126-873a-a8d5344a4fea.png',
    name: '123RF'
  },
  {
    id: 'Dreamstime',
    imgSrc: '/lovable-uploads/43c64a45-f810-4126-873a-a8d5344a4fea.png',
    name: 'Dreamstime'
  }
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  onPlatformChange
}) => {
  return (
    <div className="flex space-x-3 overflow-x-auto px-2 mx-0 my-0 py-3">
      {platforms.map(platform => (
        <TooltipProvider key={platform.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onPlatformChange(platform.id)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg px-6 py-4 text-sm transition-all relative overflow-hidden group min-w-[110px]",
                  selectedPlatform === platform.id
                    ? "ring-2 ring-blue-500 bg-blue-500/10"
                    : "bg-gray-800 hover:bg-gray-700"
                )}
              >
                {/* Glow Effect Overlay */}
                <div className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-300 rounded-lg pointer-events-none",
                  selectedPlatform === platform.id
                    ? "bg-gradient-to-r from-purple-600/30 via-blue-500/30 to-cyan-400/30 opacity-100"
                    : "bg-gradient-to-r from-purple-600/30 via-blue-500/30 to-cyan-400/30 group-hover:opacity-100"
                )}
                  style={{
                    boxShadow: "0 0 15px 2px rgba(123, 97, 255, 0.3)",
                  }}
                />
                
                <div className="flex h-16 w-16 items-center justify-center rounded bg-transparent relative z-10 mb-2">
                  <img 
                    src={platform.imgSrc} 
                    alt={platform.name} 
                    className="h-14 w-14 object-contain"
                    style={{ 
                      backgroundColor: "#f8f9fa", 
                      padding: "2px", 
                      borderRadius: "4px" 
                    }}
                    onError={(e) => {
                      console.error(`Failed to load image: ${platform.imgSrc}`);
                      e.currentTarget.src = '/placeholder.svg'; // Fallback to placeholder
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-200 relative z-10">{platform.name}</span>
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
