import { Platform } from '@/components/PlatformSelector';
import { GenerationMode } from '@/components/GenerationModeSelector';
import { getRelevantFreepikKeywords, suggestCategoriesForShutterstock, suggestCategoriesForAdobeStock, removeSymbolsFromTitle } from './imageHelpers';
import { convertSvgToPng, isSvgFile } from './svgToPng';
import { extractVideoThumbnail, isVideoFile } from './videoProcessor';
import { isEpsFile, extractEpsMetadata, createEpsMetadataRepresentation } from './epsMetadataExtractor';

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
    maxDescriptionWords = 30
  } = options;

  const isFreepikOnly = platforms.length === 1 && platforms[0] === 'Freepik';
  const isShutterstock = platforms.length === 1 && platforms[0] === 'Shutterstock';
  const isAdobeStock = platforms.length === 1 && platforms[0] === 'AdobeStock';
  
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
    
    // Special handling for EPS files
    if (originalIsEps) {
      prompt = `This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes information like title, creator, creation date, and some extracted text. Based on this information, generate appropriate metadata for this design file:`;
    }
    // Modify prompt for video files
    else if (originalIsVideo) {
      prompt = `This is a thumbnail from a video file named "${originalFilename}". Analyze this thumbnail and generate metadata suitable for a video:`;
    }
    
    if (generationMode === 'imageToPrompt') {
      if (originalIsEps) {
        prompt = `This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes information like title, creator, creation date, and some extracted text. Generate a detailed description of what this design file likely contains. The description should be at least 50 words but not more than 150 words.`;
      } else if (originalIsVideo) {
        prompt = `This is a thumbnail from a video file named "${originalFilename}". Generate a detailed description of what this video appears to contain based on this frame. Include details about content, style, colors, movement, and composition. The description should be at least 50 words but not more than 150 words.`;
      } else {
        prompt = `Generate a detailed prompt description to recreate this image with an AI image generator. Include details about content, style, colors, lighting, and composition. The prompt should be at least 50 words but not more than 150 words.`;
      }
    } else if (isFreepikOnly) {
      if (originalIsEps) {
        prompt = `This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes information like title, creator, creation date, and some extracted text. Generate metadata for the Freepik platform:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words that accurately describes what's likely in this design file. The title should be relevant for stock image platforms. Don't use any symbols.
2. Create an image generation prompt that describes this design file in 1-2 sentences (30-50 words).
3. Generate a detailed list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design. Focus on content, style, and technical aspects of the design.`;
      } else {
        prompt = `Analyze this image and generate metadata for the Freepik platform:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words that accurately describes what's in the image. The title should be relevant for stock image platforms. Don't use any symbols.
2. Create an image generation prompt that describes this image in 1-2 sentences (30-50 words).
3. Generate a detailed list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this image. Focus on content, style, emotions, and technical details of the image.`;
      }
    } else if (isShutterstock) {
      if (originalIsEps) {
        prompt = `This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes information like title, creator, creation date, and some extracted text. Generate metadata for the Shutterstock platform:
1. A clear, descriptive detailed description that's between ${minDescriptionWords}-${maxDescriptionWords} words about what's likely in this design file.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design.`;
      } else {
        prompt = `Analyze this image and generate metadata for the Shutterstock platform:
1. A clear, descriptive detailed description that's between ${minDescriptionWords}-${maxDescriptionWords} words.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this image.`;
      }
    } else if (isAdobeStock) {
      if (originalIsEps) {
        prompt = `This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes information like title, creator, creation date, and some extracted text. Generate metadata for Adobe Stock:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words about what's likely in this design file. Don't use any symbols.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design.`;
      } else {
        prompt = `Analyze this image and generate metadata for Adobe Stock:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words. Don't use any symbols.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this image.`;
      }
    } else {
      if (originalIsVideo) {
        prompt = `This is a thumbnail from a video file named "${originalFilename}". Analyze this thumbnail and generate metadata suitable for a video:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words that accurately describes what's in the video. Don't use any symbols.
2. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this video.
3. A category number between 1-10, where:
   1=Animations, 2=Backgrounds, 3=Business, 4=Education, 5=Food, 6=Lifestyle, 7=Nature, 8=Presentations, 9=Technology, 10=Other`;
      } else if (originalIsEps) {
        prompt = `This is metadata extracted from an EPS file named "${originalFilename}". The metadata includes information like title, creator, creation date, and some extracted text. Generate appropriate metadata for this design file:
1. A clear, descriptive title between ${minTitleWords}-${maxTitleWords} words that accurately describes what's likely in this design file. Don't use any symbols.
2. A detailed description that's between ${minDescriptionWords}-${maxDescriptionWords} words.
3. A list of ${minKeywords}-${maxKeywords} relevant, specific keywords (single words or short phrases) that someone might search for to find this design.`;
      } else {
        prompt = `Analyze this image and generate:
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
              // For EPS files, send the metadata as text without inline_data
              ...(originalIsEps 
                ? [{ text: base64Image }] 
                : [{
                    inline_data: {
                      mime_type: fileToProcess.type,
                      data: base64Image.split(',')[1],
                    },
                  }]
              ),
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
        filename: originalFilename,
        isVideo: originalIsVideo,
        isEps: originalIsEps
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
      // If keywords exist in the result, use them
      if (!result.keywords || result.keywords.length < minKeywords) {
        // Fallback: Generate keywords from the prompt if not enough keywords provided
        const freepikKeywords = getRelevantFreepikKeywords(result.prompt || '');
        result.keywords = freepikKeywords;
      }
      result.baseModel = "leonardo";
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
      return {
        title: result.title || '',
        description: result.description || '',
        keywords: result.keywords || [],
        category: result.category || 10, // Default to "Other" if not specified
        filename: originalFilename,
        isVideo: true,
        isEps: false,
        ...(!isFreepikOnly && !isShutterstock && !isAdobeStock ? { categories: result.categories } : {}),
      };
    }
    
    // For EPS-specific responses
    if (originalIsEps) {
      return {
        title: result.title || '',
        description: result.description || '',
        keywords: result.keywords || [],
        prompt: result.prompt,
        baseModel: result.baseModel || "leonardo",
        categories: result.categories,
        filename: originalFilename,
        isVideo: false,
        isEps: true,
      };
    }
    
    return {
      title: result.title || '',
      description: result.description || '',
      keywords: result.keywords || [],
      prompt: result.prompt,
      baseModel: result.baseModel || "leonardo",
      categories: result.categories,
      filename: originalFilename,
      isVideo: false,
      isEps: false,
    };
  } catch (error) {
    console.error('Processing error:', error instanceof Error ? error.message : 'Unknown error');
    
    return {
      title: '',
      description: '',
      keywords: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      isVideo: isVideoFile(imageFile),
      isEps: isEpsFile(imageFile),
      filename: imageFile.name,
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
