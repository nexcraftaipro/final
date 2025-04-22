
import { Platform } from '@/components/PlatformSelector';
import { GenerationMode } from '@/components/GenerationModeSelector';
import { getRelevantFreepikKeywords, suggestCategoriesForShutterstock, suggestCategoriesForAdobeStock, removeSymbolsFromTitle } from './imageHelpers';

export interface KeywordSettings {
  /** Allow single-word keywords (e.g., "beach", "sunset") */
  singleWord: boolean;
  /** Allow double-word keywords (e.g., "blue sky", "mountain lake") */
  doubleWord: boolean;
  /** If true, allows both single and double word keywords regardless of other settings.
   * If false, strictly follows singleWord/doubleWord settings */
  mixedKeywords: boolean;
}

export interface AnalysisOptions {
  titleLength?: number;
  descriptionLength?: number;
  keywordCount?: number;
  keywordSettings?: KeywordSettings;
  platform?: 'freepik' | 'shutterstock' | 'adobestock';
  generationMode?: 'metadata' | 'imageToPrompt';
  baseModel?: string | null;
  platforms?: Platform[];
  minTitleWords?: number;
  maxTitleWords?: number;
  minKeywords?: number;
  maxKeywords?: number;
  minDescriptionWords?: number;
  maxDescriptionWords?: number;
  titleCustomization?: {
    beforeTitle?: string;
    afterTitle?: string;
  };
  customization?: {
    customPrompt: boolean;
    customPromptText?: string;
    prohibitedWords: boolean;
    prohibitedWordsList?: string[];
    transparentBackground: boolean;
  };
}

export interface ImageAnalysisResult {
  title: string;
  description: string;
  keywords: string[];
  categories: string[];
  baseModel: string;
  prompt?: string;
  error?: string;
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function validateAndFilterKeywords(
  keywords: string[],
  settings: KeywordSettings = { singleWord: true, doubleWord: false, mixedKeywords: false },
  maxCount: number = 10
): string[] {
  if (!Array.isArray(keywords)) {
    return [];
  }

  // Remove empty strings and trim whitespace
  let filteredKeywords = keywords
    .map(k => k?.trim())
    .filter(k => k && k.length > 0);

  // Remove special characters and normalize spaces
  filteredKeywords = filteredKeywords.map(k => 
    k.replace(/[^\w\s-]/g, '')
     .replace(/\s+/g, ' ')
     .toLowerCase()
  );

  // Filter based on word count and settings
  filteredKeywords = filteredKeywords.filter(keyword => {
    const wordCount = countWords(keyword);
    
    if (wordCount > 2) return false; // Never allow more than 2 words
    
    if (settings.mixedKeywords) return true; // Allow both single and double words
    
    if (wordCount === 1) return settings.singleWord;
    if (wordCount === 2) return settings.doubleWord;
    
    return false;
  });

  // Remove duplicates and limit to maxCount
  return [...new Set(filteredKeywords)].slice(0, maxCount);
}

const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://api.github.com',
  token: import.meta.env.VITE_GITHUB_TOKEN,
  endpoint: import.meta.env.VITE_API_ENDPOINT || '/repos/uf-photo-metadata-helper/analyze'
};

