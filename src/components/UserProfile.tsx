
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Crown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const UserProfile: React.FC = () => {
  const { user, profile, signOut, canGenerateMetadata } = useAuth();

  if (!user || !profile) return null;

  const creditPercentage = Math.min((profile.credits_used / 10) * 100, 100);
  const remainingCredits = profile.is_premium ? '∞' : Math.max(0, 10 - profile.credits_used);

  return (
    <div className="glass-panel p-4 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{user.email}</p>
            <div className="flex items-center text-sm text-muted-foreground">
              {profile.is_premium ? (
                <div className="flex items-center text-amber-500">
                  <Crown className="h-3 w-3 mr-1" />
                  <span>Premium User</span>
                </div>
              ) : (
                <span>Free User</span>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-1" />
          Sign Out
        </Button>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span>Credits remaining</span>
          <span className="font-medium">{remainingCredits}</span>
        </div>
        {!profile.is_premium && (
          <Progress value={creditPercentage} className="h-2" />
        )}
      </div>
      
      {!profile.is_premium && profile.credits_used >= 10 && (
        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-2 rounded text-xs">
          You've used all your free credits. Please contact admin for premium access.
        </div>
      )}
    </div>
  );
};

export default UserProfile;
