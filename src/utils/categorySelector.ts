
// Utility to determine the most appropriate video category based on content analysis

export interface VideoCategory {
  id: number;
  name: string;
}

export const videoCategories: VideoCategory[] = [
  { id: 1, name: "Animals" },
  { id: 2, name: "Buildings and Architecture" },
  { id: 3, name: "Business" },
  { id: 4, name: "Drinks" },
  { id: 5, name: "The Environment" },
  { id: 6, name: "States of Mind" },
  { id: 7, name: "Food" },
  { id: 8, name: "Graphic Resources" },
  { id: 9, name: "Hobbies and Leisure" },
  { id: 10, name: "Industry" },
  { id: 11, name: "Landscapes" },
  { id: 12, name: "Lifestyle" },
  { id: 13, name: "People" },
  { id: 14, name: "Plants and Flowers" },
  { id: 15, name: "Culture and Religion" },
  { id: 16, name: "Science" },
  { id: 17, name: "Social Issues" },
  { id: 18, name: "Sports" },
  { id: 19, name: "Technology" },
  { id: 20, name: "Transport" },
  { id: 21, name: "Travel" }
];

// Category keywords mapping for content analysis
const categoryKeywords: Record<number, string[]> = {
  1: ["animal", "wildlife", "pet", "zoo", "dog", "cat", "bird", "fish", "fauna"],
  2: ["building", "architecture", "structure", "house", "apartment", "skyscraper", "office", "construction"],
  3: ["business", "office", "corporate", "meeting", "professional", "commerce", "management", "executive"],
  4: ["drink", "beverage", "coffee", "tea", "juice", "water", "cocktail", "wine", "beer", "alcohol"],
  5: ["environment", "nature", "ecosystem", "conservation", "planet", "earth", "green", "sustainable"],
  6: ["mind", "emotion", "feeling", "mental", "psychology", "mood", "thought", "dream", "meditation"],
  7: ["food", "meal", "dish", "cuisine", "cooking", "restaurant", "recipe", "ingredient", "culinary"],
  8: ["graphic", "design", "illustration", "vector", "template", "pattern", "texture", "abstract"],
  9: ["hobby", "leisure", "entertainment", "recreation", "pastime", "game", "fun", "activity"],
  10: ["industry", "factory", "manufacturing", "production", "industrial", "machinery", "assembly"],
  11: ["landscape", "scenery", "vista", "panorama", "horizon", "outdoor", "mountain", "valley"],
  12: ["lifestyle", "living", "daily", "routine", "wellness", "health", "habit", "fashion"],
  13: ["people", "person", "human", "individual", "crowd", "group", "portrait", "face"],
  14: ["plant", "flower", "tree", "garden", "botanical", "floral", "leaf", "bloom", "vegetation"],
  15: ["culture", "religion", "tradition", "belief", "ritual", "ceremony", "heritage", "worship"],
  16: ["science", "research", "laboratory", "experiment", "academic", "study", "discovery", "scientific"],
  17: ["social", "issue", "problem", "cause", "awareness", "inequality", "justice", "activism"],
  18: ["sport", "athlete", "game", "competition", "team", "fitness", "exercise", "training"],
  19: ["technology", "digital", "electronic", "computer", "device", "gadget", "innovation", "tech"],
  20: ["transport", "vehicle", "car", "train", "plane", "bus", "bicycle", "boat", "travel"],
  21: ["travel", "tourism", "vacation", "destination", "trip", "journey", "explore", "tourist"]
};

/**
 * Determine the most appropriate video category based on content analysis
 * @param title The video title
 * @param description The video description (if available)
 * @param keywords The video keywords
 * @returns The category ID (1-21)
 */
export function determineVideoCategory(title: string = '', description: string = '', keywords: string[] = []): number {
  // Default to "Industry" (10) if we can't determine a category
  const defaultCategory = 10;
  
  if (!title && keywords.length === 0) return defaultCategory;
  
  // Combine all text for analysis
  const allContent = `${title.toLowerCase()} ${description.toLowerCase()} ${keywords.join(' ').toLowerCase()}`;
  
  // Score each category based on keyword matches
  const categoryScores: Record<number, number> = {};
  
  // Initialize scores for all categories
  videoCategories.forEach(category => {
    categoryScores[category.id] = 0;
  });
  
  // Calculate scores
  Object.entries(categoryKeywords).forEach(([categoryId, keywords]) => {
    const id = parseInt(categoryId);
    keywords.forEach(keyword => {
      // Count occurrences of the keyword
      const regex = new RegExp(keyword, 'gi');
      const matches = allContent.match(regex);
      if (matches) {
        categoryScores[id] += matches.length;
      }
    });
  });
  
  // Find category with highest score
  let bestCategory = defaultCategory;
  let highestScore = 0;
  
  Object.entries(categoryScores).forEach(([categoryId, score]) => {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = parseInt(categoryId);
    }
  });
  
  return bestCategory;
}

/**
 * Get category name by its ID
 * @param id The category ID
 * @returns The category name
 */
export function getCategoryNameById(id: number): string {
  const category = videoCategories.find(cat => cat.id === id);
  return category ? category.name : "Industry"; // Default to "Industry" if not found
}