export async function analyzeImageWithGemini(
  imageFile: File,
  options: AnalysisOptions = {}
): Promise<ImageAnalysisResult> {
  // Validate API configuration
  if (!API_CONFIG.token) {
    throw new Error('GitHub token is not configured. Please check your environment variables.');
  }

  // Convert file to base64
  const imageBase64 = await fileToBase64(imageFile);

  const {
    titleLength = 60,
    descriptionLength = 160,
    keywordCount = 50,
    keywordSettings = {
      singleWord: true,
      doubleWord: true,
      mixedKeywords: true
    },
    platform = 'freepik',
    generationMode = 'metadata',
    baseModel = null,
    customization
  } = options;

  let prompt = '';
  if (platform === 'freepik') {
    if (generationMode === 'imageToPrompt') {
      prompt = `Generate a creative prompt for this image that would be suitable for AI image generation. The prompt should be detailed and descriptive, focusing on the visual elements, style, and mood of the image. Format the response as a JSON object with a single field "prompt" containing the generated prompt string.`;
    } else {
      prompt = `Analyze this image and provide metadata in JSON format with the following fields:
      - title: A catchy, descriptive title (max ${titleLength} characters)
      - description: A detailed description (max ${descriptionLength} characters)
      - keywords: An array of ${keywordCount} relevant keywords. ${
        keywordSettings.singleWord ? 'Include single word keywords. ' : ''
      }${keywordSettings.doubleWord ? 'Include two-word keywords. ' : ''
      }${keywordSettings.mixedKeywords ? 'Include mixed-length keywords. ' : ''
      }Keywords should be lowercase and comma-separated.
      - categories: An array of relevant Freepik categories
      ${baseModel ? `- baseModel: "${baseModel}"` : ''}`;
    }
  } else if (platform === 'shutterstock') {
    prompt = `Analyze this image and provide metadata in JSON format with the following fields:
    - title: A catchy, descriptive title (max ${titleLength} characters)
    - description: A detailed description (max ${descriptionLength} characters)
    - keywords: An array of ${keywordCount} relevant keywords. ${
      keywordSettings.singleWord ? 'Include single word keywords. ' : ''
    }${keywordSettings.doubleWord ? 'Include two-word keywords. ' : ''
    }${keywordSettings.mixedKeywords ? 'Include mixed-length keywords. ' : ''
    }Keywords should be lowercase and comma-separated.
    - categories: An array of relevant Shutterstock categories`;
  } else if (platform === 'adobestock') {
    prompt = `Analyze this image and provide metadata in JSON format with the following fields:
    - title: A catchy, descriptive title (max ${titleLength} characters)
    - description: A detailed description (max ${descriptionLength} characters)
    - keywords: An array of ${keywordCount} relevant keywords. ${
      keywordSettings.singleWord ? 'Include single word keywords. ' : ''
    }${keywordSettings.doubleWord ? 'Include two-word keywords. ' : ''
    }${keywordSettings.mixedKeywords ? 'Include mixed-length keywords. ' : ''
    }Keywords should be lowercase and comma-separated.
    - categories: An array of relevant Adobe Stock categories`;
  }

  // Add custom prompt if specified
  if (customization?.customPrompt && customization.customPromptText) {
    prompt += `\n\nAdditional instructions: ${customization.customPromptText}`;
  }

  // Add prohibited words if specified
  if (customization?.prohibitedWords && customization.prohibitedWordsList?.length) {
    prompt += `\n\nPlease avoid using these words: ${customization.prohibitedWordsList.join(', ')}`;
  }

  try {
    console.log('Analyzing image with options:', {
      platform,
      generationMode,
      baseModel,
      customization: { ...customization, customPromptText: customization?.customPromptText ? 'present' : 'not present' }
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${API_CONFIG.token}`
    };

    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image: imageBase64,
        prompt: prompt,
        options: {
          platform,
          generationMode,
          baseModel,
          titleLength,
          descriptionLength,
          keywordCount,
          keywordSettings,
          customization
        }
      })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to analyze image';
      try {
      const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        if (errorData.documentation_url) {
          console.error('API Documentation:', errorData.documentation_url);
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      const error = new Error(`GitHub API Error: ${errorMessage}`);
      return {
        title: '',
        description: '',
        keywords: [],
        categories: [],
        baseModel: '',
        error: error.message
      };
    }

    const data = await response.json();
    
    // Parse the response JSON string into an object
    let result;
    try {
      result = typeof data.result === 'string' ? JSON.parse(data.result) : data.result || data;
    } catch (e) {
      console.error('Failed to parse API response:', e);
      return {
        title: '',
        description: '',
        keywords: [],
        categories: [],
        baseModel: '',
        error: 'Invalid response format from API'
      };
    }

    // Validate and format keywords based on settings
    const keywords = validateAndFilterKeywords(
      result.keywords || [], 
      keywordSettings,
      keywordCount
    );

    // Clean up the title
    const cleanTitle = removeSymbolsFromTitle(result.title || '');

    const finalResult = {
      title: cleanTitle,
      description: result.description || '',
      keywords: keywords,
      categories: result.categories || [],
      baseModel: result.baseModel || baseModel || '',
      prompt: generationMode === 'imageToPrompt' ? result.prompt : undefined
    };

    console.log('Analysis complete:', {
      hasTitle: !!finalResult.title,
      keywordCount: finalResult.keywords.length,
      hasDescription: !!finalResult.description,
      baseModel: finalResult.baseModel
    });

    return finalResult;
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      title: '',
      description: '',
      keywords: [],
      categories: [],
      baseModel: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
