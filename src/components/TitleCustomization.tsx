import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TitleCustomizationProps {
  onBeforeTitleChange: (text: string) => void;
  onAfterTitleChange: (text: string) => void;
}

const TitleCustomization: React.FC<TitleCustomizationProps> = ({
  onBeforeTitleChange,
  onAfterTitleChange
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [beforeTitle, setBeforeTitle] = useState('');
  const [afterTitle, setAfterTitle] = useState('');

  const handleBeforeTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBeforeTitle(e.target.value);
    onBeforeTitleChange(e.target.value);
  };

  const handleAfterTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAfterTitle(e.target.value);
    onAfterTitleChange(e.target.value);
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-4 group"
      >
        <h3 className="text-sm font-medium text-[#f68003]">TITLE CUSTOMIZATION</h3>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-[#f68003] transition-transform duration-200",
            isExpanded ? "transform rotate-180" : ""
          )}
        />
      </button>

      {isExpanded && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-200">Before Title</div>
            <Input
              type="text"
              placeholder="Text before title"
              value={beforeTitle}
              onChange={handleBeforeTitleChange}
              className="bg-[#1a1a1a] border-gray-700"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-gray-200">After Title</div>
            <Input
              type="text"
              placeholder="Text after title"
              value={afterTitle}
              onChange={handleAfterTitleChange}
              className="bg-[#1a1a1a] border-gray-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TitleCustomization; 