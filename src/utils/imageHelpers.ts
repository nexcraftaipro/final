
import { Platform } from '@/components/PlatformSelector';
import { v4 as uuidv4 } from 'uuid';

export interface ProcessedImage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  result?: {
    title?: string;
    description?: string;
    keywords?: string[];
    prompt?: string;
    baseModel?: string;
    categories?: string[];
  };
  error?: string;
}

// Generate a unique ID for images
export const generateId = (): string => {
  return uuidv4();
};

// Function to create image objects with preview URLs
export const createProcessedImages = (files: File[]): ProcessedImage[] => {
  return Array.from(files).map(file => ({
    id: uuidv4(),
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'pending'
  }));
};

// Create image preview from file
export const createImagePreview = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const previewUrl = URL.createObjectURL(file);
      resolve(previewUrl);
    } catch (error) {
      reject(error);
    }
  });
};

// Check if file is a valid image type
export const isValidImageType = (file: File): boolean => {
  const validTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/svg+xml', 
    'application/postscript', 
    'application/eps', 
    'image/eps', 
    'application/illustrator'
  ];
  return validTypes.includes(file.type);
};

// Check if file size is valid (less than 10GB)
export const isValidFileSize = (file: File): boolean => {
  const maxSize = 10 * 1024 * 1024 * 1024; // 10GB in bytes
  return file.size <= maxSize;
};

// Format file size to human-readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Remove symbols from title
export const removeSymbolsFromTitle = (title: string): string => {
  return title.replace(/[^\w\s]/gi, '').trim();
};

// Formatted CSV export for different platforms
export const formatImagesAsCSV = (
  images: ProcessedImage[], 
  isFreepikOnly: boolean,
  isShutterstock: boolean,
  isAdobeStock: boolean
): string => {
  const completedImages = images.filter(img => img.status === 'complete' && img.result);
  
  if (completedImages.length === 0) {
    return '';
  }
  
  let headers: string[] = [];
  let rows: string[][] = [];
  
  // Determine headers based on platform
  if (isFreepikOnly) {
    headers = ['Filename', 'Title', 'Keywords', 'Prompt', 'Base-Model'];
  } else if (isShutterstock) {
    headers = ['Filename', 'Description', 'Keywords', 'Categories'];
  } else if (isAdobeStock) {
    headers = ['Filename', 'Title', 'Keywords', 'Category'];
  } else {
    headers = ['Filename', 'Title', 'Description', 'Keywords'];
  }
  
  // Format rows based on platform
  completedImages.forEach(image => {
    if (!image.result) return;
    
    let row: string[] = [];
    
    if (isFreepikOnly) {
      row = [
        image.file.name,
        image.result.title || '',
        image.result.keywords ? `"${image.result.keywords.join(', ')}"` : '',
        image.result.prompt || '',
        image.result.baseModel || 'leonardo'
      ];
    } else if (isShutterstock) {
      row = [
        image.file.name,
        image.result.description || '',
        image.result.keywords ? `"${image.result.keywords.join(', ')}"` : '',
        image.result.categories ? `"${image.result.categories.join(',')}"` : ''
      ];
    } else if (isAdobeStock) {
      row = [
        image.file.name,
        image.result.title || '',
        image.result.keywords ? `"${image.result.keywords.join(', ')}"` : '',
        image.result.categories ? `"${image.result.categories[0] || ''}"` : ''
      ];
    } else {
      row = [
        image.file.name,
        image.result.title || '',
        image.result.description || '',
        image.result.keywords ? `"${image.result.keywords.join(', ')}"` : ''
      ];
    }
    
    rows.push(row);
  });
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
};

