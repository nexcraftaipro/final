import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ApiKeyInput from '@/components/ApiKeyInput';
import ImageUploader from '@/components/ImageUploader';
import ResultsDisplay from '@/components/ResultsDisplay';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ProcessedImage } from '@/utils/imageHelpers';
import { analyzeImageWithGemini, AnalysisOptions } from '@/utils/geminiApi';
import { toast } from 'sonner';
import { Sparkles, Loader2, ShieldAlert, Image, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Platform } from '@/components/PlatformSelector';
import PlatformSelector from '@/components/PlatformSelector';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppHeader from '@/components/AppHeader';
import Sidebar from '@/components/Sidebar';
import { AIModel } from '@/components/AIModelSelector';

// Updated payment gateway link
const PAYMENT_GATEWAY_URL = "https://secure-pay.nagorikpay.com/api/execute/9c7e8b9c01fea1eabdf4d4a37b685e0a";

interface KeywordSettings {
  singleWord: boolean;
  doubleWord: boolean;
  mixedKeywords: boolean;
}

interface TitleCustomization {
  beforeTitle: string;
  afterTitle: string;
}

interface CustomizationSettings {
  customPrompt: boolean;
  customPromptText: string;
  prohibitedWords: boolean;
  prohibitedWordsList: string[];
  transparentBackground: boolean;
}

