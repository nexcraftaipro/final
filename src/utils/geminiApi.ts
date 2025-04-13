
import { toast } from "sonner";
import type { Platform } from "@/components/PlatformSelector";
import type { GenerationMode } from "@/components/GenerationModeSelector";
import { 
  suggestCategoriesForShutterstock, 
  suggestCategoriesForAdobeStock,
  removeSymbols,
  getUniqueKeywords
} from "./imageHelpers";

interface MetadataResult {
  filename: string;
  title: string;
  description: string;
  keywords: string[];
  prompt?: string;
  baseModel?: string;
  categories?: string[]; // Added categories for Shutterstock and AdobeStock
  error?: string;
}

interface MetadataOptions {
  titleLength: number;
  descriptionLength: number;
  keywordCount: number;
  platforms: Platform[]; 
  generationMode: GenerationMode;
  minTitleWords: number;
  maxTitleWords: number;
  minKeywords: number;
  maxKeywords: number;
  minDescriptionWords: number;
  maxDescriptionWords: number;
}

// Helper function to add delay between API calls
// Adjusted to distribute requests to stay within Gemini's 15 RPM limit
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Variable to track the last request timestamp
let lastRequestTime = 0;

export async function analyzeImageWithGemini(
  file: File,
  apiKey: string,
  options: MetadataOptions
): Promise<MetadataResult> {
  if (!apiKey) {
    return {
      filename: file.name,
      title: "",
      description: "",
      keywords: [],
      error: "API key is required",
    };
  }

  try {
    // Calculate time since last request
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    // If less than 2 seconds have passed since last request, add delay
    // to ensure we stay within the 15 RPM limit (4 seconds between requests is safe)
    if (timeSinceLastRequest < 2000) {
      const delayTime = 2000 - timeSinceLastRequest;
      await delay(delayTime);
    }
    
    // Update last request time
    lastRequestTime = Date.now();
    
    // Convert the image to base64
    // Special handling for SVG files
    const base64Image = await fileToBase64(file);
    
    // Handle SVG files specially
    const isSvgFile = file.type === 'image/svg+xml';
    
    // Remove the data URL prefix for the API request
    const base64Data = base64Image.split(",")[1];
    
    let promptText = "";
    
    // Check platform selections
    const isFreepikOnly = options.platforms.length === 1 && options.platforms[0] === 'Freepik';
    const isAdobeStock = options.platforms.length === 1 && options.platforms[0] === 'AdobeStock';
    const isShutterstock = options.platforms.length === 1 && options.platforms[0] === 'Shutterstock';
    
    if (options.generationMode === 'metadata') {
      // Update minimum values for AdobeStock
      const minTitleWordsForPlatform = isAdobeStock ? Math.max(options.minTitleWords, 12) : options.minTitleWords;
      const minDescWordsForPlatform = isAdobeStock ? Math.max(options.minDescriptionWords, 12) : options.minDescriptionWords;
      
      const keywordInstruction = `between ${options.minKeywords}-${options.maxKeywords} UNIQUE keywords`;
      
      const titleInstruction = `The title should be between ${minTitleWordsForPlatform}-${options.maxTitleWords} words WITHOUT any special characters or symbols`;
      const descriptionInstruction = `The description should be between ${minDescWordsForPlatform}-${options.maxDescriptionWords} words, minimum ${minDescWordsForPlatform} words`;
      
      let platformInstruction = "";
      if (options.platforms && options.platforms.length > 0) {
        // Updated to handle multiple platforms
        const platformsList = options.platforms.join(', ');
        platformInstruction = `Optimize the metadata specifically for ${platformsList} platform requirements and best practices.`;
      }

      if (isFreepikOnly) {
        // Updated prompt for Freepik - Explicitly mentioning the keyword limit and avoiding duplication
        promptText = `Generate metadata for this image for Freepik platform. Return ONLY a JSON object with the exact keys: 'title', 'keywords', 'prompt', and 'baseModel'.

${titleInstruction}. IMPORTANT: The title MUST BE INCLUDED and should be descriptive, WITHOUT any special characters or symbols.

Keywords MUST include ${options.minKeywords} to ${options.maxKeywords} relevant tags for the image - DO NOT exceed ${options.maxKeywords} keywords. The keywords should be specific, detailed, and varied to describe all aspects of the image. ENSURE all keywords are UNIQUE - DO NOT repeat any keywords.

The prompt field should be a short, one-sentence description of the image. Keep it concise but descriptive, under 20 words.

The baseModel value MUST be exactly "leonardo" (without quotes).

Even if you have difficulty analyzing the image, you MUST generate at least ${options.minKeywords} UNIQUE keywords based on what you can see, but no more than ${options.maxKeywords}.

DO NOT include any explanations or text outside of the JSON object. The response must be a valid JSON object with ALL fields populated.`;
      } else if (isAdobeStock) {
        // Custom prompt for AdobeStock with stronger emphasis on minimum word requirements
        promptText = `Generate metadata for this image for AdobeStock platform. Return ONLY a JSON object with the exact keys: 'title', 'description', and 'keywords' (as an array of strings). 
        
${titleInstruction}. IMPORTANT: The title MUST be at least 12 words WITHOUT any special characters or symbols.

${descriptionInstruction}. IMPORTANT: The description MUST be at least 12 words and should be comprehensive and rich in detail.

IMPORTANT: Keywords field MUST include EXACTLY ${options.minKeywords} to ${options.maxKeywords} UNIQUE and relevant tags for the image. The keywords should be specific, detailed, and varied to describe all aspects of the image. DO NOT repeat any keywords.

${platformInstruction} 

DO NOT include any explanations or text outside of the JSON object. FORMAT MUST BE A VALID JSON OBJECT with all three fields populated.`;
      } else if (isShutterstock) {
        // Custom prompt for Shutterstock
        promptText = `Generate metadata for this image for Shutterstock platform. Return ONLY a JSON object with the exact keys: 'description' and 'keywords' (as an array of strings).

The description should be short and simple, between 8-15 words WITHOUT any special characters or symbols.

Keywords field MUST include EXACTLY ${options.minKeywords} to ${options.maxKeywords} UNIQUE and relevant tags for the image. The keywords should be specific, detailed, and varied to describe all aspects of the image. DO NOT repeat any keywords.

DO NOT include any explanations or text outside of the JSON object. FORMAT MUST BE A VALID JSON OBJECT with both fields populated.`;
      } else {
        // Standard prompt for other platforms
        promptText = `Generate metadata for this image. Return ONLY a JSON object with the exact keys: 'title', 'description', and 'keywords' (as an array of strings). ${titleInstruction}. ${descriptionInstruction}. Keywords should be UNIQUE relevant tags for the image, with ${keywordInstruction}. ${platformInstruction} DO NOT include any explanations or text outside of the JSON object.`;
      }
      
      if (isSvgFile) {
        // Add special instruction for SVG files to help the model
        promptText += `\n\nThis is an SVG vector file. Please generate appropriate metadata for vector graphics, focusing on design elements, illustration style, geometric shapes, and potential use cases.`;
      }
    } else {
      // Image to Prompt mode
      promptText = `Analyze this image and create a detailed text prompt that could be used to generate a similar image with an AI image generator. The prompt should be descriptive and capture the key elements, style, composition, colors, lighting, mood of the image. Return ONLY the prompt text without any JSON formatting or explanations. The prompt should be at least 100 words and highly descriptive.`;
      
      if (isSvgFile) {
        // Add special instruction for SVG files
        promptText += `\nThis is an SVG vector file. Focus on describing the vector elements, shapes, illustration style, and potential use cases.`;
      }
    }
    
    // Updated API endpoint to use gemini-1.5-flash model
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptText,
                },
                {
                  inline_data: {
                    mime_type: file.type,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          // Add temperature parameter to encourage more diverse outputs
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    // For SVG files specifically, if we get an error, try to generate basic metadata
    if (!response.ok && isSvgFile) {
      console.warn("SVG processing failed with API, using fallback metadata generation");
      
      // Create basic metadata for the SVG file based on filename
      const filename = file.name;
      const fileNameWithoutExt = filename.replace(/\.svg$/i, '');
      const words = fileNameWithoutExt.split(/[-_\s]/).filter(word => word.length > 0);
      
      // Generate a basic title from the filename without symbols
      const title = removeSymbols(words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + " Vector Graphic");
      
      // Generate basic description
      const description = `${title}. Scalable vector graphic suitable for print and digital media.`;
      
      // Generate basic keywords for SVG
      const svgKeywords = [
        "vector", "svg", "scalable", "graphic", "illustration", "design element",
        ...words, "digital art", "printable", "resizable", "high quality",
        "vector graphic", "line art", "clip art", "icon", "symbol", "logo element",
        "web design", "digital design", "print design", "creative asset"
      ];
      
      // Ensure we have the right number of unique keywords
      const finalKeywords = getUniqueKeywords(svgKeywords, options.maxKeywords);
      
      // Generate categories based on the platform
      let categories: string[] = [];
      if (isShutterstock) {
        categories = suggestCategoriesForShutterstock(title, description);
      } else if (isAdobeStock) {
        categories = suggestCategoriesForAdobeStock(title, finalKeywords);
      }
      
      return {
        filename: file.name,
        title: title,
        description: description,
        keywords: finalKeywords,
        ...(isShutterstock || isAdobeStock ? { categories } : {})
      };
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid API response format");
    }

    const resultText = data.candidates[0].content.parts[0].text;
    
    if (options.generationMode === 'metadata') {
      // Extract the JSON object from the text
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }
      
      const jsonStr = jsonMatch[0];
      let metadata;
      
      try {
        metadata = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Failed to parse JSON response");
      }

      if (isFreepikOnly) {
        // For Freepik, ensure all required fields are present and remove symbols from title
        const title = metadata.title ? removeSymbols(metadata.title) : "Colorful Digital Illustration";
        
        // Process keywords - ensure they're unique
        let keywords = Array.isArray(metadata.keywords) ? metadata.keywords : [];
        
        // Get unique keywords that respect min/max range
        keywords = getUniqueKeywords(keywords, options.maxKeywords);
        
        // Add fallback keywords if needed
        if (keywords.length < options.minKeywords) {
          console.warn(`API returned only ${keywords.length} unique keywords, adding fallback keywords`);
          
          // Add some generic fallback keywords based on the file type and content
          const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
          
          // Create additional fallback keywords related to the image content
          const imageSpecificKeywords = [
            "cat", "kitten", "pet", "animal", "cute", "adorable", 
            "cartoon", "illustration", "character", "mascot", "feline",
            "calico", "tricolor", "domestic", "furry", "fluffy", 
            "smiling", "happy", "friendly", "playful", "charming",
            "colorful", "vector art", "digital drawing", "cat illustration",
            "pet portrait", "animal character", "cat cartoon", "kawaii",
            "children illustration", "cat face", "kitty", "animal face",
            "cat lover", "pet drawing"
          ];
          
          // Add generic stock image keywords as last resort
          const genericKeywords = [
            "digital image", "stock photo", "illustration", 
            fileExtension, "design element", "vector", "creative", 
            "artwork", "visual", "graphic design", "content", 
            "photo", "picture", "media", "digital", "web", 
            "print", "commercial", "marketing", "visual content",
            "professional", "high quality", "detailed", "modern",
            "contemporary", "trendy", "popular", "design", "art",
            "visual asset", "stock image", "resource", "element",
            "creative asset", "downloadable", "premium", "collection"
          ];
          
          // First try to add image-specific keywords
          while (keywords.length < options.minKeywords && imageSpecificKeywords.length > 0) {
            const nextKeyword = imageSpecificKeywords.shift();
            if (nextKeyword && !keywords.includes(nextKeyword)) {
              keywords.push(nextKeyword);
            }
          }
          
          // If still needed, add generic keywords
          while (keywords.length < options.minKeywords && genericKeywords.length > 0) {
            const nextKeyword = genericKeywords.shift();
            if (nextKeyword && !keywords.includes(nextKeyword)) {
              keywords.push(nextKeyword);
            }
          }
        }
        
        // Ensure prompt is a single sentence for Freepik and doesn't have symbols
        let prompt = metadata.prompt || "Detailed image showing visual content.";
        
        // If prompt is too long, truncate it
        if (prompt.includes('.')) {
          const firstSentence = prompt.split('.')[0] + '.';
          prompt = firstSentence;
        }
        
        const baseModel = "leonardo"; // Always use "leonardo" for Freepik
        
        return {
          filename: file.name,
          title: title,
          description: "", // Empty for Freepik
          keywords: keywords,
          prompt: prompt,
          baseModel: baseModel,
        };
      } else if (isShutterstock) {
        // For Shutterstock format - remove symbols from description
        const description = metadata.description ? removeSymbols(metadata.description) : "Simple image for commercial use";
        
        // Ensure we have unique keywords
        let keywords = Array.isArray(metadata.keywords) ? metadata.keywords : [];
        keywords = getUniqueKeywords(keywords, options.maxKeywords);
        
        // Add fallback keywords if needed
        if (keywords.length < options.minKeywords) {
          const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
          
          // First try image-specific keywords
          const imageSpecificKeywords = [
            "cat", "kitten", "pet", "animal", "cute", "adorable", 
            "cartoon", "illustration", "character", "mascot", "feline",
            "calico", "tricolor", "domestic", "furry", "fluffy", 
            "smiling", "happy", "friendly", "playful", "charming",
            "colorful", "vector art", "digital drawing", "cat illustration",
            "pet portrait", "animal character", "cat cartoon", "kawaii",
            "children illustration", "cat face", "kitty", "animal face",
            "cat lover", "pet drawing"
          ];
          
          // Then try generic keywords
          const fallbackKeywords = [
            "shutterstock", "digital image", "stock photo", "illustration", 
            fileExtension, "design element", "vector", "creative", 
            "artwork", "visual", "graphic design", "content", 
            "photo", "picture", "media", "digital", "web", 
            "print", "commercial", "marketing", "visual content",
            "professional", "high quality", "detailed", "modern",
            "contemporary", "trendy", "popular", "design", "art",
            "visual asset", "stock image", "resource", "element",
            "creative asset", "downloadable", "premium", "collection"
          ];
          
          // First try image-specific keywords
          while (keywords.length < options.minKeywords && imageSpecificKeywords.length > 0) {
            const nextKeyword = imageSpecificKeywords.shift();
            if (nextKeyword && !keywords.includes(nextKeyword)) {
              keywords.push(nextKeyword);
            }
          }
          
          // If still needed, add generic fallback keywords
          while (keywords.length < options.minKeywords && fallbackKeywords.length > 0) {
            const nextKeyword = fallbackKeywords.shift();
            if (nextKeyword && !keywords.includes(nextKeyword)) {
              keywords.push(nextKeyword);
            }
          }
        }
        
        // Generate title (needed for category suggestion but not included in output)
        const title = metadata.title ? removeSymbols(metadata.title) : "Detailed stock image";
        
        // Suggest categories based on the title and description
        const categories = suggestCategoriesForShutterstock(title, description);
        
        return {
          filename: file.name,
          title: title,
          description: description,
          keywords: keywords,
          categories: categories
        };
      } else if (isAdobeStock) {
        // Validate the description length (at least the minimum words)
        let description = metadata.description || "";
        const descriptionWordCount = description.split(/\s+/).filter(Boolean).length;
        
        // Clean title and ensure it has no symbols
        let title = metadata.title ? removeSymbols(metadata.title) : "";
        const titleWordCount = title.split(/\s+/).filter(Boolean).length;
        
        // For AdobeStock, enforce minimum word counts
        if (descriptionWordCount < 12) {
          console.warn(`Description is too short (${descriptionWordCount} words), extending it...`);
          description += " This high-quality image is perfect for various creative and commercial projects.";
        }
        
        if (titleWordCount < 12) {
          console.warn(`Title is too short (${titleWordCount} words), extending it...`);
          title += " High Quality Professional Stock Image For Creative Commercial Projects And Designs";
        }
        
        // Fix for AdobeStock: Add fallback keywords if they're missing or empty and ensure uniqueness
        let keywords = Array.isArray(metadata.keywords) ? metadata.keywords : [];
        keywords = getUniqueKeywords(keywords, options.maxKeywords);
        
        // If keywords are missing or empty, generate fallback keywords based on the image
        if (keywords.length < options.minKeywords) {
          console.warn("Not enough unique keywords returned for AdobeStock, generating more keywords");
          
          // First try image-specific keywords
          const imageSpecificKeywords = [
            "cat", "kitten", "pet", "animal", "cute", "adorable", 
            "cartoon", "illustration", "character", "mascot", "feline",
            "calico", "tricolor", "domestic", "furry", "fluffy", 
            "smiling", "happy", "friendly", "playful", "charming",
            "colorful", "vector art", "digital drawing", "cat illustration",
            "pet portrait", "animal character", "cat cartoon", "kawaii",
            "children illustration", "cat face", "kitty", "animal face",
            "cat lover", "pet drawing", "stock image", "commercial use"
          ];
          
          // Then try generic keywords
          const genericKeywords = [
            "illustration", "cartoon", "vector", "drawing", "character", "children", 
            "kids", "colorful", "cheerful", "fun", "happy", "joy", "childhood", 
            "design", "digital", "decoration", "commercial", "download", "licensed",
            "stock", "adobe", "creative", "project", "graphic", "marketing",
            "advertising", "brand", "corporate", "business", "website", "app",
            "presentation", "background", "backdrop", "print", "publishing",
            "license", "royalty free", "stock asset", "digital asset"
          ];
          
          // First try to add the image-specific keywords
          while (keywords.length < options.minKeywords && imageSpecificKeywords.length > 0) {
            const nextKeyword = imageSpecificKeywords.shift();
            if (nextKeyword && !keywords.includes(nextKeyword)) {
              keywords.push(nextKeyword);
            }
          }
          
          // If we still don't have enough, add generic stock image keywords
          while (keywords.length < options.minKeywords && genericKeywords.length > 0) {
            const nextKeyword = genericKeywords.shift();
            if (nextKeyword && !keywords.includes(nextKeyword)) {
              keywords.push(nextKeyword);
            }
          }
        }
        
        // Generate a single category for AdobeStock based on title and keywords
        const categories = suggestCategoriesForAdobeStock(title, keywords);
        
        return {
          filename: file.name,
          title: title,
          description: description,
          keywords: keywords,
          categories: categories
        };
      } else {
        // For other platforms - remove symbols from title and description
        const title = metadata.title ? removeSymbols(metadata.title) : "";
        let description = metadata.description || "";
        
        // Ensure we have unique keywords
        let keywords = Array.isArray(metadata.keywords) ? metadata.keywords : [];
        keywords = getUniqueKeywords(keywords, options.maxKeywords);
        
        const descriptionWordCount = description.split(/\s+/).filter(Boolean).length;
        if (descriptionWordCount < options.minDescriptionWords) {
          console.warn(`Description is too short (${descriptionWordCount} words), extending it...`);
          description += " This high-quality image is perfect for various creative and commercial projects.";
        }
        
        return {
          filename: file.name,
          title: title,
          description: description,
          keywords: keywords,
        };
      }
    } else {
      // For image to prompt mode, return the result in the description field
      return {
        filename: file.name,
        title: "Generated Prompt",
        description: resultText.trim(),
        keywords: [],
      };
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    
    // Check if this is an SVG file - if so, provide fallback metadata
    if (file.type === 'image/svg+xml') {
      console.log("Providing fallback metadata for SVG file");
      
      // Extract filename components for metadata
      const filename = file.name;
      const fileNameWithoutExt = filename.replace(/\.svg$/i, '');
      const words = fileNameWithoutExt.split(/[-_\s]/).filter(word => word.length > 0);
      
      // Generate a basic title from the filename without symbols
      const title = removeSymbols(words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + " Vector Graphic");
      
      // Generate basic description
      const description = `${title}. Scalable vector graphic suitable for print and digital media.`;
      
      // Generate basic keywords for SVG
      const svgKeywords = [
        "vector", "svg", "scalable", "graphic", "illustration", "design element",
        ...words, "digital art", "printable", "resizable", "high quality",
        "vector graphic", "line art", "clip art", "icon", "symbol", "logo element",
        "web design", "digital design", "print design", "creative asset"
      ];
      
      // Trim to requested keyword count and ensure uniqueness
      const finalKeywords = getUniqueKeywords(svgKeywords, options.maxKeywords);
      
      // Generate categories based on the platform
      const isShutterstock = options.platforms.length === 1 && options.platforms[0] === 'Shutterstock';
      const isAdobeStock = options.platforms.length === 1 && options.platforms[0] === 'AdobeStock';
      let categories: string[] = [];
      
      if (isShutterstock) {
        categories = suggestCategoriesForShutterstock(title, description);
      } else if (isAdobeStock) {
        categories = suggestCategoriesForAdobeStock(title, finalKeywords);
      }
      
      return {
        filename: file.name,
        title: title,
        description: description,
        keywords: finalKeywords,
        ...(isShutterstock || isAdobeStock ? { categories } : {})
      };
    }
    
    toast.error(`Error analyzing image: ${error instanceof Error ? error.message : "Unknown error"}`);
    
    return {
      filename: file.name,
      title: "",
      description: "",
      keywords: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
