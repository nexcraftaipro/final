import { useState, useCallback } from 'react';
import { extractFileMetadata, FileMetadata } from '@/utils/fileMetadataExtractor';

interface UseFileMetadataOptions {
  onMetadataExtracted?: (file: File, metadata: FileMetadata) => void;
  autoExtract?: boolean;
}

export function useFileMetadata(options: UseFileMetadataOptions = {}) {
  const { onMetadataExtracted, autoExtract = true } = options;
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [filesMetadata, setFilesMetadata] = useState<Record<string, FileMetadata>>({});
  const [error, setError] = useState<string | null>(null);
  
  const extractMetadata = useCallback(async (file: File): Promise<FileMetadata> => {
    if (filesMetadata[file.name]) {
      return filesMetadata[file.name];
    }
    
    setIsExtracting(true);
    setError(null);
    
    try {
      const metadata = await extractFileMetadata(file);
      
      setFilesMetadata(prev => ({
        ...prev,
        [file.name]: metadata
      }));
      
      if (onMetadataExtracted) {
        onMetadataExtracted(file, metadata);
      }
      
      return metadata;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract metadata';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExtracting(false);
    }
  }, [filesMetadata, onMetadataExtracted]);
  
  const processFiles = useCallback(async (files: File[]): Promise<FileMetadata[]> => {
    if (!autoExtract) {
      return [];
    }
    
    setIsExtracting(true);
    setError(null);
    
    try {
      const metadataPromises = files.map(file => extractFileMetadata(file));
      const metadataResults = await Promise.all(metadataPromises);
      
      const newMetadataMap: Record<string, FileMetadata> = {};
      
      files.forEach((file, index) => {
        newMetadataMap[file.name] = metadataResults[index];
        
        if (onMetadataExtracted) {
          onMetadataExtracted(file, metadataResults[index]);
        }
      });
      
      setFilesMetadata(prev => ({
        ...prev,
        ...newMetadataMap
      }));
      
      return metadataResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract metadata';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExtracting(false);
    }
  }, [autoExtract, onMetadataExtracted]);
  
  const getMetadataForFile = useCallback((file: File | string): FileMetadata | null => {
    const fileName = typeof file === 'string' ? file : file.name;
    return filesMetadata[fileName] || null;
  }, [filesMetadata]);
  
  const clearMetadata = useCallback(() => {
    setFilesMetadata({});
    setError(null);
  }, []);
  
  return {
    extractMetadata,
    processFiles,
    getMetadataForFile,
    clearMetadata,
    filesMetadata,
    isExtracting,
    error
  };
} 