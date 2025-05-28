import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Lock, Info, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ProcessedImage, createImagePreview, generateId, isValidImageType, isValidFileSize, formatFileSize } from '@/utils/imageHelpers';
import { isVideoFile } from '@/utils/videoProcessor';
import { isEpsFile } from '@/utils/epsMetadataExtractor';
import FileMetadataDisplay from './FileMetadataDisplay';
import { writeMetadataToFile } from '@/utils/metadataWriter';

interface ImageUploaderProps {
  onImagesSelected: (images: ProcessedImage[]) => void;
  isProcessing: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesSelected,
  isProcessing
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'vectors'>('vectors');
  const [showMetadata, setShowMetadata] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentProcessedImage, setCurrentProcessedImage] = useState<ProcessedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(async (files: FileList) => {
    const processedImages: ProcessedImage[] = [];
    const promises: Promise<ProcessedImage>[] = [];
    const filesToProcess = Array.from(files);
    let videoCount = 0;
    let imageCount = 0;
    let epsCount = 0;
    for (const file of filesToProcess) {
      const promise = (async () => {
        // Validate file is an image or video
        if (!isValidImageType(file)) {
          toast.error(`${file.name} is not a valid file. Supported formats: JPEG, PNG, SVG, MP4, MOV, and other image/video formats. EPS files are no longer supported.`);
          return null;
        }

        // Validate file size
        if (!isValidFileSize(file)) {
          toast.error(`${file.name} exceeds the 10GB size limit.`);
          return null;
        }

        // Track file type
        if (isVideoFile(file)) {
          videoCount++;
        } else if (isEpsFile(file)) {
          epsCount++;
        } else {
          imageCount++;
        }
        try {
          const previewUrl = await createImagePreview(file);
          return {
            id: generateId(),
            file,
            previewUrl,
            status: 'pending' as const
          };
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Failed to process ${file.name}`);
          return null;
        }
      })();
      promises.push(promise as Promise<ProcessedImage>);
    }
    const results = await Promise.all(promises);

    // Filter out any null results from failed processing
    const validResults = results.filter(Boolean) as ProcessedImage[];
    if (validResults.length > 0) {
      onImagesSelected(validResults);

      // Create a more specific success message
      let successMsg = '';
      const typesAdded = [];
      if (imageCount > 0) {
        typesAdded.push(`${imageCount} image${imageCount !== 1 ? 's' : ''}`);
      }
      if (videoCount > 0) {
        typesAdded.push(`${videoCount} video${videoCount !== 1 ? 's' : ''}`);
      }
      if (epsCount > 0) {
        typesAdded.push(`${epsCount} EPS file${epsCount !== 1 ? 's' : ''}`);
      }
      if (typesAdded.length > 1) {
        const lastType = typesAdded.pop();
        successMsg = `Added ${typesAdded.join(', ')} and ${lastType}`;
      } else if (typesAdded.length === 1) {
        successMsg = `Added ${typesAdded[0]}`;
      } else {
        successMsg = `${validResults.length} file${validResults.length !== 1 ? 's' : ''} added`;
      }
      toast.success(successMsg);
      
      // Remove the auto-display of metadata
      // setCurrentFile(validResults[0].file);
      // setCurrentProcessedImage(validResults[0]);
      // setShowMetadata(true);
    } else if (files.length > 0) {
      toast.error('No valid files were found to process.');
    }
  }, [onImagesSelected]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset the file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [processFiles]);

  const handleBrowseClick = useCallback(() => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isProcessing]);

  const handleTabClick = useCallback((tab: 'images' | 'videos' | 'vectors', e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the dropzone click
    setActiveTab(tab);
    
    // Also open the file manager when tabs are clicked
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isProcessing]);

  const closeMetadataDialog = () => {
    setShowMetadata(false);
    setCurrentFile(null);
    setCurrentProcessedImage(null);
  };
  
  const handleSaveMetadataToFile = async () => {
    if (currentProcessedImage && currentProcessedImage.result) {
      try {
        const success = await writeMetadataToFile(currentProcessedImage);
        if (success) {
          toast.success('Metadata added to file. Download the file to save it.');
        } else {
          toast.error('Unable to write metadata directly to file.');
        }
      } catch (error) {
        console.error('Error writing metadata to file:', error);
        toast.error('Failed to write metadata to file');
      }
    } else {
      toast.error('No metadata available to save');
    }
  };

  return (
    <>
      <div className="dropzone-container bg-gradient-to-br from-[#121212] to-[#1f1f1f] border border-solid border-gray-700 rounded-xl overflow-hidden shadow-lg">      
        <div 
          className={`drop-zone flex flex-col items-center justify-center p-12 transition-all duration-300 cursor-pointer ${isDragging ? 'dropzone-active bg-blue-900/10 border-blue-400' : 'hover:bg-gray-800/30'}`} 
          onDragOver={handleDragOver} 
          onDragEnter={handleDragEnter} 
          onDragLeave={handleDragLeave} 
          onDrop={handleDrop} 
          onClick={handleBrowseClick}
          data-testid="drop-zone"
        >
          <div className="bg-gray-500/50 p-5 rounded-full mb-5 cursor-pointer hover:bg-gray-500/70 transition-colors">
            <Upload className="h-9 w-9 text-blue-400" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-5 font-['Inter']">Choose Files</h3>
          
          <div className="file-type-tabs flex gap-2 mb-8">
            <button 
              className={`px-5 py-2 rounded-full text-white font-semibold text-sm ${activeTab === 'images' ? 'bg-blue-600' : 'bg-blue-500/80'}`} 
              onClick={(e) => handleTabClick('images', e)}
            >
              Images
            </button>
            <button 
              className={`px-5 py-2 rounded-full text-white font-semibold text-sm ${activeTab === 'vectors' ? 'bg-purple-600' : 'bg-purple-500/80'}`} 
              onClick={(e) => handleTabClick('vectors', e)}
            >
              Vectors
            </button>
            <button 
              className={`px-5 py-2 rounded-full text-white font-semibold text-sm ${activeTab === 'videos' ? 'bg-red-600' : 'bg-red-500/80'}`} 
              onClick={(e) => handleTabClick('videos', e)}
            >
              Videos
            </button>
          </div>
          
          <div className="privacy-notice flex items-center justify-center mb-2">
            <Lock className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-400 text-sm">Privacy Statement</span>
          </div>
          
          <p className="text-gray-400 text-sm text-center mb-2 max-w-md">We process your files directly on your device. All data is automatically removed after metadata extraction.</p>
          
          <p className="text-blue-400 text-sm font-semibold mt-1">Upload a maximum of 500 files in a single action</p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInputChange} 
            accept="image/jpeg,image/png,image/jpg,image/svg+xml,video/mp4,video/quicktime,video/webm,video/ogg,video/x-msvideo,video/x-ms-wmv" 
            multiple 
            className="hidden" 
            disabled={isProcessing} 
          />
        </div>
      </div>

      {/* File Metadata Dialog */}
      {showMetadata && currentFile && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="w-full max-w-2xl">
            <div className="mb-4 flex justify-end">
              {currentProcessedImage && currentProcessedImage.result && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleSaveMetadataToFile}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border-none mr-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Metadata to File</span>
                </Button>
              )}
            </div>
            <FileMetadataDisplay 
              file={currentFile} 
              processedImage={currentProcessedImage || undefined}
              onClose={closeMetadataDialog} 
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUploader;
