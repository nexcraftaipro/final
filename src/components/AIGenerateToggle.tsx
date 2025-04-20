import React from 'react';
import { Switch } from "@/components/ui/switch";

interface AIGenerateToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const AIGenerateToggle: React.FC<AIGenerateToggleProps> = ({
  enabled,
  onToggle
}) => {
  return (
    <div className="flex items-center justify-between space-x-2">
      <label className="text-sm text-gray-400">AI-Generated Content</label>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-blue-600"
      />
    </div>
  );
};

export default AIGenerateToggle; 