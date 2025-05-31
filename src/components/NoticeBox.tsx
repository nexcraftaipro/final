import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "notice_dismissed_time";
const DISMISS_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export function NoticeBox() {
  const [isVisible, setIsVisible] = useState(false);
  const { profile } = useAuth();
  const isPremiumUser = profile?.is_premium ?? false;

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

          <p className="text-base leading-relaxed">
            যারা ইতিমধ্যেই মান্থলি প্যাকেজ নিয়েছেন, তাদের চিন্তার কোনো কারণ নেই!
          </p>
          
          <p className="text-base leading-relaxed">
            ✅ আপনি যদি এখন ডিসকাউন্ট মূল্যে ইয়ারলি প্যাকেজে আপগ্রেড করেন,<br />
            👉 তাহলে আপনার বর্তমান মান্থলি প্যাকেজের বাকি দিনগুলো<br />
            ইয়ারলি প্যাকেজের মেয়াদের সঙ্গে যুক্ত হয়ে যাবে!
          </p>
          
          <p className="font-semibold text-base leading-relaxed">
            অর্থাৎ, আপনি পাবেন এক বছরের মেয়াদ + আপনার বাকি দিনগুলো একসাথে! 🎁
          </p>
        </div>
      </div>
    </div>
  );
} 