
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white">User Profile</h2>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-800 p-2 rounded-full">
              <User className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-white">{user.email}</p>
              <div className="flex items-center text-sm text-gray-400">
                {profile.is_premium ? (
                  <div className="flex items-center text-amber-400">
                    <Crown className="h-3 w-3 mr-1" />
                    <span>Premium User</span>
                  </div>
                ) : (
                  <span>Free User</span>
                )}
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Credits Remaining</span>
            <span className="font-medium text-amber-400">{remainingCredits}</span>
          </div>
          {!profile.is_premium && (
            <Progress 
              value={creditPercentage} 
              className="h-2 bg-gray-800"
              indicatorClassName="bg-gradient-to-r from-amber-500 to-orange-500"
            />
          )}
        </div>
        
        {!profile.is_premium && profile.credits_used >= 10 && (
          <div className="bg-amber-900/30 text-amber-300 p-3 rounded-lg text-xs border border-amber-800/50">
            You've used all your free credits. Please contact admin for premium access.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
