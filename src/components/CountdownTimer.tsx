import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate?: Date;
  className?: string;
  onExpire?: () => void;
  compact?: boolean;
  storageKey?: string; // Add localStorage key for persistence
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  className, 
  onExpire, 
  compact = false,
  storageKey
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Local timer target
  const [localTargetDate, setLocalTargetDate] = useState<Date | null>(null);

  // Initialize the timer from localStorage or props
  useEffect(() => {
    let timerTarget: Date;

    if (storageKey) {
      const storedTime = localStorage.getItem(storageKey);
      
      if (storedTime) {
        const timestamp = parseInt(storedTime, 10);
        const now = Date.now();
        
        if (timestamp > now) {
          // Use the stored date if it's in the future
          timerTarget = new Date(timestamp);
        } else {
          // Create a new date if expired (24 hours from now)
          timerTarget = new Date(Date.now() + 24 * 60 * 60 * 1000);
          localStorage.setItem(storageKey, timerTarget.getTime().toString());
        }
      } else if (targetDate) {
        // Use the provided targetDate as fallback and store it
        timerTarget = targetDate;
        localStorage.setItem(storageKey, timerTarget.getTime().toString());
      } else {
        // Create a new date if nothing exists (24 hours from now)
        timerTarget = new Date(Date.now() + 24 * 60 * 60 * 1000);
        localStorage.setItem(storageKey, timerTarget.getTime().toString());
      }
    } else if (targetDate) {
      // If no storageKey, just use the provided targetDate
      timerTarget = targetDate;
    } else {
      // Fallback to 24 hours from now if nothing is provided
      timerTarget = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    setLocalTargetDate(timerTarget);
  }, [storageKey, targetDate]);

  useEffect(() => {
    // Don't start timer until localTargetDate is set
    if (!localTargetDate) return;

    const calculateTimeLeft = () => {
      const difference = localTargetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        // Timer expired
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        
        // Create a new timer target when expired
        if (storageKey) {
          const newTargetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
          setLocalTargetDate(newTargetDate);
          localStorage.setItem(storageKey, newTargetDate.getTime().toString());
        }
        
        // Call the onExpire callback if provided
        if (onExpire) {
          onExpire();
        }
      }
    };

    // Calculate immediately and then set up interval
    calculateTimeLeft();
    const timerId = setInterval(calculateTimeLeft, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(timerId);
  }, [localTargetDate, onExpire, storageKey]);

  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  if (compact) {
    // Compact display format for small spaces (like badges)
    return (
      <span className={className}>
        {timeLeft.hours}h {formatNumber(timeLeft.minutes)}m
      </span>
    );
  }

  return (
    <span className={className}>
      {timeLeft.days}d {formatNumber(timeLeft.hours)}h {formatNumber(timeLeft.minutes)}m {formatNumber(timeLeft.seconds)}s
    </span>
  );
};

export default CountdownTimer; 