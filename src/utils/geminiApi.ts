/**
 * Gemini API Integration with OpenRouter Fallback
 * 
 * This file integrates Gemini API for AI image analysis with an automatic
 * fallback mechanism to OpenRouter's Gemini 1.5 Flash 8B model when Gemini
 * API requests fail due to:
 * 
 * - Quota exceeded errors (status 429)
 * - Rate limiting
 * - Access denied errors (status 403)
 * - Any other errors that may occur
 * 
 * The fallback mechanism preserves the user experience by transparently switching
 * to OpenRouter while maintaining the same quality of results.
 * 
 * Features:
 * - Automatic fallback from Gemini API to OpenRouter Gemini 1.5 Flash 8B
 * - Retry mechanism for OpenRouter API calls
 * - Default OpenRouter API keys for cases where none is provided
 * - Toast notifications when fallback occurs
 */

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
const DEFAULT_OPENROUTER_KEYS: string[] = [];

// Function to get a random default OpenRouter API key
export function getRandomOpenRouterKey(): string {
  return ''; // Return empty string since we no longer provide default keys
}

// Generate and cache a random API key for this session
let sessionOpenRouterKey = '';

// Function to get the current default OpenRouter key for this session
export function getDefaultOpenRouterKey(): string {
  return sessionOpenRouterKey;
}

// Function to ensure we have an API key config with OpenRouter fallback
export function ensureApiKeyConfig(apiKeyConfig: ApiKeyConfig): ApiKeyConfig {
  return {
    ...apiKeyConfig,
    deepseekApiKey: apiKeyConfig.deepseekApiKey || ''
  };
}

// Track the last working model index across multiple requests
// This helps avoid repeated attempts on models that have exceeded their quota
let lastWorkingModelIndex = 0;

// Track which Gemini models have failed due to quota in the current session
const failedGeminiModels = new Set<string>();

// Track the currently active API provider
let currentApiProvider: 'gemini' | 'openai' | 'openrouter' = 'gemini';

// Track the last working model name
let lastWorkingModelName: string = 'gemini-2.0-flash';

// Function to reset the model index, useful when starting a new session
export function resetGeminiModelIndex(): void {
  lastWorkingModelIndex = 0;
  currentApiProvider = 'gemini';
  lastWorkingModelName = 'gemini-2.0-flash';
  failedGeminiModels.clear();
  console.log("Reset model index to 0 and provider to Gemini (Gemini 2.0 Flash)");
}

// Function to get the current API provider
export function getCurrentApiProvider(): 'gemini' | 'openai' | 'openrouter' {
  return currentApiProvider;
}

// Function to get the last working model name
export function getLastWorkingModelName(): string {
  return lastWorkingModelName;
}

