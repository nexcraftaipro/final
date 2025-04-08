
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Copy, X, Clipboard, Check } from 'lucide-react';
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
    <div className="w-full space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">03. Results</h2>
        <div className="flex gap-2">
          {hasCompletedImages && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white border-none"
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

      {hasCompletedImages && completedImages.map((image) => (
        <Card key={image.id} className="overflow-hidden bg-gray-800/50 border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Preview Column */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-700">
              <h3 className="text-xl font-medium text-orange-500 mb-4">Image Preview</h3>
              <div className="relative aspect-square w-full overflow-hidden rounded-md mb-3">
                <img
                  src={image.previewUrl}
                  alt={image.file.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-gray-400 text-sm">{image.file.name}</p>
            </div>
            
            {/* Generated Metadata Column */}
            <div className="p-6">
              <h3 className="text-xl font-medium text-orange-500 mb-4">
                {generationMode === 'metadata' ? 'Generated Metadata' : 'Generated Prompt'}
              </h3>
              
              {image.result && (
                <div className="space-y-6">
                  <div>
                    <p className="text-orange-400 mb-1">Filename:</p>
                    <p>{image.file.name}</p>
                  </div>
                  
                  {generationMode === 'metadata' ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-orange-400 mb-1">Title:</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(image.result?.title || '')}
                            className="h-6 px-2 text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            <span>Copy</span>
                          </Button>
                        </div>
                        <p>{image.result.title}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-orange-400 mb-1">Description:</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(image.result?.description || '')}
                            className="h-6 px-2 text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            <span>Copy</span>
                          </Button>
                        </div>
                        <p>{image.result.description}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-orange-400 mb-1">Keywords:</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(image.result?.keywords.join(', ') || '')}
                            className="h-6 px-2 text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            <span>Copy</span>
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {image.result.keywords.map((keyword, idx) => (
                            <span 
                              key={idx} 
                              className="px-3 py-1 bg-blue-600 rounded-full text-sm text-white"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-orange-400 mb-1">Generated Prompt:</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(image.result?.description || '')}
                          className="h-6 px-2 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          <span>Copy</span>
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{image.result.description}</p>
                    </div>
                  )}
                </div>
              )}
              
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
            </div>
          </div>
        </Card>
      ))}
      
      {images.filter(img => img.status !== 'complete').length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.filter(img => img.status !== 'complete').map((image) => (
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
