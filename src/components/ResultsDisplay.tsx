import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy, X, Check, Film, FileType, CheckCircle, Clock, Save } from 'lucide-react';
import { ProcessedImage, formatImagesAsCSV, formatVideosAsCSV, downloadCSV, formatFileSize, removeSymbolsFromTitle, removeCommasFromDescription } from '@/utils/imageHelpers';
import { toast } from 'sonner';
import { GenerationMode } from '@/components/GenerationModeSelector';
import { Card } from '@/components/ui/card';
import { Platform } from '@/components/PlatformSelector';
import { getCategoryNameById } from '@/utils/categorySelector';
import { writeMetadataToFile } from '@/utils/metadataWriter';

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
      downloadCSV(videoCsvContent, 'video-metadata.csv', 'videos' as Platform);  // Fixed type issue
      toast.success('Video metadata CSV file downloaded');
    }

    // Process regular images if they exist
    if (regularImages.length > 0) {
      const csvContent = formatImagesAsCSV(regularImages, isFreepikOnly, isShutterstock, isAdobeStock, isVecteezy, isDepositphotos, is123RF, isAlamy);
      // Pass the platform name for custom folder naming
      const selectedPlatform = selectedPlatforms.length === 1 ? selectedPlatforms[0] : undefined;
      downloadCSV(csvContent, 'image-metadata.csv', selectedPlatform);
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
  
  // Function to write metadata to file
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
  
  // Function to save metadata for all files at once
  const handleSaveAllMetadata = async () => {
    const completedImages = images.filter(img => img.status === 'complete');
    if (completedImages.length === 0) return;
    
    toast.info(`Preparing to save metadata for ${completedImages.length} files...`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Process each image sequentially
    for (const image of completedImages) {
      if (!image.result) {
        failCount++;
        continue;
      }
      
      try {
        // Check if it's a JPEG image
        const isJpeg = image.file.type === "image/jpeg";
        
        if (!isJpeg) {
          toast.warning(`Skipping non-JPEG file: ${image.file.name}`);
          continue;
        }
        
        // Pass folder name to writeMetadataToFile (it will be handled in the function)
        const success = await writeMetadataToFile(image, "Pixcraftai Metadat");
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Error writing metadata for file:', image.file.name, error);
        failCount++;
      }
    }
    
    // Show summary toast
    if (successCount > 0) {
      toast.success(`Successfully processed metadata for ${successCount} file${successCount !== 1 ? 's' : ''}! Files saved to "Pixcraftai Metadat" folder.`);
    }
    
    if (failCount > 0) {
      toast.error(`Failed to process metadata for ${failCount} file${failCount !== 1 ? 's' : ''}.`);
    }
  };
  
  const completedImages = images.filter(img => img.status === 'complete');
  const hasCompletedImages = completedImages.length > 0;

  return <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Generated Data</h2>
        <div className="flex gap-2">
          {hasCompletedImages && generationMode === 'metadata' && <Button variant="outline" size="sm" onClick={handleSaveAllMetadata} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white border-none">
              <Save className="h-4 w-4" />
              <span>Save All Metadata</span>
            </Button>}
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
                    <p className="text-gray-300 whitespace-pre-wrap">{image.result?.description || ''}</p>
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
                        <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white border-none">
                          <Download className="h-4 w-4" />
                          <span>Download CSV</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleSaveMetadataToFile(image)} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white border-none">
                          <Save className="h-4 w-4" />
                          <span>Save Metadata</span>
                        </Button>
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
                      
                      {/* Show title for all platforms except Shutterstock */}
                      {!isShutterstock && <div>
                          <h4 className="text-amber-500 flex items-center gap-2">Title:
                            <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(cleanTitle, image.id + '-title')} className="ml-1 p-1">
                              {copiedId === image.id + '-title' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                            </Button>
                          </h4>
                          <p className="text-white">{cleanTitle}</p>
                        </div>}
                      
                      {/* Show description for platforms other than Freepik and AdobeStock */}
                      {!isFreepikOnly && !isAdobeStock && <div>
                          <h4 className="text-amber-500">Description:</h4>
                          {isVecteezy ? <div>
                              <p className="text-white">{image.result?.description ? removeCommasFromDescription(image.result.description) : ''}</p>
                            </div> : <p className="text-white">{image.result?.description || ''}</p>}
                        </div>}
                      
                      <div>
                        <h4 className="text-amber-500 flex items-center gap-2">Keywords:
                          <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard((image.result?.keywords || []).join(', '), image.id + '-keywords')} className="ml-1 p-1">
                            {copiedId === image.id + '-keywords' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                          </Button>
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {image.result?.keywords && image.result.keywords.length > 0 ? image.result.keywords.map((keyword, index) => <span key={index} className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                                {keyword}
                              </span>) : <span className="text-gray-400">No keywords available</span>}
                        </div>
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
