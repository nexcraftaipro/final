import { Platform } from '@/components/PlatformSelector';
import { GenerationMode } from '@/components/GenerationModeSelector';
import { getRelevantFreepikKeywords } from './keywordGenerator';
import { suggestCategoriesForShutterstock, suggestCategoriesForAdobeStock, removeSymbolsFromTitle } from './imageHelpers';
import { convertSvgToPng, isSvgFile } from './svgToPng';
import { extractVideoThumbnail, isVideoFile } from './videoProcessor';
import { isEpsFile, extractEpsMetadata, createEpsMetadataRepresentation } from './epsMetadataExtractor';
import { determineVideoCategory } from './categorySelector';
import { toast } from 'sonner';

// Track the last working model index across multiple requests
// This helps avoid repeated attempts on models that have exceeded their quota
let lastWorkingModelIndex = 0;

// Track the currently active API provider
let currentApiProvider: 'gemini' | 'openai' = 'gemini';

// Function to reset the model index, useful when starting a new session
export function resetGeminiModelIndex(): void {
  lastWorkingModelIndex = 0;
  currentApiProvider = 'gemini';
  console.log("Reset model index to 0 and provider to Gemini");
}

// Function to get the current API provider
export function getCurrentApiProvider(): 'gemini' | 'openai' {
  return currentApiProvider;
}

// Function to manually set the API provider
export function setApiProvider(provider: 'gemini' | 'openai'): void {
  currentApiProvider = provider;
  lastWorkingModelIndex = 0; // Reset index when switching providers
  console.log(`Switched API provider to ${provider}`);
}

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
  customPromptEnabled?: boolean;
  customPrompt?: string;
  prohibitedWords?: string;
  prohibitedWordsEnabled?: boolean;
  transparentBgEnabled?: boolean;
  silhouetteEnabled?: boolean;
  singleWordKeywordsEnabled?: boolean;
}

interface AnalysisResult {
  title: string;
  description: string;
  keywords: string[];
  prompt?: string;
  baseModel?: string;
  categories?: string[];
  error?: string;
  filename?: string;
  isVideo?: boolean;
  category?: number;
  isEps?: boolean;
  provider?: 'gemini' | 'openai';
  processingTime?: number;
}

interface ApiKeyConfig {
  geminiApiKey: string;
  openaiApiKey?: string;
}

interface GeminiModel {
  name: string;
  maxOutputTokens: number;
  temperature: number;
  topK: number;
  topP: number;
  provider: 'gemini' | 'openai';
  modelPath?: string; // For OpenAI API endpoint path
}

const GEMINI_MODELS: GeminiModel[] = [
  {
    name: 'gemini-2.0-flash',
    maxOutputTokens: 1024,
    temperature: 0.4,
    topK: 32,
    topP: 0.95,
    provider: 'gemini',
  },
  {
    name: 'gemini-1.5-flash-8b',
    maxOutputTokens: 1024,
    temperature: 0.4,
    topK: 32,
    topP: 0.95,
    provider: 'gemini',
  },
  {
    name: 'gemini-1.5-flash',
    maxOutputTokens: 1024,
    temperature: 0.4,
    topK: 32,
    topP: 0.95,
    provider: 'gemini',
  },
  {
    name: 'gemini-1.5-pro',
    maxOutputTokens: 1024,
    temperature: 0.4,
    topK: 32,
    topP: 0.95,
    provider: 'gemini',
  },
  // OpenAI fallback models
  {
    name: 'gpt-4-vision-preview',
    maxOutputTokens: 1024,
    temperature: 0.4,
    topK: 0,
    topP: 0.95,
    provider: 'openai',
    modelPath: 'chat/completions'
  },
  {
    name: 'gpt-4o',
    maxOutputTokens: 1024,
    temperature: 0.4,
    topK: 0,
    topP: 0.95,
    provider: 'openai',
    modelPath: 'chat/completions'
  }
];