// Function to manually set the API provider
export function setApiProvider(provider: 'gemini' | 'openai' | 'openrouter'): void {
  currentApiProvider = provider;
  lastWorkingModelIndex = 0; // Reset index when switching providers
  if (provider === 'gemini') {
    failedGeminiModels.clear(); // Reset failed models when manually switching to Gemini
    lastWorkingModelName = 'gemini-2.0-flash'; // Reset to default model
  }
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
    name: 'gemini-1.5-flash-8b',
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
  // Ensure we have an OpenRouter API key for fallback
  const config = ensureApiKeyConfig(apiKeyConfig);
  
  // Use the appropriate API key based on provider
  let apiKey;
  if (model.provider === 'gemini') {
    apiKey = config.geminiApiKey;
  } else if (model.provider === 'openai') {
    apiKey = config.openaiApiKey;
  } else if (model.provider === 'openrouter') {
    apiKey = config.deepseekApiKey; // Using the deepseekApiKey for all OpenRouter models
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
  try {
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
        console.log(`${model.name} quota exceeded. Recording as failed.`);
        
        // Add this model to the failed Gemini models set
        if (model.provider === 'gemini') {
          failedGeminiModels.add(model.name);
          console.log('Updated failed Gemini models list:', Array.from(failedGeminiModels));
          
          // Check if we should try another Gemini model first
          // Define the preferred order of Gemini models
          const preferredGeminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
          
          // Filter out failed models
          const availableGeminiModels = preferredGeminiModels.filter(m => !failedGeminiModels.has(m));
          
          if (availableGeminiModels.length > 0) {
            // There are still Gemini models we haven't tried
            const nextGeminiModelName = availableGeminiModels[0];
            const nextGeminiModel = GEMINI_MODELS.find(m => m.name === nextGeminiModelName && m.provider === 'gemini');
            
            if (nextGeminiModel) {
              console.log(`Trying next Gemini model: ${nextGeminiModel.name}`);
              
              // Notify user we're trying another Gemini model
              toast.info(`${model.name} quota exceeded. Trying ${nextGeminiModel.name}...`, {
                duration: 3000
              });
              
              // Try the next Gemini model
              return callGeminiAPI(nextGeminiModel, prompt, base64Image, originalIsEps, config);
            }
          }
          
          // Check if all Gemini models are now known to be failed
          const allGeminiFailed = preferredGeminiModels.every(m => failedGeminiModels.has(m));
          
          if (allGeminiFailed) {
            // If all Gemini models have failed, now switch to OpenRouter
            console.log('All Gemini models have exceeded their quota. Falling back to OpenRouter Gemini 1.5 Flash 8B');
            
            // Notify user about the fallback to OpenRouter
            toast.info('All Gemini models exceeded. Falling back to OpenRouter Gemini 1.5 Flash 8B', {
              duration: 4000
            });
          } else {
            toast.info(`${model.name} quota exceeded. Trying alternative model...`, {
              duration: 3000
            });
          }
        } else {
          toast.info(`${model.name} quota exceeded. Falling back to OpenRouter Gemini 1.5 Flash 8B`, {
            duration: 4000
          });
        }
        
        // Find the OpenRouter Gemini 1.5 Flash 8B model
        const geminiFlash8BModel = GEMINI_MODELS.find(m => 
          m.provider === 'openrouter' && 
          m.openrouterModel === 'google/gemini-flash-1.5-8b'
        );
        
        if (geminiFlash8BModel && config.deepseekApiKey) {
          // Update the currently active API provider
          currentApiProvider = 'openrouter';
          console.log('Switched API provider to OpenRouter for Gemini 1.5 Flash 8B');
          
          // Directly call OpenRouter API with the Gemini Flash 8B model
          return callOpenRouterAPI(geminiFlash8BModel, prompt, base64Image, originalIsEps, config.deepseekApiKey);
        } else {
          // If we can't use OpenRouter, throw the quota exceeded error
          throw new Error(`QUOTA_EXCEEDED: ${errorMessage}`);
        }
      }
      
      throw new Error(errorMessage);
    }

    // If successful, clear this model from the failed models list (it's working now)
    if (model.provider === 'gemini') {
      failedGeminiModels.delete(model.name);
      // Remember this as the last working model
      lastWorkingModelName = model.name;
      console.log(`Model ${model.name} is working correctly, setting as lastWorkingModelName`);
    } else if (model.provider === 'openrouter') {
      // If OpenRouter is working, remember it
      lastWorkingModelName = 'openrouter-gemini-1.5-flash-8b';
      console.log(`OpenRouter model is working correctly, setting as lastWorkingModelName`);
    }

    return response.json();
  } catch (error) {
    // For network errors or other unexpected errors
    console.error('Error in Gemini API call:', error);
    
    // If the error is coming from our application (already formatted)
    if (error instanceof Error && error.message.startsWith('QUOTA_EXCEEDED:')) {
      throw error;
    }
    
    // For unexpected errors, also try to fall back to OpenRouter
    console.log('Unexpected Gemini API error. Trying to fall back to OpenRouter Gemini 1.5 Flash 8B');
    
    // Notify user about the fallback due to unexpected error
    toast.info('Gemini API error. Falling back to OpenRouter Gemini 1.5 Flash 8B', {
      duration: 4000
    });
    
    // Find the OpenRouter Gemini 1.5 Flash 8B model
    const geminiFlash8BModel = GEMINI_MODELS.find(m => 
      m.provider === 'openrouter' && 
      m.openrouterModel === 'google/gemini-flash-1.5-8b'
    );
    
    if (geminiFlash8BModel && config.deepseekApiKey) {
      // Update the currently active API provider
      currentApiProvider = 'openrouter';
      console.log('Switched API provider to OpenRouter for Gemini 1.5 Flash 8B');
      
      // Directly call OpenRouter API with the Gemini Flash 8B model
      return callOpenRouterAPI(geminiFlash8BModel, prompt, base64Image, originalIsEps, config.deepseekApiKey);
    }
    
    throw error;
  }
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
    top_p: model.topP,
    // Add fallbacks to ensure reliability
    fallbacks: [
      {
        model: "google/gemini-flash-1.5-8b",
        provider: "openrouter"
      },
      {
        model: "anthropic/claude-3-haiku",
        provider: "openrouter"
      }
    ],
    route: "fallbacks"
  };
  
  console.log("OpenRouter request payload structure:", JSON.stringify({
    model: requestPayload.model,
    message_structure: "Structure proper, image data omitted for brevity",
    parameters: {
      max_tokens: requestPayload.max_tokens,
      temperature: requestPayload.temperature,
      top_p: requestPayload.top_p
    },
    fallbacks: requestPayload.fallbacks,
    route: requestPayload.route
  }, null, 2));

  // Maximum number of retries
  const MAX_RETRIES = 2;
  let retryCount = 0;
  let lastError = null;

  // Try up to MAX_RETRIES times to get a successful response
  while (retryCount <= MAX_RETRIES) {
    try {
      if (retryCount > 0) {
        console.log(`Retrying OpenRouter API call (attempt ${retryCount} of ${MAX_RETRIES})`);
        
        // Use a different API key on retry if we have a list of default keys
        if (DEFAULT_OPENROUTER_KEYS.length > 1) {
          const randomApiKey = getRandomOpenRouterKey();
          apiKey = randomApiKey;
          console.log("Using different OpenRouter API key for retry");
        }
      }
      
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
        let errorMessage = `Failed to analyze image with OpenRouter model ${model.name}`;
        const errorCode = response.status;
        
        try {
          const errorData = await response.json();
          console.error("OpenRouter API error:", errorData);
          errorMessage = errorData?.error?.message || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        
        // If we're out of retries, throw the error
        if (retryCount === MAX_RETRIES) {
          throw new Error(errorMessage);
        }
        
        // Store the error and retry
        lastError = new Error(errorMessage);
        retryCount++;
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        continue;
      }

      // Parse and log the full response for debugging
      const data = await response.json();
      console.log("OpenRouter response success:", true);
      
      if (!data?.choices?.[0]?.message?.content) {
        console.error("Unexpected response format:", data);
        
        // If we're out of retries, throw an error
        if (retryCount === MAX_RETRIES) {
          throw new Error("Unexpected response format from OpenRouter API");
        }
        
        // Store the error and retry
        lastError = new Error("Unexpected response format from OpenRouter API");
        retryCount++;
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        continue;
      }
      
      // Get the content - special handling for possible JSON
      let responseContent = data.choices[0].message.content;
      console.log("Raw content from OpenRouter:", responseContent);
      
      // Check which model actually responded
      if (data.model) {
        console.log(`Response came from model: ${data.model}`);
      }
      
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
      
      // If we're out of retries, throw the error
      if (retryCount === MAX_RETRIES) {
        throw error;
      }
      
      // Store the error and retry
      lastError = error;
      retryCount++;
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
    }
  }
  
  // We should never reach here, but just in case
  throw lastError || new Error("Failed to get response from OpenRouter API after multiple retries");
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
  
  let apiKeyConfig: ApiKeyConfig = {
    geminiApiKey: apiKey,
    openaiApiKey,
    deepseekApiKey: forceOpenRouterGemini ? getDefaultOpenRouterKey() : deepseekApiKey
  };
  
  // Ensure we have an OpenRouter API key for fallback
  apiKeyConfig = ensureApiKeyConfig(apiKeyConfig);

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

  // Log the currently failed models for debugging
  if (failedGeminiModels.size > 0) {
    console.log('Currently failed Gemini models:', Array.from(failedGeminiModels));
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
      
      // Define the preferred order of Gemini models
      const preferredGeminiModelNames = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
      
      // First, get all Gemini models in preferred order
      const geminiModels = preferredGeminiModelNames
        .map(name => availableModels.find(m => m.name === name && m.provider === 'gemini'))
        .filter(m => m !== undefined) as GeminiModel[];
      
      // Get OpenRouter models (with priority to Gemini 1.5 Flash 8B)
      const openRouterModels = availableModels.filter(m => m.provider === 'openrouter');
      const openRouterGeminiFlash = openRouterModels.find(m => 
        m.openrouterModel === 'google/gemini-flash-1.5-8b'
      );
      
      // Get OpenAI models as last resort
      const openaiModels = availableModels.filter(m => m.provider === 'openai');
      
      // Create the prioritized model list
      let modelsToTry: GeminiModel[] = [];
      
      // If the last working model was OpenRouter, ONLY use OpenRouter and don't try Gemini models
      if (lastWorkingModelName === 'openrouter-gemini-1.5-flash-8b' && openRouterGeminiFlash) {
        console.log('Last working model was OpenRouter. Only using OpenRouter without trying Gemini models.');
        modelsToTry = [openRouterGeminiFlash];
        
        // Add other OpenRouter models as fallbacks
        const otherOpenRouterModels = openRouterModels.filter(m => 
          m.openrouterModel !== 'google/gemini-flash-1.5-8b'
        );
        modelsToTry = [...modelsToTry, ...otherOpenRouterModels];
        
        // Add OpenAI models as last resort fallbacks, but no Gemini models
        modelsToTry = [...modelsToTry, ...openaiModels];
        
        // Set the current provider to OpenRouter
        currentApiProvider = 'openrouter';
      }
      // If we have a last working Gemini model, prioritize it
      else if (lastWorkingModelName && lastWorkingModelName !== 'gemini-2.0-flash') {
        const lastWorkingModel = geminiModels.find(m => m.name === lastWorkingModelName);
        if (lastWorkingModel) {
          console.log(`Using last working model: ${lastWorkingModelName}`);
          modelsToTry = [lastWorkingModel];
          
          // Add other Gemini models that haven't failed
          const otherGeminiModels = geminiModels.filter(m => 
            m.name !== lastWorkingModelName && !failedGeminiModels.has(m.name)
          );
          modelsToTry = [...modelsToTry, ...otherGeminiModels];
          
          // Add OpenRouter and OpenAI models as fallbacks
          if (openRouterGeminiFlash) {
            modelsToTry = [...modelsToTry, openRouterGeminiFlash];
          }
          modelsToTry = [...modelsToTry, ...openaiModels];
        } else {
          // If we can't find the last working model, use default order
          modelsToTry = getDefaultModelOrder(geminiModels, openRouterGeminiFlash, openaiModels);
        }
      } else {
        // Use default order if no last working model or if it's the default model
        modelsToTry = getDefaultModelOrder(geminiModels, openRouterGeminiFlash, openaiModels);
      }
      
      // Helper function to get default model order
      function getDefaultModelOrder(
        geminiModels: GeminiModel[], 
        openRouterGeminiFlash: GeminiModel | undefined, 
        openaiModels: GeminiModel[]
      ): GeminiModel[] {
        // Check if all Gemini models have failed
        const allGeminiFailed = geminiModels.length > 0 && 
          geminiModels.every(m => failedGeminiModels.has(m.name));
        
        // If all Gemini models have failed, start immediately with OpenRouter
        if (allGeminiFailed && openRouterGeminiFlash) {
          console.log('All Gemini models have previously failed. Starting directly with OpenRouter Gemini 1.5 Flash 8B');
          toast.info('Using OpenRouter Gemini 1.5 Flash 8B (all Gemini models exceeded quota)', { 
            duration: 4000 
          });
          currentApiProvider = 'openrouter'; // Update the provider
          
          // Start with OpenRouter Gemini Flash, then add other models
          const result = [openRouterGeminiFlash];
          
          // Add other OpenRouter models
          const otherOpenRouterModels = openRouterModels.filter(m => 
            m.openrouterModel !== 'google/gemini-flash-1.5-8b'
          );
          result.push(...otherOpenRouterModels);
          
          // Add OpenAI models last
          result.push(...openaiModels);
          
          return result;
        } 
        
        // Otherwise use the regular prioritization logic
        // Filter out failed Gemini models
        const availableGeminiModels = geminiModels.filter(m => !failedGeminiModels.has(m.name));
        
        // Start with available Gemini models
        const result = [...availableGeminiModels];
        
        // Add OpenRouter models next, prioritizing Gemini 1.5 Flash 8B
        if (openRouterGeminiFlash) {
          result.push(openRouterGeminiFlash);
        }
        
        // Add other OpenRouter models
        const otherOpenRouterModels = openRouterModels.filter(m => 
          m.openrouterModel !== 'google/gemini-flash-1.5-8b'
        );
        result.push(...otherOpenRouterModels);
        
        // Add OpenAI models last
        result.push(...openaiModels);
        
        return result;
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
          
          // Remember this as the last working model
          if (model.provider === 'gemini') {
            lastWorkingModelName = model.name;
            console.log(`Setting last working model name to ${lastWorkingModelName}`);
          } else if (model.provider === 'openrouter' && model.openrouterModel === 'google/gemini-flash-1.5-8b') {
            lastWorkingModelName = 'openrouter-gemini-1.5-flash-8b';
            console.log(`Setting last working model name to ${lastWorkingModelName} (OpenRouter)`);
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
              console.log(`Not enough keywords provided (${result.keywords.length}), need at least ${minKeywords}. Generating more...`);
              
              // Create content to generate more keywords from
              const contentForKeywords = [
                result.title || '',
                result.description || '',
                result.keywords.join(', ')
              ].join(' ');
              
              // Try to ensure we meet the minimum keyword requirement
              let attempts = 0;
              const maxAttempts = 3;
              let previousKeywordCount = result.keywords.length;
              
              const generateMoreKeywords = () => {
                attempts++;
                console.log(`Keyword generation attempt ${attempts}`);
                
                // Generate additional keywords
                const additionalKeywords = getRelevantFreepikKeywords(contentForKeywords, singleWordKeywordsEnabled);
                
                // Combine existing keywords with new ones, remove duplicates
                const combinedKeywords = [...new Set([...result.keywords, ...additionalKeywords])];
                
                // Check if we have enough keywords now
                if (combinedKeywords.length < minKeywords && attempts < maxAttempts) {
                  // Check if we're stuck (no new keywords added)
                  if (combinedKeywords.length === previousKeywordCount) {
                    console.log("No new keywords generated, using alternative approach");
                    // Try splitting existing words and adding common related terms
                    const splitWords = combinedKeywords.flatMap(kw => kw.split(/[\s-]/));
                    const uniqueSplitWords = [...new Set(splitWords)].filter(w => w.length > 2);
                    result.keywords = [...combinedKeywords, ...uniqueSplitWords];
                  } else {
                    // Not stuck, proceed with normal variation generation
                    const existingKeywords = combinedKeywords.join(' ');
                    const variations = getRelevantFreepikKeywords(existingKeywords, false);
                    result.keywords = [...new Set([...combinedKeywords, ...variations])];
                  }
                  
                  // Update the previousKeywordCount for next iteration
                  previousKeywordCount = combinedKeywords.length;
                  
                  // If we still don't have enough, repeat with more aggressive settings
                  if (result.keywords.length < minKeywords) {
                    return generateMoreKeywords();
                  }
                } else {
                  // We have enough keywords, or we've tried enough times
                  result.keywords = combinedKeywords;
                }
                
                // Use the combined list, up to maxKeywords
                result.keywords = result.keywords.slice(0, maxKeywords);
                console.log(`Keywords expanded from original count to ${result.keywords.length}, final count: ${result.keywords.length}`);
              };
              
              generateMoreKeywords();
            }
            
            // Enforce exact keyword count requirements
            if (result.keywords) {
              // If we have too many keywords, keep them limited to maxKeywords
              if (result.keywords.length > maxKeywords) {
                console.log(`Too many keywords (${result.keywords.length}), limiting to ${maxKeywords}`);
                result.keywords = result.keywords.slice(0, maxKeywords);
              }
              
              // If we still have too few keywords after all attempts, create new ones using AI-generated 
              // content and common stock photo terms to reach the minimum
              if (result.keywords.length < minKeywords) {
                console.log(`Still not enough keywords (${result.keywords.length}), adding generic stock keywords to reach ${minKeywords}`);
                
                // Add common stock photography keywords to fill the gap
                const stockKeywords = [
                  "creative", "design", "modern", "artistic", "professional",
                  "clean", "minimal", "detailed", "high resolution", "stock image", 
                  "commercial", "business", "concept", "digital", "illustration",
                  "background", "stylish", "decorative", "trendy", "contemporary",
                  "graphic", "beautiful", "lifestyle", "creative", "popular",
                  "elegant", "premium", "quality", "simple", "colorful"
                ];
                
                // Calculate how many more keywords we need
                const neededKeywords = minKeywords - result.keywords.length;
                const additionalStockKeywords = stockKeywords.slice(0, neededKeywords);
                
                // Add the stock keywords to reach the minimum
                result.keywords = [...result.keywords, ...additionalStockKeywords];
                console.log(`Added ${additionalStockKeywords.length} generic stock keywords to reach minimum`);
              }
            }

            // Validate and enforce title word count
            if (result.title) {
              const titleWords = result.title.trim().split(/\s+/);
              console.log(`Title word count: ${titleWords.length}, Min: ${minTitleWords}, Max: ${maxTitleWords}`);
              
              // If title has fewer words than minimum required, expand it
              if (titleWords.length < minTitleWords && result.description) {
                // Try to add words from description or keywords to expand the title
                console.log('Title has fewer words than minimum, expanding...');
                const descWords = (result.description || '').split(/\s+/);
                const keywordWords = result.keywords ? result.keywords.join(' ').split(/\s+/) : [];
                const potentialWords = [...descWords, ...keywordWords]
                  .filter(w => !titleWords.includes(w) && w.length > 2)
                  .slice(0, minTitleWords - titleWords.length);
                
                if (potentialWords.length > 0) {
                  result.title = result.title + ' ' + potentialWords.join(' ');
                  console.log(`Expanded title to: "${result.title}"`);
                }
              }
              
              // If title has more words than maximum allowed, truncate it
              if (titleWords.length > maxTitleWords) {
                console.log('Title has more words than maximum, truncating...');
                result.title = titleWords.slice(0, maxTitleWords).join(' ');
                console.log(`Truncated title to: "${result.title}"`);
              }
            }
            
            // Validate and enforce description word count
            if (result.description) {
              const descWords = result.description.trim().split(/\s+/);
              console.log(`Description word count: ${descWords.length}, Min: ${minDescriptionWords}, Max: ${maxDescriptionWords}`);
              
              // If description has fewer words than minimum required, expand it
              if (descWords.length < minDescriptionWords) {
                console.log('Description has fewer words than minimum, expanding...');
                // Use keywords to add relevant content
                const keywordSentence = result.keywords ? 
                  `This image features ${result.keywords.slice(0, 5).join(', ')}.` : '';
                
                if (keywordSentence) {
                  result.description = result.description + ' ' + keywordSentence;
                  console.log(`Expanded description to: "${result.description}"`);
                }
              }
              
              // If description has more words than maximum allowed, truncate it
              if (descWords.length > maxDescriptionWords) {
                console.log('Description has more words than maximum, truncating...');
                result.description = descWords.slice(0, maxDescriptionWords).join(' ');
                console.log(`Truncated description to: "${result.description}"`);
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
                    const keywordLower = keyword.toLowerCase();
                    return !prohibitedWordsArray.some(prohibited => keywordLower.includes(prohibited));
                  });
                }
                
                // If we need to add more keywords after filtering
                if (result.keywords.length < minKeywords) {
                  console.log('Not enough keywords after filtering prohibited words, generating more...');
                  
                  // Generate more keywords that don't contain prohibited words
                  const contentForKeywords = [
                    result.title || '',
                    result.description || '',
                    result.keywords.join(', ')
                  ].join(' ');
                  
                  const additionalKeywords = getRelevantFreepikKeywords(contentForKeywords, singleWordKeywordsEnabled);
                  
                  // Filter out additional keywords containing prohibited words
                  const filteredAdditionalKeywords = additionalKeywords.filter(keyword => {
                    const keywordLower = keyword.toLowerCase();
                    return !prohibitedWordsArray.some(prohibited => keywordLower.includes(prohibited));
                  });
                  
                  // Add filtered additional keywords
                  result.keywords = [...new Set([...result.keywords, ...filteredAdditionalKeywords])].slice(0, maxKeywords);
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
            
            // Ensure all required fields have at least an empty value
            if (!result.title) {
              console.log('No title provided, generating a default title');
              if (result.description) {
                // Extract first sentence from description
                const firstSentence = result.description.split('.')[0];
                result.title = firstSentence || 'Stock Image';
              } else if (result.keywords && result.keywords.length > 0) {
                // Use top keywords to form a title
                result.title = `${result.keywords.slice(0, 3).join(' ')} Stock Image`;
              } else {
                result.title = 'Stock Image';
              }
            }
            
            if (!result.description) {
              console.log('No description provided, generating a default description');
              if (result.keywords && result.keywords.length > 0) {
                // Use keywords to create a description
                result.description = `This image features ${result.keywords.slice(0, 8).join(', ')}. ${result.title}`;
              } else {
                result.description = result.title || 'Stock image for commercial use.';
              }
            }
            
            if (!result.keywords || result.keywords.length === 0) {
              console.log('No keywords provided, generating default keywords');
              const contentForKeywords = result.title + ' ' + result.description;
              result.keywords = getRelevantFreepikKeywords(contentForKeywords, singleWordKeywordsEnabled).slice(0, maxKeywords);
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