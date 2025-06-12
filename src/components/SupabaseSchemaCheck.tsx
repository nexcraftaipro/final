import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function SupabaseSchemaCheck() {
  const [tableStatus, setTableStatus] = useState({
    users: false,
    profiles: false,
    images: false,
    image_metadata_generations: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkTables() {
      try {
        // Check users table
        const usersResult = await supabase.from('users').select('count').limit(1);
        
        // Check profiles table
        const profilesResult = await supabase.from('profiles').select('count').limit(1);
        
        // Check images table
        const imagesResult = await supabase.from('images').select('count').limit(1);
        
        // Check image_metadata_generations table
        const metadataResult = await supabase.from('image_metadata_generations').select('count').limit(1);
        
        setTableStatus({
          users: !usersResult.error,
          profiles: !profilesResult.error,
          images: !imagesResult.error,
          image_metadata_generations: !metadataResult.error
        });
      } catch (err) {
        console.error('Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    checkTables();
  }, []);

  // Count available tables
  const availableTablesCount = Object.values(tableStatus).filter(Boolean).length;

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Available Tables</h2>
      
      {loading && (
        <div className="flex items-center">
          <div className="animate-spin h-5 w-5 mr-2 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p>Checking available tables...</p>
        </div>
      )}
      
      {error && (
        <div className="text-red-600">
          <p>Error: {error}</p>
        </div>
      )}
      
      {!loading && !error && availableTablesCount === 0 && (
        <p>No accessible tables found. You may need to check your permissions.</p>
      )}
      
      {!loading && !error && availableTablesCount > 0 && (
        <div>
          <p className="mb-2">Found {availableTablesCount} accessible tables:</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Table Name</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(tableStatus).map(([tableName, isAvailable], index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                    <td className="px-4 py-2">{tableName}</td>
                    <td className="px-4 py-2">
                      {isAvailable ? (
                        <span className="text-green-600">Available</span>
                      ) : (
                        <span className="text-red-600">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 