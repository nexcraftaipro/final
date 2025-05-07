
/**
 * Removes symbols from a string
 */
export const removeSymbols = (text: string): string => {
  return text.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
};
