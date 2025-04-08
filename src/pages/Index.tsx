
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import ApiKeyInput from '@/components/ApiKeyInput';
import ImageUploader from '@/components/ImageUploader';
import ResultsDisplay from '@/components/ResultsDisplay';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ProcessedImage } from '@/utils/imageHelpers';
import { analyzeImageWithGemini } from '@/utils/geminiApi';
import { toast } from 'sonner';
import { Sparkles, Loader2, ShieldAlert, Image, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Platform } from '@/components/PlatformSelector';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppHeader from '@/components/AppHeader';
import Sidebar from '@/components/Sidebar';

const Index: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [titleLength, setTitleLength] = useState(200);
  const [descriptionLength, setDescriptionLength] = useState(200);
  const [keywordCount, setKeywordCount] = useState(50);
  const [platform, setPlatform] = useState<Platform | null>('Shutterstock');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('metadata');
  const [selectedTab, setSelectedTab] = useState('image');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  // Default values as requested
  const [minTitleWords, setMinTitleWords] = useState(10);
  const [maxTitleWords, setMaxTitleWords] = useState(15);
  const [minKeywords, setMinKeywords] = useState(35);
  const [maxKeywords, setMaxKeywords] = useState(45);
  const [minDescriptionWords, setMinDescriptionWords] = useState(20);
  const [maxDescriptionWords, setMaxDescriptionWords] = useState(30);

  const {
    user,
    isLoading,
    canGenerateMetadata,
    incrementCreditsUsed,
    profile
  } = useAuth();

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini-api-key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);
  
  useEffect(() => {
    if (!isLoading && !user) {
      setShouldRedirect(true);
    }
  }, [isLoading, user]);

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

  const handleMinTitleWordsChange = (value: number[]) => {
    setMinTitleWords(value[0]);
  };

  const handleMaxTitleWordsChange = (value: number[]) => {
    setMaxTitleWords(value[0]);
  };

  const handleMinKeywordsChange = (value: number[]) => {
    setMinKeywords(value[0]);
  };

  const handleMaxKeywordsChange = (value: number[]) => {
    setMaxKeywords(value[0]);
  };

  const handleMinDescriptionWordsChange = (value: number[]) => {
    setMinDescriptionWords(value[0]);
  };

  const handleMaxDescriptionWordsChange = (value: number[]) => {
    setMaxDescriptionWords(value[0]);
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
            // Add a 2-second delay between processing images to respect the 15 RPM limit
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          const options = {
            titleLength,
            descriptionLength,
            keywordCount,
            platform,
            generationMode,
            minTitleWords,
            maxTitleWords,
            minKeywords,
            maxKeywords,
            minDescriptionWords,
            maxDescriptionWords
          };
          
          const result = await analyzeImageWithGemini(image.file, apiKey, options);
          
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader 
        remainingCredits={remainingCredits} 
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
      />
      
      <div className="flex flex-1">
        <Sidebar 
          selectedMode={generationMode}
          onModeChange={handleModeChange}
          minTitleWords={minTitleWords}
          onMinTitleWordsChange={handleMinTitleWordsChange}
          maxTitleWords={maxTitleWords}
          onMaxTitleWordsChange={handleMaxTitleWordsChange}
          minKeywords={minKeywords}
          onMinKeywordsChange={handleMinKeywordsChange}
          maxKeywords={maxKeywords}
          onMaxKeywordsChange={handleMaxKeywordsChange}
          minDescriptionWords={minDescriptionWords}
          onMinDescriptionWordsChange={handleMinDescriptionWordsChange}
          maxDescriptionWords={maxDescriptionWords}
          onMaxDescriptionWordsChange={handleMaxDescriptionWordsChange}
          selectedPlatform={platform}
          onPlatformChange={handlePlatformChange}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="relative w-full">
                  <div className="flex border-b border-gray-700">
                    <div 
                      className={`mode-tab ${selectedTab === 'image' ? 'active' : ''}`}
                      onClick={() => setSelectedTab('image')}
                    >
                      Image
                    </div>
                    <div 
                      className={`mode-tab ${selectedTab === 'vector' ? 'active' : ''}`}
                      onClick={() => setSelectedTab('vector')}
                    >
                      Vector
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <ImageUploader onImagesSelected={handleImagesSelected} isProcessing={isProcessing} />
              </div>
              
              {pendingCount > 0 && canGenerateMetadata && (
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={handleProcessImages} 
                    disabled={isProcessing || !apiKey} 
                    className="glow-button bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-md shadow-lg transition-all duration-300 border-none"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Process {pendingCount} Image{pendingCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {!canGenerateMetadata && (
                <div className="bg-amber-900/30 border border-amber-800/50 rounded-lg p-4 flex items-center mt-4">
                  <ShieldAlert className="h-5 w-5 text-amber-500 mr-2" />
                  <p className="text-sm text-amber-300">
                    You've reached your free limit of 10 metadata generations. Contact admin for premium access.
                  </p>
                </div>
              )}
              
              <div className="mt-8">
                <ResultsDisplay 
                  images={images} 
                  onRemoveImage={handleRemoveImage} 
                  onClearAll={handleClearAll} 
                  generationMode={generationMode} 
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
