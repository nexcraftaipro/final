import { Platform } from '@/components/PlatformSelector';
import { GenerationMode } from '@/components/GenerationModeSelector';
import { getRelevantFreepikKeywords, suggestCategoriesForShutterstock, suggestCategoriesForAdobeStock, removeSymbolsFromTitle } from './imageHelpers';

interface AnalysisOptions {
  titleLength?: number;
  descriptionLength?: number;
  keywordCount?: number;
  platforms?: Platform[];
  generationMode?: GenerationMode;
  minTitleWords?: number;
  maxTitleWords?: number;
  minKeywords?: number;
  maxKeywords?: number;
  minDescriptionWords?: number;
  maxDescriptionWords?: number;
  baseModel?: string;
  keywordSettings?: {
    singleWord: boolean;
    doubleWord: boolean;
    mixed: boolean;
  };
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

interface AnalysisResult {
  title: string;
  description: string;
  keywords: string[];
  prompt?: string;
  baseModel?: string;
  categories?: string[];
  error?: string;
}

function validateAndFilterKeywords(keywords: string[], settings: { singleWord: boolean; doubleWord: boolean; mixed: boolean }): string[] {
  if (!keywords || keywords.length === 0) return [];

  const processedKeywords = keywords.map(kw => kw.trim().toLowerCase())
    .filter(kw => kw.length > 0);
  
  if (settings.doubleWord) {
    // For double-word mode, combine adjacent single words into pairs
    const forcedDoubleWords: string[] = [];
    for (let i = 0; i < processedKeywords.length - 1; i += 2) {
      const pair = `${processedKeywords[i]} ${processedKeywords[i + 1]}`;
      if (pair.split(/\s+/).length === 2) {
        forcedDoubleWords.push(pair);
      }
    }
    return forcedDoubleWords;
  }

  return processedKeywords.filter(keyword => {
    const wordCount = keyword.split(/\s+/).length;
    if (settings.singleWord) {
      return wordCount === 1;
    } else if (settings.mixed) {
      return wordCount <= 2;
    }
    return true;
  });
}

export async function analyzeImageWithGemini(
  imageFile: File,
  apiKey: string,
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  const {
    platforms = ['AdobeStock'],
    generationMode = 'metadata',
    minTitleWords = 10,
    maxTitleWords = 15,
    minKeywords = 25,
    maxKeywords = 35,
    minDescriptionWords = 10,
    maxDescriptionWords = 30,
    baseModel,
    keywordSettings = {
      singleWord: true,
      doubleWord: false,
      mixed: false
    },
    titleCustomization = {
      beforeTitle: '',
      afterTitle: ''
    },
    customization = {
      customPrompt: false,
      customPromptText: '',
      prohibitedWords: false,
      prohibitedWordsList: [],
      transparentBackground: false
    }
  } = options;

  const isFreepikOnly = platforms.length === 1 && platforms[0] === 'Freepik';
  const isShutterstock = platforms.length === 1 && platforms[0] === 'Shutterstock';
  const isAdobeStock = platforms.length === 1 && platforms[0] === 'AdobeStock';
  
  try {
    // Convert image file to base64
    const base64Image = await fileToBase64(imageFile);
    
    let prompt = '';

    if (customization.customPrompt && customization.customPromptText) {
      // Use custom prompt if provided
      prompt = customization.customPromptText;
    } else {
      if (keywordSettings.doubleWord) {
        prompt = `Analyze this image and generate metadata.

CRITICAL INSTRUCTION FOR KEYWORDS:
You must ONLY generate TWO-WORD keyword phrases. Each keyword MUST be EXACTLY two words.

Required format for keywords:
- Each keyword must be exactly two words (e.g., "botanical illustration", "floral design", "natural medicine")
- DO NOT generate single words
- DO NOT generate phrases with more than two words
- DO NOT use hyphens or special characters

Examples of VALID keywords:
- "medicinal plants"
- "herbal medicine"
- "floral arrangement"
- "botanical art"
- "natural wellness"

Examples of INVALID keywords (DO NOT use):
- "flowers" (single word)
- "pink" (single word)
- "health-conscious" (hyphenated)
- "spa and wellness" (three words)
- "beautiful pink flowers" (three words)

Generate ${maxKeywords} two-word keywords that describe:
1. Subject matter and content
2. Style and technique
3. Colors and visual elements
4. Usage and context
5. Mood and feeling

Format the response as a JSON object with these exact fields:
{
  "title": "descriptive title",
  ${isFreepikOnly ? '"prompt": "image generation prompt",' : ''}
  "keywords": ["two word phrase", "another two words", ...]
}

IMPORTANT: Each keyword in the array MUST be exactly two words.`;
      } else {
        prompt = `Analyze this image and generate:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words. Don't use any symbols.
2. A detailed description that's between ${minDescriptionWords}-${maxDescriptionWords} words.
3. Generate between ${minKeywords}-${maxKeywords} keywords that someone might search for to find this image.
   Focus on: subject matter, actions, emotions, style, technical aspects, colors, composition.`;
      }
    }

    // Add format instructions
    if (generationMode === 'imageToPrompt') {
      prompt += `\n\nReturn the prompt description only, nothing else.`;
    } else {
      prompt += `\n\nFormat your response as a JSON object with the following fields:
- "title": The descriptive title
- "description": The detailed description (if applicable)
- "keywords": An array of keywords following the specified format
${isFreepikOnly ? '- "prompt": The image generation prompt' : ''}

IMPORTANT: For the keywords array, ensure STRICT adherence to the specified format (${keywordSettings.doubleWord ? 'exactly two words per keyword' : keywordSettings.singleWord ? 'exactly one word per keyword' : 'mix of one and two words'}).`;
    }

    // Add prohibited words instruction if enabled
    if (customization.prohibitedWords && customization.prohibitedWordsList?.length) {
      prompt += `\n\nIMPORTANT: Do NOT use any of the following words in the title, description, or keywords:
${customization.prohibitedWordsList.join(', ')}`;
    }
    
    // Updated to use the newer Gemini 1.5 Flash model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: imageFile.type,
                  data: base64Image.split(',')[1],
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error:', errorData);
      throw new Error(errorData?.error?.message || 'Failed to analyze image');
    }

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '';
    
    // For image-to-prompt mode, just return the description
    if (generationMode === 'imageToPrompt') {
      return {
        title: '',
        description: text.trim(),
        keywords: [],
      };
    }
    
    // Extract JSON from the response text
    let jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                    text.match(/```\n([\s\S]*?)\n```/) ||
                    text.match(/\{[\s\S]*\}/);
                    
    let jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    
    // Clean up potential garbage around the JSON object
    jsonStr = jsonStr.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse JSON from response:', jsonStr);
      console.error('Original response:', text);
      throw new Error('Failed to parse metadata from the API response');
    }
    
