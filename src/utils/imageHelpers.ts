import { Platform } from '@/components/PlatformSelector';
import { removeSymbols } from './stringUtils';
import { suggestCategoriesForShutterstock, suggestCategoriesForAdobeStock } from './imageHelpers';
import { getRelevantFreepikKeywords } from './keywordGenerator';
import { determineVideoCategory } from './categorySelector';

export interface ProcessedImage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  result?: {
    title: string;
    description: string;
    keywords: string[];
    prompt?: string;
    baseModel?: string;
    categories?: string[];
    isVideo?: boolean;
    category?: number;
    isEps?: boolean;
  };
  error?: string;
}

/**
 * Format images as CSV
 */
export const formatImagesAsCSV = (
  images: ProcessedImage[],
  isFreepikOnly?: boolean,
  isShutterstock?: boolean,
  isAdobeStock?: boolean,
  isVecteezy?: boolean,
  isDepositphotos?: boolean,
  is123RF?: boolean,
  isAlamy?: boolean
): string => {
  const header = isFreepikOnly
    ? '"Filename","Title","Prompt","Keywords"'
    : isShutterstock
      ? '"Filename","Description","Keywords"'
      : isAdobeStock
        ? '"Filename","Title","Keywords"'
        : '"Filename","Title","Description","Keywords"';

  const rows = images
    .filter(img => img.status === 'complete' && img.result)
    .map(img => {
      const filename = img.file.name;
      const title = img.result?.title ? removeSymbolsFromTitle(img.result.title) : '';
      const description = img.result?.description || '';
      const keywords = (img.result?.keywords || []).join(',');
      const prompt = img.result?.prompt || '';

      return isFreepikOnly
        ? `"${escapeCSV(filename)}","${escapeCSV(title)}","${escapeCSV(prompt)}","${escapeCSV(keywords)}"`
        : isShutterstock
          ? `"${escapeCSV(filename)}","${escapeCSV(description)}","${escapeCSV(keywords)}"`
          : isAdobeStock
            ? `"${escapeCSV(filename)}","${escapeCSV(title)}","${escapeCSV(keywords)}"`
            : `"${escapeCSV(filename)}","${escapeCSV(title)}","${escapeCSV(description)}","${escapeCSV(keywords)}"`;
    });

  return `${header}\n${rows.join('\n')}`;
};

/**
 * Format videos as CSV
 */
export const formatVideosAsCSV = (videos: ProcessedImage[]): string => {
  // Create CSV header row
  const header = '"Filename","Title","Keywords","Category"';
  
  // Process each video
  const rows = videos
    .filter(video => video.status === 'complete' && video.result)
    .map(video => {
      // Ensure we have a filename
      const filename = video.file.name;
      
      // Clean title
      const title = video.result?.title ? removeSymbolsFromTitle(video.result.title) : '';
      
      // Join keywords
      const keywords = (video.result?.keywords || []).join(',');
      
      // Determine category
      // Use the existing category if available, otherwise determine it
      const category = video.result?.category || determineVideoCategory(
        title,
        video.result?.description || '',
        video.result?.keywords || []
      );
      
      // Format the row with proper CSV escaping
      return `"${escapeCSV(filename)}","${escapeCSV(title)}","${escapeCSV(keywords)}","${category}"`;
    });
  
  // Combine header and rows
  return `${header}\n${rows.join('\n')}`;
};

/**
 * Downloads content as a CSV file
 */
export const downloadCSV = (csvContent: string, filename: string, platform?: Platform) => {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  
  // Use platform to create a custom folder name
  const folderName = platform ? `${platform}-metadata` : 'metadata';
  
  // Append folder name to filename
  a.download = `${folderName}/${filename}`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Removes symbols from a title
 */
export const removeSymbolsFromTitle = (title: string): string => {
  return removeSymbols(title);
};

/**
 * Removes commas from a description
 */
export const removeCommasFromDescription = (description: string): string => {
  return description.replace(/,/g, '');
};

// Helper function to properly escape CSV fields
export const escapeCSV = (field: string): string => {
  // Replace double quotes with two double quotes according to CSV standard
  return field.replace(/"/g, '""');
};
