/**
 * Utility for extracting metadata from various file types
 */
import { isEpsFile, extractEpsMetadata } from './epsMetadataExtractor';
import { isVideoFile } from './videoProcessor';

export interface FileMetadata {
  filename: string;
  fileSize: number;
  fileType: string;
  lastModified: Date;
  dimensions?: { width: number; height: number };
  duration?: number;
  resolution?: { horizontal: number, vertical: number };
  creator?: string;
  creationDate?: string;
  title?: string;
  subject?: string;
  description?: string;
  tags?: string[];
  rating?: number;
  comments?: string;
  copyright?: string;
  camera?: {
    make?: string;
    model?: string;
    exposureTime?: string;
    fNumber?: number;
    iso?: number;
    focalLength?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  additionalProperties?: Record<string, string>;
}

/**
 * Extract metadata from a file
 * @param file - The file to extract metadata from
 * @returns A Promise that resolves to a FileMetadata object
 */
export async function extractFileMetadata(file: File): Promise<FileMetadata> {
  const metadata: FileMetadata = {
    filename: file.name,
    fileSize: file.size,
    fileType: file.type || getFileTypeFromExtension(file.name),
    lastModified: new Date(file.lastModified),
    additionalProperties: {},
  };

  // Extract metadata based on file type
  if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg')) {
    return extractImageMetadata(file, metadata);
  } else if (isEpsFile(file)) {
    return extractEpsFileMetadata(file, metadata);
  } else if (isVideoFile(file)) {
    return extractVideoFileMetadata(file, metadata);
  } else if (file.type.startsWith('audio/')) {
    return extractAudioFileMetadata(file, metadata);
  } else if (file.type === 'application/pdf') {
    return extractPdfMetadata(file, metadata);
  } else {
    return metadata;
  }
}

/**
 * Extract metadata from an image file
 */
async function extractImageMetadata(file: File, baseMetadata: FileMetadata): Promise<FileMetadata> {
  const metadata = { ...baseMetadata };

  try {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        // Extract image dimensions
        metadata.dimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight
        };
        
        // Estimate resolution (96 dpi is standard for web)
        metadata.resolution = {
          horizontal: 96,
          vertical: 96
        };
        
        URL.revokeObjectURL(objectUrl);
        resolve(metadata);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(metadata); // Resolve with base metadata if image loading fails
      };
      
      img.src = objectUrl;
    });
  } catch (error) {
    console.error('Error extracting image metadata:', error);
    return metadata;
  }
}

/**
 * Extract metadata from an EPS file
 */
async function extractEpsFileMetadata(file: File, baseMetadata: FileMetadata): Promise<FileMetadata> {
  const metadata = { ...baseMetadata };
  
  try {
    const epsMetadata = await extractEpsMetadata(file);
    
    metadata.title = epsMetadata.title;
    metadata.creator = epsMetadata.creator;
    metadata.creationDate = epsMetadata.creationDate;
    
    if (epsMetadata.boundingBox) {
      const dimensions = epsMetadata.boundingBox.split(' ');
      if (dimensions.length >= 4) {
        metadata.dimensions = {
          width: Math.abs(Number(dimensions[2]) - Number(dimensions[0])),
          height: Math.abs(Number(dimensions[3]) - Number(dimensions[1]))
        };
      }
    }
    
    // Add EPS-specific metadata
    if (epsMetadata.documentType) {
      metadata.additionalProperties!['Document Type'] = epsMetadata.documentType;
    }
    
    if (epsMetadata.colors && epsMetadata.colors.length > 0) {
      metadata.additionalProperties!['Colors'] = epsMetadata.colors.join(', ');
    }
    
    if (epsMetadata.fontInfo && epsMetadata.fontInfo.length > 0) {
      metadata.additionalProperties!['Fonts'] = epsMetadata.fontInfo.join(', ');
    }
    
    return metadata;
  } catch (error) {
    console.error('Error extracting EPS metadata:', error);
    return metadata;
  }
}

/**
 * Extract metadata from a video file
 */
async function extractVideoFileMetadata(file: File, baseMetadata: FileMetadata): Promise<FileMetadata> {
  const metadata = { ...baseMetadata };
  
  try {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const objectUrl = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        // Extract video dimensions and duration
        metadata.dimensions = {
          width: video.videoWidth,
          height: video.videoHeight
        };
        
        metadata.duration = video.duration;
        
        URL.revokeObjectURL(objectUrl);
        resolve(metadata);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(metadata); // Resolve with base metadata if video loading fails
      };
      
      video.src = objectUrl;
    });
  } catch (error) {
    console.error('Error extracting video metadata:', error);
    return metadata;
  }
}

/**
 * Extract metadata from an audio file
 */
async function extractAudioFileMetadata(file: File, baseMetadata: FileMetadata): Promise<FileMetadata> {
  const metadata = { ...baseMetadata };
  
  try {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      const objectUrl = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        // Extract audio duration
        metadata.duration = audio.duration;
        
        URL.revokeObjectURL(objectUrl);
        resolve(metadata);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(metadata); // Resolve with base metadata if audio loading fails
      };
      
      audio.src = objectUrl;
    });
  } catch (error) {
    console.error('Error extracting audio metadata:', error);
    return metadata;
  }
}

/**
 * Extract metadata from a PDF file
 * Note: This function provides basic metadata, advanced extraction would require a PDF library
 */
async function extractPdfMetadata(file: File, baseMetadata: FileMetadata): Promise<FileMetadata> {
  return baseMetadata; // Basic metadata only for PDFs for now
}

/**
 * Get file type from file extension if MIME type is not available
 */
function getFileTypeFromExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const extensionMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'eps': 'application/postscript',
    'pdf': 'application/pdf',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mp3',
    'wav': 'audio/wav',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  return extensionMap[extension] || 'application/octet-stream';
}

/**
 * Format file size in a human-readable way
 */
export function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

/**
 * Format date in a human-readable way
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
} 