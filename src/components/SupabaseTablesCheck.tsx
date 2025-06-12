import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function SupabaseTablesCheck() {
  const [tableCount, setTableCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkTableCount() {
      try {
        // Try to query the information_schema to get table count
        // This is a workaround and may not work with limited permissions
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error checking tables:', error);
          setError(error.message);
          return;
        }
        
        setTableCount(count);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    checkTableCount();
  }, []);

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Database Overview</h2>
      
      {loading && (
        <div className="flex items-center">
          <div className="animate-spin h-5 w-5 mr-2 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p>Checking database...</p>
        </div>
      )}
      
      {error && (
        <div className="text-red-600">
          <p>Error: {error}</p>
        </div>
      )}
      
      {!loading && !error && tableCount !== null && (
        <div>
          <p>Your Supabase database is connected successfully!</p>
          <p className="mt-2">Users table has {tableCount} records.</p>
        </div>
      )}
    </div>
  );
} 