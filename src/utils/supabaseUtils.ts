
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to execute a custom SQL query (used for development/testing)
 * @param sqlQuery - The SQL query to execute
 * @returns Promise with the query result
 */
export const executeCustomQuery = async (sqlQuery: string) => {
  try {
    // This is a workaround for direct SQL execution
    // For production, it's better to use stored procedures
    const { data, error } = await supabase.rpc('execute_query', {
      query_text: sqlQuery
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('SQL Query Execution Error:', error);
    throw error;
  }
};

/**
 * Setup function to initialize the database tables and functions needed
 * This should be run once to set up the required database structure
 */
export const setupActiveSessionsTable = async () => {
  try {
    const { data, error } = await supabase.rpc('setup_active_sessions');
    
    if (error) {
      console.error('Error setting up active sessions:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Setup Error:', error);
    return false;
  }
};
