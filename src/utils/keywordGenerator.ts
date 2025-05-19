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
  // Remove duplicates and limit to 50 keywords
  const uniqueWords = Array.from(new Set(filteredWords));
  return uniqueWords.slice(0, 50);
};

// Common words to exclude from keywords
const commonWords = [
  'the', 'and', 'for', 'with', 'this', 'that', 'are', 'from',
  'has', 'have', 'had', 'was', 'were', 'will', 'been', 'being',
  'can', 'could', 'may', 'might', 'must', 'should', 'would',
  'its', 'his', 'her', 'they', 'them', 'their', 'our', 'your',
  'not', 'but', 'than', 'then', 'when', 'how'
];
