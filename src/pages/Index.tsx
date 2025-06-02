import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import ApiKeyInput from '@/components/ApiKeyInput';
import ImageUploader from '@/components/ImageUploader';
import ResultsDisplay from '@/components/ResultsDisplay';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ProcessedImage } from '@/utils/imageHelpers';
import { analyzeImageWithGemini, resetGeminiModelIndex } from '@/utils/geminiApi';
import { toast } from 'sonner';
import { Sparkles, Loader2, ShieldAlert, Image, Info, Film, LogIn, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Platform } from '@/components/PlatformSelector';
import PlatformSelector from '@/components/PlatformSelector';
import GenerationModeSelector, { GenerationMode } from '@/components/GenerationModeSelector';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppHeader from '@/components/AppHeader';
import Sidebar from '@/components/Sidebar';
import { isSvgFile } from '@/utils/svgToPng';
import { isVideoFile } from '@/utils/videoProcessor';
import { setupVideoDebug, testVideoSupport, testSpecificVideo } from '@/utils/videoDebug';

// Updated payment gateway link
const PAYMENT_GATEWAY_URL = "https://meta.pixcraftai.com/pricing";

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
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('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');
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [titleLength, setTitleLength] = useState([10, 15]);
  const [descriptionLength, setDescriptionLength] = useState(200);
  const [keywordCount, setKeywordCount] = useState(50);
  
  // Updated to only have the first three platforms selected by default
  const [platforms, setPlatforms] = useState<Platform[]>(['Freepik', 'AdobeStock', 'Shutterstock']);
  
  const [generationMode, setGenerationMode] = useState<GenerationMode>('metadata');
  const [selectedTab, setSelectedTab] = useState('image');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();

  // Updated default values for title and description
  const [minTitleWords, setMinTitleWords] = useState(8);
  const [maxTitleWords, setMaxTitleWords] = useState(18);
  const [minKeywords, setMinKeywords] = useState(43);
  const [maxKeywords, setMaxKeywords] = useState(48);
  const [minDescriptionWords, setMinDescriptionWords] = useState(12); // Updated to 12
  const [maxDescriptionWords, setMaxDescriptionWords] = useState(30);
  
  // Custom prompt state
  const [customPromptEnabled, setCustomPromptEnabled] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [prohibitedWords, setProhibitedWords] = useState('');
  const [prohibitedWordsEnabled, setProhibitedWordsEnabled] = useState(false);
  const [transparentBgEnabled, setTransparentBgEnabled] = useState(false);
  const [silhouetteEnabled, setSilhouetteEnabled] = useState(false);
  const [singleWordKeywordsEnabled, setSingleWordKeywordsEnabled] = useState(true);
  
  // Initialize API keys from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini-api-key');
    const savedOpenaiKey = localStorage.getItem('openai-api-key');
    const savedOpenrouterKey = localStorage.getItem('openrouter-api-key') || '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';
    
    if (savedKey) setApiKey(savedKey);
    if (savedOpenaiKey) setOpenaiApiKey(savedOpenaiKey);
    if (savedOpenrouterKey) setDeepseekApiKey(savedOpenrouterKey);
    
    // Reset the Gemini model index on page load
    resetGeminiModelIndex();
  }, []);
  
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  
  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
  };
  
  const handleOpenaiApiKeyChange = (key: string) => {
    setOpenaiApiKey(key);
  };
  
  const handleDeepseekApiKeyChange = (key: string) => {
    setDeepseekApiKey(key);
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
    setTitleLength(value);
  };
  
  const handleDescriptionLengthChange = (value: number[]) => {
    setDescriptionLength(value[0]);
  };
  
  const handleKeywordCountChange = (value: number[]) => {
    setKeywordCount(value[0]);
  };
  
  const handlePlatformChange = (newPlatforms: Platform[]) => {
    if (newPlatforms.length > 0) {
      setPlatforms(newPlatforms);
    }
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
  
  const handleCustomPromptEnabledChange = (enabled: boolean) => {
    setCustomPromptEnabled(enabled);
  };
  
  const handleCustomPromptChange = (prompt: string) => {
    setCustomPrompt(prompt);
  };
  
  const handleProhibitedWordsChange = (words: string) => {
    setProhibitedWords(words);
  };
  
  const handleProhibitedWordsEnabledChange = (enabled: boolean) => {
    setProhibitedWordsEnabled(enabled);
  };
  
  const handleTransparentBgEnabledChange = (enabled: boolean) => {
    setTransparentBgEnabled(enabled);
  };
  
  const handleSilhouetteEnabledChange = (enabled: boolean) => {
    setSilhouetteEnabled(enabled);
  };
  
  const handleSingleWordKeywordsEnabledChange = (enabled: boolean) => {
    setSingleWordKeywordsEnabled(enabled);
  };
  
  const handleUpgradePlan = () => {
    window.location.href = PAYMENT_GATEWAY_URL;
  };
  
  const handleProcessImages = async () => {
    // Check if user is authenticated first
    if (!user) {
      // Redirect to auth page if not authenticated
      toast.info('Please sign in or sign up to process images');
      navigate('/auth');
      return;
    }
    
    if (!apiKey) {
      toast.error('Please enter an API key');
      return;
    }
    
    const pendingImages = images.filter(img => img.status === 'pending');
    
    if (pendingImages.length === 0) {
      toast.info('No images to process');
      return;
    }
    
    // Count video files for better messaging
    const videoFiles = pendingImages.filter(img => isVideoFile(img.file));
    const imageFiles = pendingImages.filter(img => !isVideoFile(img.file));
    
    if (!canGenerateMetadata) {
      toast.error('You have reached your free limit. Please upgrade to premium.');
      return;
    }
    
    const canProceed = await incrementCreditsUsed();
    
    if (!canProceed) {
      return;
    }
    
    // Reset the Gemini model index at the start of a new batch
    // This allows the system to try models from the beginning for a new batch
    resetGeminiModelIndex();
    
    setIsProcessing(true);
    
    try {
      setImages(prev => prev.map(img => img.status === 'pending' ? {
        ...img,
        status: 'processing' as const
      } : img));
      
      // Check for special file types
      const hasSvgFiles = pendingImages.some(img => isSvgFile(img.file));
      const hasVideoFiles = pendingImages.some(img => isVideoFile(img.file));
      
      // Show notifications for special file types - SVG notification removed
      // The conversion still happens, but we don't show the message
      
      // Process images one by one
      const updatedImages: ProcessedImage[] = [...images];
      let successCount = 0;
      
      for (let i = 0; i < pendingImages.length; i++) {
        const img = pendingImages[i];
        if (img.status !== 'pending') continue;
        
        updatedImages[i] = { ...img, status: 'processing' };
        setImages([...updatedImages]);
        
        try {
          console.log(`Processing image ${i + 1}/${pendingImages.length}: ${img.file.name}`);
          
          // Update to pass all API keys
          const result = await analyzeImageWithGemini(
            img.file, 
            apiKey,
            {
              titleLength: titleLength[0],
              descriptionLength,
              keywordCount,
              platforms,
              generationMode,
              minTitleWords,
              maxTitleWords,
              minKeywords,
              maxKeywords,
              minDescriptionWords,
              maxDescriptionWords,
              customPromptEnabled,
              customPrompt,
              prohibitedWords,
              prohibitedWordsEnabled,
              transparentBgEnabled,
              silhouetteEnabled,
              singleWordKeywordsEnabled
            },
            openaiApiKey,
            deepseekApiKey
          );
          
          // Update UI on success
          updatedImages[i] = {
            ...img,
            status: result.error ? 'error' : 'complete',
            processingTime: result.processingTime || 0,
            result: result.error ? undefined : {
              title: result.title,
              description: result.description,
              keywords: result.keywords,
              prompt: result.prompt,
              category: result.category,
              categories: result.categories,
              baseModel: result.baseModel,
              provider: result.provider
            },
            error: result.error ? '' : undefined
          };
          
          setImages([...updatedImages]);
          
          if (!result.error) {
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing file ${img.file.name}:`, error);
          
          updatedImages[i] = {
            ...img,
            status: 'error',
            error: '' // Don't show error message to user, just set status
          };
          
          setImages([...updatedImages]);
        }
      }
      
      // Success message based on what was processed
      if (videoFiles.length > 0 && imageFiles.length > 0) {
        toast.success(`Processing complete`);
      } else if (videoFiles.length > 0) {
        toast.success(`Processing complete`);
      } else {
        toast.success('Processing complete');
      }
    } catch (error) {
      console.error('Error during processing:', error);
      // Don't show error message, just complete silently
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const pendingCount = images.filter(img => img.status === 'pending').length;
  const remainingCredits = profile?.is_premium ? '∞' : Math.max(0, 10 - (profile?.credits_used || 0));
  
  // Add a new function to handle image updates
  const handleImageUpdate = (updatedImage: ProcessedImage) => {
    setImages(prev => {
      const newImages = [...prev];
      const index = newImages.findIndex(img => img.id === updatedImage.id);
      if (index !== -1) {
        newImages[index] = updatedImage;
      }
      return newImages;
    });
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader 
        remainingCredits={profile?.credits_used ? Math.max(0, 10 - profile.credits_used) : 0} 
        apiKey={apiKey} 
        onApiKeyChange={handleApiKeyChange}
        openaiApiKey={openaiApiKey}
        onOpenaiApiKeyChange={handleOpenaiApiKeyChange}
        deepseekApiKey={deepseekApiKey}
        onDeepseekApiKeyChange={handleDeepseekApiKeyChange}
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
          customPromptEnabled={customPromptEnabled}
          onCustomPromptEnabledChange={handleCustomPromptEnabledChange}
          customPrompt={customPrompt}
          onCustomPromptChange={handleCustomPromptChange}
          prohibitedWords={prohibitedWords}
          onProhibitedWordsChange={handleProhibitedWordsChange}
          prohibitedWordsEnabled={prohibitedWordsEnabled}
          onProhibitedWordsEnabledChange={handleProhibitedWordsEnabledChange}
          transparentBgEnabled={transparentBgEnabled}
          onTransparentBgEnabledChange={handleTransparentBgEnabledChange}
          silhouetteEnabled={silhouetteEnabled}
          onSilhouetteEnabledChange={handleSilhouetteEnabledChange}
          singleWordKeywordsEnabled={singleWordKeywordsEnabled}
          onSingleWordKeywordsEnabledChange={handleSingleWordKeywordsEnabledChange}
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
                
                <div className="mt-4">
                  
                  
                </div>
              </div>
              
              <div className="mt-6">
                <ImageUploader
                  onImagesSelected={handleImagesSelected}
                  isProcessing={isProcessing}
                />
              </div>
              
              {pendingCount > 0 && (
                <div className="flex justify-center mt-8">
                  {!user ? (
                    <Button
                      onClick={() => navigate('/auth')}
                      className="glow-button bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-md shadow-lg transition-all duration-300 border-none"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      Login to Process {pendingCount} Image{pendingCount !== 1 ? 's' : ''}
                    </Button>
                  ) : profile?.credits_used >= 1 && !profile?.is_premium ? (
                    <Button
                      onClick={handleUpgradePlan}
                      className="glow-button bg-amber-500 hover:bg-amber-600 text-black px-8 py-3 text-lg rounded-md shadow-lg transition-all duration-300 border-none"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Upgrade to Process {pendingCount} Image{pendingCount !== 1 ? 's' : ''}
                    </Button>
                  ) : (
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
                  )}
                </div>
              )}
              
              <div className="mt-8">
                <ResultsDisplay
                  images={images}
                  onRemoveImage={handleRemoveImage}
                  onClearAll={handleClearAll}
                  generationMode={generationMode}
                  selectedPlatforms={platforms}
                  onUpdateImage={handleImageUpdate}
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
