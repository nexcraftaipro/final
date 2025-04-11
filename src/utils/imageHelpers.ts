
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
    categories?: string[]; // Added categories field for Shutterstock
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
export function formatImagesAsCSV(images: ProcessedImage[], isFreepikOnly: boolean = false, isShutterstock: boolean = false): string {
  // Determine headers based on platform selection
  let headers;
  
  if (isFreepikOnly) {
    headers = ['"File name"', '"Title"', '"Keywords"', '"Prompt"', '"Base-Model"'];
  } else if (isShutterstock) {
    headers = ['"Filename"', '"Description"', '"Keywords"', '"Categories"'];
  } else {
    headers = ['"Filename"', '"Title"', '"Description"', '"Keywords"'];
  }
    
  // Add headers
  const csvContent = [
    // Use semicolons for Freepik, commas for other platforms
    headers.join(isFreepikOnly ? ';' : ','),
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
            `"leonardo"`,
          ].join(';');
        } else if (isShutterstock) {
          return [
            `"${img.file.name}"`,
            `"${img.result?.description || ''}"`,
            `"${img.result?.keywords?.join(',') || ''}"`,
            `"${img.result?.categories?.join(',') || ''}"`,
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

// Shutterstock Categories
export const shutterstockCategories = [
  'Abstract', 'Animals/Wildlife', 'Arts', 'Backgrounds/Textures', 
  'Beauty/Fashion', 'Buildings/Landmarks', 'Business/Finance', 
  'Celebrities', 'Education', 'Food and drink', 'Healthcare/Medical', 
  'Holidays', 'Industrial', 'Interiors', 'Miscellaneous', 'Nature', 
  'Objects', 'Parks/Outdoor', 'People', 'Religion', 'Science', 
  'Signs/Symbols', 'Sports/Recreation', 'Technology', 'Transportation', 'Vintage'
];

// Helper to determine the best categories for an image based on title/description
export function suggestCategoriesForShutterstock(title: string, description: string): string[] {
  // Combine the title and description for analysis
  const combinedText = (title + " " + description).toLowerCase();
  
  // Map of common words/phrases to categories
  const categoryMatches: Record<string, string[]> = {
    // Abstract
    'abstract': ['Abstract'],
    'geometric': ['Abstract'],
    'pattern': ['Abstract', 'Backgrounds/Textures'],
    
    // Animals
    'animal': ['Animals/Wildlife'],
    'wildlife': ['Animals/Wildlife'],
    'pet': ['Animals/Wildlife'],
    'dog': ['Animals/Wildlife'],
    'cat': ['Animals/Wildlife'],
    'bird': ['Animals/Wildlife'],
    'fish': ['Animals/Wildlife'],
    
    // Arts
    'art': ['Arts'],
    'painting': ['Arts'],
    'sculpture': ['Arts'],
    'drawing': ['Arts'],
    'creative': ['Arts'],
    
    // Backgrounds/Textures
    'background': ['Backgrounds/Textures'],
    'texture': ['Backgrounds/Textures'],
    'pattern': ['Backgrounds/Textures'],
    'wallpaper': ['Backgrounds/Textures'],
    
    // Beauty/Fashion
    'beauty': ['Beauty/Fashion'],
    'fashion': ['Beauty/Fashion'],
    'makeup': ['Beauty/Fashion'],
    'model': ['Beauty/Fashion', 'People'],
    'style': ['Beauty/Fashion'],
    'clothing': ['Beauty/Fashion'],
    
    // Buildings/Landmarks
    'building': ['Buildings/Landmarks'],
    'architecture': ['Buildings/Landmarks'],
    'landmark': ['Buildings/Landmarks'],
    'monument': ['Buildings/Landmarks'],
    'skyscraper': ['Buildings/Landmarks'],
    'house': ['Buildings/Landmarks'],
    
    // Business/Finance
    'business': ['Business/Finance'],
    'finance': ['Business/Finance'],
    'office': ['Business/Finance'],
    'meeting': ['Business/Finance'],
    'corporate': ['Business/Finance'],
    'professional': ['Business/Finance'],
    
    // Celebrities - hard to match without specific names
    'celebrity': ['Celebrities'],
    'famous': ['Celebrities'],
    'star': ['Celebrities'],
    
    // Education
    'education': ['Education'],
    'school': ['Education'],
    'learning': ['Education'],
    'student': ['Education'],
    'book': ['Education'],
    'classroom': ['Education'],
    
    // Food and drink
    'food': ['Food and drink'],
    'drink': ['Food and drink'],
    'meal': ['Food and drink'],
    'restaurant': ['Food and drink'],
    'cooking': ['Food and drink'],
    'kitchen': ['Food and drink'],
    
    // Healthcare/Medical
    'health': ['Healthcare/Medical'],
    'medical': ['Healthcare/Medical'],
    'doctor': ['Healthcare/Medical'],
    'hospital': ['Healthcare/Medical'],
    'nurse': ['Healthcare/Medical'],
    'medicine': ['Healthcare/Medical'],
    
    // Holidays
    'holiday': ['Holidays'],
    'christmas': ['Holidays'],
    'halloween': ['Holidays'],
    'easter': ['Holidays'],
    'celebration': ['Holidays'],
    'festival': ['Holidays'],
    
    // Industrial
    'industrial': ['Industrial'],
    'factory': ['Industrial'],
    'manufacturing': ['Industrial'],
    'machinery': ['Industrial'],
    'construction': ['Industrial'],
    
    // Interiors
    'interior': ['Interiors'],
    'room': ['Interiors'],
    'furniture': ['Interiors'],
    'home': ['Interiors'],
    'decoration': ['Interiors'],
    'indoor': ['Interiors'],
    
    // Miscellaneous
    'misc': ['Miscellaneous'],
    'various': ['Miscellaneous'],
    'assorted': ['Miscellaneous'],
    
    // Nature
    'nature': ['Nature'],
    'landscape': ['Nature', 'Parks/Outdoor'],
    'mountain': ['Nature', 'Parks/Outdoor'],
    'forest': ['Nature'],
    'plant': ['Nature'],
    'flower': ['Nature'],
    'tree': ['Nature'],
    'river': ['Nature'],
    'lake': ['Nature'],
    'ocean': ['Nature'],
    'sea': ['Nature'],
    
    // Objects
    'object': ['Objects'],
    'item': ['Objects'],
    'tool': ['Objects'],
    'product': ['Objects'],
    
    // Parks/Outdoor
    'park': ['Parks/Outdoor'],
    'outdoor': ['Parks/Outdoor'],
    'garden': ['Parks/Outdoor'],
    'yard': ['Parks/Outdoor'],
    'camping': ['Parks/Outdoor'],
    
    // People
    'people': ['People'],
    'person': ['People'],
    'man': ['People'],
    'woman': ['People'],
    'child': ['People'],
    'family': ['People'],
    'group': ['People'],
    
    // Religion
    'religion': ['Religion'],
    'church': ['Religion'],
    'temple': ['Religion'],
    'mosque': ['Religion'],
    'prayer': ['Religion'],
    'spiritual': ['Religion'],
    
    // Science
    'science': ['Science'],
    'research': ['Science'],
    'lab': ['Science'],
    'chemistry': ['Science'],
    'biology': ['Science'],
    'physics': ['Science'],
    
    // Signs/Symbols
    'sign': ['Signs/Symbols'],
    'symbol': ['Signs/Symbols'],
    'icon': ['Signs/Symbols'],
    'logo': ['Signs/Symbols'],
    
    // Sports/Recreation
    'sport': ['Sports/Recreation'],
    'game': ['Sports/Recreation'],
    'play': ['Sports/Recreation'],
    'athlete': ['Sports/Recreation'],
    'fitness': ['Sports/Recreation'],
    'exercise': ['Sports/Recreation'],
    'recreation': ['Sports/Recreation'],
    
    // Technology
    'technology': ['Technology'],
    'computer': ['Technology'],
    'digital': ['Technology'],
    'electronic': ['Technology'],
    'device': ['Technology'],
    'smartphone': ['Technology'],
    'internet': ['Technology'],
    
    // Transportation
    'transportation': ['Transportation'],
    'vehicle': ['Transportation'],
    'car': ['Transportation'],
    'bus': ['Transportation'],
    'train': ['Transportation'],
    'plane': ['Transportation'],
    'airplane': ['Transportation'],
    'ship': ['Transportation'],
    'boat': ['Transportation'],
    
    // Vintage
    'vintage': ['Vintage'],
    'retro': ['Vintage'],
    'antique': ['Vintage'],
    'old': ['Vintage'],
    'classic': ['Vintage']
  };
  
  // Count category matches based on the text content
  const categoryCount: Record<string, number> = {};
  
  // Check each word against our category mapping
  const words = combinedText.split(/\s+/);
  for (const word of words) {
    if (categoryMatches[word]) {
      for (const category of categoryMatches[word]) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    }
  }
  
  // Sort categories by number of matches
  const sortedCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  
  // Return top 2 categories, or default to "Miscellaneous" and "Objects" if none found
  return sortedCategories.length >= 2 
    ? sortedCategories.slice(0, 2) 
    : sortedCategories.concat(["Miscellaneous", "Objects"]).slice(0, 2);
}
