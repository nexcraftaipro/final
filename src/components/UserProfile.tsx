import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Crown, Infinity, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import md5 from 'crypto-js/md5';

const UserProfile: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  
  if (!user || !profile) return null;

  const creditPercentage = Math.min(profile.credits_used / 10 * 100, 100);
  const remainingCredits = profile.is_premium ? '∞' : Math.max(0, 10 - profile.credits_used);

  // Get user profile photo URL
  const getGravatarUrl = () => {
    if (!user.email) return '';
    
    // Use Gravatar which will display Gmail profile photos if connected
    const emailHash = md5(user.email.trim().toLowerCase());
    
    // Using 404 as the fallback means it will show no image if not found
    // This will trigger the AvatarFallback component to show the first letter
    return `https://www.gravatar.com/avatar/${emailHash}?d=404&s=200`;
  };
  
  const avatarUrl = getGravatarUrl();

  // Calculate time remaining if premium user
  const getTimeRemaining = () => {
    if (!profile.expiration_date) return null;
    const expirationDate = new Date(profile.expiration_date);
    if (expirationDate < new Date()) return null;
    return formatDistanceToNow(expirationDate, { addSuffix: true });
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 px-4">
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
                <div className="flex items-center text-amber-400">
                  <Crown className="h-3 w-3 mr-1 bg-[#0d0e0d]" />
                  <span className="text-[#01fa01]">Premium User</span>
                  {timeRemaining && (
                    <div className="flex items-center ml-2 text-orange-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{timeRemaining}</span>
                    </div>
                  )}
                </div>
              ) : (
                <span>Free User</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-3 border-t border-gray-800">
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

      <div className="p-4 border-t border-gray-800">
        <Button 
          variant="ghost" 
          className="w-full justify-center text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
