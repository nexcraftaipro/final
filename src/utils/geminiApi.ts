
import { toast } from "sonner";

interface MetadataResult {
  filename: string;
  title: string;
  description: string;
  keywords: string[];
  error?: string;
}

export async function analyzeImageWithGemini(
  file: File,
  apiKey: string
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
                  text: "Generate metadata for this image. Return ONLY a JSON object with the exact keys: 'title', 'description', and 'keywords' (as an array of strings). The title should be short and descriptive. The description should be 1-2 sentences. Keywords should be relevant tags for the image, with 1-50 keywords. DO NOT include any explanations or text outside of the JSON object.",
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
    
    // Extract the JSON object from the text
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }
    
    const jsonStr = jsonMatch[0];
    const metadata = JSON.parse(jsonStr);
    
    return {
      filename: file.name,
      title: metadata.title || "",
      description: metadata.description || "",
      keywords: Array.isArray(metadata.keywords) ? metadata.keywords : [],
    };
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
