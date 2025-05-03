
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image, Film, FileType } from 'lucide-react';
import { toast } from 'sonner';
import { ProcessedImage, createImagePreview, generateId, isValidImageType, isValidFileSize, formatFileSize } from '@/utils/imageHelpers';
import { isVideoFile } from '@/utils/videoProcessor';
import { isEpsFile } from '@/utils/epsMetadataExtractor';

interface ImageUploaderProps {
  onImagesSelected: (images: ProcessedImage[]) => void;
  isProcessing: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesSelected,
  isProcessing
}) => {
  const [isDragging, setIsDragging] = useState(false);
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
          toast.error(`${file.name} is not a valid file. Supported formats: JPEG, PNG, SVG, EPS, MP4, MOV, and other image/video formats.`);
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
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div className="dropzone-container bg-gradient-to-br from-[#121212] to-[#1f1f1f] border border-dashed border-gray-700 rounded-xl overflow-hidden shadow-lg">      
      <div 
        className={`drop-zone flex flex-col items-center justify-center p-12 transition-all duration-300 ${isDragging ? 'dropzone-active bg-blue-900/10 border-blue-400' : 'hover:bg-gray-800/30'}`} 
        onDragOver={handleDragOver} 
        onDragEnter={handleDragEnter} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop} 
        data-testid="drop-zone"
      >
        <div className="mb-8 flex gap-4 icon-container">
          <div className="bg-blue-900/20 p-5 rounded-full icon-glow pulse-animation">
            <Image className="h-9 w-9 text-blue-400" />
          </div>
          <div className="bg-purple-900/20 p-5 rounded-full icon-glow pulse-animation">
            <Film className="h-9 w-9 text-purple-400" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3 font-['Inter']">Drag and drop media here</h3>
        
        <p className="text-amber-300 mb-8 text-sm max-w-md text-center">
          Supported formats: JPEG, PNG, SVG, MP4, MOV, AVI, and more (up to 10GB each)
        </p>
        
        <div className="flex gap-4">
          <Button 
            onClick={handleBrowseClick} 
            className="browse-button bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-6 rounded-xl flex items-center gap-2 shadow-lg" 
            disabled={isProcessing}
          >
            <Image className="h-5 w-5" />
            Browse Media Files
          </Button>
        </div>
        
        <p className="text-gray-400 text-xs mt-6">
          <span className="bg-gray-800 px-2 py-1 rounded">Tip:</span> For best results, use high-resolution images
        </p>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInputChange} 
          accept="image/jpeg,image/png,image/jpg,image/svg+xml,application/postscript,application/eps,image/eps,application/illustrator,video/mp4,video/quicktime,video/webm,video/ogg,video/x-msvideo,video/x-ms-wmv" 
          multiple 
          className="hidden" 
          disabled={isProcessing} 
        />
      </div>
    </div>
  );
};

export default ImageUploader;
