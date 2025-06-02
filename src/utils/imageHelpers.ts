import { Platform } from '@/components/PlatformSelector';
import { removeSymbols } from './stringUtils';
import { getRelevantFreepikKeywords } from './keywordGenerator';
import { determineVideoCategory } from './categorySelector';

export interface ProcessedImage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  processingTime?: number;
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
    provider?: 'gemini' | 'openai' | 'openrouter';
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
    ? '"File name";"Title";"Keywords";"Prompt";"Base-Model"'
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
      const prompt = img.result?.prompt || description;
      // Always use "midjourney 5" for Freepik platform
      const baseModel = isFreepikOnly ? "midjourney 5" : (img.result?.baseModel || 'Ideogram 1.0');

      return isFreepikOnly
        ? `"${escapeCSV(filename)}";"${escapeCSV(title)}";"${escapeCSV(keywords)}";"${escapeCSV(prompt)}";"${escapeCSV(baseModel)}"`
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
export const formatVideosAsCSV = (videos: ProcessedImage[], isShutterstock?: boolean): string => {
  // Create CSV header row - Shutterstock requires specific format
  const header = isShutterstock 
    ? '"Filename","Description","Keywords"'
    : '"Filename","Title","Keywords","Category"';
  
  // Process each video
  const rows = videos
    .filter(video => video.status === 'complete' && video.result)
    .map(video => {
      // Ensure we have a filename
      const filename = video.file.name;
      
      // Clean title
      const title = video.result?.title ? removeSymbolsFromTitle(video.result.title) : '';
      
      // Get description for Shutterstock
      const description = video.result?.description || '';
      
      // Join keywords
      const keywords = (video.result?.keywords || []).join(',');
      
      // Determine category
      // Use the existing category if available, otherwise determine it
      const category = video.result?.category || determineVideoCategory(
        title,
        description,
        video.result?.keywords || []
      );
      
      // Format the row with proper CSV escaping
      // For Shutterstock, use the description and keywords without category
      return isShutterstock
        ? `"${escapeCSV(filename)}","${escapeCSV(description)}","${escapeCSV(keywords)}"`
        : `"${escapeCSV(filename)}","${escapeCSV(title)}","${escapeCSV(keywords)}","${category}"`;
    });
  
  // Combine header and rows
  return `${header}\n${rows.join('\n')}`;
};

/**
 * Downloads content as a CSV file
 */
export const downloadCSV = (csvContent: string, filename: string, platform?: Platform | string): string => {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  
  // Add platform prefix to filename if provided
  const filenameWithPrefix = platform ? `${platform}-${filename}` : filename;
  
  // Set the download filename
  a.download = filenameWithPrefix;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Return the URL as required by the function signature
  return url;
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

/**
 * Create a preview for an image file
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Check if the file type is allowed
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = [
    'image/jpeg', 
    'image/png', 
    'image/jpg', 
    'image/svg+xml', 
    'application/postscript',
    'application/eps',
    'image/eps',
    'application/illustrator',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/ogg',
    'video/x-msvideo',
    'video/x-ms-wmv'
  ];
  
  return validTypes.includes(file.type);
};

/**
 * Check if the file size is within limits
 */
export const isValidFileSize = (file: File): boolean => {
  const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10GB
  return file.size <= MAX_SIZE;
};

/**
 * Suggest categories for Shutterstock
 */
export const suggestCategoriesForShutterstock = (title: string, description: string): string[] => {
  const content = `${title} ${description}`.toLowerCase();
  
  const categories: string[] = [];
  
  if (content.includes('people') || content.includes('person') || content.includes('portrait')) {
    categories.push('People');
  }
  
  if (content.includes('nature') || content.includes('landscape') || content.includes('outdoor')) {
    categories.push('Nature');
  }
  
  if (content.includes('business') || content.includes('office') || content.includes('professional')) {
    categories.push('Business');
  }
  
  if (content.includes('food') || content.includes('drink') || content.includes('meal')) {
    categories.push('Food & Drink');
  }
  
  if (content.includes('abstract') || content.includes('pattern') || content.includes('texture')) {
    categories.push('Backgrounds/Textures');
  }
  
  // Return at least one category
  if (categories.length === 0) {
    categories.push('Objects');
  }
  
  return categories;
};

/**
 * Suggest categories for Adobe Stock
 */
export const suggestCategoriesForAdobeStock = (title: string, keywords: string[]): string[] => {
  const content = `${title} ${keywords.join(' ')}`.toLowerCase();
  
  const categories: string[] = [];
  
  if (content.includes('people') || content.includes('person') || content.includes('portrait')) {
    categories.push('People');
  }
  
  if (content.includes('nature') || content.includes('landscape') || content.includes('outdoor')) {
    categories.push('Nature');
  }
  
  if (content.includes('business') || content.includes('office') || content.includes('professional')) {
    categories.push('Business');
  }
  
  if (content.includes('food') || content.includes('drink') || content.includes('meal')) {
    categories.push('Food');
  }
  
  if (content.includes('abstract') || content.includes('pattern') || content.includes('texture')) {
    categories.push('Abstract');
  }
  
  // Return at least one category
  if (categories.length === 0) {
    categories.push('Illustrations');
  }
  
  return categories;
};
