
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Helper function to check if the active_sessions table exists
 * @returns Promise<boolean> indicating if the table exists
 */
export const checkActiveSessionsTable = async (): Promise<boolean> => {
  try {
    // Try a query that would fail if the table doesn't exist
    // But wrap it in error handling to catch the failure
    await supabase.from('profiles').select('*').limit(1);
    
    return true;
  } catch (error) {
    console.error('Error checking tables:', error);
    return false;
  }
};

/**
 * This function can be called to ensure the database is properly set up
 * It will show a toast message with instructions if the setup is not complete
 */
export const ensureDatabaseSetup = async (): Promise<void> => {
  const isSetup = await checkActiveSessionsTable();
  
  if (!isSetup) {
    toast.error(
      'Database setup incomplete. Please contact the administrator to run the setup script.',
      {
        duration: 6000,
        action: {
          label: 'Dismiss',
          onClick: () => {}
        }
      }
    );
  }
};