// Download CSV file
export const downloadCSV = (content: string, filename: string, platform?: Platform): void => {
  if (!content) return;
  
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to suggest categories for AdobeStock based on title and keywords
export const suggestCategoriesForAdobeStock = (title: string, keywords: string[]): string[] => {
  const categoryMap: { [key: string]: string[] } = {
    'Animals': ['animal', 'pet', 'dog', 'cat', 'bird', 'wildlife', 'zoo', 'farm', 'fish', 'insect', 'mammal'],
    'Buildings and Architecture': ['building', 'architecture', 'house', 'city', 'skyscraper', 'construction', 'tower', 'monument', 'landmark', 'structure', 'office'],
    'Business': ['business', 'office', 'corporate', 'meeting', 'professional', 'workplace', 'career', 'finance', 'executive', 'entrepreneur'],
    'Drinks': ['drink', 'beverage', 'coffee', 'tea', 'wine', 'cocktail', 'beer', 'juice', 'alcohol', 'glass'],
    'The Environment': ['environment', 'nature', 'ecology', 'sustainable', 'green', 'climate', 'earth', 'conservation', 'ecosystem'],
    'States of Mind': ['emotion', 'feeling', 'mood', 'expression', 'psychology', 'mental', 'happiness', 'sadness', 'anger', 'fear', 'stress', 'calm'],
    'Food': ['food', 'meal', 'cuisine', 'cooking', 'restaurant', 'dish', 'vegetable', 'fruit', 'dessert', 'breakfast', 'lunch', 'dinner'],
    'Graphic Resources': ['graphic', 'design', 'illustration', 'pattern', 'background', 'texture', 'template', 'element', 'icon', 'symbol'],
    'Hobbies and Leisure': ['hobby', 'leisure', 'activity', 'recreation', 'entertainment', 'fun', 'game', 'sport', 'craft', 'music', 'art'],
    'Industry': ['industry', 'factory', 'manufacturing', 'production', 'industrial', 'machinery', 'engineering', 'mechanical', 'construction', 'worker'],
    'Landscapes': ['landscape', 'scenery', 'vista', 'outdoor', 'mountain', 'beach', 'desert', 'forest', 'field', 'rural', 'horizon'],
    'Lifestyle': ['lifestyle', 'living', 'everyday', 'modern', 'trendy', 'fashion', 'home', 'interior', 'comfort', 'style'],
    'People': ['people', 'person', 'man', 'woman', 'child', 'portrait', 'face', 'family', 'group', 'crowd', 'human'],
    'Plants and Flowers': ['plant', 'flower', 'garden', 'botanical', 'floral', 'bloom', 'leaf', 'tree', 'vegetation', 'grass'],
    'Culture and Religion': ['culture', 'religion', 'tradition', 'ceremony', 'ritual', 'faith', 'belief', 'worship', 'spiritual', 'ethnic', 'heritage'],
    'Science': ['science', 'research', 'laboratory', 'experiment', 'scientific', 'biology', 'chemistry', 'physics', 'medicine', 'technology'],
    'Social Issues': ['social', 'issue', 'problem', 'awareness', 'activism', 'protest', 'rights', 'equality', 'community', 'political'],
    'Sports': ['sport', 'athlete', 'game', 'competition', 'fitness', 'exercise', 'team', 'match', 'ball', 'race', 'stadium'],
    'Technology': ['technology', 'digital', 'computer', 'electronic', 'device', 'gadget', 'innovation', 'modern', 'smart', 'mobile', 'software'],
    'Transport': ['transport', 'vehicle', 'car', 'bus', 'train', 'airplane', 'boat', 'traffic', 'travel', 'commute', 'road'],
    'Travel': ['travel', 'tourism', 'vacation', 'holiday', 'adventure', 'destination', 'journey', 'exploration', 'tourist', 'sightseeing']
  };
  
  // Count categories based on keywords and title
  const categoryScores: { [key: string]: number } = {};
  
  // Initialize all categories with 0 score
  Object.keys(categoryMap).forEach(category => {
    categoryScores[category] = 0;
  });
  
  // Process title to increase category scores
  const titleWords = title.toLowerCase().split(/\s+/);
  Object.entries(categoryMap).forEach(([category, relatedTerms]) => {
    relatedTerms.forEach(term => {
      const termRegex = new RegExp(`\\b${term}\\b`, 'i');
      if (title.toLowerCase().match(termRegex)) {
        categoryScores[category] += 3; // Higher weight for title matches
      }
    });
  });
  
  // Process keywords to increase category scores
  keywords.forEach(keyword => {
    Object.entries(categoryMap).forEach(([category, relatedTerms]) => {
      relatedTerms.forEach(term => {
        const termRegex = new RegExp(`\\b${term}\\b`, 'i');
        if (keyword.toLowerCase().match(termRegex)) {
          categoryScores[category] += 1;
        }
      });
    });
  });
  
  // Get top category by score
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0)
    .map(([category]) => category);
  
  // Default to "People" if no matches found
  if (sortedCategories.length === 0) {
    return ["People"];
  }
  
  return [sortedCategories[0]]; // Return only the top category
};