async function callGeminiAPI(
  model: GeminiModel,
  prompt: string,
  base64Image: string,
  originalIsEps: boolean,
  apiKeyConfig: ApiKeyConfig
): Promise<any> {
  // Use the appropriate API key based on provider
  const apiKey = model.provider === 'gemini' 
    ? apiKeyConfig.geminiApiKey 
    : apiKeyConfig.openaiApiKey;
  
  if (!apiKey) {
    throw new Error(`No API key provided for ${model.provider} provider`);
  }

  // For OpenAI provider
  if (model.provider === 'openai') {
    return callOpenAiAPI(model, prompt, base64Image, originalIsEps, apiKey);
  }

  // For Gemini provider (existing implementation)
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.name}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            // For EPS files, send the metadata as text without inline_data
            ...(originalIsEps 
              ? [{ text: base64Image }] 
              : [{
                  inline_data: {
                    mime_type: 'image/png',
                    data: base64Image.split(',')[1],
                  },
                }]
            ),
          ],
        },
      ],
      generationConfig: {
        temperature: model.temperature,
        topK: model.topK,
        topP: model.topP,
        maxOutputTokens: model.maxOutputTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData?.error?.message || `Failed to analyze image with ${model.name}`;
    const errorCode = response.status;
    
    // Check specifically for quota/rate limiting errors
    if (
      errorCode === 429 ||
      errorCode === 403 ||
      errorMessage.toLowerCase().includes('quota') ||
      errorMessage.toLowerCase().includes('rate limit') ||
      errorMessage.toLowerCase().includes('resource exhausted') ||
      errorMessage.toLowerCase().includes('limit exceeded')
    ) {
      throw new Error(`QUOTA_EXCEEDED: ${errorMessage}`);
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

// New function for OpenAI API calls
async function callOpenAiAPI(
  model: GeminiModel,
  prompt: string,
  base64Image: string,
  originalIsEps: boolean,
  apiKey: string
): Promise<any> {
  const url = `https://api.openai.com/v1/${model.modelPath}`;
  
  // Structure message content based on whether it's an EPS file or not
  const messageContent = originalIsEps
    ? [
        { type: "text", text: prompt },
        { type: "text", text: base64Image }
      ]
    : [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: base64Image,
            detail: "high"
          }
        }
      ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model.name,
      messages: [
        {
          role: "user",
          content: messageContent
        }
      ],
      max_tokens: model.maxOutputTokens,
      temperature: model.temperature,
      top_p: model.topP
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData?.error?.message || `Failed to analyze image with OpenAI model ${model.name}`;
    const errorCode = response.status;
    
    // Check specifically for quota/rate limiting errors
    if (
      errorCode === 429 ||
      errorCode === 403 ||
      errorMessage.toLowerCase().includes('quota') ||
      errorMessage.toLowerCase().includes('rate limit') ||
      errorMessage.toLowerCase().includes('resource exhausted') ||
      errorMessage.toLowerCase().includes('limit exceeded')
    ) {
      throw new Error(`QUOTA_EXCEEDED: ${errorMessage}`);
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  // Transform OpenAI response format to match Gemini format
  return {
    candidates: [
      {
        content: {
          parts: [
            { text: data.choices[0].message.content }
          ]
        }
      }
    ]
  };
}

export async function analyzeImageWithGemini(
  imageFile: File,
  apiKey: string,
  options: AnalysisOptions = {},
  openaiApiKey?: string
): Promise<AnalysisResult> {
  const apiKeyConfig: ApiKeyConfig = {
    geminiApiKey: apiKey,
    openaiApiKey
  };

  // Track processing time
  const startTime = Date.now();

  const {
    platforms = ['AdobeStock'],
    generationMode = 'metadata',
    minTitleWords = 10,
    maxTitleWords = 15,
    minKeywords = 25,
    maxKeywords = 35,
    minDescriptionWords = 10,
    maxDescriptionWords = 30,
    customPromptEnabled = false,
    customPrompt = '',
    prohibitedWords = '',
    prohibitedWordsEnabled = false,
    transparentBgEnabled = false,
    silhouetteEnabled = false,
    singleWordKeywordsEnabled = false
  } = options;

  const isFreepikOnly = platforms.length === 1 && platforms[0] === 'Freepik';
  const isShutterstock = platforms.length === 1 && platforms[0] === 'Shutterstock';
  const isAdobeStock = platforms.length === 1 && platforms[0] === 'AdobeStock';
  
  console.log('Starting image analysis with Gemini. Will fallback through models if needed.');
  
  try {
    // Store original filename
    const originalFilename = imageFile.name;
    
    // Check if we need to process special file types
    let fileToProcess = imageFile;
    let originalIsSvg = false;
    let originalIsVideo = false;
    let originalIsEps = false;
    let epsMetadata = null;

    // Handle SVG files
    if (isSvgFile(imageFile)) {
      try {
        originalIsSvg = true;
        console.log('Converting SVG to PNG for Gemini API compatibility...');
        fileToProcess = await convertSvgToPng(imageFile);
        console.log('SVG conversion successful');
      } catch (conversionError) {
        console.error('SVG conversion failed:', conversionError);
        throw new Error('Failed to convert SVG to PNG format: ' + (conversionError instanceof Error ? conversionError.message : 'Unknown error'));
      }
    }
    // Handle EPS files
    else if (isEpsFile(imageFile)) {
      try {
        originalIsEps = true;
        console.log('Extracting metadata from EPS file for Gemini API compatibility...');
        epsMetadata = await extractEpsMetadata(imageFile);
        fileToProcess = createEpsMetadataRepresentation(epsMetadata);
        console.log('EPS metadata extraction successful');
      } catch (extractionError) {
        console.error('EPS metadata extraction failed:', extractionError);
        throw new Error('Failed to extract metadata from EPS file: ' + (extractionError instanceof Error ? extractionError.message : 'Unknown error'));
      }
    }
    // Handle video files
    else if (isVideoFile(imageFile)) {
      try {
        originalIsVideo = true;
        fileToProcess = await extractVideoThumbnail(imageFile);
      } catch (extractionError) {
        throw new Error('Failed to extract thumbnail from video: ' + (extractionError instanceof Error ? extractionError.message : 'Unknown error'));
      }
    }
    
    // Convert image file to base64
    const base64Image = await fileToBase64(fileToProcess);
    
    // Define prompt based on platform and file type
    let prompt = `Analyze this image and generate:`;
    
    // Add silhouette instructions if enabled
    let silhouetteInstructions = '';
    if (silhouetteEnabled) {
      silhouetteInstructions = `IMPORTANT: This image features a silhouette. Please ensure you:
1. Add "silhouette" to the end of the title
2. Include "silhouette" as one of the keywords
3. Mention the silhouette style in the description as a distinctive feature\n\n`;
    }
    
    // Use custom prompt if enabled and provided
    if (customPromptEnabled && customPrompt.trim()) {
      // Append the formatting instructions to the custom prompt
      let formattingPrompt = '';
      
      // Add prohibited words instruction if provided and enabled
      if (prohibitedWordsEnabled && prohibitedWords.trim()) {
        const prohibitedWordsArray = prohibitedWords
          .split(',')
          .map(word => word.trim())
          .filter(word => word.length > 0);
        
        if (prohibitedWordsArray.length > 0) {
          formattingPrompt += `\n\nIMPORTANT: Do not use the following words in any part of the metadata (title, description, or keywords): ${prohibitedWordsArray.join(', ')}.`;
        }
      }
      
      // Add transparent background instructions if enabled
      if (transparentBgEnabled) {
        formattingPrompt += `\n\nIMPORTANT: This image has a transparent background. Please ensure you:
1. Add "on transparent background" to the end of the title
2. Include "transparent background" as one of the keywords
3. Mention the transparent background in the description as a valuable feature for designers`;
      }
      
      // Add silhouette instructions if enabled
      if (silhouetteEnabled) {
        formattingPrompt += `\n\nIMPORTANT: This image features a silhouette. Please ensure you:
1. Add "silhouette" to the end of the title
2. Include "silhouette" as one of the keywords
3. Mention the silhouette style in the description as a distinctive feature`;
      }
      
      if (generationMode === 'imageToPrompt') {
        formattingPrompt += '\n\nReturn the prompt description only, nothing else.';
      } else if (isFreepikOnly) {
        formattingPrompt += `\n\nFormat your response as a JSON object with the fields "title", "prompt", and "keywords" (as an array of at least ${minKeywords} terms).`;
      } else if (isShutterstock) {
        formattingPrompt += `\n\nFormat your response as a JSON object with the fields "description" and "keywords" (as an array of at least ${minKeywords} terms).`;
      } else if (isAdobeStock) {
        formattingPrompt += `\n\nFormat your response as a JSON object with the fields "title" and "keywords" (as an array of at least ${minKeywords} terms).`;
      } else {
        if (originalIsVideo) {
          formattingPrompt += `\n\nFormat your response as a JSON object with the fields "title", "keywords" (as an array of at least ${minKeywords} terms), and "category" (as a number from 1-10).`;
        } else {
          formattingPrompt += `\n\nFormat your response as a JSON object with the fields "title", "description", and "keywords" (as an array of at least ${minKeywords} terms).`;
        }
      }
      
      prompt = `${customPrompt}${formattingPrompt}`;
    } else {
      // Process prohibited words for default prompts
      let prohibitedWordsInstructions = '';
      if (prohibitedWordsEnabled && prohibitedWords.trim()) {
        const prohibitedWordsArray = prohibitedWords
          .split(',')
          .map(word => word.trim())
          .filter(word => word.length > 0);
        
        if (prohibitedWordsArray.length > 0) {
          prohibitedWordsInstructions = `IMPORTANT: Do not use the following words in any part of the metadata (title, description, or keywords): ${prohibitedWordsArray.join(', ')}.\n\n`;
        }
      }
      
      // Add transparent background instructions if enabled
      let transparentBgInstructions = '';
      if (transparentBgEnabled) {
        transparentBgInstructions = `IMPORTANT: This image has a transparent background. Please ensure you:
1. Add "on transparent background" to the end of the title
2. Include "transparent background" as one of the keywords
3. Mention the transparent background in the description as a valuable feature for designers\n\n`;
      }
      
      // Add silhouette instructions if enabled
      let silhouetteInstructions = '';
      if (silhouetteEnabled) {
        silhouetteInstructions = `IMPORTANT: This image features a silhouette. Please ensure you:
1. Add "silhouette" to the end of the title
2. Include "silhouette" as one of the keywords
3. Mention the silhouette style in the description as a distinctive feature\n\n`;
      }
      
      // Special handling for EPS files
      if (originalIsEps) {
        prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes information like title, creator, creation date, document type, color information, and content details. Based on this information, generate appropriate metadata for this design file:`;
      }
      // Modify prompt for video files
      else if (originalIsVideo) {
        prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is a thumbnail from a video file named "${originalFilename}". Analyze this thumbnail and generate metadata suitable for a video:`;
      }
      
      if (generationMode === 'imageToPrompt') {
        if (originalIsEps) {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes information like title, creator, document type (${epsMetadata?.documentType || 'Vector Design'}), and content details. Generate a detailed description of what this design file likely contains. 
          
Image Count: ${epsMetadata?.imageCount || 1}
Colors: ${epsMetadata?.colors?.join(', ') || 'Unknown'}
Fonts: ${epsMetadata?.fontInfo?.join(', ') || 'Unknown'}

The description should be at least 50 words but not more than 150 words. Important: Do not include phrases like "Vector EPS" or "EPS file" or "Vector file" in the description itself - just describe the content.`;
        } else if (originalIsVideo) {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is a thumbnail from a video file named "${originalFilename}". Generate a detailed description of what this video appears to contain based on this frame. Include details about content, style, colors, movement, and composition. The description should be at least 50 words but not more than 150 words.`;
        } else {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}Generate a detailed prompt description to recreate this image with an AI image generator. Include details about content, style, colors, lighting, and composition. The prompt should be at least 50 words but not more than 150 words.`;
        }
      } else if (isFreepikOnly) {
        if (originalIsEps) {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes the following information:

Document Type: ${epsMetadata?.documentType || 'Vector Design'}
Image Count: ${epsMetadata?.imageCount || 1}
Colors: ${epsMetadata?.colors?.join(', ') || 'Unknown'}
Fonts: ${epsMetadata?.fontInfo?.join(', ') || 'Unknown'}

Generate metadata for the Freepik platform:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words that accurately describes what's likely in this design file. The title should be relevant for stock image platforms. Don't use any symbols.
2. Create an image generation prompt that describes this design file in 1-2 sentences (30-50 words). Important: Do not include phrases like "Vector EPS" or "EPS file" or "Vector file" in the prompt itself - just describe the content.
3. Generate a detailed list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design. Focus on content, style, and technical aspects of the design.`;
        } else {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}Analyze this image and generate metadata for the Freepik platform:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words that accurately describes what's in the image. The title should be relevant for stock image platforms. Don't use any symbols.
2. Create an image generation prompt that describes this image in 1-2 sentences (30-50 words).
3. Generate a detailed list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this image. Focus on content, style, emotions, and technical details of the image.`;
        }
      } else if (isShutterstock) {
        if (originalIsEps) {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes the following information:

Document Type: ${epsMetadata?.documentType || 'Vector Design'}
Image Count: ${epsMetadata?.imageCount || 1}
Colors: ${epsMetadata?.colors?.join(', ') || 'Unknown'}
Fonts: ${epsMetadata?.fontInfo?.join(', ') || 'Unknown'}

Generate metadata for the Shutterstock platform:
1. A clear, descriptive detailed description that's between ${minDescriptionWords}-${maxDescriptionWords} words about what's likely in this design file. Important: Do not include phrases like "Vector EPS" or "EPS file" or "Vector file" in the description itself - just describe the content.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design.`;
        } else {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}Analyze this image and generate metadata for the Shutterstock platform:
1. A clear, descriptive detailed description that's between ${minDescriptionWords}-${maxDescriptionWords} words.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this image.`;
        }
      } else if (isAdobeStock) {
        if (originalIsEps) {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes the following information:

Document Type: ${epsMetadata?.documentType || 'Vector Design'}
Image Count: ${epsMetadata?.imageCount || 1}
Colors: ${epsMetadata?.colors?.join(', ') || 'Unknown'}
Fonts: ${epsMetadata?.fontInfo?.join(', ') || 'Unknown'}

Generate metadata for Adobe Stock:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words about what's likely in this design file. Don't use any symbols or phrases like "Vector EPS" or "EPS file".
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design.`;
        } else {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}Analyze this image and generate metadata for Adobe Stock:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words. Don't use any symbols.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this image.`;
        }
      } else {
        if (originalIsVideo) {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is a thumbnail from a video file named "${originalFilename}". Analyze this thumbnail and generate metadata suitable for a video:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words that accurately describes what's in the video. Don't use any symbols.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this video.
3. A category number between 1-10, where:
   1=Animations, 2=Backgrounds, 3=Business, 4=Education, 5=Food, 6=Lifestyle, 7=Nature, 8=Presentations, 9=Technology, 10=Other`;
        } else if (originalIsEps) {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes the following information:

Document Type: ${epsMetadata?.documentType || 'Vector Design'}
Image Count: ${epsMetadata?.imageCount || 1}
Colors: ${epsMetadata?.colors?.join(', ') || 'Unknown'}
Fonts: ${epsMetadata?.fontInfo?.join(', ') || 'Unknown'}

Generate appropriate metadata for this design file:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words that accurately describes what's likely in this design file. Don't use any symbols.
2. A detailed description that's between ${minDescriptionWords}-${maxDescriptionWords} words. Important: Do not include phrases like "Vector EPS" or "EPS file" or "Vector file" in the description itself - just describe the content.
3. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design.`;
        } else {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}Analyze this image and generate:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words. Don't use any symbols.
2. A detailed description that's between ${minDescriptionWords}-${maxDescriptionWords} words.
3. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this image.`;
        }
      }
      
      if (generationMode === 'imageToPrompt') {
        prompt += `\n\nReturn the prompt description only, nothing else.`;
      } else if (isFreepikOnly) {
        prompt += `\n\nFormat your response as a JSON object with the fields "title", "prompt", and "keywords" (as an array of at least ${minKeywords} terms).`;
      } else if (isShutterstock) {
        prompt += `\n\nFormat your response as a JSON object with the fields "description" and "keywords" (as an array).`;
      } else if (isAdobeStock) {
        prompt += `\n\nFormat your response as a JSON object with the fields "title" and "keywords" (as an array).`;
      } else {
        if (originalIsVideo) {
          prompt += `\n\nFormat your response as a JSON object with the fields "title", "keywords" (as an array), and "category" (as a number from 1-10).`;
        } else {
          prompt += `\n\nFormat your response as a JSON object with the fields "title", "description", and "keywords" (as an array).`;
        }
      }
    }
    
    // Filter models based on available API keys
    const availableModels = GEMINI_MODELS.filter(model => 
      (model.provider === 'gemini' && apiKeyConfig.geminiApiKey) || 
      (model.provider === 'openai' && apiKeyConfig.openaiApiKey)
    );

    if (availableModels.length === 0) {
      throw new Error("No API keys provided for any available models");
    }

    // Get models for the current provider first
    const currentProviderModels = availableModels.filter(model => model.provider === currentApiProvider);
    
    // Start with models from the current provider, then try the other provider if available
    let modelsToTry = [
      ...currentProviderModels.slice(lastWorkingModelIndex), 
    ];

    // If we're starting with Gemini models, add OpenAI models as backup
    if (currentApiProvider === 'gemini' && apiKeyConfig.openaiApiKey) {
      const openaiModels = availableModels.filter(model => model.provider === 'openai');
      modelsToTry = [...modelsToTry, ...openaiModels];
    }
    // If we're starting with OpenAI models, add Gemini models as backup
    else if (currentApiProvider === 'openai' && apiKeyConfig.geminiApiKey) {
      const geminiModels = availableModels.filter(model => model.provider === 'gemini');
      modelsToTry = [...modelsToTry, ...geminiModels];
    }
    
    // Try each model in sequence until one succeeds
    let lastError: Error | null = null;
    let providerSwitched = false;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      
      try {
        console.log(`Attempting to use ${model.name} (${model.provider})...`);
        const data = await callGeminiAPI(model, prompt, base64Image, originalIsEps, apiKeyConfig);
        console.log(`Successfully generated content with ${model.name} model.`);
        
        // Update the current provider if it changed
        if (currentApiProvider !== model.provider) {
          currentApiProvider = model.provider;
          console.log(`Switched to ${currentApiProvider} provider`);
          providerSwitched = true;
        }
        
        // Update the lastWorkingModelIndex only for the current provider
        if (model.provider === currentApiProvider) {
          // Find the index in the original GEMINI_MODELS array
          const modelIndex = GEMINI_MODELS.findIndex(m => m.name === model.name && m.provider === model.provider);
          if (modelIndex !== -1) {
            lastWorkingModelIndex = modelIndex;
          }
        }
        
        const text = data.candidates[0]?.content?.parts[0]?.text || '';
        
        // For image-to-prompt mode, just return the description
        if (generationMode === 'imageToPrompt') {
          return {
            title: '',
            description: text.trim(),
            keywords: [],
            prompt: text.trim(),
            filename: originalFilename,
            isVideo: originalIsVideo,
            isEps: originalIsEps,
            baseModel: isFreepikOnly ? "midjourney 5" : model.name,
            provider: model.provider,
            processingTime: (Date.now() - startTime) / 1000
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
          result.baseModel = isFreepikOnly ? "midjourney 5" : model.name; // Always set "midjourney 5" for Freepik
          result.provider = model.provider; // Add the provider to the result
          
          // Ensure titles don't have symbols
          if (result.title) {
            result.title = removeSymbolsFromTitle(result.title);
          }
          
          // Post-process for transparent background if enabled
          if (transparentBgEnabled) {
            // Add "on transparent background" to the title if not already present
            if (result.title && !result.title.toLowerCase().includes('transparent background')) {
              result.title = result.title.trim() + ' on transparent background';
            }
            
            // Add "transparent background" to keywords if not already present
            if (result.keywords && !result.keywords.some(k => k.toLowerCase().includes('transparent background'))) {
              result.keywords.push('transparent background');
            }
            
            // Mention transparent background in description if not already mentioned
            if (result.description && !result.description.toLowerCase().includes('transparent background')) {
              result.description = result.description.trim() + ' This image features a transparent background, making it versatile for various design projects.';
            }
          }
          
          // Post-process for silhouette if enabled
          if (silhouetteEnabled) {
            // Add "silhouette" to the title if not already present
            if (result.title && !result.title.toLowerCase().includes('silhouette')) {
              result.title = result.title.trim() + ' silhouette';
            }
            
            // Add "silhouette" to keywords if not already present
            if (result.keywords && !result.keywords.some(k => k.toLowerCase().includes('silhouette'))) {
              result.keywords.push('silhouette');
            }
            
            // Mention silhouette in description if not already mentioned
            if (result.description && !result.description.toLowerCase().includes('silhouette')) {
              result.description = result.description.trim() + ' This image features a striking silhouette design, perfect for creating a bold visual impact.';
            }
          }
          
          // Ensure we have enough keywords for all platforms and custom prompts
          if (result.keywords && result.keywords.length < minKeywords) {
            console.log('Not enough keywords provided, generating more...');
            
            // For custom prompts or any platform, generate additional keywords if needed
            if (customPromptEnabled || (!isFreepikOnly && !isShutterstock && !isAdobeStock)) {
              // Use title and description to generate more keywords
              const contentForKeywords = [
                result.title || '',
                result.description || '',
                result.keywords.join(', ')
              ].join(' ');
              
              // Use the existing Freepik keyword generator as a fallback
              const additionalKeywords = getRelevantFreepikKeywords(contentForKeywords, singleWordKeywordsEnabled);
              
              // Combine existing keywords with new ones, remove duplicates
              const combinedKeywords = [...new Set([...result.keywords, ...additionalKeywords])];
              
              // Use the combined list, up to maxKeywords
              result.keywords = combinedKeywords.slice(0, maxKeywords);
            }
          }
          
          // Post-process to filter out prohibited words if provided and enabled
          if (prohibitedWordsEnabled && prohibitedWords.trim()) {
            const prohibitedWordsArray = prohibitedWords
              .split(',')
              .map(word => word.trim().toLowerCase())
              .filter(word => word.length > 0);
            
            if (prohibitedWordsArray.length > 0) {
              // Filter keywords
              if (result.keywords && result.keywords.length > 0) {
                result.keywords = result.keywords.filter(keyword => {
                  const lowerKeyword = keyword.toLowerCase();
                  return !prohibitedWordsArray.some(prohibited => lowerKeyword.includes(prohibited));
                });
                
                // If we filtered too many keywords, generate replacements
                if (result.keywords.length < minKeywords) {
                  const additionalKeywords = getRelevantFreepikKeywords(result.title || '' + ' ' + (result.description || ''), singleWordKeywordsEnabled);
                  const filteredAdditionalKeywords = additionalKeywords.filter(keyword => {
                    const lowerKeyword = keyword.toLowerCase();
                    return !prohibitedWordsArray.some(prohibited => lowerKeyword.includes(prohibited));
                  });
                  
                  // Add filtered additional keywords
                  result.keywords = [...new Set([...result.keywords, ...filteredAdditionalKeywords])].slice(0, maxKeywords);
                }
              }
            }
          }
          
          // Post-process to filter keywords to single words if enabled
          if (singleWordKeywordsEnabled && result.keywords && Array.isArray(result.keywords)) {
            result.keywords = result.keywords.filter(k => typeof k === 'string' && k.trim().split(/\s+/).length === 1);
          }
          
          // For Freepik, use the keywords provided directly from the API response
          if (isFreepikOnly) {
            // If keywords exist in the result, use them
            if (!result.keywords || result.keywords.length < minKeywords) {
              // Fallback: Generate keywords from the prompt if not enough keywords provided
              const freepikKeywords = getRelevantFreepikKeywords(result.prompt || '', singleWordKeywordsEnabled);
              result.keywords = freepikKeywords;
            }
            
            // IMPORTANT: Always ensure prompt is generated for Freepik
            // Set the prompt even if not downloading CSV
            if (!result.prompt) {
              // Generate a descriptive prompt from the title and keywords
              const keywordText = result.keywords?.slice(0, 10).join(', ') || 'various elements';
              result.prompt = `Generate a ${result.title?.toLowerCase() || 'image'} with ${keywordText}. ${result.description || ''}`;
            }
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
          
          // For video-specific responses
          if (originalIsVideo) {
            // Extract category from Gemini result if provided, otherwise determine it from content
            let videoCategory: number;
            
            if (result.category && typeof result.category === 'number' && result.category >= 1 && result.category <= 21) {
              videoCategory = result.category;
            } else {
              // If Gemini didn't provide a valid category, determine it from the content
              videoCategory = determineVideoCategory(
                result.title || '',
                result.description || '',
                result.keywords || []
              );
            }
            
            return {
              title: result.title || '',
              description: result.description || '',
              keywords: result.keywords || [],
              category: videoCategory,
              filename: originalFilename,
              isVideo: true,
              isEps: false,
              processingTime: (Date.now() - startTime) / 1000,
              ...(!isFreepikOnly && !isShutterstock && !isAdobeStock ? { categories: result.categories } : {}),
            };
          }
          
          // For EPS-specific responses
          if (originalIsEps) {
            // Generate a prompt if not provided
            const epsPrompt = result.prompt || result.description || 
                `Generate a ${result.title?.toLowerCase() || 'vector illustration'} with ${result.keywords?.slice(0, 10).join(', ') || 'various elements'}.`;
            
            return {
              title: result.title || '',
              description: result.description || '',
              keywords: result.keywords || [],
              prompt: epsPrompt,
              baseModel: isFreepikOnly ? "midjourney 5" : (result.baseModel || "leonardo"),
              categories: result.categories,
              filename: originalFilename,
              isVideo: false,
              isEps: true,
              processingTime: (Date.now() - startTime) / 1000,
            };
          }
          
          // Add processing time to the result
          result.processingTime = (Date.now() - startTime) / 1000;
          
          // Ensure baseModel is set to midjourney 5 for Freepik platform
          if (isFreepikOnly) {
            result.baseModel = "midjourney 5";
          }
          
          // Ensure prompt is set (use description as fallback)
          if (!result.prompt && result.description) {
            result.prompt = result.description;
          }
          
          return result;
        } catch (e) {
          console.error('Failed to parse JSON from response:', jsonStr);
          console.error('Original response:', text);
          throw new Error('Failed to parse metadata from the API response');
        }
      } catch (error) {
        console.error(`Error with ${model.name}:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if this is a quota/rate limit error
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
        if (
          errorMessage.includes('quota_exceeded:') || 
          errorMessage.includes('quota') || 
          errorMessage.includes('rate limit') || 
          errorMessage.includes('429') ||
          errorMessage.includes('403') ||
          errorMessage.includes('resource exhausted') ||
          errorMessage.includes('limit exceeded')
        ) {
          console.log(`${model.name} quota exceeded or rate limited, trying next model...`);
          
          // Show a toast notification about model fallback
          if (!providerSwitched) {
            // Only show the first fallback notification to avoid spamming
            toast.info(`${model.name} quota exceeded. Trying alternative models...`, {
              duration: 3000,
            });
          }
          
          // If we're at the last model of the current provider, prepare to switch providers
          const isLastModelOfCurrentProvider = !modelsToTry
            .slice(i + 1)
            .some(m => m.provider === model.provider);
            
          if (isLastModelOfCurrentProvider && !providerSwitched) {
            const nextProvider = model.provider === 'gemini' ? 'openai' : 'gemini';
            const hasNextProviderKey = nextProvider === 'gemini' 
              ? !!apiKeyConfig.geminiApiKey 
              : !!apiKeyConfig.openaiApiKey;
              
            if (hasNextProviderKey) {
              toast.info(`Switching to ${nextProvider.toUpperCase()} models...`, {
                duration: 3000,
              });
              providerSwitched = true;
            }
          }
          
          continue;
        }
        
        // If it's not a quota error, throw it
        console.error(`Non-quota error with ${model.name}, stopping fallback sequence.`);
        throw error;
      }
    }

    // If we get here, all models failed
    console.error('All models exceeded their quotas or failed.');
    throw lastError || new Error('All models failed. Please try again later.');
  } catch (error) {
    console.error('Processing error:', error instanceof Error ? error.message : 'Unknown error');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isQuotaError = errorMessage.toLowerCase().includes('quota') || 
                         errorMessage.toLowerCase().includes('rate limit') || 
                         errorMessage.includes('resource exhausted');
    
    return {
      title: '',
      description: '',
      keywords: [],
      prompt: '',
      baseModel: isFreepikOnly ? "midjourney 5" : "leonardo",
      error: isQuotaError 
        ? 'All available models have reached their quota limits. Please try again later or check your API keys.' 
        : errorMessage,
      isVideo: isVideoFile(imageFile),
      isEps: isEpsFile(imageFile),
      filename: imageFile.name,
      processingTime: (Date.now() - startTime) / 1000
    };
  }
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  // For text files (like our EPS metadata), read as text instead of binary
  if (file.type === 'text/plain') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
  
  // For image files, proceed as usual with dataURL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
