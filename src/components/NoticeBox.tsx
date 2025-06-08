import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "notice_dismissed_time";
const DISMISS_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export function NoticeBox() {
  // Set isVisible to false by default
  const [isVisible, setIsVisible] = useState(false);
  const { profile } = useAuth();
  const isPremiumUser = profile?.is_premium ?? false;

  // Always return null to never show the notification
  return null;

  /* Original implementation below - commented out
  useEffect(() => {
    // Only check visibility if user is premium
    if (!isPremiumUser) return;

    // Check if notice should be shown
    const checkNoticeVisibility = () => {
      const dismissedTime = localStorage.getItem(STORAGE_KEY);
      if (!dismissedTime) {
        setIsVisible(true);
        return;
      }

      // Check if the dismissal time has expired
      const dismissedAt = parseInt(dismissedTime, 10);
      const currentTime = new Date().getTime();
      if (currentTime - dismissedAt >= DISMISS_DURATION) {
        setIsVisible(true);
      }
    };

    checkNoticeVisibility();
  }, [isPremiumUser]);

  const dismissNotice = () => {
    const currentTime = new Date().getTime();
    localStorage.setItem(STORAGE_KEY, currentTime.toString());
    setIsVisible(false);
  };

  // Don't render anything if user is not premium or notice shouldn't be visible
  if (!isPremiumUser || !isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 animate-fade-in">
      <div 
        className="relative w-full max-w-lg border rounded-lg shadow-lg p-6 animate-scale-in" 
        style={{ backgroundColor: "#0C60E8" }}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-2 text-white" 
          onClick={dismissNotice}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="space-y-4 mt-2" style={{ color: "#FFFFFF" }}>
          <p className="text-base leading-relaxed">
            ঈদ মানে আনন্দ! এখন থেকে ইয়ারলি প্যাকেজ এর ওপরে থাকছে ৭২% ডিসকাউন্ট!
          </p>
        </div>
      </div>
    </div>
  );
  */
} 