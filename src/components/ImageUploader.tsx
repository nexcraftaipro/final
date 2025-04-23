import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ProcessedImage, createImagePreview, generateId, isValidImageType, isValidFileSize } from '@/utils/imageHelpers';

interface ImageUploaderProps {
  onImagesSelected: (images: ProcessedImage[]) => void;
  isProcessing: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesSelected,
  isProcessing
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'images' | 'videos' | 'vectors'>('images');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(async (files: FileList) => {
    const processedImages: ProcessedImage[] = [];
    const promises: Promise<ProcessedImage>[] = [];
    const filesToProcess = Array.from(files);

    for (const file of filesToProcess) {
      const promise = (async () => {
        // Validate file is an image
        if (!isValidImageType(file)) {
          toast.error(`${file.name} is not a valid image file. Only JPEG, PNG, SVG, AI, and EPS files are supported.`);
          return null;
        }

        // Validate file size
        if (!isValidFileSize(file)) {
          toast.error(`${file.name} exceeds the 10GB size limit.`);
          return null;
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
      toast.success(`${validResults.length} image${validResults.length !== 1 ? 's' : ''} added`);
    } else if (files.length > 0) {
      toast.error('No valid images were found to process.');
    }
  }, [onImagesSelected]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
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
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div 
      className="bg-[#121212] border border-dashed border-gray-700 rounded-lg overflow-hidden cursor-pointer"
      onClick={handleBrowseClick}
    >
      <div 
        className={`w-full min-h-[300px] flex flex-col items-center justify-center p-8 transition-all duration-300 ${
          isDragging ? 'bg-blue-900/10' : ''
        }`} 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop}
      >
        {/* Image icon */}
        <div className="mb-5">
          <div className="p-5 rounded-lg bg-gray-800">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        </div>
        
        {/* Drag and Drop text */}
        <h2 className="text-2xl font-semibold text-white mb-6">
          Drag and Drop
        </h2>
        
        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTab('images');
            }}
            variant="outline" 
            className={`rounded-full px-6 ${selectedTab === 'images' ? 'bg-blue-600 text-white border-transparent hover:bg-blue-700' : 'bg-gray-800 text-gray-300 border-transparent hover:bg-gray-700'}`}
          >
            Images
          </Button>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTab('videos');
            }}
            variant="outline" 
            className={`rounded-full px-6 ${selectedTab === 'videos' ? 'bg-red-600 text-white border-transparent hover:bg-red-700' : 'bg-gray-800 text-gray-300 border-transparent hover:bg-gray-700'}`}
          >
            Videos
          </Button>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTab('vectors');
            }}
            variant="outline" 
            className={`rounded-full px-6 ${selectedTab === 'vectors' ? 'bg-purple-600 text-white border-transparent hover:bg-purple-700' : 'bg-gray-800 text-gray-300 border-transparent hover:bg-gray-700'}`}
          >
            Vectors
          </Button>
        </div>
        
        {/* Privacy notice */}
        <div className="text-center text-sm text-gray-400 max-w-md mt-2">
          <div className="flex justify-center items-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Privacy Notice
          </div>
          <p>Your Files are processed locally and not stored on any server. Files are automatically deleted after metadata generation.</p>
          <p className="text-blue-400 mt-2">Upload up to 1000 files at once</p>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInputChange} 
          accept="image/jpeg,image/png,image/jpg,image/svg+xml,application/postscript,application/eps,image/eps,application/illustrator" 
          multiple 
          className="hidden" 
          disabled={isProcessing} 
        />
      </div>
    </div>
  );
};

export default ImageUploader;
