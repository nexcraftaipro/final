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
  maxCount: number = 10,
  minCount: number = 5
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

  // Create separate arrays for single and double word keywords
  const singleWordKeywords: string[] = [];
  const doubleWordKeywords: string[] = [];
  
  // Sort keywords into appropriate arrays
  filteredKeywords.forEach(keyword => {
    const wordCount = countWords(keyword);
    
    if (wordCount === 1) {
      singleWordKeywords.push(keyword);
    } else if (wordCount === 2) {
      doubleWordKeywords.push(keyword);
    }
    // Ignore keywords with more than 2 words
  });

  // Determine which keywords to include based on settings
  let finalKeywords: string[] = [];
  
  if (settings.mixedKeywords) {
    // If mixed keywords, include both single and double word keywords
    finalKeywords = [...singleWordKeywords, ...doubleWordKeywords];
  } else if (settings.singleWord) {
    finalKeywords = singleWordKeywords;
  } else if (settings.doubleWord) {
    finalKeywords = doubleWordKeywords;
    
    // If we don't have enough double-word keywords and the model didn't provide enough,
    // we'll need to generate additional ones by combining single words
    if (finalKeywords.length < minCount && singleWordKeywords.length >= 2) {
      const additionalNeeded = minCount - finalKeywords.length;
      
      // Create combinations of single words to form double-word keywords
      for (let i = 0; i < singleWordKeywords.length && finalKeywords.length < minCount; i++) {
        for (let j = i + 1; j < singleWordKeywords.length && finalKeywords.length < minCount; j++) {
          const newKeyword = `${singleWordKeywords[i]} ${singleWordKeywords[j]}`;
          if (!finalKeywords.includes(newKeyword)) {
            finalKeywords.push(newKeyword);
          }
        }
      }
    }
  }

  // Remove duplicates and limit to maxCount
  return [...new Set(finalKeywords)].slice(0, maxCount);
}

/**
 * Convert SVG to PNG using HTML5 Canvas
 */
async function convertSvgToPng(file: File): Promise<File> {
  // If it's not an SVG, just return the original file
  if (file.type !== 'image/svg+xml') {
    return file;
  }
  
  return new Promise((resolve, reject) => {
    // Read the SVG file
    const reader = new FileReader();
    reader.onload = (e) => {
      const svgText = e.target?.result as string;
      
      // Create a temporary image element
      const img = new Image();
      img.onload = () => {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        // Set the canvas dimensions to match the SVG
        canvas.width = img.width || 1024;  // Use 1024 as default if width is 0
        canvas.height = img.height || 1024; // Use 1024 as default if height is 0
        
        // Draw the SVG on the canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Fill with white background to ensure opacity is handled properly
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG
        ctx.drawImage(img, 0, 0);
        
        // Convert canvas to PNG as blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert SVG to PNG'));
            return;
          }
          
          // Create a new File from the blob
          const convertedFile = new File([blob], file.name.replace('.svg', '.png'), {
            type: 'image/png',
            lastModified: new Date().getTime()
          });
          
          resolve(convertedFile);
        }, 'image/png');
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load SVG'));
      };
      
      // Set the source of the image to the SVG data URL
      img.src = svgText;
    };
    
    reader.onerror = () => reject(new Error('Failed to read SVG file'));
    reader.readAsDataURL(file);
  });
}

