
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
    imgSrc: '/lovable-uploads/62873d0a-2616-43e6-aa7d-4f07fc6af6fb.png',
    name: 'Freepik'
  },
  {
    id: 'AdobeStock',
    imgSrc: '/lovable-uploads/61b6ac51-ce03-4947-8b63-4f1a485ac31d.png',
    name: 'AdobeStock'
  },
  {
    id: 'Shutterstock',
    imgSrc: '/lovable-uploads/69bc8d70-babd-45f8-81fb-c3090c2294af.png',
    name: 'Shutterstock'
  },
  {
    id: 'Vecteezy',
    imgSrc: '/lovable-uploads/280ec0d9-4714-490a-b5cc-3657cd060fb3.png',
    name: 'Vecteezy'
  },
  {
    id: 'Canva',
    imgSrc: '/lovable-uploads/cf6db19f-768a-4f04-a4c9-3df7656020e3.png',
    name: 'Canva'
  },
  {
    id: '123RF',
    imgSrc: '/lovable-uploads/d7ac0c83-9fa5-482a-ba80-03117bc45fb0.png',
    name: '123RF'
  },
  {
    id: 'Dreamstime',
    imgSrc: '/lovable-uploads/58559f70-e0d1-40dc-bbc9-29fc0dc6ff26.png',
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
                  "flex flex-col items-center justify-center rounded-lg px-4 py-3 text-sm transition-all relative overflow-hidden group",
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
                
                <div className="flex h-14 w-14 items-center justify-center rounded bg-transparent relative z-10 mb-1">
                  <img src={platform.imgSrc} alt={platform.name} className="h-12 w-12 object-contain" />
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
