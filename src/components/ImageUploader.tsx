
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

    if (filesToProcess.length === 0) {
      toast.error('Please select valid files');
      return;
    }

    for (const file of filesToProcess) {
      const fileType = file.type.toLowerCase();
      // Accept SVG, JPG/PNG, and video files
      if (!(fileType === 'image/svg+xml' || 
            fileType === 'image/jpeg' || 
            fileType === 'image/png' || 
            fileType === 'image/jpg' ||
            fileType.startsWith('video/'))) {
        toast.error(`${file.name} is not a supported file type`);
        continue;
      }

      const promise = (async () => {
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
    const validResults = results.filter(Boolean) as ProcessedImage[];
    
    if (validResults.length > 0) {
      onImagesSelected(validResults);
      toast.success(`${validResults.length} file${validResults.length !== 1 ? 's' : ''} added`);
    } else if (files.length > 0) {
      toast.error('No valid files were found to process.');
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
        className={`w-full min-h-[300px] flex flex-col items-center justify-center p-8 transition-all duration-300 ${isDragging ? 'bg-blue-900/10' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-5">
          <div className="p-5 rounded-lg bg-gray-800">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-white mb-6">
          Drag and Drop Upto unlimited File
        </h2>

        <p className="text-center text-sm text-gray-400 max-w-md mt-4">
          NOTE: Directly EPS Format Not Supported
        </p>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/svg+xml,image/jpeg,image/png,image/jpg,video/*"
          multiple
          className="hidden"
          disabled={isProcessing}
        />
      </div>
    </div>
  );
};

export default ImageUploader;
