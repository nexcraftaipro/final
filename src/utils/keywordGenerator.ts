/**
 * Generates relevant keywords for Freepik platform
 */
export const getRelevantFreepikKeywords = (content: string, singleWordOnly: boolean = false): string[] => {
  // Extract potential keywords from content
  const words = content.toLowerCase().split(/\s+/);
  
  // Filter out common words and short words
  let filteredWords = words.filter(word => {
    const cleaned = word.replace(/[^\w]/g, '');
    return cleaned.length > 2 && !commonWords.includes(cleaned);
  });
  
  // If singleWordOnly is true, filter to only single words
  if (singleWordOnly) {
    filteredWords = filteredWords.filter(word => !word.includes(' '));
  }

  // Generate n-grams (2-word phrases) for more keyword options
  let bigrams = [];
  if (!singleWordOnly) {
    for (let i = 0; i < words.length - 1; i++) {
      const word1 = words[i].replace(/[^\w]/g, '');
      const word2 = words[i + 1].replace(/[^\w]/g, '');
      
      if (word1.length > 2 && word2.length > 2 && 
          !commonWords.includes(word1) && !commonWords.includes(word2)) {
        bigrams.push(`${words[i]} ${words[i + 1]}`);
      }
    }
  }
  
  // Combine single words and phrases, removing duplicates
  const allKeywords = [...filteredWords, ...bigrams];
  const uniqueWords = Array.from(new Set(allKeywords));
  
  // Return more keywords than needed to ensure we have enough options
  return uniqueWords.slice(0, 100);
};

// List of common words to exclude from keywords
export const commonWords = [
  "the", "and", "that", "have", "for", "not", "with", "you", "this", "but",
  "his", "from", "they", "say", "her", "she", "will", "one", "all", "would",
  "there", "their", "what", "out", "about", "who", "get", "which", "when", "make",
  "can", "like", "time", "just", "him", "know", "take", "person", "into", "year",
  "your", "good", "some", "could", "them", "see", "other", "than", "then", "now",
  "look", "only", "come", "its", "over", "think", "also", "back", "after", "use",
  "two", "how", "our", "work", "first", "well", "way", "even", "new", "want",
  "because", "any", "these", "give", "day", "most", "are", "was", "has", "had",
  "does", "been", "before", "doing", "during", "each", "few", "form", "found", "from",
  "gave", "goes", "gone", "got", "more", "much", "must", "non", "off", "own",
  "onto", "such", "than", "that", "then", "they", "this", "thus", "too", "very",
  "want", "were", "what", "when", "with"
];
