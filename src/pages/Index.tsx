
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import ApiKeyInput from '@/components/ApiKeyInput';
import ImageUploader from '@/components/ImageUploader';
import ResultsDisplay from '@/components/ResultsDisplay';
import ThemeToggle from '@/components/ThemeToggle';
import UserProfile from '@/components/UserProfile';
import { Button } from '@/components/ui/button';
import { ProcessedImage } from '@/utils/imageHelpers';
import { analyzeImageWithGemini } from '@/utils/geminiApi';
import { toast } from 'sonner';
import { Sparkles, Camera, Loader2, ShieldAlert, Image, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ContentSettings from '@/components/ContentSettings';
import PlatformSelector, { Platform } from '@/components/PlatformSelector';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
import StarCursor from '@/components/StarCursor';

const Index: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [titleLength, setTitleLength] = useState(200);
  const [descriptionLength, setDescriptionLength] = useState(200);
  const [keywordCount, setKeywordCount] = useState(50);
  const [platform, setPlatform] = useState<Platform | null>('Shutterstock');
  const [scrolled, setScrolled] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('metadata');
  const [showSettings, setShowSettings] = useState(false);

  const {
    user,
    isLoading,
    canGenerateMetadata,
    incrementCreditsUsed,
    profile
  } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      setShouldRedirect(true);
    }
  }, [isLoading, user]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  if (shouldRedirect) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
  };

  const handleImagesSelected = (newImages: ProcessedImage[]) => {
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleClearAll = () => {
    setImages([]);
  };

  const handleTitleLengthChange = (value: number[]) => {
    setTitleLength(value[0]);
  };

  const handleDescriptionLengthChange = (value: number[]) => {
    setDescriptionLength(value[0]);
  };

  const handleKeywordCountChange = (value: number[]) => {
    setKeywordCount(value[0]);
  };

  const handlePlatformChange = (newPlatform: Platform) => {
    setPlatform(newPlatform);
  };

  const handleModeChange = (mode: GenerationMode) => {
    setGenerationMode(mode);
  };

  const handleProcessImages = async () => {
    if (!apiKey) {
      toast.error('Please enter your Gemini API key first');
      return;
    }

    const pendingImages = images.filter(img => img.status === 'pending');
    if (pendingImages.length === 0) {
      toast.info('No images to process');
      return;
    }

    if (!canGenerateMetadata) {
      toast.error('You have reached your free limit. Please upgrade to premium.');
      return;
    }

    const canProceed = await incrementCreditsUsed();
    if (!canProceed) {
      return;
    }

    setIsProcessing(true);
    try {
      setImages(prev => prev.map(img => img.status === 'pending' ? {
        ...img,
        status: 'processing' as const
      } : img));

      for (const image of pendingImages) {
        try {
          if (pendingImages.indexOf(image) > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          const result = await analyzeImageWithGemini(
            image.file, 
            apiKey, 
            keywordCount, 
            titleLength, 
            descriptionLength, 
            platform, 
            generationMode
          );
          
          setImages(prev => prev.map(img => img.id === image.id ? {
            ...img,
            status: result.error ? 'error' as const : 'complete' as const,
            result: result.error ? undefined : {
              title: result.title,
              description: result.description,
              keywords: result.keywords
            },
            error: result.error
          } : img));
        } catch (error) {
          console.error(`Error processing image ${image.file.name}:`, error);
          setImages(prev => prev.map(img => img.id === image.id ? {
            ...img,
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          } : img));
        }
      }
      toast.success('All images processed successfully');
    } catch (error) {
      console.error('Error during image processing:', error);
      toast.error('An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = images.filter(img => img.status === 'pending').length;
  const remainingCredits = profile?.is_premium ? '∞' : Math.max(0, 10 - (profile?.credits_used || 0));

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-200">
      <StarCursor />
      
      <header className={`sticky top-0 z-10 transition-all duration-300 border-b ${
        scrolled ? 'bg-gray-900/90 backdrop-blur-md shadow-sm border-gray-800' : 'bg-gray-900/80 backdrop-blur-sm border-transparent'
      }`}>
        <div className="container max-w-6xl mx-auto py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-600 bg-clip-text text-transparent flex items-center">
              <Image className="h-6 w-6 mr-2 text-orange-500" />
              Meta Master
            </h1>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-gray-800/60 rounded-full px-4 py-1.5">
                <span className="text-sm text-gray-400 mr-2">Credits:</span>
                <span className="text-sm font-semibold text-amber-400">{remainingCredits}</span>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main content - 8 columns */}
            <div className="lg:col-span-8 space-y-6">
              <ApiKeyInput apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
              <ImageUploader onImagesSelected={handleImagesSelected} isProcessing={isProcessing} />
              
              {pendingCount > 0 && canGenerateMetadata && (
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={handleProcessImages} 
                    disabled={isProcessing || !apiKey} 
                    className="glow-button bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg transition-all duration-300 border-none"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 glow-amber" />
                        Process {pendingCount} Image{pendingCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {!canGenerateMetadata && (
                <div className="bg-amber-900/30 border border-amber-800/50 rounded-lg p-4 flex items-center">
                  <ShieldAlert className="h-5 w-5 text-amber-500 mr-2" />
                  <p className="text-sm text-amber-300">
                    You've reached your free limit of 10 metadata generations. Contact admin for premium access.
                  </p>
                </div>
              )}
              
              <ResultsDisplay 
                images={images} 
                onRemoveImage={handleRemoveImage} 
                onClearAll={handleClearAll} 
                generationMode={generationMode} 
              />
            </div>
            
            {/* Sidebar - 4 columns */}
            <div className="lg:col-span-4 space-y-6">
              <UserProfile />
              
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <h2 className="text-xl font-semibold text-white">Generation Settings</h2>
                </div>
                
                <div className="p-4 space-y-6">
                  <GenerationModeSelector selectedMode={generationMode} onModeChange={handleModeChange} />
                  
                  <div className="border-t border-gray-800 pt-4">
                    <PlatformSelector selectedPlatform={platform} onPlatformChange={handlePlatformChange} />
                  </div>
                  
                  <div className="border-t border-gray-800 pt-4">
                    <ContentSettings 
                      titleLength={titleLength} 
                      onTitleLengthChange={handleTitleLengthChange} 
                      descriptionLength={descriptionLength} 
                      onDescriptionLengthChange={handleDescriptionLengthChange} 
                      keywordsCount={keywordCount} 
                      onKeywordsCountChange={handleKeywordCountChange} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-gray-800 py-4 mt-12">
        <div className="container max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-gray-500">
            Meta Master — Extract metadata from images with the power of Google Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
