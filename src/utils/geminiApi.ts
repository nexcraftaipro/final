
import { toast } from "sonner";
import type { Platform } from "@/components/PlatformSelector";
import type { GenerationMode } from "@/components/GenerationModeSelector";

interface MetadataResult {
  filename: string;
  title: string;
  description: string;
  keywords: string[];
  error?: string;
}

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeImageWithGemini(
  file: File,
  apiKey: string,
  keywordCount: number = 25,
  titleLength: number = 10,
  descriptionLength: number = 15,
  platform: Platform | null = null,
  generationMode: GenerationMode = 'metadata'
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
    // Convert the image to base64
    const base64Image = await fileToBase64(file);
    
    // Remove the data URL prefix for the API request
    const base64Data = base64Image.split(",")[1];
    
    let promptText = "";
    
    if (generationMode === 'metadata') {
      const keywordInstruction = keywordCount === 1 
        ? "exactly 1 keyword" 
        : `between 1-${keywordCount} keywords`;
      
      const titleInstruction = `The title should be short and descriptive, maximum ${titleLength} words`;
      const descriptionInstruction = `The description should be ${descriptionLength <= 30 ? 'brief' : 'detailed'}, minimum ${descriptionLength} words`;
      
      let platformInstruction = "";
      if (platform) {
        platformInstruction = `Optimize the metadata specifically for ${platform} platform requirements and best practices.`;
      }
      
      promptText = `Generate metadata for this image. Return ONLY a JSON object with the exact keys: 'title', 'description', and 'keywords' (as an array of strings). ${titleInstruction}. ${descriptionInstruction}. Keywords should be relevant tags for the image, with ${keywordInstruction}. ${platformInstruction} DO NOT include any explanations or text outside of the JSON object.`;
    } else {
      // Image to Prompt mode
      promptText = `Analyze this image and create a detailed text prompt that could be used to generate a similar image with an AI image generator. The prompt should be descriptive and capture the key elements, style, composition, colors, and mood of the image. Return ONLY the prompt text without any JSON formatting or explanations.`;
    }
    
    // Add a delay of 2 seconds to respect API rate limits before making the request
    // This is essential when processing multiple images to avoid hitting Gemini's 15 RPM limit
    await delay(2000); 
    
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
    
    if (generationMode === 'metadata') {
      // Extract the JSON object from the text
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }
      
      const jsonStr = jsonMatch[0];
      const metadata = JSON.parse(jsonStr);

      // Validate the description length (at least 15 words)
      let description = metadata.description || "";
      const wordCount = description.split(/\s+/).filter(Boolean).length;
      
      if (wordCount < descriptionLength) {
        throw new Error(`Description is too short. It has ${wordCount} words but needs at least ${descriptionLength} words.`);
      }
      
      return {
        filename: file.name,
        title: metadata.title || "",
        description: description,
        keywords: Array.isArray(metadata.keywords) ? metadata.keywords : [],
      };
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
