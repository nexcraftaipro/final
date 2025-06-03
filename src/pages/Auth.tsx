import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Loader2, FileType } from 'lucide-react';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { toast } from 'sonner';

const Auth: React.FC = () => {
  const [randomBgImage, setRandomBgImage] = useState<string>('');
  
  const {
    user,
    isLoading
  } = useAuth();

  // Set random background image on component mount
  useEffect(() => {
    const images = [
      '/images/auth-bg-1.jpg',
      '/images/auth-bg-2.jpg'
    ];
    const randomIndex = Math.floor(Math.random() * images.length);
    setRandomBgImage(images[randomIndex]);
  }, []);

  // Redirect if already authenticated
  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleError = (error: any) => {
    console.error('Google authentication error:', error);
    toast.error('Google authentication failed. Please try again.');
  };
  
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left section with random image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {randomBgImage && (
          <img 
            src={randomBgImage} 
            alt="Colorful portrait" 
            className="object-cover w-full h-full absolute inset-0"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/50 to-transparent">
          {/* Removed the text overlay */}
        </div>
      </div>
      
      {/* Right section with form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 md:p-16">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              <FileType className="h-8 w-8 mr-2 text-blue-600" />
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                Pixcraftai
              </span>
            </div>
          </div>
          
          {/* Login Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-center mb-2">
              Log in
            </h2>
            <h3 className="text-gray-500 dark:text-gray-400 text-center mb-8">
              Welcome back!
            </h3>
            
            <div className="space-y-5">
              <GoogleLoginButton onError={handleGoogleError} />
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              By signing in, you agree to our <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
