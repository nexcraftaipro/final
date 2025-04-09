
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileWarning } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Page not found</h1>
          <div className="flex justify-center my-4">
            <FileWarning className="h-20 w-20 text-amber-500" />
          </div>
          <p className="text-gray-400 mb-6">
            Looks like you've followed a broken link or entered a URL that doesn't exist on this site.
          </p>
          <div className="border-t border-gray-700 pt-6 mt-6">
            <Button 
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              <Link to="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
