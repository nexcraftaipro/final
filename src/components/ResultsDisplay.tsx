
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy, X, Check } from 'lucide-react';
import { ProcessedImage, formatImagesAsCSV, downloadCSV, formatFileSize } from '@/utils/imageHelpers';
import { toast } from 'sonner';
import { GenerationMode } from '@/components/GenerationModeSelector';

interface ResultsDisplayProps {
  images: ProcessedImage[];
  onRemoveImage: (id: string) => void;
  onClearAll: () => void;
  generationMode: GenerationMode;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ images, onRemoveImage, onClearAll, generationMode }) => {
  if (images.length === 0) return null;

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleDownloadCSV = () => {
    const csvContent = formatImagesAsCSV(images);
    downloadCSV(csvContent);
    toast.success('CSV file downloaded');
  };

  const completedImages = images.filter(img => img.status === 'complete');
  const hasCompletedImages = completedImages.length > 0;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Generated Data</h2>
        <div className="flex gap-2">
          {hasCompletedImages && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white border-none"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            <span>Clear All</span>
          </Button>
        </div>
      </div>

      {hasCompletedImages && (
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="table-cell text-left">File</th>
                <th className="table-cell text-left">Title</th>
                <th className="table-cell text-left">Keywords</th>
              </tr>
            </thead>
            <tbody>
              {completedImages.map((image) => (
                <tr key={image.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-12 rounded overflow-hidden">
                        <img
                          src={image.previewUrl}
                          alt={image.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs truncate max-w-[150px]">{image.file.name}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {image.result?.title || ''}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {image.result?.keywords.slice(0, 5).map((keyword, idx) => (
                        <span 
                          key={idx} 
                          className="keyword-tag"
                        >
                          {keyword}
                        </span>
                      ))}
                      {(image.result?.keywords.length || 0) > 5 && (
                        <span className="text-xs text-gray-400">+{(image.result?.keywords.length || 0) - 5} more</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {images.filter(img => img.status !== 'complete').length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.filter(img => img.status !== 'complete').map((image) => (
            <div key={image.id} className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded border bg-gray-700">
                      <img
                        src={image.previewUrl}
                        alt={image.file.name}
                        className="h-full w-full object-cover"
                      />
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
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onRemoveImage(image.id)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </div>
              
              <div className="border-t border-gray-700 p-3">
                {image.status === 'pending' && (
                  <div className="h-12 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Ready to process</p>
                  </div>
                )}
                
                {image.status === 'processing' && (
                  <div className="h-12 flex flex-col items-center justify-center">
                    <div className="h-6 w-6 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-1"></div>
                    <p className="text-xs text-gray-400 animate-pulse">Analyzing image...</p>
                  </div>
                )}
                
                {image.status === 'error' && (
                  <div className="h-12 flex items-center justify-center">
                    <p className="text-xs text-red-500">{image.error || 'Error processing image'}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
