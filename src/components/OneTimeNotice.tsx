
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface OneTimeNoticeProps {
  message: string;
  noticeId: string;
}

const OneTimeNotice = ({ message, noticeId }: OneTimeNoticeProps) => {
  useEffect(() => {
    const hasShown = localStorage.getItem(`notice-${noticeId}`);
    
    if (!hasShown) {
      // Show the notice
      toast.info(message, {
        id: noticeId,
        duration: 10000, // Extended duration (10 seconds)
        position: 'top-center',
      });
      
      // Mark as shown
      localStorage.setItem(`notice-${noticeId}`, 'true');
    }
  }, [message, noticeId]);

  // This component doesn't render anything visible
  return null;
};

export default OneTimeNotice;
