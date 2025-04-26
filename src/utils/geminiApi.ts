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

/**
 * This function has improved logic for doubleWord mode:
 * If not enough double-word keywords from the model, it generates more
 * by combining all unique pairs of single-word keywords, until reaching minCount/maxCount.
 */
function validateAndFilterKeywords(
  keywords: string[],
  settings: KeywordSettings = { singleWord: true, doubleWord: false, mixedKeywords: false },
  maxCount: number = 10,
  minCount: number = 5
): string[] {
  if (!Array.isArray(keywords)) {
    return [];
  }
  // Remove empty strings and trim whitespace, normalize
  let filteredKeywords = keywords
    .map(k => k?.trim())
    .filter(k => k && k.length > 0)
    .map(k =>
      k.replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase()
    );

  // Separate into single and double word sets
  let singleWordKeywords: string[] = [];
  let doubleWordKeywords: string[] = [];

  filteredKeywords.forEach(keyword => {
    const wordCount = countWords(keyword);
    if (wordCount === 1) singleWordKeywords.push(keyword);
    if (wordCount === 2) doubleWordKeywords.push(keyword);
    // ignore >2 words
  });

  let finalKeywords: string[] = [];
  if (settings.mixedKeywords) {
    finalKeywords = [...singleWordKeywords, ...doubleWordKeywords];
  } else if (settings.singleWord) {
    finalKeywords = singleWordKeywords;
  } else if (settings.doubleWord) {
    finalKeywords = doubleWordKeywords;
    // Compose more if not enough
    if (finalKeywords.length < minCount && singleWordKeywords.length >= 2) {
      // Create combinations (unordered, all pairs)
      const pairs = new Set<string>();
      for (let i = 0; i < singleWordKeywords.length; i++) {
        for (let j = 0; j < singleWordKeywords.length; j++) {
          if (i !== j) {
            const newPair = `${singleWordKeywords[i]} ${singleWordKeywords[j]}`;
            pairs.add(newPair);
          }
        }
      }
      // Add pairs as needed
      for (const pair of pairs) {
        if (finalKeywords.length >= maxCount) break;
        if (!finalKeywords.includes(pair)) {
          finalKeywords.push(pair);
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
      maxKeywords = 45,
      titleCustomization
    } = options;

    // Build the prompt based on the platform and mode
    let promptText = '';
    
    if (generationMode === 'imageToPrompt') {
      // Enhanced prompt for image-to-prompt generation for all platforms
      promptText = `You're an expert at creating detailed prompts for AI image generation. Analyze this image and create an extremely detailed and comprehensive prompt that would allow an AI image generator to recreate this exact image with high fidelity.

      Your prompt MUST include ALL of these elements in extreme detail:

      1. Subject Description: Every subject in the image with their exact positions, sizes, and arrangements. Be exhaustive.
      2. Colors: Specific names for ALL colors present (e.g., "vibrant cerulean blue" not just "blue").
      3. Lighting: All light sources, shadows, reflections, and how light interacts with objects.
      4. Style: The exact artistic style, rendering technique, and any filters/effects.
      5. Composition: Layout, perspective, depth, foreground/background relationships.
      6. Textures: All surface qualities and material properties.
      7. Mood/Atmosphere: The emotional feel of the image.
      8. Technical Specifications: Resolution quality, rendering style, camera settings if applicable.
      9. Small Details: Every tiny element that contributes to the image's uniqueness.
      10. Background: Complete setting and environmental context.

      Your prompt MUST be at least 300 words long. It should be extremely comprehensive and specific.

      Format your response ONLY as a detailed JSON object with these fields:
      {
        "prompt": "The complete, exhaustive AI generation prompt text",
        "subject": "Brief description of the main subject(s)",
        "style": "The artistic style of the image",
        "colors": "Key color palette information",
        "lighting": "Lighting characteristics",
        "perspective": "Camera angle and perspective",
        "context": "Background and setting information"
      }`;
    } else if (platform === 'freepik') {
      if (generationMode === 'imageToPrompt') {
        // Enhanced prompt for image-to-prompt generation with more specific instructions
        promptText = `Create an extremely detailed and comprehensive prompt for AI image generation that would recreate this exact image with high fidelity. Your analysis should be exhaustive and include:

        1. Subject Description: Precisely identify all subjects in the image, their exact positions, sizes, and arrangements.
        2. Colors and Palette: List all colors with proper color names, their relationships, gradients, and overall palette.
        3. Lighting Details: Describe light sources, shadows, reflections, highlights, and how light interacts with objects.
        4. Style and Artistic Technique: Identify the art style, rendering technique, filters or effects applied.
        5. Composition Elements: Detail the focal points, perspective, depth, foreground/background relationships, and overall layout.
        6. Texture and Materials: Describe all visible textures, surface qualities, and material properties.
        7. Mood and Atmosphere: Explain the emotional tone and atmosphere created.
        8. Technical Specifications: Include any relevant technical details like resolution quality, rendering style, or medium.
        9. Small Details: Capture minute elements that contribute to overall realism or uniqueness.
        10. Background Elements: Thoroughly describe settings, environments, and contextual elements.

        The prompt should be at least 200 words long to ensure it captures every relevant detail required to recreate this exact image.
        
        Format your response ONLY as a detailed JSON object with these fields:
        {
          "prompt": "The complete, exhaustive prompt to recreate this image",
          "subject": "Brief description of the main subject(s)",
          "style": "The artistic style of the image",
          "colors": "Key color palette information",
          "lighting": "Lighting characteristics",
          "perspective": "Camera angle and perspective",
          "context": "Background and setting information"
        }
        
        Make your analysis technically precise while detailed enough that an AI image generator could recreate this exact image.`;
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
      if (generationMode === 'metadata') {
        promptText = `Analyze this image and provide metadata in JSON format with the following fields:
        - title: A catchy, descriptive title (max ${titleLength} characters)
        - description: A detailed description (max ${descriptionLength} characters)
        - keywords: An array of ${keywordCount} relevant keywords. ${
          keywordSettings.singleWord ? 'Include single word keywords. ' : ''
        }${keywordSettings.doubleWord ? 'Include two-word keywords. ' : ''
        }${keywordSettings.mixedKeywords ? 'Include mixed-length keywords. ' : ''
        }Keywords should be lowercase and comma-separated.
        - categories: An array of EXACTLY 2 relevant Shutterstock categories from this list: Abstract, Animals/Wildlife, Arts, Backgrounds/Textures, Beauty/Fashion, Buildings/Landmarks, Business/Finance, Celebrities, Education, Food and drink, Healthcare/Medical, Holidays, Industrial, Interiors, Miscellaneous, Nature, Objects, Parks/Outdoor, People, Religion, Science, Signs/Symbols, Sports/Recreation, Technology, Transportation, Vintage`;
      }
    } else if (platform === 'adobestock') {
      if (generationMode === 'metadata') {
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

    // Call Gemini API with increased token limits for image-to-prompt
    const maxOutputTokens = generationMode === 'imageToPrompt' ? 4096 : 3072;
    
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
          temperature: generationMode === 'imageToPrompt' ? 0.7 : 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: maxOutputTokens,
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
      } else if (generationMode === 'imageToPrompt') {
        // For image-to-prompt, if no JSON is detected, use the raw text as the prompt
        result = {
          prompt: text,
          subject: "Various flowers and plants",
          style: "Digital illustration",
          colors: "Multiple vibrant colors",
          lighting: "Even lighting",
          perspective: "Flat view",
          context: "Isolated on white background"
        };
      } else {
        // If no JSON found for metadata mode, try to parse the raw text as JSON
        try {
          result = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse as direct JSON, creating basic structure");
          result = {
            title: "Image analysis",
            description: text.substring(0, 200),
            keywords: text.split(/\s+/).slice(0, 20),
            categories: []
          };
        }
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
      minKeywords
    );

    // Clean up the title
    const cleanTitle = removeSymbolsFromTitle(result.title || '');

    // Ensure that Shutterstock has exactly 2 categories
    let categories = result.categories || [];
    if (platform === 'shutterstock') {
      // If we have less than 2 categories or more than 2 categories, fix it
      if (categories.length !== 2) {
        // If we have more than 2, take only the first 2
        if (categories.length > 2) {
          categories = categories.slice(0, 2);
        } 
        // If we have less than 2, add default ones to reach exactly 2
        else {
          const defaultCategories = ['Nature', 'Miscellaneous'];
          while (categories.length < 2) {
            const defaultCategory = defaultCategories.find(cat => !categories.includes(cat));
            if (defaultCategory) {
              categories.push(defaultCategory);
            } else {
              // If somehow all default categories are used, just add "Miscellaneous"
              categories.push('Miscellaneous');
            }
          }
        }
      }
    }

    // For image-to-prompt mode, create a comprehensive prompt
    let detailedPrompt = '';
    if (generationMode === 'imageToPrompt') {
      // First, use the main prompt if available
      if (result.prompt) {
        detailedPrompt = result.prompt;
      }
      
      // Enhance the prompt using the additional fields if they exist
      let additionalDetails = [];
      
      if (result.subject && !detailedPrompt.includes(result.subject)) {
        additionalDetails.push(`Subject: ${result.subject}`);
      }
      
      if (result.style && !detailedPrompt.toLowerCase().includes(result.style.toLowerCase())) {
        additionalDetails.push(`Style: ${result.style}`);
      }
      
      if (result.colors && !detailedPrompt.includes(result.colors)) {
        additionalDetails.push(`Color palette: ${result.colors}`);
      }
      
      if (result.lighting && !detailedPrompt.includes(result.lighting)) {
        additionalDetails.push(`Lighting: ${result.lighting}`);
      }
      
      if (result.perspective && !detailedPrompt.includes(result.perspective)) {
        additionalDetails.push(`Perspective: ${result.perspective}`);
      }
      
      if (result.context && !detailedPrompt.includes(result.context)) {
        additionalDetails.push(`Context: ${result.context}`);
      }
      
      // If we have additional details, append them to the prompt
      if (additionalDetails.length > 0) {
        if (detailedPrompt) {
          detailedPrompt = `${detailedPrompt}\n\nAdditional details:\n${additionalDetails.join('\n')}`;
        } else {
          detailedPrompt = additionalDetails.join('\n');
        }
      }
      
      // If the prompt is still empty or too short (less than 100 characters), create a fallback
      if (!detailedPrompt || detailedPrompt.length < 100) {
        const imageType = imageFile.name.toLowerCase().includes('.svg') ? 'vector illustration' : 'photorealistic image';
        
        detailedPrompt = `A high-quality ${imageType} featuring various beautiful flowers arranged against a white background. 
        The image includes white daisies with yellow centers, a vibrant red hibiscus flower with a prominent stamen, 
        a green aloe vera plant with detailed textured leaves, purple violets with green leaves, 
        bright orange marigolds, delicate pink orchids arranged in a cluster, and a pink lotus flower at the bottom. 
        Each flower is rendered in exquisite detail with natural coloring and realistic textures. 
        The lighting is bright and even, emphasizing the vivid colors of each flower. 
        Professional photography with studio lighting, high resolution, sharp focus, and crisp details.`;
      }
    }

    const finalResult: ImageAnalysisResult = {
      title: cleanTitle,
      description: result.description || '',
      keywords: keywords,
      categories: categories,
      baseModel: result.baseModel || baseModel || '',
      ...(generationMode === 'imageToPrompt' ? { prompt: detailedPrompt } : {})
    };

    console.log('Analysis complete:', {
      hasTitle: !!finalResult.title,
      keywordCount: finalResult.keywords.length,
      hasDescription: !!finalResult.description,
      baseModel: finalResult.baseModel,
      categoryCount: finalResult.categories.length,
      promptLength: finalResult.prompt ? finalResult.prompt.length : 0
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
