import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileType } from 'lucide-react';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { toast } from 'sonner';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [randomBgImage, setRandomBgImage] = useState<string>('');
  
  const {
    signIn,
    signUp,
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
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signUp(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {mode === 'signin' ? 'Log in' : 'Sign up'}
            </h2>
            <h3 className="text-gray-500 dark:text-gray-400 text-center mb-8">
              {mode === 'signin' ? 'Welcome back!' : 'Create your account'}
            </h3>
            
            {mode === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <Input 
                    id="signin-email" 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required
                    className="rounded-xl dark:bg-gray-700 p-4 h-12"
                  />
                </div>
                
                <div>
                  <Input 
                    id="signin-password" 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required
                    className="rounded-xl dark:bg-gray-700 p-4 h-12"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white h-12 text-md p-0" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 
                    <Loader2 className="h-5 w-5 animate-spin" /> : 
                    "Log in"
                  }
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-gray-800 px-4 text-gray-500 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                <GoogleLoginButton onError={handleGoogleError} />
                
                <div className="text-center mt-6">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Don't have an account? 
                    <button 
                      type="button" 
                      onClick={() => setMode('signup')} 
                      className="text-blue-600 font-semibold ml-1 hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-5">
                <div>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required
                    className="rounded-xl dark:bg-gray-700 p-4 h-12"
                  />
                </div>
                
                <div>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="Password (min. 6 characters)" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    minLength={6}
                    className="rounded-xl dark:bg-gray-700 p-4 h-12"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white h-12 text-md p-0" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 
                    <Loader2 className="h-5 w-5 animate-spin" /> : 
                    "Sign up"
                  }
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-gray-800 px-4 text-gray-500 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                <GoogleLoginButton onError={handleGoogleError} />
                
                <div className="text-center mt-6">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Already have an account? 
                    <button 
                      type="button" 
                      onClick={() => setMode('signin')} 
                      className="text-blue-600 font-semibold ml-1 hover:underline"
                    >
                      Log in
                    </button>
                  </p>
                </div>
              </form>
            )}
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
