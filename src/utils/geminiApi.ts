import { toast } from "sonner";
import type { Platform } from "@/components/PlatformSelector";
import type { GenerationMode } from "@/components/GenerationModeSelector";

interface MetadataResult {
  filename: string;
  title: string;
  description: string;
  keywords: string[];
  prompt?: string;
  baseModel?: string;
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
    const base64Image = await fileToBase64(file);
    
    // Remove the data URL prefix for the API request
    const base64Data = base64Image.split(",")[1];
    
    let promptText = "";
    
    // Check if only Freepik is selected
    const isFreepikOnly = options.platforms.length === 1 && options.platforms[0] === 'Freepik';
    
    if (options.generationMode === 'metadata') {
      const keywordInstruction = `between ${options.minKeywords}-${options.maxKeywords} keywords`;
      
      const titleInstruction = `The title should be between ${options.minTitleWords}-${options.maxTitleWords} words`;
      const descriptionInstruction = `The description should be between ${options.minDescriptionWords}-${options.maxDescriptionWords} words, minimum ${options.minDescriptionWords} words`;
      
      let platformInstruction = "";
      if (options.platforms && options.platforms.length > 0) {
        // Updated to handle multiple platforms
        const platformsList = options.platforms.join(', ');
        platformInstruction = `Optimize the metadata specifically for ${platformsList} platform requirements and best practices.`;
      }

      if (isFreepikOnly) {
        // Updated prompt for Freepik - Explicitly mentioning the keyword limit
        promptText = `Generate metadata for this image for Freepik platform. Return ONLY a JSON object with the exact keys: 'title', 'keywords', 'prompt', and 'baseModel'.

${titleInstruction}. 

Keywords MUST include ${options.minKeywords} to ${options.maxKeywords} relevant tags for the image - DO NOT exceed ${options.maxKeywords} keywords. The keywords should be specific, detailed, and varied to describe all aspects of the image.

The prompt field should be a short, one-sentence description of the image. Keep it concise but descriptive, under 20 words.

The baseModel value MUST be exactly "leonardo" (without quotes).

Even if you have difficulty analyzing the image, you MUST generate at least ${options.minKeywords} keywords based on what you can see, but no more than ${options.maxKeywords}.

DO NOT include any explanations or text outside of the JSON object. The response must be a valid JSON object with ALL fields populated.`;
      } else {
        // Standard prompt for other platforms
        promptText = `Generate metadata for this image. Return ONLY a JSON object with the exact keys: 'title', 'description', and 'keywords' (as an array of strings). ${titleInstruction}. ${descriptionInstruction}. Keywords should be relevant tags for the image, with ${keywordInstruction}. ${platformInstruction} DO NOT include any explanations or text outside of the JSON object.`;
      }
    } else {
      // Image to Prompt mode
      promptText = `Analyze this image and create a detailed text prompt that could be used to generate a similar image with an AI image generator. The prompt should be descriptive and capture the key elements, style, composition, colors, lighting, mood of the image. Return ONLY the prompt text without any JSON formatting or explanations. The prompt should be at least 100 words and highly descriptive.`;
    }
    
    // Updated API endpoint to use gemini-1.5-flash model instead of the deprecated gemini-pro-vision
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
        // For Freepik, ensure all required fields are present
        const title = metadata.title || "";
        // Fallback for keywords - ensure we have at least some keywords even if the API failed
        let keywords = Array.isArray(metadata.keywords) ? metadata.keywords : [];
        
        // Ensure keywords respect the min/max range set in options
        if (keywords.length > options.maxKeywords) {
          console.warn(`API returned ${keywords.length} keywords, trimming to maximum ${options.maxKeywords}`);
          keywords = keywords.slice(0, options.maxKeywords);
        }
        
        // If we have no keywords or fewer than minimum, generate some basic ones
        if (keywords.length < options.minKeywords) {
          console.warn(`API returned only ${keywords.length} keywords, adding fallback keywords`);
          
          // Add some generic fallback keywords based on the file type
          const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
          
          const fallbackKeywords = [
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
          
          // Add generic keywords until we reach the minimum
          while (keywords.length < options.minKeywords && fallbackKeywords.length > 0) {
            const nextKeyword = fallbackKeywords.shift();
            if (nextKeyword && !keywords.includes(nextKeyword)) {
              keywords.push(nextKeyword);
            }
          }
        }
        
        // Ensure prompt is a single sentence for Freepik
        let prompt = metadata.prompt || "Detailed image showing visual content.";
        
        // If prompt is too long, truncate it or use only the first sentence
        if (prompt.includes('.')) {
          const firstSentence = prompt.split('.')[0] + '.';
          prompt = firstSentence;
        }
        
        const baseModel = "leonardo"; // Always use "leonardo" for Freepik
        
        // Ensure we have all required fields for Freepik
        if (!title) {
          throw new Error("Title is missing from the API response");
        }
        
        return {
          filename: file.name,
          title: title,
          description: "", // Empty for Freepik
          keywords: keywords,
          prompt: prompt,
          baseModel: baseModel,
        };
      } else {
        // Validate the description length (at least the minimum words)
        let description = metadata.description || "";
        const wordCount = description.split(/\s+/).filter(Boolean).length;
        
        if (wordCount < options.minDescriptionWords) {
          throw new Error(`Description is too short. It has ${wordCount} words but needs at least ${options.minDescriptionWords} words.`);
        }
        
        return {
          filename: file.name,
          title: metadata.title || "",
          description: description,
          keywords: Array.isArray(metadata.keywords) ? metadata.keywords : [],
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
