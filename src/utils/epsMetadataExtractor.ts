/**
 * Utility for extracting metadata from EPS (Encapsulated PostScript) files
 * This is necessary because Gemini API doesn't support EPS format directly
 */

/**
 * Checks if a file is an EPS file
 */
export function isEpsFile(file: File): boolean {
  return (
    file.type === 'application/postscript' || 
    file.type === 'application/eps' || 
    file.type === 'application/x-eps' ||
    file.type === 'image/eps' ||
    file.name.toLowerCase().endsWith('.eps')
  );
}

/**
 * Represents metadata extracted from an EPS file
 */
export interface EpsMetadata {
  title?: string;
  creator?: string;
  creationDate?: string;
  boundingBox?: string;
  documentStructuringConventions?: Record<string, string>;
  isEps: boolean;
  filename: string;
  fileSize: number;
  extractedText: string;
}

/**
 * Extracts metadata from an EPS file
 * @param epsFile - The EPS file to extract metadata from
 * @returns A Promise that resolves to an EpsMetadata object
 */
export async function extractEpsMetadata(epsFile: File): Promise<EpsMetadata> {
  // Read the EPS file as text
  const epsText = await readEpsFileAsText(epsFile);
  
  // Initialize metadata object
  const metadata: EpsMetadata = {
    isEps: true,
    filename: epsFile.name,
    fileSize: epsFile.size,
    extractedText: epsText,
    documentStructuringConventions: {}
  };
  
  // Extract Document Structuring Conventions (DSC) comments
  const dscComments = extractDscComments(epsText);
  
  // Map specific DSC comments to metadata fields
  metadata.title = dscComments['Title'];
  metadata.creator = dscComments['Creator'] || dscComments['Author'];
  metadata.creationDate = dscComments['CreationDate'] || dscComments['ModDate'];
  metadata.boundingBox = dscComments['BoundingBox'];
  
  // Store all DSC comments in the metadata
  metadata.documentStructuringConventions = dscComments;
  
  return metadata;
}

/**
 * Helper function to read an EPS file as text
 */
function readEpsFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Extracts Document Structuring Conventions (DSC) comments from an EPS file
 * @param epsText - The EPS file content as text
 * @returns An object mapping DSC comment names to their values
 */
function extractDscComments(epsText: string): Record<string, string> {
  const dscComments: Record<string, string> = {};
  
  // Regular expression to match DSC comments
  // DSC comments start with %% followed by a keyword and optional value
  const dscRegex = /%%([\w]+)(?::\s*(.*))?$/gm;
  
  let match;
  while ((match = dscRegex.exec(epsText)) !== null) {
    const [, key, value] = match;
    if (key && value) {
      dscComments[key] = value.trim();
    } else if (key) {
      dscComments[key] = '';
    }
  }
  
  return dscComments;
}

/**
 * Serializes EPS metadata to a format suitable for the Gemini API
 * @param metadata - The EPS metadata to serialize
 * @returns A string representation of the metadata
 */
export function serializeEpsMetadata(metadata: EpsMetadata): string {
  // Create a formatted text representation instead of JSON
  const sections = [
    `EPS FILE METADATA`,
    `================`,
    ``,
    `Filename: ${metadata.filename}`,
    `File Size: ${Math.round(metadata.fileSize / 1024)} KB`,
    ``,
    `DOCUMENT PROPERTIES`,
    `------------------`,
    `Title: ${metadata.title || 'Unknown'}`,
    `Creator: ${metadata.creator || 'Unknown'}`,
    `Creation Date: ${metadata.creationDate || 'Unknown'}`,
    `Bounding Box: ${metadata.boundingBox || 'Unknown'}`,
    ``,
    `DOCUMENT CONTENT PREVIEW`,
    `----------------------`,
    metadata.extractedText.substring(0, 1000) + (metadata.extractedText.length > 1000 ? '...' : ''),
    ``,
    `ADDITIONAL DSC COMMENTS`,
    `---------------------`
  ];
  
  // Add DSC comments (skip the ones we already used for basic metadata)
  const skipKeys = ['Title', 'Creator', 'Author', 'CreationDate', 'ModDate', 'BoundingBox'];
  Object.entries(metadata.documentStructuringConventions || {})
    .filter(([key]) => !skipKeys.includes(key))
    .forEach(([key, value]) => {
      sections.push(`${key}: ${value}`);
    });
  
  return sections.join('\n');
}

/**
 * Creates a synthetic image-like representation of EPS metadata
 * This allows us to use the existing image analysis workflow
 * @param metadata - The EPS metadata
 * @returns A File object containing the metadata as plain text
 */
export function createEpsMetadataRepresentation(metadata: EpsMetadata): File {
  // Serialize the metadata
  const serializedMetadata = serializeEpsMetadata(metadata);
  
  // Create a new File from the serialized metadata
  const metadataFile = new File(
    [serializedMetadata], 
    metadata.filename.replace(/\.eps$/i, '-metadata.txt'), 
    {
      type: 'text/plain',
      lastModified: Date.now()
    }
  );
  
  return metadataFile;
} 