    // Ensure titles don't have symbols
    if (result.title) {
      result.title = removeSymbolsFromTitle(result.title);
    }
    
    // For Freepik, use the keywords provided directly from the API response
    if (isFreepikOnly) {
      // If keywords exist in the result, validate and filter them
      let filteredKeywords = validateAndFilterKeywords(result.keywords || [], keywordSettings);
      
      // If we don't have enough keywords after filtering, generate new ones from the prompt
      if (!filteredKeywords || filteredKeywords.length < minKeywords) {
        const freepikKeywords = getRelevantFreepikKeywords(result.prompt || '');
        filteredKeywords = validateAndFilterKeywords(freepikKeywords, keywordSettings);
      }
      
      result.keywords = filteredKeywords;
      result.baseModel = baseModel || '';
    }
    
    // For Shutterstock, suggest categories based on content
    if (isShutterstock) {
      result.categories = suggestCategoriesForShutterstock(
        result.title || '', 
        result.description || ''
      );
    }
    
    // For Adobe Stock, suggest categories based on content
    if (isAdobeStock) {
      result.categories = suggestCategoriesForAdobeStock(
        result.title || '',
        result.keywords || []
      );
    }
    
    // Enhanced validation for double-word keywords
    if (result.keywords && keywordSettings.doubleWord) {
      let filteredKeywords = validateAndFilterKeywords(result.keywords, keywordSettings);
      
      // If we don't have enough valid double-word keywords, try to create them from single words
      if (filteredKeywords.length < minKeywords) {
        const allWords = result.keywords
          .join(' ')
          .split(/\s+/)
          .filter(word => word.length > 2);
        
        const additionalPairs: string[] = [];
        for (let i = 0; i < allWords.length - 1; i += 2) {
          additionalPairs.push(`${allWords[i]} ${allWords[i + 1]}`);
        }
        
        filteredKeywords = [...new Set([...filteredKeywords, ...additionalPairs])];
      }
      
      result.keywords = filteredKeywords.slice(0, maxKeywords);
    }
    
    // Process the title with customization
    if (result.title) {
      let customizedTitle = result.title.trim();
      if (titleCustomization.beforeTitle) {
        customizedTitle = `${titleCustomization.beforeTitle.trim()} ${customizedTitle}`;
      }
      if (customization.transparentBackground) {
        customizedTitle = `${customizedTitle} on Transparent Background`;
      }
      if (titleCustomization.afterTitle) {
        customizedTitle = `${customizedTitle} ${titleCustomization.afterTitle.trim()}`;
      }
      result.title = customizedTitle;
    }
    
    if (result.keywords) {
      // Filter out prohibited words from keywords if enabled
      if (customization.prohibitedWords && customization.prohibitedWordsList?.length) {
        result.keywords = result.keywords.filter(keyword => 
          !customization.prohibitedWordsList?.some(prohibited => 
            keyword.toLowerCase().includes(prohibited.toLowerCase())
          )
        );
      }

      // Add transparent background keyword if enabled
      if (customization.transparentBackground) {
        result.keywords.push('transparent background');
      }

      // Validate keywords based on settings
      result.keywords = validateAndFilterKeywords(result.keywords, keywordSettings);
    }

    if (result.description && customization.transparentBackground) {
      // Add transparent background mention to description
      result.description = `${result.description.trim()}. This image features a transparent background, making it perfect for various design applications.`;
    }
    
    return {
      title: result.title || '',
      description: result.description || '',
      keywords: result.keywords || [],
      prompt: result.prompt,
      baseModel: result.baseModel || baseModel || '',
      categories: result.categories,
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      title: '',
      description: '',
      keywords: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
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
