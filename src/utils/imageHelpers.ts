
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
  };
  error?: string;
}

// Generate a unique ID for each image
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create preview URLs for images
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Format for CSV export
export function formatImagesAsCSV(images: ProcessedImage[], isFreepikOnly: boolean = false): string {
  // Determine headers based on platform selection
  const headers = isFreepikOnly
    ? ['Filename', 'Title', 'Keywords', 'Prompt', 'Base-Model']
    : ['Filename', 'Title', 'Description', 'Keywords'];
    
  // Add headers
  const csvContent = [
    headers.join(','),
    // Add data rows
    ...images
      .filter(img => img.status === 'complete' && img.result)
      .map(img => {
        if (isFreepikOnly) {
          return [
            `"${img.file.name}"`,
            `"${img.result?.title || ''}"`,
            `"${img.result?.keywords?.join(', ') || ''}"`,
            `"${img.result?.prompt || ''}"`,
            `"${img.result?.baseModel || 'leonardo 5'}"`,
          ].join(',');
        } else {
          return [
            `"${img.file.name}"`,
            `"${img.result?.title || ''}"`,
            `"${img.result?.description || ''}"`,
            `"${img.result?.keywords?.join(', ') || ''}"`,
          ].join(',');
        }
      })
  ].join('\n');

  return csvContent;
}

// Export data to CSV file
export function downloadCSV(csvContent: string, filename = 'image-metadata.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Get file size in human-readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if file is a valid image type - Updated to support more formats
export function isValidImageType(file: File): boolean {
  const acceptedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/jpg', 
    'image/webp',
    'image/svg+xml',  // SVG support
    'application/postscript', // AI files
    'application/eps', // EPS files
    'application/x-eps',
    'image/eps',
    'application/illustrator' // Adobe Illustrator
  ];
  return acceptedTypes.includes(file.type);
}

// Check if file size is within limits (10GB max)
export function isValidFileSize(file: File, maxSizeGB = 10): boolean {
  const maxSizeBytes = maxSizeGB * 1024 * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
