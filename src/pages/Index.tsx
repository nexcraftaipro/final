
import React, { useState, useEffect } from 'react';
import ApiKeyInput from '@/components/ApiKeyInput';
import ImageUploader from '@/components/ImageUploader';
import ResultsDisplay from '@/components/ResultsDisplay';
import { Button } from '@/components/ui/button';
import { ProcessedImage } from '@/utils/imageHelpers';
import { analyzeImageWithGemini } from '@/utils/geminiApi';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';

const Index: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [keywordCount, setKeywordCount] = useState(10);

  // Handle API Key change
  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
  };

  // Handle new images selected
  const handleImagesSelected = (newImages: ProcessedImage[]) => {
    setImages(prev => [...prev, ...newImages]);
  };

  // Remove an image from the list
  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Clear all images
  const handleClearAll = () => {
    setImages([]);
  };

  // Handle keyword count change
  const handleKeywordCountChange = (value: number[]) => {
    setKeywordCount(value[0]);
  };

  // Process images with Gemini API
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

    setIsProcessing(true);

    try {
      // Update status to processing for all pending images
      setImages(prev => 
        prev.map(img => 
          img.status === 'pending' 
            ? { ...img, status: 'processing' as const } 
            : img
        )
      );

      // Process images one by one to avoid overwhelming the API
      for (const image of pendingImages) {
        try {
          const result = await analyzeImageWithGemini(image.file, apiKey, keywordCount);
          
          setImages(prev => 
            prev.map(img => 
              img.id === image.id 
                ? { 
                    ...img, 
                    status: result.error ? 'error' as const : 'complete' as const,
                    result: result.error ? undefined : {
                      title: result.title,
                      description: result.description,
                      keywords: result.keywords
                    },
                    error: result.error
                  } 
                : img
            )
          );
        } catch (error) {
          console.error(`Error processing image ${image.file.name}:`, error);
          
          setImages(prev => 
            prev.map(img => 
              img.id === image.id 
                ? { 
                    ...img, 
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                  } 
                : img
            )
          );
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

  // Count pending images
  const pendingCount = images.filter(img => img.status === 'pending').length;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-800">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Photo Metadata Helper</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container py-8 space-y-8">
          <ApiKeyInput apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Keyword Options</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label htmlFor="keyword-count" className="text-sm font-medium">
                    Number of keywords to generate (max): {keywordCount}
                  </label>
                </div>
                <Slider
                  id="keyword-count"
                  min={1}
                  max={50}
                  step={1}
                  value={[keywordCount]}
                  onValueChange={handleKeywordCountChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>
            </div>
          </div>
          
          <ImageUploader 
            onImagesSelected={handleImagesSelected} 
            isProcessing={isProcessing} 
          />
          
          {pendingCount > 0 && (
            <div className="flex justify-center">
              <Button
                onClick={handleProcessImages}
                disabled={isProcessing || !apiKey}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
              >
                {isProcessing ? (
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  `Process ${pendingCount} Image${pendingCount !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          )}
          
          <ResultsDisplay 
            images={images} 
            onRemoveImage={handleRemoveImage}
            onClearAll={handleClearAll}
          />
        </div>
      </main>
      
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            Photo Metadata Helper — Extract metadata from images with the power of Google Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
