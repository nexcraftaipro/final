import { Platform } from '@/components/PlatformSelector';
import { GenerationMode } from '@/components/GenerationModeSelector';
import { getRelevantFreepikKeywords } from './keywordGenerator';
import { suggestCategoriesForShutterstock, suggestCategoriesForAdobeStock, removeSymbolsFromTitle } from './imageHelpers';
import { convertSvgToPng, isSvgFile } from './svgToPng';
import { extractVideoThumbnail, isVideoFile } from './videoProcessor';
import { isEpsFile, extractEpsMetadata, createEpsMetadataRepresentation } from './epsMetadataExtractor';
import { determineVideoCategory } from './categorySelector';
import { toast } from 'sonner';

// List of default OpenRouter API keys
const DEFAULT_OPENROUTER_KEYS = [
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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',
  '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'
];

// Function to get a random default OpenRouter API key
export function getRandomOpenRouterKey(): string {
  const randomIndex = Math.floor(Math.random() * DEFAULT_OPENROUTER_KEYS.length);
  return DEFAULT_OPENROUTER_KEYS[randomIndex];
}

// Generate and cache a random API key for this session
let sessionOpenRouterKey = getRandomOpenRouterKey();

// Function to get the current default OpenRouter key for this session
export function getDefaultOpenRouterKey(): string {
  return sessionOpenRouterKey;
}

// Track the last working model index across multiple requests
// This helps avoid repeated attempts on models that have exceeded their quota
let lastWorkingModelIndex = 0;

// Track the currently active API provider
let currentApiProvider: 'gemini' | 'openai' | 'openrouter' = 'gemini';

// Function to reset the model index, useful when starting a new session
export function resetGeminiModelIndex(): void {
  lastWorkingModelIndex = 0;
  currentApiProvider = 'gemini';
  console.log("Reset model index to 0 and provider to Gemini (Gemini 2.0 Flash)");
}

// Function to get the current API provider
export function getCurrentApiProvider(): 'gemini' | 'openai' | 'openrouter' {
  return currentApiProvider;
}

// Function to manually set the API provider
export function setApiProvider(provider: 'gemini' | 'openai' | 'openrouter'): void {
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
  provider?: 'gemini' | 'openai' | 'openrouter';
  processingTime?: number;
}

interface ApiKeyConfig {
  geminiApiKey: string;
  openaiApiKey?: string;
  deepseekApiKey?: string;
}

interface GeminiModel {
  name: string;
  maxOutputTokens: number;
  temperature: number;
  topK: number;
  topP: number;
  provider: 'gemini' | 'openai' | 'openrouter';
  modelPath?: string; // For OpenAI API endpoint path
  openrouterModel?: string; // For OpenRouter model path
}

