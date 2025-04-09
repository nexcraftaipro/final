
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
    imgSrc: '/lovable-uploads/bd85c2fa-e4e3-4445-a43a-8fd48a0fcdeb.png',
    name: 'Freepik'
  },
  {
    id: 'AdobeStock',
    imgSrc: '/lovable-uploads/89332086-fa16-40a9-abff-1f946b992469.png',
    name: 'AdobeStock'
  },
  {
    id: 'Shutterstock',
    imgSrc: '/lovable-uploads/e363fb07-b380-46fe-8e0b-185a16cb6a4d.png',
    name: 'Shutterstock'
  },
  {
    id: 'Vecteezy',
    imgSrc: '/lovable-uploads/764c7b7e-771a-424d-80c9-ac25a796c0af.png',
    name: 'Vecteezy'
  },
  {
    id: 'Canva',
    imgSrc: '/lovable-uploads/8a67d08d-da17-4c8a-a5a2-e6c9125a6d3f.png',
    name: 'Canva'
  },
  {
    id: '123RF',
    imgSrc: '/lovable-uploads/5ab1838a-533f-49c4-acd7-297a2b3db26a.png',
    name: '123RF'
  },
  {
    id: 'Dreamstime',
    imgSrc: '/lovable-uploads/bfddde46-cbec-4d7b-9e5a-a7808fead3bf.png',
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
                
                <div className="flex h-12 w-12 items-center justify-center rounded bg-transparent relative z-10 mb-1">
                  <img src={platform.imgSrc} alt={platform.name} className="h-10 w-10 object-contain" />
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
