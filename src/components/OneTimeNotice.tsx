
import React, { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Alert } from "@/components/ui/alert";
import { AlertTitle } from "@/components/ui/alert";
import { AlertDescription } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";

export function OneTimeNotice() {
  const { toast } = useToast();

  useEffect(() => {
    // Check if the notice has already been shown
    const noticeShown = localStorage.getItem('noticeShown');
    
    if (!noticeShown) {
      // Show the notice
      toast({
        title: "Important Notice",
        description: (
          <Alert className="bg-blue-950/30 border border-blue-800 text-white">
            <AlertCircle className="h-5 w-5 text-blue-400" />
            <AlertTitle className="text-blue-200 ml-2">Support Information</AlertTitle>
            <AlertDescription className="text-blue-100 ml-2">
              If you face any error, please contact the support option.
            </AlertDescription>
          </Alert>
        ),
        duration: 10000, // Show for 10 seconds
      });
      
      // Mark the notice as shown
      localStorage.setItem('noticeShown', 'true');
    }
  }, [toast]);

  return null; // This component doesn't render anything
}