const Index: React.FC = () => {
  const {
    user,
    isLoading,
    canGenerateMetadata,
    incrementCreditsUsed,
    profile,
    apiKey: authApiKey
  } = useAuth();

  const [apiKey, setApiKey] = useState('');
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [titleLength, setTitleLength] = useState(200);
  const [descriptionLength, setDescriptionLength] = useState(200);
  const [keywordCount, setKeywordCount] = useState(50);
  const [baseModel, setBaseModel] = useState<AIModel | null>(null);
  
  // Updated to only have one platform selected by default
  const [platforms, setPlatforms] = useState<Platform[]>(['AdobeStock']);
  
  const [generationMode, setGenerationMode] = useState<GenerationMode>('metadata');
  const [selectedTab, setSelectedTab] = useState('image');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();

  // Updated default values for title and description
  const [minTitleWords, setMinTitleWords] = useState(12);
  const [maxTitleWords, setMaxTitleWords] = useState(15);
  const [minKeywords, setMinKeywords] = useState(35);
  const [maxKeywords, setMaxKeywords] = useState(45);
  const [minDescriptionWords, setMinDescriptionWords] = useState(12);
  const [maxDescriptionWords, setMaxDescriptionWords] = useState(30);
  
  const [keywordSettings, setKeywordSettings] = useState<KeywordSettings>({
    singleWord: true,
    doubleWord: false,
    mixedKeywords: false
  });
  
  const [titleCustomization, setTitleCustomization] = useState<TitleCustomization>({
    beforeTitle: '',
    afterTitle: ''
  });
  
  const [customization, setCustomization] = useState<CustomizationSettings>({
    customPrompt: false,
    customPromptText: '',
    prohibitedWords: false,
    prohibitedWordsList: [],
    transparentBackground: false
  });
  
  // Get API key from localStorage or auth context
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini-api-key') || authApiKey;
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, [authApiKey]);
  
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
  
  const handlePlatformChange = (newPlatforms: Platform[]) => {
    setPlatforms(newPlatforms);
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
  
  const handleKeywordSettingsChange = (settings: KeywordSettings) => {
    setKeywordSettings(settings);
  };
  
  const handleTitleCustomizationChange = (customization: TitleCustomization) => {
    setTitleCustomization(prev => ({
      ...prev,
      ...customization
    }));
  };
  
  const handleCustomizationChange = (settings: {
    customPrompt: boolean;
    prohibitedWords: boolean;
    transparentBackground: boolean;
  }) => {
    setCustomization(prev => ({
      ...prev,
      ...settings
    }));
  };
  
  const handleCustomPromptTextChange = (text: string) => {
    setCustomization(prev => ({
      ...prev,
      customPromptText: text
    }));
  };
  
  const handleProhibitedWordsChange = (words: string) => {
    setCustomization(prev => ({
      ...prev,
      prohibitedWordsList: words.split('\n').map(word => word.trim()).filter(Boolean)
    }));
  };
  
  const handleUpgradePlan = () => {
    window.location.href = PAYMENT_GATEWAY_URL;
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
          
          const options: AnalysisOptions = {
            titleLength,
            descriptionLength,
            keywordCount,
            platform: platforms.length === 1 ? 
              platforms[0].toLowerCase() as 'freepik' | 'shutterstock' | 'adobestock' : 
              'freepik',
            generationMode,
            minTitleWords,
            maxTitleWords,
            minKeywords,
            maxKeywords,
            minDescriptionWords,
            maxDescriptionWords,
            baseModel,
            keywordSettings,
            titleCustomization,
            customization
          };
          
          const result = await analyzeImageWithGemini(image.file, options);
          
          const isFreepikOnly = platforms.length === 1 && platforms[0] === 'Freepik';
          const isShutterstock = platforms.length === 1 && platforms[0] === 'Shutterstock';
          
          if (result.error) {
            setImages(prev => prev.map(img => img.id === image.id ? {
              ...img,
              status: 'error' as const,
              error: result.error
            } : img));
            continue;
          }
          
          setImages(prev => prev.map(img => img.id === image.id ? {
            ...img,
            status: 'complete' as const,
            result: {
              title: result.title,
              description: result.description,
              keywords: result.keywords,
              ...(isFreepikOnly && {
                prompt: result.prompt,
                baseModel: baseModel || 'None'
              }),
              ...(isShutterstock && {
                categories: result.categories
              })
            }
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
    // Add helper to check if Freepik is selected
    const isFreepikOnly = platforms.length === 1 && platforms[0] === "Freepik";
    // You should thread aiGenerate and baseModel state
    const aiGenerate =
      isFreepikOnly &&
      !!baseModel; // AI content is switched on only if baseModel is non-null
  
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
          selectedPlatforms={platforms} 
          onPlatformChange={handlePlatformChange}
          onBaseModelChange={setBaseModel}
          onKeywordSettingsChange={handleKeywordSettingsChange}
          onTitleCustomizationChange={handleTitleCustomizationChange}
          onCustomizationChange={handleCustomizationChange}
          onCustomPromptTextChange={handleCustomPromptTextChange}
          onProhibitedWordsChange={handleProhibitedWordsChange}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <div className="flex flex-col mb-4 py-[22px] my-0 mx-0 px-0">
                <h2 className="text-lg font-medium mb-2 text-[#fe6e00]">PLATFORMS:-</h2>
                <div className="flex border-b border-gray-700">
                  <PlatformSelector
                    selectedPlatforms={platforms}
                    onPlatformChange={handlePlatformChange}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <ImageUploader
                  onImagesSelected={handleImagesSelected}
                  isProcessing={isProcessing}
                />
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
                <div className="bg-amber-900/30 border border-amber-800/50 rounded-lg p-4 flex flex-col items-center mt-4">
                  <div className="flex items-center mb-2">
                    <ShieldAlert className="h-5 w-5 text-amber-500 mr-2" />
                    <p className="text-sm text-amber-300">
                      You've reached your free limit of 10 metadata generations. Upgrade for unlimited access.
                    </p>
                  </div>
                  <Button 
                    onClick={handleUpgradePlan} 
                    className="mt-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  >
                    Upgrade Now
                  </Button>
                </div>
              )}
              
              <div className="mt-8">
                <ResultsDisplay
                  images={images}
                  onRemoveImage={handleRemoveImage}
                  onClearAll={handleClearAll}
                  generationMode={generationMode}
                  selectedPlatforms={platforms}
                  aiGenerate={aiGenerate}
                  selectedBaseModel={baseModel}
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