// Direct integration with Gemini API
export async function analyzeImageWithGemini(
  imageFile: File,
  options: AnalysisOptions = {}
): Promise<ImageAnalysisResult> {
  try {
    // Get the API key from localStorage or environment variable
    let apiKey = localStorage.getItem('gemini-api-key') || import.meta.env.VITE_GEMINI_API_KEY;
    
    // Check if API key is valid (not empty and not the placeholder)
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return {
        title: '',
        description: '',
        keywords: [],
        categories: [],
        baseModel: '',
        error: 'Gemini API key is not configured. Please add your API key in the settings.'
      };
    }

    // If this is an SVG file, convert it to PNG first
    let processedFile = imageFile;
    if (imageFile.type === 'image/svg+xml') {
      try {
        console.log('Converting SVG to PNG before sending to Gemini API...');
        processedFile = await convertSvgToPng(imageFile);
        console.log('SVG conversion complete. Using PNG format for API request.');
      } catch (conversionError) {
        console.error('SVG conversion failed:', conversionError);
        return {
          title: '',
          description: '',
          keywords: [],
          categories: [],
          baseModel: '',
          error: 'Failed to convert SVG file for processing. Please try a different file format.'
        };
      }
    }

    // Convert file to base64
    const imageBase64 = await fileToBase64(processedFile);
    
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
      customization,
      minKeywords = 35,
      maxKeywords = 45
    } = options;

    // Build the prompt based on the platform and mode
    let promptText = '';
    
    if (platform === 'freepik') {
      if (generationMode === 'imageToPrompt') {
        promptText = `Generate a creative prompt for this image that would be suitable for AI image generation. The prompt should be detailed and descriptive, focusing on the visual elements, style, and mood of the image. Format the response as a JSON object with a single field "prompt" containing the generated prompt string.`;
      } else {
        promptText = `Analyze this image and provide metadata in JSON format with the following fields:
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
      promptText = `Analyze this image and provide metadata in JSON format with the following fields:
      - title: A catchy, descriptive title (max ${titleLength} characters)
      - description: A detailed description (max ${descriptionLength} characters)
      - keywords: An array of ${keywordCount} relevant keywords. ${
        keywordSettings.singleWord ? 'Include single word keywords. ' : ''
      }${keywordSettings.doubleWord ? 'Include two-word keywords. ' : ''
      }${keywordSettings.mixedKeywords ? 'Include mixed-length keywords. ' : ''
      }Keywords should be lowercase and comma-separated.
      - categories: An array of relevant Shutterstock categories`;
    } else if (platform === 'adobestock') {
      promptText = `Analyze this image and provide metadata in JSON format with the following fields:
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
      promptText += `\n\nAdditional instructions: ${customization.customPromptText}`;
    }

    // Add prohibited words if specified
    if (customization?.prohibitedWords && customization.prohibitedWordsList?.length) {
      promptText += `\n\nPlease avoid using these words: ${customization.prohibitedWordsList.join(', ')}`;
    }

    console.log('Analyzing image with options:', {
      platform,
      generationMode,
      baseModel,
      fileType: processedFile.type,
      originalType: imageFile.type,
      customization: { ...customization, customPromptText: customization?.customPromptText ? 'present' : 'not present' }
    });

    // Call Gemini API directly
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: processedFile.type,
                  data: imageBase64.split(',')[1] // Remove data:image/jpeg;base64, prefix
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to analyze image';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      return {
        title: '',
        description: '',
        keywords: [],
        categories: [],
        baseModel: '',
        error: `Gemini API Error: ${errorMessage}`
      };
    }

    const data = await response.json();
    
    // Parse the response from Gemini API
    let result: any = {};
    
    try {
      // Extract the text content from Gemini's response
      const content = data.candidates?.[0]?.content;
      const text = content?.parts?.[0]?.text || '';
      
      // Extract JSON from the text (Gemini sometimes wraps JSON in markdown code blocks)
      const jsonMatch = text.match(/```json\s*(\{.*?\})\s*```/s) || 
                        text.match(/\{.*\}/s);
                        
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // If no JSON found, try to parse the raw text as JSON
        result = JSON.parse(text);
      }
    } catch (e) {
      console.error('Failed to parse Gemini API response:', e);
      return {
        title: '',
        description: '',
        keywords: [],
        categories: [],
        baseModel: '',
        error: 'Invalid response format from Gemini API'
      };
    }

    // Validate and format keywords based on settings
    const keywords = validateAndFilterKeywords(
      result.keywords || [], 
      keywordSettings,
      maxKeywords,
      minKeywords  // Pass the minimum keywords count to ensure we get enough
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
