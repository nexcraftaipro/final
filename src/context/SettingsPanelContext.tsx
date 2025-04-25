
import React, { createContext, useContext, useState, ReactNode } from 'react';

type PanelType = 'title' | 'keyword' | 'customization' | null;

interface SettingsPanelContextType {
  expandedPanel: PanelType;
  togglePanel: (panel: PanelType) => void;
}

const SettingsPanelContext = createContext<SettingsPanelContextType | undefined>(undefined);

export function useSettingsPanel() {
  const context = useContext(SettingsPanelContext);
  if (context === undefined) {
    throw new Error('useSettingsPanel must be used within a SettingsPanelProvider');
  }
  return context;
}

interface SettingsPanelProviderProps {
  children: ReactNode;
}

export function SettingsPanelProvider({ children }: SettingsPanelProviderProps) {
  // Set 'customization' as the default expanded panel
  const [expandedPanel, setExpandedPanel] = useState<PanelType>('customization');

  const togglePanel = (panel: PanelType) => {
    // If clicking the currently expanded panel, collapse it
    if (expandedPanel === panel) {
      setExpandedPanel(null);
    } else {
      // Otherwise expand the clicked panel (and collapse any other)
      setExpandedPanel(panel);
    }
  };

  return (
    <SettingsPanelContext.Provider value={{ expandedPanel, togglePanel }}>
      {children}
    </SettingsPanelContext.Provider>
  );
}
