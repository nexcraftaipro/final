
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Copy, X, Clipboard, Check } from 'lucide-react';
import { ProcessedImage, formatImagesAsCSV, downloadCSV, formatFileSize } from '@/utils/imageHelpers';
import { toast } from 'sonner';

interface ResultsDisplayProps {
  images: ProcessedImage[];
  onRemoveImage: (id: string) => void;
  onClearAll: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ images, onRemoveImage, onClearAll }) => {
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
    <div className="w-full space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">03. Results</h2>
        <div className="flex gap-2">
          {hasCompletedImages && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden glass-panel glass-panel-hover animate-scale-in">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
                    <img
                      src={image.previewUrl}
                      alt={image.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-medium text-sm truncate max-w-[140px] sm:max-w-[200px]" title={image.file.name}>
                      {image.file.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(image.file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onRemoveImage(image.id)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="border-t p-4">
              {image.status === 'pending' && (
                <div className="h-24 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Ready to process</p>
                </div>
              )}
              
              {image.status === 'processing' && (
                <div className="h-24 flex flex-col items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-2"></div>
                  <p className="text-sm text-muted-foreground animate-pulse-subtle">Analyzing image...</p>
                </div>
              )}
              
              {image.status === 'error' && (
                <div className="h-24 flex items-center justify-center">
                  <p className="text-sm text-red-500">{image.error || 'Error processing image'}</p>
                </div>
              )}
              
              {image.status === 'complete' && image.result && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Title</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyToClipboard(image.result?.title || '')}
                      >
                        <Copy className="h-3 w-3" />
                        <span className="sr-only">Copy title</span>
                      </Button>
                    </div>
                    <p className="text-sm">{image.result.title}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Description</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyToClipboard(image.result?.description || '')}
                      >
                        <Copy className="h-3 w-3" />
                        <span className="sr-only">Copy description</span>
                      </Button>
                    </div>
                    <p className="text-sm">{image.result.description}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Keywords</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyToClipboard(image.result?.keywords.join(', ') || '')}
                      >
                        <Copy className="h-3 w-3" />
                        <span className="sr-only">Copy keywords</span>
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {image.result.keywords.map((keyword, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;
