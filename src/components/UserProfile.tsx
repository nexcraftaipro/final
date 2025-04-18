
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Check, Crown, Infinity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

const UserProfile: React.FC = () => {
  const { user, profile, signOut } = useAuth();

  if (!user || !profile) return null;

  const creditPercentage = Math.min(profile.credits_used / 10 * 100, 100);
  const remainingCredits = profile.is_premium ? '∞' : Math.max(0, 10 - profile.credits_used);

  // Generate avatar URL based on user email for consistency
  const avatarSeed = user.email || 'default';
  const avatarUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${avatarSeed}`;

  const formattedExpirationDate = profile.expiration_date 
    ? format(new Date(profile.expiration_date), 'MMM dd, yyyy')
    : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-gray-800 px-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="ring-2 ring-blue-500/50">
              <AvatarImage src={avatarUrl} alt={user.email} />
              <AvatarFallback className="bg-blue-900">
                {user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-white">{user.email}</p>
              <div className="flex items-center text-sm text-gray-400">
                {profile.is_premium ? (
                  <div className="flex flex-col">
                    <div className="flex items-center text-amber-400">
                      <Crown className="h-3 w-3 mr-1 bg-[#0d0e0d]" />
                      <span className="text-[#01fa01]">Premium User</span>
                    </div>
                    {formattedExpirationDate && (
                      <span className="text-xs text-gray-400 mt-1">
                        Expires: {formattedExpirationDate}
                      </span>
                    )}
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
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-300 hover:-translate-y-1 my-0 py-0 px-[10px] text-base mx-0"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-orange-500 text-xl">Credits remaining</span>
          <div className="flex items-center font-medium text-amber-400">
            {profile.is_premium ? <Infinity className="h-4 w-4 mr-1 rounded-xl" /> : remainingCredits}
          </div>
        </div>
        
        {!profile.is_premium && (
          <Progress 
            value={creditPercentage} 
            className="h-2 bg-gray-800" 
            indicatorClassName="bg-gradient-to-r from-amber-500 to-orange-500" 
          />
        )}
      </div>
    </div>
  );
};

export default UserProfile;
