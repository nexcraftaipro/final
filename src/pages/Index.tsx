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
import { Sparkles, Camera, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ContentSettings from '@/components/ContentSettings';
import PlatformSelector, { Platform } from '@/components/PlatformSelector';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
const Index: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [titleLength, setTitleLength] = useState(10);
  const [descriptionLength, setDescriptionLength] = useState(15);
  const [keywordCount, setKeywordCount] = useState(25);
  const [platform, setPlatform] = useState<Platform | null>('Shutterstock');
  const [scrolled, setScrolled] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('metadata');
  const {
    user,
    isLoading,
    canGenerateMetadata,
    incrementCreditsUsed
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
          const result = await analyzeImageWithGemini(image.file, apiKey, keywordCount, titleLength, descriptionLength, platform, generationMode);
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
  return <div className="flex min-h-screen flex-col">
      <header className={`sticky top-0 z-10 transition-all duration-300 border-b ${scrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-gray-200 dark:border-gray-800' : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-transparent'}`}>
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent flex items-center">
              <Camera className="h-6 w-6 mr-2 text-primary" />
              Photo Metadata Helper
            </h1>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container py-8 space-y-8">
          

          <UserProfile />
          
          <ApiKeyInput apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
          
          <div className="glass-panel p-6 rounded-xl shadow-md glow">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500 glow-amber" />
              Processing Options
            </h2>
            
            <div className="space-y-6">
              <GenerationModeSelector selectedMode={generationMode} onModeChange={handleModeChange} />

              <PlatformSelector selectedPlatform={platform} onPlatformChange={handlePlatformChange} />
              
              <ContentSettings titleLength={titleLength} onTitleLengthChange={handleTitleLengthChange} descriptionLength={descriptionLength} onDescriptionLengthChange={handleDescriptionLengthChange} keywordsCount={keywordCount} onKeywordsCountChange={handleKeywordCountChange} />
            </div>
          </div>
          
          <ImageUploader onImagesSelected={handleImagesSelected} isProcessing={isProcessing} />
          
          {!canGenerateMetadata && <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center">
              <ShieldAlert className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                You've reached your free limit of 10 metadata generations. Contact admin for premium access.
              </p>
            </div>}
          
          {pendingCount > 0 && canGenerateMetadata && <div className="flex justify-center">
              <Button onClick={handleProcessImages} disabled={isProcessing || !apiKey} className="glow-button bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-xl transition-all duration-300">
                {isProcessing ? <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </> : <>
                    <Sparkles className="mr-2 h-5 w-5 glow-blue" />
                    Process {pendingCount} Image{pendingCount !== 1 ? 's' : ''}
                  </>}
              </Button>
            </div>}
          
          <ResultsDisplay images={images} onRemoveImage={handleRemoveImage} onClearAll={handleClearAll} generationMode={generationMode} />
        </div>
      </main>
      
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            Photo Metadata Helper — Extract metadata from images with the power of Google Gemini AI
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;