
/**
 * Utility to manage sidebar state with localStorage and dispatch events
 */

export const setSidebarCollapsed = (isCollapsed: boolean): void => {
  localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
  
  // Create and dispatch a custom event for components to listen to
  const event = new Event('sidebar-state-change');
  window.dispatchEvent(event);
  
  // Also dispatch a storage event for components listening to storage changes
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'sidebar-collapsed',
    newValue: isCollapsed.toString()
  }));
};

export const getSidebarCollapsed = (): boolean => {
  return localStorage.getItem('sidebar-collapsed') === 'true';
};
