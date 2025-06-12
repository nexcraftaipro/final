import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { extractOAuthTokensFromUrl } from '@/utils/authUtils';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if there are tokens in the URL (for implicit grant flow)
        const tokens = extractOAuthTokensFromUrl();
        
        if (tokens) {
          console.log('Found OAuth tokens in URL, setting session');
          // Handle tokens if present
        }
        
        // Handle the OAuth callback using Supabase's built-in handler
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting auth session:', error);
          setError(error.message);
          toast.error('Authentication failed. Please try again.');
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }

        // Listen for auth state change
        supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event);
          if (event === 'SIGNED_IN' && session) {
            toast.success('Signed in successfully!');
            navigate('/');
          } else if (event === 'SIGNED_OUT') {
            navigate('/auth');
          }
        });
        
        // If we get here and there's a session, navigate to home
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          toast.success('Signed in successfully!');
          navigate('/');
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
        toast.error('Authentication failed. Please try again.');
        setTimeout(() => navigate('/auth'), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-red-500 mb-4">Authentication Error</div>
        <div className="text-sm text-gray-500">{error}</div>
        <div className="mt-4 text-sm">Redirecting to login page...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <div className="text-sm text-gray-500">Completing authentication...</div>
    </div>
  );
} 