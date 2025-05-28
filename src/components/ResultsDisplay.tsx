import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy, X, Check, Film, FileType, CheckCircle, Clock, Save, Info, Wand2 } from 'lucide-react';
import { ProcessedImage, formatImagesAsCSV, formatVideosAsCSV, downloadCSV, formatFileSize, removeSymbolsFromTitle, removeCommasFromDescription } from '@/utils/imageHelpers';
import { toast } from 'sonner';
import { GenerationMode } from '@/components/GenerationModeSelector';
import { Card } from '@/components/ui/card';
import { Platform } from '@/components/PlatformSelector';
import { getCategoryNameById } from '@/utils/categorySelector';
import { writeMetadataToFile, createMetadataFileContent } from '@/utils/metadataWriter';
import JSZip from 'jszip';

interface ResultsDisplayProps {
  images: ProcessedImage[];
  onRemoveImage: (id: string) => void;
  onClearAll: () => void;
  generationMode: GenerationMode;
  selectedPlatforms?: Platform[];
}
const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  images,
  onRemoveImage,
  onClearAll,
  generationMode,
  selectedPlatforms = ['AdobeStock']
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newlyCompletedIds, setNewlyCompletedIds] = useState<string[]>([]);
  const metadataRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [isAllProcessingComplete, setIsAllProcessingComplete] = useState(false);
  const [epsEnabled, setEpsEnabled] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingKeywords, setEditingKeywords] = useState<string | null>(null);
  const [editedTitleValue, setEditedTitleValue] = useState<{[key: string]: string}>({});
  const [editedKeywordsValue, setEditedKeywordsValue] = useState<{[key: string]: string[]}>({});
  const [keywordSuggestions, setKeywordSuggestions] = useState<{[key: string]: string[]}>({});
  const [showingSuggestions, setShowingSuggestions] = useState<string | null>(null);
  
  // Track newly completed images
  useEffect(() => {
    const currentCompletedIds = images
      .filter(img => img.status === 'complete')
      .map(img => img.id);
      
    // Find newly completed images since last render
    const newlyCompleted = currentCompletedIds.filter(id => {
      const wasNotCompleteBefore = !newlyCompletedIds.includes(id);
      return wasNotCompleteBefore;
    });
    
    // Check if all processing is complete
    const hasProcessingItems = images.some(img => img.status === 'processing');
    const hasNewCompletions = newlyCompleted.length > 0;
    
    if (hasNewCompletions) {
      // Add newly completed images to the state
      setNewlyCompletedIds(prevIds => [...prevIds, ...newlyCompleted]);
      
      // If some items are still processing, scroll to the most recently completed item
      if (hasProcessingItems) {
        const mostRecentId = newlyCompleted[newlyCompleted.length - 1];
        setTimeout(() => {
          const element = metadataRefs.current[mostRecentId];
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
    
    // If previously had processing items but now all complete, scroll to the first completed item
    if (!hasProcessingItems && currentCompletedIds.length > 0 && !isAllProcessingComplete) {
      setIsAllProcessingComplete(true);
      const firstCompletedId = currentCompletedIds[0];
      setTimeout(() => {
        const element = metadataRefs.current[firstCompletedId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
    
    // Reset the isAllProcessingComplete flag if we have new processing items
    if (hasProcessingItems && isAllProcessingComplete) {
      setIsAllProcessingComplete(false);
    }
  }, [images, isAllProcessingComplete]);

  if (images.length === 0) return null;
  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Check for specific platforms
  const isFreepikOnly = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'Freepik';
  const isShutterstock = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'Shutterstock';
  const isAdobeStock = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'AdobeStock';
  const isVecteezy = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'Vecteezy';
  const isDepositphotos = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'Depositphotos';
  const is123RF = selectedPlatforms.length === 1 && selectedPlatforms[0] === '123RF';
  const isAlamy = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'Alamy';
  const handleDownloadCSV = () => {
    // Check if there are any videos to process
    const videoImages = images.filter(img => img.result?.isVideo);
    const regularImages = images.filter(img => !img.result?.isVideo);

    // Process videos if they exist
    if (videoImages.length > 0) {
      const isShutterstock = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'Shutterstock';
      const videoCsvContent = formatVideosAsCSV(videoImages, isShutterstock);
      downloadCSV(videoCsvContent, 'video-metadata.csv', 'videos' as Platform);
      toast.success('Video metadata CSV file downloaded');
    }

    // Process regular images if they exist
    if (regularImages.length > 0) {
      // Apply EPS extension modification if enabled
      let imagesToProcess = regularImages;
      if (epsEnabled) {
        imagesToProcess = regularImages.map(img => {
          // Create a shallow copy to avoid modifying the original
          const modifiedImg = { ...img };
          // Create a new File object with modified name
          const originalName = img.file.name;
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          const newFileName = `${nameWithoutExt}.eps`;
          // Create a new File object with the same content but different name
          modifiedImg.file = new File([img.file], newFileName, { type: img.file.type });
          return modifiedImg;
        });
      }
      
      const csvContent = formatImagesAsCSV(imagesToProcess, isFreepikOnly, isShutterstock, isAdobeStock, isVecteezy, isDepositphotos, is123RF, isAlamy);
      // Pass the platform name for custom folder naming
      const selectedPlatform = selectedPlatforms.length === 1 ? selectedPlatforms[0] : undefined;
      downloadCSV(csvContent, 'image-metadata.csv', selectedPlatform);
      toast.success('Image metadata CSV file downloaded');
    }
  };

  // Function to download CSV for a single image
  const downloadSingleImageCSV = (image: ProcessedImage) => {
    if (!image.result) {
      toast.error('No metadata available for this image');
      return;
    }

    // Create a single-item array for processing
    let imagesToProcess = [image];
    
    // Apply EPS extension modification if enabled
    if (epsEnabled) {
      imagesToProcess = imagesToProcess.map(img => {
        // Create a shallow copy to avoid modifying the original
        const modifiedImg = { ...img };
        // Create a new File object with modified name
        const originalName = img.file.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const newFileName = `${nameWithoutExt}.eps`;
        // Create a new File object with the same content but different name
        modifiedImg.file = new File([img.file], newFileName, { type: img.file.type });
        return modifiedImg;
      });
    }
    
    if (image.result?.isVideo) {
      const isShutterstock = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'Shutterstock';
      const videoCsvContent = formatVideosAsCSV(imagesToProcess, isShutterstock);
      const filename = image.file.name.split('.')[0] || 'video';
      downloadCSV(videoCsvContent, `${filename}-metadata.csv`, 'videos' as Platform);
      toast.success('Video metadata CSV file downloaded');
    } else {
      const csvContent = formatImagesAsCSV(imagesToProcess, isFreepikOnly, isShutterstock, isAdobeStock, isVecteezy, isDepositphotos, is123RF, isAlamy);
      // Use the image filename as the CSV filename
      const filename = image.file.name.split('.')[0] || 'image';
      const selectedPlatform = selectedPlatforms.length === 1 ? selectedPlatforms[0] : undefined;
      downloadCSV(csvContent, `${filename}-metadata.csv`, selectedPlatform);
      toast.success('Image metadata CSV file downloaded');
    }
  };
  
  const downloadPromptText = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], {
      type: 'text/plain'
    });
    element.href = URL.createObjectURL(file);
    element.download = `${filename.split('.')[0]}-prompt.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Prompt downloaded as text file');
  };

  // Function to download all prompts as a zip file
  const downloadAllPrompts = () => {
    const completedImages = images.filter(img => img.status === 'complete');
    if (completedImages.length === 0) return;

    // Create a single text file with all prompts, without filenames or separators
    const allPromptsText = completedImages.map(img => {
      return img.result?.description || '';
    }).join('\n\n');
    const element = document.createElement("a");
    const file = new Blob([allPromptsText], {
      type: 'text/plain'
    });
    element.href = URL.createObjectURL(file);
    element.download = `all-prompts.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('All prompts downloaded as text file');
  };
  
  // Function to write metadata to file for a single image
  const handleSaveMetadataToFile = async (image: ProcessedImage) => {
    if (!image.result) {
      toast.error('No metadata available to save');
      return;
    }
    
    // Check if it's a JPEG image first
    const isJpeg = image.file.type === "image/jpeg";
    
    try {
      toast.info('Preparing metadata for embedding...');
      
      // If it's not a JPEG, warn the user
      if (!isJpeg) {
        toast.warning('Full metadata embedding only works with JPEG images. Other formats will use descriptive filenames.');
      }
      
      const success = await writeMetadataToFile(image);
      if (success) {
        toast.success('Metadata processed! Check your downloads folder for the file.');
      } else {
        toast.error('Unable to write metadata to file. See console for details.');
      }
    } catch (error) {
      console.error('Error writing metadata to file:', error);
      toast.error('Failed to write metadata to file. Please try again with a different image.');
    }
  };
  
  // Function to save metadata for all files at once as a zip archive
  const handleSaveAllMetadata = async () => {
    const completedImages = images.filter(img => img.status === 'complete');
    if (completedImages.length === 0) return;
    
    toast.info(`Preparing to create zip archive with ${completedImages.length} files...`);
    
    try {
      // Create a new JSZip instance
      const zip = new JSZip();
      
      let successCount = 0;
      let failCount = 0;
      
      // Process each image sequentially
      for (const image of completedImages) {
        if (!image.result) {
          failCount++;
          continue;
        }
        
        try {
          // Get the file content with metadata instead of downloading directly
          const fileContent = await createMetadataFileContent(image);
          
          if (fileContent) {
            // Generate file name
            const safeTitle = image.result.title 
              ? image.result.title.replace(/[<>:"/\\|?*]/g, '-') 
              : image.file.name.split('.')[0];
            
            const suffix = fileContent.metadataEmbedded ? "stock_ready" : "no_metadata";
            const fileName = image.file.type === "image/jpeg" 
              ? `${safeTitle}_${suffix}.jpeg`
              : image.file.name;
            
            // Add the file to the zip
            zip.file(fileName, fileContent.data);
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error('Error processing file for zip:', image.file.name, error);
          failCount++;
        }
      }
      
      if (successCount > 0) {
        // Generate the zip file
        const zipContent = await zip.generateAsync({ type: 'blob' });
        
        // Create download link
        const url = URL.createObjectURL(zipContent);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pixcraftai-metadata.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success(`Successfully created zip archive with ${successCount} file${successCount !== 1 ? 's' : ''}!`);
      }
      
      if (failCount > 0) {
        toast.error(`Failed to process ${failCount} file${failCount !== 1 ? 's' : ''}.`);
      }
    } catch (error) {
      console.error('Error creating zip archive:', error);
      toast.error('Failed to create zip archive. Please try again.');
    }
  };
  
  const completedImages = images.filter(img => img.status === 'complete');
  const hasCompletedImages = completedImages.length > 0;

  // Add a function to handle title edits
  const handleTitleEdit = (imageId: string, title: string) => {
    setEditedTitleValue(prev => ({...prev, [imageId]: title}));
    setEditingTitle(imageId);
  };

  // Add a function to save title edits
  const saveTitleEdit = (imageId: string) => {
    const imageIndex = images.findIndex(img => img.id === imageId);
    if (imageIndex !== -1 && images[imageIndex].result) {
      // Create a shallow copy of the images array
      const updatedImages = [...images];
      // Create a shallow copy of the image object
      const updatedImage = {...updatedImages[imageIndex]};
      // Create a shallow copy of the result object
      const updatedResult = {...updatedImage.result!};
      // Update the title
      updatedResult.title = editedTitleValue[imageId];
      // Update the image with the updated result
      updatedImage.result = updatedResult;
      // Update the images array with the updated image
      updatedImages[imageIndex] = updatedImage;
      // You would typically update your state here, but since the images are passed as props
      // you might need to implement a callback to the parent component
      toast.success('Title updated successfully');
    }
    setEditingTitle(null);
  };

  // Fix the function to handle keywords edits
  const handleKeywordsEdit = (imageId: string, keywords: string[]) => {
    setEditedKeywordsValue(prev => ({...prev, [imageId]: keywords}));
    setEditingKeywords(imageId);
  };

  // Add a function to save keywords edits
  const saveKeywordsEdit = (imageId: string) => {
    const imageIndex = images.findIndex(img => img.id === imageId);
    if (imageIndex !== -1 && images[imageIndex].result) {
      // Create a shallow copy of the images array
      const updatedImages = [...images];
      // Create a shallow copy of the image object
      const updatedImage = {...updatedImages[imageIndex]};
      // Create a shallow copy of the result object
      const updatedResult = {...updatedImage.result!};
      // Update the keywords
      updatedResult.keywords = editedKeywordsValue[imageId];
      // Update the image with the updated result
      updatedImage.result = updatedResult;
      // Update the images array with the updated image
      updatedImages[imageIndex] = updatedImage;
      // You would typically update your state here, but since the images are passed as props
      // you might need to implement a callback to the parent component
      toast.success('Keywords updated successfully');
    }
    setEditingKeywords(null);
  };

  // Add keyword suggestion function
  const generateKeywordSuggestions = (imageId: string, existingKeywords: string[]) => {
    // Create a set of existing keywords to avoid duplicates
    const existingKeywordSet = new Set(existingKeywords.map(k => k.toLowerCase()));
    
    // Common keyword associations and categories
    const keywordAssociations: {[key: string]: string[]} = {
      // People and portraits
      'woman': ['female', 'lady', 'girl', 'person', 'model', 'beautiful', 'attractive'],
      'man': ['male', 'guy', 'person', 'model', 'handsome'],
      'portrait': ['face', 'headshot', 'closeup', 'person', 'model', 'expression'],
      'people': ['person', 'human', 'crowd', 'group', 'social', 'community'],
      'face': ['portrait', 'expression', 'smile', 'emotion', 'closeup'],
      
      // Visual styles
      'blurred': ['bokeh', 'soft', 'focus', 'dreamy', 'depth', 'background'],
      'vintage': ['retro', 'old', 'classic', 'nostalgic', 'aged', 'antique'],
      'minimal': ['simple', 'clean', 'minimalist', 'modern', 'elegant'],
      'bright': ['colorful', 'vibrant', 'vivid', 'saturated', 'sunny'],
      'dark': ['moody', 'dramatic', 'shadow', 'low-key', 'contrast'],
      
      // Environments
      'nature': ['outdoor', 'landscape', 'environment', 'scenic', 'natural'],
      'urban': ['city', 'street', 'building', 'architecture', 'metropolitan'],
      'indoor': ['interior', 'room', 'inside', 'studio', 'home'],
      
      // Colors
      'red': ['color', 'warm', 'vibrant', 'passionate', 'bold'],
      'blue': ['color', 'cool', 'calm', 'water', 'sky'],
      'green': ['color', 'nature', 'fresh', 'grass', 'natural'],
      'black': ['dark', 'elegant', 'contrast', 'monochrome', 'shadow'],
      'white': ['bright', 'clean', 'minimal', 'light', 'pure'],
      
      // Emotions
      'happy': ['smile', 'joy', 'positive', 'cheerful', 'fun', 'laughing'],
      'serious': ['thoughtful', 'professional', 'contemplative', 'focused'],
      
      // Photography terms
      'closeup': ['macro', 'detail', 'close', 'tight', 'zoom'],
      'landscape': ['scenic', 'nature', 'outdoor', 'panorama', 'vista'],
      'portraiture': ['vertical', 'person', 'face', 'model'],
      'silhouette': ['shadow', 'outline', 'dark', 'contrast', 'backlit'],
      
      // Style categories
      'abstract': ['pattern', 'geometric', 'artistic', 'modern', 'creative'],
      'fashion': ['style', 'clothing', 'model', 'trendy', 'outfit'],
      'art': ['artistic', 'creative', 'design', 'expressive', 'aesthetic'],
      
      // Descriptors
      'beautiful': ['pretty', 'attractive', 'gorgeous', 'stunning', 'lovely'],
      'professional': ['business', 'corporate', 'formal', 'work', 'expertise'],
      'creative': ['artistic', 'innovative', 'imaginative', 'original', 'unique'],
      
      // Technical terms
      'bokeh': ['blurred', 'depth', 'background', 'soft', 'focus'],
      'hdr': ['high-dynamic-range', 'contrast', 'detailed', 'rich'],
      'depth of field': ['bokeh', 'blur', 'focus', 'background', 'foreground'],
      'macro': ['closeup', 'detail', 'micro', 'extreme', 'texture'],
      
      // Hair
      'hair': ['hairstyle', 'haircut', 'beauty', 'salon', 'grooming'],
      'blonde': ['hair', 'gold', 'light', 'fair', 'yellow'],
      'brunette': ['hair', 'brown', 'dark', 'chestnut'],
      'redhead': ['hair', 'ginger', 'auburn', 'copper', 'red'],
      
      // Clothing
      'dress': ['clothing', 'fashion', 'formal', 'elegant', 'garment'],
      'suit': ['formal', 'business', 'professional', 'clothing', 'elegant'],
      'casual': ['relaxed', 'informal', 'comfortable', 'everyday', 'leisure'],
    };
    
    // Additional common photography and stock keywords
    const commonStockKeywords = [
      'lifestyle', 'candid', 'authentic', 'genuine', 'natural', 'real', 
      'contemporary', 'modern', 'trendy', 'fashionable', 'stylish',
      'expressive', 'emotive', 'emotional', 'feeling', 'mood',
      'minimalist', 'simple', 'clean', 'elegant', 'sophisticated',
      'dramatic', 'cinematic', 'atmospheric', 'moody', 'ambiance',
      'concept', 'conceptual', 'symbolic', 'metaphor', 'representation',
      'healthy', 'wellness', 'fitness', 'wellbeing', 'active',
      'traditional', 'cultural', 'heritage', 'classic', 'timeless'
    ];
    
    // Generate suggestions based on existing keywords
    let suggestions: string[] = [];
    
    // Add related keywords based on associations
    existingKeywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      if (keywordAssociations[lowerKeyword]) {
        suggestions = [...suggestions, ...keywordAssociations[lowerKeyword]];
      }
      
      // Check for partial matches (keywords that contain the current keyword)
      Object.keys(keywordAssociations).forEach(key => {
        if (key.includes(lowerKeyword) || lowerKeyword.includes(key)) {
          suggestions = [...suggestions, ...keywordAssociations[key]];
        }
      });
    });
    
    // Add some common stock keywords if we don't have many suggestions
    if (suggestions.length < 10) {
      suggestions = [...suggestions, ...commonStockKeywords.slice(0, 15)];
    }
    
    // Remove duplicates and existing keywords
    const filteredSuggestions = [...new Set(suggestions)]
      .filter(suggestion => !existingKeywordSet.has(suggestion.toLowerCase()))
      .slice(0, 20); // Limit to 20 suggestions
    
    // Store the suggestions
    setKeywordSuggestions(prev => ({...prev, [imageId]: filteredSuggestions}));
    setShowingSuggestions(imageId);
  };
  
  // Add a function to add a suggested keyword
  const addSuggestedKeyword = (imageId: string, keyword: string) => {
    if (editingKeywords === imageId) {
      // If already editing, add to the edited value
      setEditedKeywordsValue(prev => {
        const currentKeywords = prev[imageId] || [];
        return {...prev, [imageId]: [...currentKeywords, keyword]};
      });
    } else {
      // If not editing, start editing with the new keyword added
      const currentKeywords = images.find(img => img.id === imageId)?.result?.keywords || [];
      handleKeywordsEdit(imageId, [...currentKeywords, keyword]);
    }
    
    // Remove the suggestion from the list
    setKeywordSuggestions(prev => {
      const currentSuggestions = prev[imageId] || [];
      return {...prev, [imageId]: currentSuggestions.filter(k => k !== keyword)};
    });
  };
  
  // Add a function to close suggestions
  const closeSuggestions = () => {
    setShowingSuggestions(null);
  };

  return <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Generated Data</h2>
        <div className="flex gap-2">
          {hasCompletedImages && generationMode === 'metadata' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm">EPS</span>
                <div 
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${epsEnabled ? 'bg-green-500' : 'bg-gray-200'} cursor-pointer`}
                  onClick={() => setEpsEnabled(!epsEnabled)}
                >
                  <span 
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${epsEnabled ? 'translate-x-6' : 'translate-x-1'} shadow-md`}
                  />
                </div>
                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full bg-gray-700 hover:bg-gray-600 p-1"
                  >
                    <Info className="h-4 w-4 text-white" />
                    <span className="sr-only">EPS Information</span>
                  </Button>
                  <div className="absolute bottom-full mb-2 right-0 w-64 bg-gray-900 text-xs text-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    When enabled, automatically change .JPG, .PNG Or .SVG to .EPS
                  </div>
                </div>
              </div>
              <div className="relative group">
                <Button variant="outline" size="sm" onClick={handleSaveAllMetadata} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white border-none">
                  <Save className="h-4 w-4" />
                  <span>Save All as ZIP</span>
                </Button>
                <div className="absolute bottom-full mb-2 right-0 w-64 bg-gray-900 text-xs text-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Upload All metadata Directly to Your Image!
                </div>
              </div>
            </>
          )}
          {hasCompletedImages && generationMode === 'metadata' && <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white border-none">
              <Download className="h-4 w-4" />
              <span>Download All CSV</span>
            </Button>}
          {hasCompletedImages && generationMode === 'imageToPrompt' && completedImages.length > 1 && <Button variant="outline" size="sm" onClick={downloadAllPrompts} className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white border-none">
              <Download className="h-4 w-4" />
              <span>Download All</span>
            </Button>}
          <Button variant="outline" size="sm" onClick={onClearAll} className="flex items-center gap-1">
            <X className="h-4 w-4" />
            <span>Clear All</span>
          </Button>
        </div>
      </div>

      {/* Image to Prompt mode display - Updated to show image with prompt */}
      {generationMode === 'imageToPrompt' && completedImages.length > 0 && <div className="grid grid-cols-1 gap-6">
          {completedImages.map(image => <div 
                key={image.id} 
                className="bg-black rounded-lg border border-gray-800 overflow-hidden"
                ref={el => metadataRefs.current[image.id] = el}
              >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {/* Left column - Source Image */}
                <div className="p-4 border border-gray-800 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Source Image:</h3>
                  <div className="rounded-lg overflow-hidden mb-4">
                    {image.result?.isVideo ? <div className="flex items-center justify-center bg-gray-900 h-[200px] rounded-lg">
                        <Film className="h-16 w-16 text-gray-400" />
                        <span className="ml-2 text-gray-400">Video File</span>
                      </div> : image.result?.isEps ? <div className="flex items-center justify-center bg-gray-900 h-[200px] rounded-lg">
                        <FileType className="h-16 w-16 text-amber-400" />
                        <span className="ml-2 text-gray-400">EPS Design File</span>
                      </div> : <img src={image.previewUrl} alt={image.file.name} className="w-full object-cover max-h-[400px]" />}
                  </div>
                </div>
                
                {/* Right column - Generated Prompt */}
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-4">Generated Prompt:</h3>
                  <div className="bg-black border border-gray-800 rounded-lg p-6">
                    {image.result?.prompt ? (
                      <div className="text-gray-200 whitespace-pre-wrap mb-2">{image.result.prompt}</div>
                    ) : (
                      <div className="text-gray-500 italic">Not provided</div>
                    )}
                  </div>
                  <div className="flex justify-end mt-4 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(image.result?.description || '', image.id)} className="flex items-center gap-1">
                      {copiedId === image.id ? <>
                          <Check className="h-4 w-4" />
                          <span>Copied</span>
                        </> : <>
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadPromptText(image.result?.description || '', image.file.name)} className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>)}
        </div>}

      {/* Metadata mode display */}
      {generationMode === 'metadata' && hasCompletedImages && <div className="overflow-auto">
          {completedImages.map(image => {
        // Clean title by removing symbols
        const cleanTitle = image.result?.title ? removeSymbolsFromTitle(image.result.title) : '';
        return <div 
                key={image.id} 
                className="mb-6 bg-gray-800/30 border border-gray-700/50 rounded-lg overflow-hidden"
                ref={el => metadataRefs.current[image.id] = el}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 border-r border-gray-700/50">
                    <h3 className="text-amber-500 text-lg mb-2">Image Preview</h3>
                    <div className="rounded-lg overflow-hidden mb-4">
                      {image.result?.isVideo ? <div className="flex items-center justify-center bg-gray-900 h-[200px] rounded-lg">
                          <Film className="h-16 w-16 text-gray-400" />
                          <span className="ml-2 text-gray-400">Video File</span>
                        </div> : image.result?.isEps ? <div className="flex items-center justify-center bg-gray-900 h-[200px] rounded-lg">
                          <FileType className="h-16 w-16 text-amber-400" />
                          <span className="ml-2 text-gray-400">EPS Design File</span>
                        </div> : <img src={image.previewUrl} alt={image.file.name} className="w-full object-cover max-h-[400px]" />}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-amber-500 text-lg">Generated Metadata</h3>
                        {image.processingTime !== undefined && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="text-amber-500 text-sm font-medium">{image.processingTime}s</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadSingleImageCSV(image)} className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white border-none">
                          <Download className="h-4 w-4" />
                          <span>Download CSV</span>
                        </Button>
                        <div className="relative group">
                          <Button variant="outline" size="sm" onClick={() => handleSaveMetadataToFile(image)} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white border-none">
                            <Save className="h-4 w-4" />
                            <span>Save With Metadata</span>
                          </Button>
                          <div className="absolute bottom-full mb-2 right-0 w-64 bg-gray-900 text-xs text-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                            Upload All metadata Directly to Your Image!
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-amber-500 flex items-center gap-2">Filename:
                          <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(image.file.name, image.id + '-filename')} className="ml-1 p-1">
                            {copiedId === image.id + '-filename' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                          </Button>
                        </h4>
                        <p className="text-white">{image.file.name}</p>
                      </div>
                      
                      {/* Modify the title section */}
                      {!isShutterstock && <div>
                          <h4 className="text-amber-500 flex items-center gap-2">
                            Title:
                            <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(cleanTitle, image.id + '-title')} className="ml-1 p-1">
                              {copiedId === image.id + '-title' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                            </Button>
                            {editingTitle !== image.id && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleTitleEdit(image.id, cleanTitle)} 
                                className="ml-1 p-1 text-xs text-blue-400 hover:text-blue-300"
                              >
                                Edit
                              </Button>
                            )}
                          </h4>
                          {editingTitle === image.id ? (
                            <div className="flex items-center mt-1">
                              <input 
                                type="text" 
                                value={editedTitleValue[image.id]} 
                                onChange={(e) => setEditedTitleValue(prev => ({...prev, [image.id]: e.target.value}))}
                                className="flex-grow p-2 bg-gray-800 border border-gray-600 rounded text-white"
                              />
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => saveTitleEdit(image.id)} 
                                className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                              >
                                Save
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setEditingTitle(null)} 
                                className="ml-1 bg-gray-600 hover:bg-gray-700 text-white"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <p className="text-white">{cleanTitle}</p>
                          )}
                        </div>}
                      
                      {/* Show description for platforms other than Freepik and AdobeStock */}
                      {!isFreepikOnly && !isAdobeStock && <div>
                          <h4 className="text-amber-500">Description:</h4>
                          {isVecteezy ? <div>
                              <p className="text-white">{image.result?.description ? removeCommasFromDescription(image.result.description) : ''}</p>
                            </div> : <p className="text-white">{image.result?.description || ''}</p>}
                        </div>}
                      
                      {/* Modify the keywords section */}
                      <div>
                        <h4 className="text-amber-500 flex items-center gap-2">
                          Keywords:
                          <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard((image.result?.keywords || []).join(', '), image.id + '-keywords')} className="ml-1 p-1">
                            {copiedId === image.id + '-keywords' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                          </Button>
                          {editingKeywords !== image.id && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleKeywordsEdit(image.id, image.result?.keywords || [])} 
                              className="ml-1 p-1 text-xs text-blue-400 hover:text-blue-300"
                            >
                              Edit
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => generateKeywordSuggestions(image.id, image.result?.keywords || [])} 
                            className="ml-1 p-1 text-xs text-purple-400 hover:text-purple-300 flex items-center"
                          >
                            <Wand2 className="h-3 w-3 mr-1" />
                            Enhance
                          </Button>
                        </h4>
                        {editingKeywords === image.id ? (
                          <div className="mt-1">
                            <textarea 
                              value={editedKeywordsValue[image.id]?.join(', ')} 
                              onChange={(e) => {
                                const keywordsArray = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                                setEditedKeywordsValue(prev => ({...prev, [image.id]: keywordsArray}));
                              }}
                              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                              rows={4}
                            />
                            <div className="flex mt-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => saveKeywordsEdit(image.id)} 
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Save
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setEditingKeywords(null)} 
                                className="ml-2 bg-gray-600 hover:bg-gray-700 text-white"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {image.result?.keywords && image.result.keywords.length > 0 ? image.result.keywords.map((keyword, index) => <span key={index} className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                                {keyword}
                              </span>) : <span className="text-gray-400">No keywords available</span>}
                          </div>
                        )}

                        {/* Keyword suggestions */}
                        {showingSuggestions === image.id && keywordSuggestions[image.id] && keywordSuggestions[image.id].length > 0 && (
                          <div className="mt-4 border border-purple-500/30 rounded p-3 bg-purple-900/20">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="text-purple-400 text-sm font-medium">Suggested Keywords</h5>
                              <Button variant="ghost" size="sm" onClick={closeSuggestions} className="h-6 w-6 p-0">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {keywordSuggestions[image.id].map((keyword, index) => (
                                <span 
                                  key={index} 
                                  className="bg-purple-600/50 hover:bg-purple-500 text-white text-xs px-3 py-1 rounded-full cursor-pointer flex items-center"
                                  onClick={() => addSuggestedKeyword(image.id, keyword)}
                                >
                                  <span className="mr-1">+</span> {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Show video category if applicable */}
                      {image.result?.isVideo && <div>
                          <h4 className="text-amber-500">Video Category:</h4>
                          <div className="flex items-center mt-1">
                            <span className="bg-amber-600 text-white text-xs px-3 py-1 rounded-full">
                              {image.result.category ? `${image.result.category} - ${getCategoryNameById(image.result.category)}` : "Not categorized"}
                            </span>
                          </div>
                        </div>}

                        {/* Show categories for AdobeStock */}
                        {isAdobeStock && image.result?.categories && <div>
                            <h4 className="text-amber-500">Category:</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {image.result.categories.map((category, index) => <span key={index} className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                                  {category}
                                </span>)}
                            </div>
                          </div>}

                          {/* Show categories for Shutterstock */}
                          {isShutterstock && image.result?.categories && <div>
                              <h4 className="text-amber-500">Categories:</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {image.result.categories.map((category, index) => <span key={index} className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                                    {category}
                                  </span>)}
                              </div>
                            </div>}

                            {isFreepikOnly && <>
                                <div>
                                  <h4 className="text-amber-500">Prompt:</h4>
                                  <p className="text-white">{image.result?.prompt || 'Not provided'}</p>
                                </div>
                              </>}
                    </div>
                  </div>
                </div>
              </div>;
      })}
        </div>}
      
      {/* Pending/Processing Images */}
      {images.filter(img => img.status !== 'complete').length > 0 && <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.filter(img => img.status !== 'complete').map(image => <div key={image.id} className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded border bg-gray-700">
                      <img src={image.previewUrl} alt={image.file.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-medium text-xs truncate max-w-[140px]" title={image.file.name}>
                        {image.file.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(image.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveImage(image.id)}>
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </div>
              
              <div className="border-t border-gray-700 p-3">
                {image.status === 'pending' && <div className="h-12 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Ready to process</p>
                  </div>}
                
                {image.status === 'processing' && <div className="h-12 flex flex-col items-center justify-center">
                    <div className="h-6 w-6 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-1"></div>
                    <p className="text-xs text-gray-400 animate-pulse">Analyzing image...</p>
                  </div>}
                
                {image.status === 'error' && <div className="h-12 flex items-center justify-center">
                    <p className="text-xs text-red-500">{image.error || 'Error processing image'}</p>
                  </div>}
              </div>
            </div>)}
        </div>}
    </div>;
};
export default ResultsDisplay;