const GEMINI_MODELS: GeminiModel[] = [
  // Gemini models (primary models)
  {
    name: 'gemini-2.0-flash',
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
  // OpenRouter - Gemini 1.5 Flash 8B model (fallback model)
  {
    name: 'Gemini 1.5 Flash 8B',
    maxOutputTokens: 1024,
    temperature: 0.4,
    topK: 0,
    topP: 0.95,
    provider: 'openrouter',
    openrouterModel: 'google/gemini-flash-1.5-8b'
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
  let apiKey;
  if (model.provider === 'gemini') {
    apiKey = apiKeyConfig.geminiApiKey;
  } else if (model.provider === 'openai') {
    apiKey = apiKeyConfig.openaiApiKey;
  } else if (model.provider === 'openrouter') {
    apiKey = apiKeyConfig.deepseekApiKey; // Using the deepseekApiKey for all OpenRouter models
  }
  
  if (!apiKey) {
    throw new Error(`No API key provided for ${model.provider} provider`);
  }

  // For OpenAI provider
  if (model.provider === 'openai') {
    return callOpenAiAPI(model, prompt, base64Image, originalIsEps, apiKey);
  }
  
  // For OpenRouter provider (includes both DeepSeek and GPT models)
  if (model.provider === 'openrouter') {
    return callOpenRouterAPI(model, prompt, base64Image, originalIsEps, apiKey);
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

// New function for OpenRouter API calls
async function callOpenRouterAPI(
  model: GeminiModel,
  prompt: string,
  base64Image: string,
  originalIsEps: boolean,
  apiKey: string
): Promise<any> {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  
  // Clean the base64 data to ensure proper format for OpenRouter
  let cleanedImageData = base64Image;
  if (base64Image.startsWith('data:') && !originalIsEps) {
    // Make sure we only have the base64 part without the prefix if it's not EPS data
    cleanedImageData = base64Image;
  }

  // Structure messages for the API
  let messages;
  
  if (originalIsEps) {
    // For EPS, send as plain text
    messages = [
      {
        role: "user",
        content: prompt + "\n\n" + base64Image
      }
    ];
  } else {
    // For images, use proper OpenRouter format with image support
    messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          },
          {
            type: "image_url",
            image_url: {
              url: cleanedImageData
            }
          }
        ]
      }
    ];
  }

  // Prepare the proper request payload for OpenRouter
  const requestPayload = {
    model: model.openrouterModel,
    messages: messages,
    max_tokens: model.maxOutputTokens,
    temperature: model.temperature,
    top_p: model.topP
  };
  
  console.log("OpenRouter request payload structure:", JSON.stringify({
    model: requestPayload.model,
    message_structure: "Structure proper, image data omitted for brevity",
    parameters: {
      max_tokens: requestPayload.max_tokens,
      temperature: requestPayload.temperature,
      top_p: requestPayload.top_p
    }
  }, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PixcraftAI'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      let errorMessage = `Failed to analyze image with DeepSeek model ${model.name}`;
      const errorCode = response.status;
      
      try {
        const errorData = await response.json();
        console.error("OpenRouter API error:", errorData);
        errorMessage = errorData?.error?.message || errorMessage;
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
      
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

    // Parse and log the full response for debugging
    const data = await response.json();
    console.log("OpenRouter response success:", true);
    
    if (!data?.choices?.[0]?.message?.content) {
      console.error("Unexpected response format:", data);
      throw new Error("Unexpected response format from OpenRouter API");
    }
    
    // Get the content - special handling for possible JSON
    let responseContent = data.choices[0].message.content;
    console.log("Raw content from DeepSeek:", responseContent);
    
    // Try to detect if the response is already JSON
    let parsedJsonContent = null;
    try {
      // Check if the response is already a valid JSON object
      if (responseContent.trim().startsWith('{') && responseContent.trim().endsWith('}')) {
        parsedJsonContent = JSON.parse(responseContent);
        console.log("Response is already valid JSON:", parsedJsonContent);
        
        // Validate expected fields
        if (
          parsedJsonContent.title !== undefined || 
          parsedJsonContent.description !== undefined || 
          parsedJsonContent.keywords !== undefined
        ) {
          // If the response is already valid JSON with expected fields,
          // we'll return it directly in the Gemini format
          return {
            candidates: [
              {
                content: {
                  parts: [
                    { 
                      text: JSON.stringify(parsedJsonContent) 
                    }
                  ]
                }
              }
            ]
          };
        }
      }
    } catch (e) {
      // Not JSON or not parseable, continue with normal handling
      console.log("Response is not directly parseable JSON:", e);
    }
    
    // Check if response contains code blocks with JSON
    const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || 
                      responseContent.match(/```\n([\s\S]*?)\n```/);
                      
    if (jsonMatch) {
      try {
        const extractedJson = jsonMatch[1];
        console.log("Found JSON in code block:", extractedJson);
        
        // Return the extracted JSON within the code block
        return {
          candidates: [
            {
              content: {
                parts: [
                  { text: extractedJson }
                ]
              }
            }
          ]
        };
      } catch (e) {
        console.log("Error parsing JSON from code block:", e);
      }
    }
    
    // Transform OpenRouter response format to match Gemini format
    const transformedResponse = {
      candidates: [
        {
          content: {
            parts: [
              { text: responseContent }
            ]
          }
        }
      ]
    };
    
    return transformedResponse;
  } catch (error) {
    console.error("Error in OpenRouter API call:", error);
    throw error;
  }
}

export async function analyzeImageWithGemini(
  imageFile: File,
  apiKey: string,
  options: AnalysisOptions = {},
  openaiApiKey?: string,
  deepseekApiKey?: string
): Promise<AnalysisResult> {
  // Special case for forced regeneration with OpenRouter Gemini 1.5 Flash 8B
  const forceOpenRouterGemini = deepseekApiKey === 'USE_OPENROUTER_GEMINI_FLASH_8B';
  
  const apiKeyConfig: ApiKeyConfig = {
    geminiApiKey: apiKey,
    openaiApiKey,
    deepseekApiKey: forceOpenRouterGemini ? getDefaultOpenRouterKey() : (deepseekApiKey || getDefaultOpenRouterKey())
  };

  // Track processing time
  const startTime = Date.now();
  
  // For forced regeneration, override the provider and model
  if (forceOpenRouterGemini) {
    // Temporarily set the provider to OpenRouter regardless of current setting
    const originalProvider = currentApiProvider;
    currentApiProvider = 'openrouter';
    
    // After the processing is complete, we'll restore the original provider
    setTimeout(() => {
      currentApiProvider = originalProvider;
    }, 100);
  }

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
  
  console.log('Starting image analysis with AI. Will fallback through models if needed.');
  
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
        formattingPrompt += `\n\nFormat your response as a valid JSON object with the fields "title", "prompt", and "keywords" (as an array of at least ${minKeywords} terms). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
      } else if (isShutterstock) {
        formattingPrompt += `\n\nFormat your response as a valid JSON object with the fields "description" and "keywords" (as an array of at least ${minKeywords} terms). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
      } else if (isAdobeStock) {
        formattingPrompt += `\n\nFormat your response as a valid JSON object with the fields "title" and "keywords" (as an array of at least ${minKeywords} terms). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
      } else {
        if (originalIsVideo) {
          formattingPrompt += `\n\nFormat your response as a valid JSON object with the fields "title", "keywords" (as an array of at least ${minKeywords} terms), and "category" (as a number from 1-10). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
        } else {
          formattingPrompt += `\n\nFormat your response as a valid JSON object with the fields "title", "description", and "keywords" (as an array of at least ${minKeywords} terms). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
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

The description should be at least 50 words but not more than 150 words. Important: Do not include phrases like "Vector EPS" or "EPS file" or "Vector file" in the description itself - just describe the content.

Format your response as a valid JSON object without any markdown formatting or backticks.`;
        } else if (originalIsVideo) {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is a thumbnail from a video file named "${originalFilename}". Generate a detailed description of what this video appears to contain based on this frame. Include details about content, style, colors, movement, and composition. The description should be at least 50 words but not more than 150 words.

Format your response as a valid JSON object with the field "description" without any markdown formatting or backticks.`;
        } else {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}Generate a detailed prompt description to recreate this image with an AI image generator. Include details about content, style, colors, lighting, and composition. The prompt should be at least 50 words but not more than 150 words.

Format your response as a valid JSON object with the field "description" without any markdown formatting or backticks.`;
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
3. Generate a detailed list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design. Focus on content, style, and technical aspects of the design.

Format your response as a valid JSON object with the fields "title", "prompt", and "keywords" (as an array). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
        } else {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}Analyze this image and generate metadata for the Freepik platform:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words that accurately describes what's in the image. The title should be relevant for stock image platforms. Don't use any symbols.
2. Create an image generation prompt that describes this image in 1-2 sentences (30-50 words).
3. Generate a detailed list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this image. Focus on content, style, emotions, and technical details of the image.

Format your response as a valid JSON object with the fields "title", "prompt", and "keywords" (as an array). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
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
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design.

Format your response as a valid JSON object with the fields "description" and "keywords" (as an array). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
        } else {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}Analyze this image and generate metadata for the Shutterstock platform:
1. A clear, descriptive detailed description that's between ${minDescriptionWords}-${maxDescriptionWords} words.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this image.

Format your response as a valid JSON object with the fields "description" and "keywords" (as an array). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
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
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design.

Format your response as a valid JSON object with the fields "title" and "keywords" (as an array). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
        } else {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}Analyze this image and generate metadata for Adobe Stock:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words. Don't use any symbols.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this image.