// Helper function to suggest categories for Shutterstock
export const suggestCategoriesForShutterstock = (title: string, description: string): string[] => {
  // Simplified version for Shutterstock that returns categories based on the same logic as AdobeStock
  const combinedText = `${title} ${description}`.toLowerCase();
  
  const categoryKeywords: { [key: string]: string[] } = {
    'Arts and Entertainment': ['art', 'entertainment', 'music', 'movie', 'film', 'theater', 'dance', 'creative'],
    'Business and Finance': ['business', 'finance', 'money', 'office', 'corporate', 'work', 'professional'],
    'Editorial': ['news', 'event', 'politics', 'editorial', 'current', 'affairs'],
    'Education': ['education', 'learn', 'school', 'college', 'university', 'knowledge', 'study'],
    'Food and Drink': ['food', 'drink', 'meal', 'restaurant', 'cuisine', 'cooking', 'beverage'],
    'Healthcare and Medical': ['health', 'medical', 'doctor', 'hospital', 'medicine', 'healthcare', 'wellness'],
    'Holidays and Celebrations': ['holiday', 'celebration', 'festival', 'party', 'event', 'ceremony'],
    'Lifestyle': ['lifestyle', 'living', 'fashion', 'beauty', 'home', 'family'],
    'Nature': ['nature', 'environment', 'landscape', 'outdoor', 'plant', 'flower', 'garden'],
    'People': ['people', 'person', 'portrait', 'face', 'crowd', 'human'],
    'Sports and Recreation': ['sport', 'recreation', 'game', 'activity', 'fitness', 'exercise', 'athlete'],
    'Technology': ['technology', 'digital', 'computer', 'electronic', 'innovation', 'gadget', 'device'],
    'Travel': ['travel', 'tourism', 'vacation', 'destination', 'adventure', 'journey', 'explore']
  };
  
  const categoryScores: { [key: string]: number } = {};
  
  Object.keys(categoryKeywords).forEach(category => {
    categoryScores[category] = 0;
  });
  
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        categoryScores[category] += 1;
      }
    });
  });
  
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0)
    .map(([category]) => category);
  
  if (sortedCategories.length === 0) {
    return ["People"];
  }
  
  // Return top 2 categories for Shutterstock
  return sortedCategories.slice(0, 2);
};

// Helper function for extracting Freepik relevant keywords
export const getRelevantFreepikKeywords = (prompt: string): string[] => {
  if (!prompt || prompt.trim() === '') {
    return [];
  }
  
  // List of common stop words to filter out
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 
    'does', 'did', 'of', 'this', 'that', 'these', 'those', 'it', 'they', 'them'
  ]);
  
  // Extract words and phrases from prompt
  const words = prompt.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  // Remove duplicates
  const uniqueWords = Array.from(new Set(words));
  
  // Add some common photography/design terms based on prompt content
  const additionalKeywords: string[] = [];
  
  if (prompt.match(/person|people|man|woman|child|face|portrait/i)) {
    additionalKeywords.push('portrait', 'person', 'people', 'lifestyle');
  }
  
  if (prompt.match(/nature|landscape|outdoor|mountain|forest|beach|sea|ocean/i)) {
    additionalKeywords.push('nature', 'landscape', 'outdoor', 'scenery');
  }
  
  if (prompt.match(/building|architecture|city|urban|structure|house|home/i)) {
    additionalKeywords.push('architecture', 'building', 'urban', 'structure');
  }
  
  if (prompt.match(/food|drink|meal|cuisine|restaurant|cooking/i)) {
    additionalKeywords.push('food', 'cuisine', 'cooking', 'culinary');
  }
  
  const allKeywords = [...uniqueWords, ...additionalKeywords];
  
  // Get at least 25 keywords or whatever is available
  return Array.from(new Set(allKeywords)).slice(0, 50);
};
