
export interface ProcessedImage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  result?: {
    title: string;
    description: string;
    keywords: string[];
    metadata?: Record<string, any>; // For storing extracted metadata
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
    // Check if it's an image format that browsers can preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      // For EPS and AI files, return a generic file icon
      if (file.name.endsWith('.eps') || file.name.endsWith('.ai')) {
        // Use a placeholder for EPS/AI files
        resolve('/placeholder.svg');
      } else {
        reject(new Error('Unsupported file type for preview'));
      }
    }
  });
}

// Format for CSV export
export function formatImagesAsCSV(images: ProcessedImage[]): string {
  // Add headers
  const csvContent = [
    ['Filename', 'Title', 'Description', 'Keywords', 'Metadata'].join(','),
    // Add data rows
    ...images
      .filter(img => img.status === 'complete' && img.result)
      .map(img => {
        // Format metadata as JSON string if it exists
        const metadataStr = img.result?.metadata 
          ? `"${JSON.stringify(img.result.metadata).replace(/"/g, '""')}"`
          : '""';
        
        return [
          // Escape fields that may contain commas
          `"${img.file.name}"`,
          `"${img.result?.title || ''}"`,
          `"${img.result?.description || ''}"`,
          `"${img.result?.keywords?.join(', ') || ''}"`,
          metadataStr
        ].join(',');
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

// Check if file is a valid image type
export function isValidImageType(file: File): boolean {
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/postscript', 'application/illustrator'];
  
  // If the file type is in the accepted list, return true
  if (acceptedTypes.includes(file.type)) {
    return true;
  }
  
  // If file.type is empty, check the file extension (for EPS and AI files)
  if (!file.type) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension === 'eps' || extension === 'ai';
  }
  
  return false;
}

// Check if file size is within limits (10GB max)
export function isValidFileSize(file: File, maxSizeGB = 10): boolean {
  const maxSizeBytes = maxSizeGB * 1024 * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

// Extract metadata from files
export async function extractMetadata(file: File): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    // This would be a placeholder for actual metadata extraction logic
    // In a real implementation, you would use appropriate libraries or APIs
    
    // Simulate metadata extraction based on file type
    const fileType = file.type || file.name.split('.').pop()?.toLowerCase();
    let metadata: Record<string, any> = {};
    
    // Add common metadata properties
    metadata.fileName = file.name;
    metadata.fileSize = formatFileSize(file.size);
    metadata.fileType = fileType;
    metadata.lastModified = new Date(file.lastModified).toLocaleString();
    
    // Simulate different metadata for different file types
    if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
      metadata.format = 'JPEG';
      metadata.exif = {
        camera: 'Example Camera',
        dateTaken: new Date().toLocaleString(),
        exposure: '1/125s',
        fStop: 'f/2.8',
        iso: '400',
        focalLength: '50mm',
      };
      metadata.iptc = {
        creator: 'John Doe',
        caption: 'Example photo caption',
        copyright: '© 2023',
        keywords: ['example', 'photo', 'metadata'],
      };
    } else if (fileType === 'image/png') {
      metadata.format = 'PNG';
      metadata.compression = 'Deflate';
      metadata.colorDepth = '24-bit';
      metadata.iptc = {
        creator: 'Jane Smith',
        caption: 'PNG image caption',
        keywords: ['example', 'png', 'image'],
      };
    } else if (fileType === 'application/postscript' || fileType === 'eps') {
      metadata.format = 'EPS';
      metadata.creator = 'Designer Name';
      metadata.creationDate = new Date().toLocaleDateString();
      metadata.title = 'Vector Artwork';
      metadata.xmp = {
        creatorTool: 'Adobe Illustrator',
        createDate: new Date().toISOString(),
      };
    } else if (fileType === 'application/illustrator' || fileType === 'ai') {
      metadata.format = 'Adobe Illustrator';
      metadata.version = 'CC 2023';
      metadata.creator = 'Graphic Designer';
      metadata.creationDate = new Date().toLocaleDateString();
      metadata.colorSpace = 'CMYK';
      metadata.xmp = {
        creatorTool: 'Adobe Illustrator',
        createDate: new Date().toISOString(),
        title: 'AI Artwork',
      };
    }
    
    // In a real app, we would actually extract the metadata from the file
    // For this example, we're just simulating the extraction
    
    // Resolve with our simulated metadata
    setTimeout(() => {
      resolve(metadata);
    }, 1000); // Simulate processing time
  });
}