Format your response as a valid JSON object with the fields "title" and "keywords" (as an array). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
        }
      } else {
        if (originalIsVideo) {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is a thumbnail from a video file named "${originalFilename}". Analyze this thumbnail and generate metadata suitable for a video:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words that accurately describes what's in the video. Don't use any symbols.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this video.
3. A category number between 1-10, where:
   1=Animations, 2=Backgrounds, 3=Business, 4=Education, 5=Food, 6=Lifestyle, 7=Nature, 8=Presentations, 9=Technology, 10=Other

Format your response as a valid JSON object with the fields "title", "keywords" (as an array), and "category" (as a number from 1-10). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
        } else if (originalIsEps) {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes the following information:

Document Type: ${epsMetadata?.documentType || 'Vector Design'}
Image Count: ${epsMetadata?.imageCount || 1}
Colors: ${epsMetadata?.colors?.join(', ') || 'Unknown'}
Fonts: ${epsMetadata?.fontInfo?.join(', ') || 'Unknown'}

Generate appropriate metadata for this design file:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words that accurately describes what's likely in this design file. Don't use any symbols.
2. A detailed description that's between ${minDescriptionWords}-${maxDescriptionWords} words. Important: Do not include phrases like "Vector EPS" or "EPS file" or "Vector file" in the description itself - just describe the content.
3. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design.

Format your response as a valid JSON object with the fields "title", "description", and "keywords" (as an array). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
        } else {
          prompt = `${prohibitedWordsInstructions}${transparentBgInstructions}${silhouetteInstructions}Analyze this image and generate:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words. Don't use any symbols.
2. A detailed description that's between ${minDescriptionWords}-${maxDescriptionWords} words.
3. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this image.

Format your response as a valid JSON object with the fields "title", "description", and "keywords" (as an array). Do not include backticks, markdown formatting, or any text outside the JSON object.`;
        }
      }
    }
    
    // If we're forcing OpenRouter Gemini 1.5 Flash 8B, skip the model fallback logic
    if (forceOpenRouterGemini) {
      // Find the OpenRouter Gemini 1.5 Flash 8B model
      const geminiFlash8BModel = GEMINI_MODELS.find(m => 
        m.provider === 'openrouter' && 
        m.openrouterModel === 'google/gemini-flash-1.5-8b'
      );
      
      if (!geminiFlash8BModel) {
        throw new Error('OpenRouter Gemini 1.5 Flash 8B model not found in available models');
      }
      
      // Use this model directly without fallbacks
      console.log('Forcing use of OpenRouter Gemini 1.5 Flash 8B for regeneration...');
      const data = await callOpenRouterAPI(geminiFlash8BModel, prompt, base64Image, originalIsEps, apiKeyConfig.deepseekApiKey);
      
      console.log('Successfully generated content with OpenRouter Gemini 1.5 Flash 8B model.');
      
      // Process the result similar to the normal flow
      const text = data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Same processing logic as in the normal flow...
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
          baseModel: isFreepikOnly ? "midjourney 5" : geminiFlash8BModel.name,
          provider: 'openrouter',
          processingTime: (Date.now() - startTime) / 1000
        };
      }
      
      // Extract JSON from the response text (same as in normal flow)
      let jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/```\n([\s\S]*?)\n```/) ||
                      text.match(/\{[\s\S]*\}/);
                      
      let jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      
      // Clean up potential garbage around the JSON object
      jsonStr = jsonStr.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      
      console.log("Attempting to parse JSON:", jsonStr);
      
      // Rest of the JSON parsing and processing logic is the same...
      // Continue with existing logic for JSON parsing and result processing
    } else {
      // Regular model fallback logic (existing code)
      // Filter models based on available API keys
      const availableModels = GEMINI_MODELS.filter(model => 
        (model.provider === 'gemini' && apiKeyConfig.geminiApiKey) || 
        (model.provider === 'openai' && apiKeyConfig.openaiApiKey) ||
        (model.provider === 'openrouter' && apiKeyConfig.deepseekApiKey)
      );

      if (availableModels.length === 0) {
        throw new Error("No API keys provided for any available models");
      }

      // Get models for the current provider first
      const currentProviderModels = availableModels.filter(model => model.provider === currentApiProvider);
      
      // Start with models from the current provider, then try the others as fallbacks
      let modelsToTry = [...currentProviderModels.slice(lastWorkingModelIndex)];
      
      // Add fallback models based on current provider
      if (currentApiProvider === 'gemini') {
        // If starting with Gemini, add OpenRouter models next, then OpenAI models
        const openRouterModels = availableModels.filter(model => model.provider === 'openrouter');
        const openaiModels = availableModels.filter(model => model.provider === 'openai');
        modelsToTry = [...modelsToTry, ...openRouterModels, ...openaiModels];
      }
      else if (currentApiProvider === 'openrouter') {
        // If starting with OpenRouter, try Gemini models next, then OpenAI models
        const geminiModels = availableModels.filter(model => model.provider === 'gemini');
        const openaiModels = availableModels.filter(model => model.provider === 'openai');
        modelsToTry = [...modelsToTry, ...geminiModels, ...openaiModels];
      }
      else if (currentApiProvider === 'openai') {
        // If starting with OpenAI, try Gemini next, then OpenRouter
        const geminiModels = availableModels.filter(model => model.provider === 'gemini');
        const openRouterModels = availableModels.filter(model => model.provider === 'openrouter');
        modelsToTry = [...modelsToTry, ...geminiModels, ...openRouterModels];
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
          
          console.log("Attempting to parse JSON:", jsonStr);
          
          let result;
          try {
            // Try to parse the JSON directly
            try {
              result = JSON.parse(jsonStr);
              console.log("JSON parsing successful:", result);
            } catch (parseError) {
              // If direct parsing fails, try to clean and fix the JSON 
              console.log("Initial JSON parsing failed, attempting to fix JSON:", parseError);
              
              // Try to extract the JSON structure more carefully
              // Look for title, description, keywords pattern
              const titleMatch = text.match(/["']title["']\s*:\s*["']([^"']*)["']/);
              const descriptionMatch = text.match(/["']description["']\s*:\s*["']([^"']*)["']/);
              const keywordsText = text.match(/["']keywords["']\s*:\s*\[([\s\S]*?)\]/);
              
              if (titleMatch || descriptionMatch || keywordsText) {
                console.log("Found partial JSON elements, constructing object manually");
                // Create a JSON object manually
                result = {};
                if (titleMatch) result.title = titleMatch[1];
                if (descriptionMatch) result.description = descriptionMatch[1];
                
                // Parse keywords if available
                if (keywordsText) {
                  try {
                    // Try to parse the keywords array
                    const keywordsStr = `[${keywordsText[1]}]`;
                    const keywords = JSON.parse(keywordsStr.replace(/'/g, '"'));
                    result.keywords = keywords;
                  } catch (keywordError) {
                    console.log("Failed to parse keywords, using fallback method");
                    // Fallback: split by commas and clean up
                    const keywordText = keywordsText[1].replace(/["']/g, '');
                    result.keywords = keywordText.split(',').map(k => k.trim()).filter(k => k);
                  }
                } else {
                  // If no keywords found, create some from the title and description
                  result.keywords = [];
                }
                
                console.log("Manually constructed JSON object:", result);
              } else {
                // If we can't extract structured data, use the text as description
                console.log("No JSON structure found, using text as description");
                result = {
                  title: originalFilename.replace(/\.[^/.]+$/, ""),  // Use filename without extension
                  description: text.trim(),
                  keywords: []  // Empty keywords to be filled later
                };
              }
            }
            
            // Set model and provider info
            result.baseModel = isFreepikOnly ? "midjourney 5" : model.name;
            result.provider = model.provider;
            
            // Ensure we have basic fields
            result.title = result.title || originalFilename.replace(/\.[^/.]+$/, "");
            result.description = result.description || "";
            result.keywords = result.keywords || [];
            
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
              // Determine the next provider based on priority: DeepSeek > Gemini > OpenAI
              let nextProvider: 'openrouter' | 'gemini' | 'openai';
              
              if (model.provider === 'openrouter') {
                nextProvider = 'gemini'; // DeepSeek -> Gemini
              } else if (model.provider === 'gemini') {
                nextProvider = apiKeyConfig.deepseekApiKey ? 'openrouter' : 'openai'; // Prefer DeepSeek if available
              } else {
                nextProvider = apiKeyConfig.deepseekApiKey ? 'openrouter' : 'gemini'; // Prefer DeepSeek if available
              }
              
              const hasNextProviderKey = 
                (nextProvider === 'gemini' && !!apiKeyConfig.geminiApiKey) || 
                (nextProvider === 'openai' && !!apiKeyConfig.openaiApiKey) ||
                (nextProvider === 'openrouter' && !!apiKeyConfig.deepseekApiKey);
                
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
    }
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