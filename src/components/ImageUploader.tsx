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
  const [selectedTab, setSelectedTab] = useState<'svg' | 'images' | 'videos'>('videos');
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

    // Filter files based on selected tab
    const filteredFiles = filesToProcess.filter(file => {
      const fileType = file.type.toLowerCase();
      if (selectedTab === 'svg' && fileType === 'image/svg+xml') {
        return true;
      } else if (selectedTab === 'images' && (fileType === 'image/jpeg' || fileType === 'image/png' || fileType === 'image/jpg')) {
        return true;
      } else if (selectedTab === 'videos' && fileType.startsWith('video/')) {
        return true;
      }
      return false;
    });
    if (filteredFiles.length === 0) {
      toast.error(`Please select files that match the selected type: ${selectedTab}`);
      return;
    }
    for (const file of filteredFiles) {
      const promise = (async () => {
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
      toast.success(`${validResults.length} file${validResults.length !== 1 ? 's' : ''} added`);
    } else if (files.length > 0) {
      toast.error('No valid files were found to process.');
    }
  }, [onImagesSelected, selectedTab]);
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

  // Set the accept type based on selected tab
  const getAcceptTypes = () => {
    switch (selectedTab) {
      case 'svg':
        return 'image/svg+xml';
      case 'images':
        return 'image/jpeg,image/png,image/jpg';
      case 'videos':
        return 'video/*';
      default:
        return 'image/jpeg,image/png,image/jpg,image/svg+xml,video/*';
    }
  };
  return <div className="bg-[#121212] border border-dashed border-gray-700 rounded-lg overflow-hidden cursor-pointer" onClick={handleBrowseClick}>
      <div className={`w-full min-h-[300px] flex flex-col items-center justify-center p-8 transition-all duration-300 ${isDragging ? 'bg-blue-900/10' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {/* Image icon */}
        <div className="mb-5">
          <div className="p-5 rounded-lg bg-gray-800">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        </div>
        
        {/* Drag and Drop text */}
        <h2 className="text-2xl font-semibold text-white mb-6">Drag and Drop Upto unlimited File</h2>
        
        {/* Tabs - Updated order: SVG, JPG/PNG, Videos */}
        <div className="flex space-x-2 mb-6">
          <Button onClick={e => {
          e.stopPropagation();
          setSelectedTab('svg');
        }} variant="outline" className={`rounded-full px-6 ${selectedTab === 'svg' ? 'bg-purple-600 text-white border-transparent hover:bg-purple-700' : 'bg-gray-800 text-gray-300 border-transparent hover:bg-gray-700'}`}>
            SVG
          </Button>
          <Button onClick={e => {
          e.stopPropagation();
          setSelectedTab('images');
        }} variant="outline" className={`rounded-full px-6 ${selectedTab === 'images' ? 'bg-blue-600 text-white border-transparent hover:bg-blue-700' : 'bg-gray-800 text-gray-300 border-transparent hover:bg-gray-700'}`}>
            JPG/PNG
          </Button>
          <Button onClick={e => {
          e.stopPropagation();
          setSelectedTab('videos');
        }} variant="outline" className={`rounded-full px-6 ${selectedTab === 'videos' ? 'bg-red-600 text-white border-transparent hover:bg-red-700' : 'bg-gray-800 text-gray-300 border-transparent hover:bg-gray-700'}`}>
            Videos
          </Button>
        </div>
        
        {/* Privacy notice */}
        <div className="text-center text-sm text-gray-400 max-w-md mt-2">
          
          <p>NOTE: Directly EPS Format Not Supported</p>
          <p className="text-blue-400 mt-2">Upload up to 1000 files at once</p>
        </div>
        
        <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept={getAcceptTypes()} multiple className="hidden" disabled={isProcessing} />
      </div>
    </div>;
};
export default ImageUploader;