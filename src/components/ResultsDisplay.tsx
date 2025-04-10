
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy, X, Check, ChevronDown, ChevronUp, FileIcon } from 'lucide-react';
import { ProcessedImage, formatImagesAsCSV, downloadCSV, formatFileSize } from '@/utils/imageHelpers';
import { toast } from 'sonner';
import { GenerationMode } from '@/components/GenerationModeSelector';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResultsDisplayProps {
  images: ProcessedImage[];
  onRemoveImage: (id: string) => void;
  onClearAll: () => void;
  generationMode: GenerationMode;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ images, onRemoveImage, onClearAll, generationMode }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedMetadataSections, setExpandedMetadataSections] = useState<Record<string, boolean>>({});

  if (images.length === 0) return null;

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleDownloadCSV = () => {
    const csvContent = formatImagesAsCSV(images);
    downloadCSV(csvContent);
    toast.success('CSV file downloaded');
  };

  const downloadPromptText = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${filename.split('.')[0]}-prompt.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Prompt downloaded as text file');
  };

  const toggleMetadataSection = (sectionId: string) => {
    setExpandedMetadataSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderMetadataSection = (image: ProcessedImage) => {
    if (!image.result?.metadata) {
      return <p className="text-gray-400 italic">No metadata found in this file.</p>;
    }

    const metadata = image.result.metadata;
    const sections: { title: string; data: Record<string, any> }[] = [];

    // Group metadata into sections based on file type
    if (metadata.format === 'JPEG' || metadata.format === 'PNG') {
      if (metadata.exif) sections.push({ title: 'EXIF Data', data: metadata.exif });
      if (metadata.iptc) sections.push({ title: 'IPTC Data', data: metadata.iptc });
      if (metadata.xmp) sections.push({ title: 'XMP Data', data: metadata.xmp });
    } else if (metadata.format === 'EPS' || metadata.format === 'Adobe Illustrator') {
      if (metadata.xmp) sections.push({ title: 'XMP Data', data: metadata.xmp });
      
      // Create a general info section for non-grouped metadata
      const generalInfo: Record<string, any> = {};
      Object.entries(metadata).forEach(([key, value]) => {
        if (key !== 'xmp' && typeof value !== 'object') {
          generalInfo[key] = value;
        }
      });
      
      if (Object.keys(generalInfo).length > 0) {
        sections.push({ title: 'General Information', data: generalInfo });
      }
    }

    // Add basic file info section
    const fileInfo: Record<string, any> = {
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      fileType: metadata.fileType,
      lastModified: metadata.lastModified,
      format: metadata.format,
    };
    sections.unshift({ title: 'File Information', data: fileInfo });

    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          const sectionId = `${image.id}-${section.title}`;
          const isExpanded = expandedMetadataSections[sectionId] !== false; // Default to expanded
          
          return (
            <div key={sectionId} className="border border-gray-700 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-800 px-4 py-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleMetadataSection(sectionId)}
              >
                <h4 className="text-amber-500 font-medium">{section.title}</h4>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </div>
              
              {isExpanded && (
                <div className="p-4">
                  <Table>
                    <TableBody>
                      {Object.entries(section.data).map(([key, value]) => (
                        <TableRow key={`${sectionId}-${key}`}>
                          <TableCell className="font-medium text-gray-300 w-1/3">{key}</TableCell>
                          <TableCell className="text-white">
                            {typeof value === 'object' 
                              ? JSON.stringify(value) 
                              : String(value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const completedImages = images.filter(img => img.status === 'complete');
  const hasCompletedImages = completedImages.length > 0;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Generated Data</h2>
        <div className="flex gap-2">
          {hasCompletedImages && generationMode === 'metadata' && (
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

      {/* Image to Prompt mode display */}
      {generationMode === 'imageToPrompt' && completedImages.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {completedImages.map((image) => (
            <div key={image.id} className="bg-black rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-4">Generated Prompt:</h3>
                <div className="bg-black border border-gray-800 rounded-lg p-6">
                  <p className="text-gray-300 whitespace-pre-wrap">{image.result?.description || ''}</p>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyToClipboard(image.result?.description || '', image.id)}
                    className="flex items-center gap-1"
                  >
                    {copiedId === image.id ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadPromptText(image.result?.description || '', image.file.name)}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metadata mode display */}
      {generationMode === 'metadata' && hasCompletedImages && (
        <div className="overflow-auto">
          {completedImages.map((image) => (
            <div key={image.id} className="mb-6 bg-gray-800/30 border border-gray-700/50 rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 border-r border-gray-700/50">
                  <h3 className="text-amber-500 text-lg mb-2">File Preview</h3>
                  <div className="rounded-lg overflow-hidden mb-4 bg-gray-900 flex items-center justify-center" style={{minHeight: "200px"}}>
                    {image.previewUrl.includes('data:image') ? (
                      <img
                        src={image.previewUrl}
                        alt={image.file.name}
                        className="w-full object-contain max-h-[400px]"
                      />
                    ) : (
                      <div className="text-center p-10">
                        <FileIcon className="h-20 w-20 mx-auto mb-4 text-blue-400" />
                        <p className="text-gray-300">{image.file.name}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400">{image.file.name}</div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-amber-500 text-lg">File Metadata</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadCSV}
                      className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white border-none"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download CSV</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {renderMetadataSection(image)}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
