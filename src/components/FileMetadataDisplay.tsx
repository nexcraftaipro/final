import React, { useState, useEffect } from 'react';
import { FileMetadata, extractFileMetadata, formatFileSize, formatDate } from '@/utils/fileMetadataExtractor';
import { Star, StarHalf } from 'lucide-react';
import { ProcessedImage } from '@/utils/imageHelpers';

interface FileMetadataDisplayProps {
  file: File;
  onClose?: () => void;
  processedImage?: ProcessedImage;
}

const FileMetadataDisplay: React.FC<FileMetadataDisplayProps> = ({ file, onClose, processedImage }) => {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'details'>('general');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoading(true);
      try {
        const data = await extractFileMetadata(file);
        
        // Merge AI-generated metadata if available
        if (processedImage?.result) {
          data.title = processedImage.result.title || data.title;
          data.description = processedImage.result.description || data.description;
          data.tags = processedImage.result.keywords || data.tags;
        }
        
        setMetadata(data);
      } catch (error) {
        console.error('Error extracting metadata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetadata();
  }, [file, processedImage]);

  const renderRatingStars = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarHalf key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />);
      } else {
        stars.push(<Star key={i} className="h-5 w-5 text-gray-300" />);
      }
    }
    
    return <div className="flex gap-1">{stars}</div>;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl p-4 w-full max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Loading Properties...</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl p-4 w-full max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Error Loading Properties</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-4 text-center">
          <p className="text-red-400">Failed to extract metadata from this file.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold truncate max-w-md" title={metadata.filename}>
          {metadata.filename} Properties
        </h2>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button 
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button 
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        {activeTab === 'general' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="text-gray-400">Description</div>
              <div>{metadata.description || '-'}</div>
              
              <div className="text-gray-400">Title</div>
              <div>{metadata.title || '-'}</div>
              
              <div className="text-gray-400">Subject</div>
              <div>{metadata.subject || '-'}</div>
              
              <div className="text-gray-400">Rating</div>
              <div>{renderRatingStars(metadata.rating || 0)}</div>
              
              <div className="text-gray-400">Tags</div>
              <div>{metadata.tags?.join(', ') || '-'}</div>
              
              <div className="text-gray-400">Comments</div>
              <div>{metadata.comments || '-'}</div>
              
              <div className="mt-4 text-gray-400 col-span-2 border-t border-gray-700 pt-2">
                Origin
              </div>
              
              <div className="text-gray-400">Author</div>
              <div>{metadata.creator || '-'}</div>
              
              <div className="text-gray-400">Date taken</div>
              <div>{metadata.creationDate ? formatDate(metadata.creationDate) : '-'}</div>
              
              <div className="text-gray-400">Program name</div>
              <div>-</div>
              
              <div className="text-gray-400">Date acquired</div>
              <div>{formatDate(metadata.lastModified)}</div>
              
              <div className="text-gray-400">Copyright</div>
              <div>{metadata.copyright || '-'}</div>
              
              <div className="mt-4 text-gray-400 col-span-2 border-t border-gray-700 pt-2">
                Image
              </div>
              
              <div className="text-gray-400">Image ID</div>
              <div>-</div>
              
              <div className="text-gray-400">Dimensions</div>
              <div>{metadata.dimensions ? `${metadata.dimensions.width} x ${metadata.dimensions.height}` : '-'}</div>
              
              <div className="text-gray-400">Width</div>
              <div>{metadata.dimensions ? `${metadata.dimensions.width} pixels` : '-'}</div>
              
              <div className="text-gray-400">Height</div>
              <div>{metadata.dimensions ? `${metadata.dimensions.height} pixels` : '-'}</div>
              
              <div className="text-gray-400">Horizontal resolution</div>
              <div>{metadata.resolution ? `${metadata.resolution.horizontal} dpi` : '-'}</div>
              
              <div className="text-gray-400">Vertical resolution</div>
              <div>{metadata.resolution ? `${metadata.resolution.vertical} dpi` : '-'}</div>
              
              <div className="text-gray-400">Bit depth</div>
              <div>-</div>
              
              {processedImage?.result?.keywords && (
                <>
                  <div className="mt-4 text-gray-400 col-span-2 border-t border-gray-700 pt-2">
                    AI-Generated Metadata
                  </div>
                  
                  <div className="text-gray-400">Keywords</div>
                  <div>{processedImage.result.keywords.join(', ')}</div>
                  
                  {processedImage.result.prompt && (
                    <>
                      <div className="text-gray-400">AI Prompt</div>
                      <div>{processedImage.result.prompt}</div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="text-gray-400">Name</div>
              <div>{metadata.filename}</div>
              
              <div className="text-gray-400">Type</div>
              <div>{metadata.fileType}</div>
              
              <div className="text-gray-400">Size</div>
              <div>{formatFileSize(metadata.fileSize)}</div>
              
              <div className="text-gray-400">Created</div>
              <div>{formatDate(metadata.lastModified)}</div>
              
              {metadata.duration && (
                <>
                  <div className="text-gray-400">Duration</div>
                  <div>{Math.floor(metadata.duration / 60)}:{Math.floor(metadata.duration % 60).toString().padStart(2, '0')}</div>
                </>
              )}
              
              {/* Camera info if available */}
              {metadata.camera && Object.values(metadata.camera).some(v => v) && (
                <>
                  <div className="mt-4 text-gray-400 col-span-2 border-t border-gray-700 pt-2">
                    Camera
                  </div>
                  
                  {metadata.camera.make && (
                    <>
                      <div className="text-gray-400">Make</div>
                      <div>{metadata.camera.make}</div>
                    </>
                  )}
                  
                  {metadata.camera.model && (
                    <>
                      <div className="text-gray-400">Model</div>
                      <div>{metadata.camera.model}</div>
                    </>
                  )}
                  
                  {metadata.camera.exposureTime && (
                    <>
                      <div className="text-gray-400">Exposure time</div>
                      <div>{metadata.camera.exposureTime}</div>
                    </>
                  )}
                  
                  {metadata.camera.fNumber && (
                    <>
                      <div className="text-gray-400">F-stop</div>
                      <div>f/{metadata.camera.fNumber}</div>
                    </>
                  )}
                  
                  {metadata.camera.iso && (
                    <>
                      <div className="text-gray-400">ISO speed</div>
                      <div>{metadata.camera.iso}</div>
                    </>
                  )}
                  
                  {metadata.camera.focalLength && (
                    <>
                      <div className="text-gray-400">Focal length</div>
                      <div>{metadata.camera.focalLength}</div>
                    </>
                  )}
                </>
              )}
              
              {/* Processing information */}
              {processedImage?.processingTime !== undefined && (
                <>
                  <div className="mt-4 text-gray-400 col-span-2 border-t border-gray-700 pt-2">
                    Processing Information
                  </div>
                  
                  <div className="text-gray-400">Processing time</div>
                  <div>{processedImage.processingTime}s</div>
                  
                  {processedImage.result?.baseModel && (
                    <>
                      <div className="text-gray-400">AI Model</div>
                      <div>{processedImage.result.baseModel}</div>
                    </>
                  )}
                  
                  {processedImage.result?.provider && (
                    <>
                      <div className="text-gray-400">Provider</div>
                      <div>{processedImage.result.provider.toUpperCase()}</div>
                    </>
                  )}
                </>
              )}
              
              {/* Additional properties */}
              {metadata.additionalProperties && Object.keys(metadata.additionalProperties).length > 0 && (
                <>
                  <div className="mt-4 text-gray-400 col-span-2 border-t border-gray-700 pt-2">
                    Additional Information
                  </div>
                  
                  {Object.entries(metadata.additionalProperties).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <div className="text-gray-400">{key}</div>
                      <div>{value}</div>
                    </React.Fragment>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between p-4 border-t border-gray-700">
        <button 
          onClick={() => onClose && onClose()}
          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium"
        >
          OK
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => onClose && onClose()}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium"
          >
            Cancel
          </button>
          <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm font-medium">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileMetadataDisplay; 