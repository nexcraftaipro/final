
export interface ProcessedImage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  result?: {
    title: string;
    description: string;
    keywords: string[];
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
export function formatImagesAsCSV(images: ProcessedImage[]): string {
  // Add headers
  const csvContent = [
    ['Filename', 'Title', 'Description', 'Keywords'].join(','),
    // Add data rows
    ...images
      .filter(img => img.status === 'complete' && img.result)
      .map(img => [
        // Escape fields that may contain commas
        `"${img.file.name}"`,
        `"${img.result?.title || ''}"`,
        `"${img.result?.description || ''}"`,
        `"${img.result?.keywords?.join(', ') || ''}"`,
      ].join(','))
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

// Check if file is a valid image type
export function isValidImageType(file: File): boolean {
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  return acceptedTypes.includes(file.type);
}

// Check if file size is within limits (10MB max)
export function isValidFileSize(file: File, maxSizeMB = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
