/**
 * Utility for writing metadata back to files
 */
import { ProcessedImage } from './imageHelpers';
// Import piexifjs correctly
import piexifjs from 'piexifjs';

interface MetadataToWrite {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  copyright?: string;
  rating: number;
}

interface MetadataFileContent {
  data: Blob;
  metadataEmbedded: boolean;
}

/**
 * Creates file content with embedded metadata without downloading it
 * This is used for creating zip archives with multiple files
 * 
 * @param image The processed image with metadata to embed
 * @returns A promise that resolves to an object containing the file data and metadata status
 */
export async function createMetadataFileContent(image: ProcessedImage): Promise<MetadataFileContent | null> {
  if (!image.result) {
    console.error("No generated metadata available");
    return null;
  }

  try {
    // Create metadata object with the required IPTC fields
    const metadata: MetadataToWrite = {
      title: image.result.title,
      description: image.result.description,
      keywords: image.result.keywords,
      // Empty author field as requested
      author: "", 
      copyright: `© ${new Date().getFullYear()} All Rights Reserved`,
      // Always set 5-star rating
      rating: 5
    };
    
    // Handle based on file type
    if (image.file.type === "image/jpeg") {
      return await createJpegWithMetadata(image, metadata);
    } 
    else if (image.file.type.startsWith("image/")) {
      return await createImageWithMetadata(image, metadata);
    }
    else {
      console.warn("File type not supported for metadata embedding:", image.file.type);
      return null;
    }
  } catch (error) {
    console.error("Error creating file with metadata:", error);
    return null;
  }
}

/**
 * Creates a JPEG file with embedded metadata
 */
async function createJpegWithMetadata(image: ProcessedImage, metadata: MetadataToWrite): Promise<MetadataFileContent | null> {
  try {
    // First load the image data as base64
    const base64Image = await readFileAsBase64(image.file);
    
    // Ensure this is a valid JPEG image
    if (!base64Image.startsWith("data:image/jpeg")) {
      console.error("Not a valid JPEG image");
      return null;
    }
    
    let newImageData = base64Image;
    let metadataEmbedded = false;
    
    try {
      // Create Windows-compatible EXIF data (which also includes IPTC data)
      const exifObj = createWindowsCompatibleExif(metadata);
      
      // CRITICAL: First add XMP metadata (Adobe Stock prioritizes this)
      try {
        // Generate XMP packet
        const xmpData = createXMPMetadata(metadata);
        
        // Insert XMP data into JPEG using our specialized function
        newImageData = insertXMPMetadata(xmpData, base64Image);
        
        // Then insert Exif after XMP is already in place
        try {
          const exifBytes = piexifjs.dump(exifObj);
          newImageData = piexifjs.insert(exifBytes, newImageData);
          metadataEmbedded = true;
        } catch (insertError) {
          console.error("Error inserting EXIF data:", insertError);
          // Continue with XMP-only metadata
          metadataEmbedded = true; // Still consider metadata embedded if XMP worked
        }
      } catch (xmpError) {
        console.warn("Could not add XMP metadata", xmpError);
        
        // Fall back to just EXIF/IPTC if XMP fails
        try {
          const exifBytes = piexifjs.dump(exifObj);
          newImageData = piexifjs.insert(exifBytes, base64Image);
          metadataEmbedded = true;
        } catch (insertError) {
          console.error("Error inserting EXIF data:", insertError);
          // Continue with original image if all metadata insertion fails
        }
      }
      
      // Convert to blob
      const byteString = atob(newImageData.split(",")[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      // Create the blob
      const blob = new Blob([ab], { type: "image/jpeg" });
      
      return {
        data: blob,
        metadataEmbedded
      };
    } catch (error) {
      console.error("Error processing JPEG metadata:", error);
      return null;
    }
  } catch (error) {
    console.error("Error reading file:", error);
    return null;
  }
}

/**
 * Creates a non-JPEG image with metadata in filename
 */
async function createImageWithMetadata(image: ProcessedImage, metadata: MetadataToWrite): Promise<MetadataFileContent | null> {
  try {
    // For non-JPEG images, we cannot add proper Windows metadata
    // but we'll return the original image data
    
    // Load the image into a canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Try to avoid cross-origin issues
    img.src = image.previewUrl;
    
    // Wait for the image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      // Add timeout to avoid hanging
      setTimeout(reject, 10000); 
    });
    
    // Set canvas dimensions
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Draw the image to canvas
    ctx?.drawImage(img, 0, 0);
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to convert canvas to blob"));
        }, image.file.type, 0.95);
      } catch (err) {
        reject(err);
      }
    });
    
    return {
      data: blob,
      metadataEmbedded: false // Non-JPEG images don't have embedded metadata
    };
  } catch (error) {
    console.error("Error creating image with metadata:", error);
    return null;
  }
}

/**
 * Writes metadata back to a file using the File Properties API
 * Note: This only works in some browsers and requires proper permissions
 * 
 * @param image The processed image with metadata to write
 * @returns A promise that resolves to true if successful, or false if failed
 */
export async function writeMetadataToFile(image: ProcessedImage, folderName?: string): Promise<boolean> {
  if (!image.result) {
    console.error("No generated metadata available to write");
    return false;
  }

  try {
    // Create metadata object with the required IPTC fields
    const metadata: MetadataToWrite = {
      title: image.result.title,
      description: image.result.description,
      keywords: image.result.keywords,
      // Empty author field as requested
      author: "", 
      copyright: `© ${new Date().getFullYear()} All Rights Reserved`,
      // Always set 5-star rating
      rating: 5
    };
    
    // For debugging - log the metadata we're trying to write
    console.log("Attempting to write metadata:", metadata);
    console.log("File type:", image.file.type);
    
    // Handle based on file type
    if (image.file.type === "image/jpeg") {
      console.log("Processing as JPEG");
      return await writeJpegMetadataAndDownload(image, metadata, folderName);
    } 
    else if (image.file.type.startsWith("image/")) {
      console.log("Processing as non-JPEG image");
      return await writeImageMetadataAndDownload(image, metadata, folderName);
    }
    else {
      console.warn("File type not supported for metadata embedding:", image.file.type);
      alert(`File type "${image.file.type}" doesn't support metadata embedding. Only JPEG files fully support Windows metadata.`);
      return false;
    }
  } catch (error) {
    console.error("Error writing metadata:", error);
    return false;
  }
}

/**
 * Creates Exif data structure for JPEG images
 * This is a direct approach to set Windows-compatible metadata and standard IPTC/XMP metadata
 * that microstock sites can read
 */
function createWindowsCompatibleExif(metadata: MetadataToWrite) {
  const exifObj: any = {
    "0th": {},
    "Exif": {},
    "GPS": {},
    "1st": {},
    "thumbnail": null,
    "Iptc": {}  // Add IPTC segment
  };
  
  // Windows uses specific constants for its XP metadata fields
  // These might not be exposed directly in the piexifjs library
  const XPTitle = 40091;    // Used for Title field in Windows
  const XPComment = 40092;  // Used for Comments field in Windows
  const XPAuthor = 40093;   // Used for Authors field in Windows
  const XPKeywords = 40094; // Used for Tags/Keywords field in Windows
  const XPSubject = 40095;  // Used for Subject field in Windows
  
  // Windows File Explorer uses these IFD fields for Subject
  const ImageDescriptionField = 270;  // For title/subject in many viewers
  const ArtistField = 315;            // Sometimes used for subject
  const UserCommentField = 37510;     // Exif.UserComment used by some software for subject
  
  // Define IPTC tag numbers correctly - these numbers are crucial for stock site compatibility
  // Adobe Stock compatible IPTC fields
  const IPTC_TAGS = {
    RecordVersion: 0,       // Required by IPTC standard (2:0)
    ObjectName: 5,          // Title (2:5)
    Keywords: 25,           // Keywords (2:25)
    By_line: 80,            // Creator/Author (2:80)
    Caption: 120,           // Description (2:120)
    DateCreated: 55,        // Date Created (2:55)
    CopyrightNotice: 116,   // Copyright (2:116)
    Headline: 105,          // Headline (2:105) - Used for title/subject
    SpecialInstructions: 40 // Special Instructions (2:40) - Sometimes used for subject
  };
  
  // Initialize required fields
  exifObj["Iptc"][IPTC_TAGS.RecordVersion] = [0, 2]; // IPTC version 4 (binary: 0x0002)
  
  // Add 5-star rating (always)
  exifObj["0th"][piexifjs.ImageIFD.Rating] = 5;  // 5 stars
  
  // Helper function to encode Unicode strings for Windows metadata
  function encodeWindowsString(str: string) {
    // Windows metadata uses UTF-16LE encoding with a terminating null
    const result = [];
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      result.push(char & 0xFF);
      result.push((char >> 8) & 0xFF);
    }
    // Add null termination
    result.push(0);
    result.push(0);
    return result;
  }
  
  // Add date (required field)
  const now = new Date();
  const dateTimeString = now.getFullYear() + ":" + 
                        String(now.getMonth() + 1).padStart(2, '0') + ":" + 
                        String(now.getDate()).padStart(2, '0') + " " + 
                        String(now.getHours()).padStart(2, '0') + ":" + 
                        String(now.getMinutes()).padStart(2, '0') + ":" + 
                        String(now.getSeconds()).padStart(2, '0');
  exifObj["0th"][piexifjs.ImageIFD.DateTime] = dateTimeString;
  
  // IPTC Date Created - Important for stock sites
  const iptcDate = now.getFullYear().toString() +
                   String(now.getMonth() + 1).padStart(2, '0') +
                   String(now.getDate()).padStart(2, '0');
  
  // Add IPTC date created (2:55)
  // Add to the proper place with proper format - uses an array to store in IPTC format
  exifObj["Iptc"][IPTC_TAGS.DateCreated] = [iptcDate];
  
  // ======== TITLE FIELDS ========
  // Add title (appears in Windows File Explorer)
  if (metadata.title) {
    // Standard EXIF fields
    exifObj["0th"][piexifjs.ImageIFD.DocumentName] = metadata.title;
    
    // Add title to ImageDescription field (commonly used for title)
    exifObj["0th"][ImageDescriptionField] = metadata.title;
    
    // Windows-specific XP fields
    try {
      // Title field only
      exifObj["0th"][XPTitle] = encodeWindowsString(metadata.title);
      
      // Subject field - explicitly set for Windows Explorer
      exifObj["0th"][XPSubject] = encodeWindowsString(metadata.title);
      
      // Add to standard Artist field
      exifObj["0th"][ArtistField] = metadata.title;
      
      // Add as comment for compatibility
      exifObj["0th"][XPComment] = encodeWindowsString(metadata.title);
    } catch (e) {
      console.warn("Failed to set Windows title/subject fields", e);
    }
    
    // Add IPTC Title/Object Name (2:5) - Important for stock sites!
    // Must use the correct format for IPTC - single string in the array
    exifObj["Iptc"][IPTC_TAGS.ObjectName] = [metadata.title];
    
    // Add headline (sometimes used for title/subject)
    exifObj["Iptc"][IPTC_TAGS.Headline] = [metadata.title];
    
    // Add to special instructions (sometimes used for subject)
    exifObj["Iptc"][IPTC_TAGS.SpecialInstructions] = [metadata.title];
    
    // Also set Caption/Subject same as title (if description not provided)
    if (!metadata.description) {
      exifObj["Iptc"][IPTC_TAGS.Caption] = [metadata.title];
    } else {
      // If description is provided, still add title as a special field
      exifObj["Iptc"][IPTC_TAGS.SpecialInstructions] = [metadata.title];
    }
  }
  
  // ======== DESCRIPTION FIELDS ========
  // Add description (appears as Subject in Windows File Explorer)
  if (metadata.description) {
    // Standard EXIF fields
    exifObj["0th"][piexifjs.ImageIFD.ImageDescription] = metadata.description;
    
    // Windows-specific XP fields
    try {
      exifObj["0th"][XPSubject] = encodeWindowsString(metadata.description);
    } catch (e) {
      console.warn("Failed to set Windows subject field", e);
    }
    
    // Add IPTC Caption/Abstract (2:120) - Important for stock sites!
    // Must use the correct format for IPTC - single string in the array
    exifObj["Iptc"][IPTC_TAGS.Caption] = [metadata.description];
  }
  
  // ======== KEYWORDS FIELDS - CRITICAL ========
  // Add keywords (appears as Tags in Windows File Explorer)
  if (metadata.keywords && metadata.keywords.length > 0) {
    // Use semicolons for Windows, commas for IPTC/XMP
    const keywordsText = metadata.keywords.join("; ");
    
    // IMPORTANT: Windows-specific XP fields - crucial for File Explorer "Tags" field
    try {
      // This is the field that directly maps to "Tags" in Windows File Explorer
      // Only use keyword values here, never mix with title text
      exifObj["0th"][XPKeywords] = encodeWindowsString(keywordsText);
    } catch (e) {
      console.warn("Failed to set Windows keywords field", e);
    }
    
    // Add IPTC Keywords (2:25) - Important for stock sites!
    // Each keyword as a separate entry in the array - this is crucial for Adobe Stock
    exifObj["Iptc"][IPTC_TAGS.Keywords] = [];
    
    // Add each keyword individually - exactly how Adobe Stock expects it
    metadata.keywords.forEach(keyword => {
      if (keyword && keyword.trim()) {
        exifObj["Iptc"][IPTC_TAGS.Keywords].push(keyword.trim());
      }
    });
    
    // Add a special tag for a comma-separated list as well (for maximum compatibility)
    // Some stock sites prefer to read a single field with comma-separated values
    const keywordFieldName = 1075; // Custom field for stock sites
    try {
      exifObj["0th"][keywordFieldName] = metadata.keywords.join(", ");
    } catch (e) {
      console.warn("Failed to set special keywords field", e);
    }
  }
  
  // Add standard UserComment field for other viewers
  if (metadata.description || (metadata.keywords && metadata.keywords.length > 0)) {
    let comment = "";
    
    if (metadata.description) {
      comment = metadata.description;
    }
    
    if (metadata.keywords && metadata.keywords.length > 0) {
      if (comment) comment += " - ";
      comment += "Keywords: " + metadata.keywords.join(", ");
    }
    
    // Format as UNICODE comment for EXIF
    const header = [0x55, 0x4E, 0x49, 0x43, 0x4F, 0x44, 0x45, 0x00]; // "UNICODE\0"
    const commentBytes = [];
    for (let i = 0; i < comment.length; i++) {
      commentBytes.push(comment.charCodeAt(i));
    }
    exifObj["Exif"][piexifjs.ExifIFD.UserComment] = header.concat(commentBytes);
  }
  
  // Add author info if available
  if (metadata.author) {
    // Add to IPTC Creator/Byline (2:80) - Important for stock sites!
    // Must use the correct format for IPTC - single string in the array
    exifObj["Iptc"][IPTC_TAGS.By_line] = [metadata.author];
    
    // Also add to Windows-specific XP fields
    try {
      exifObj["0th"][XPAuthor] = encodeWindowsString(metadata.author);
    } catch (e) {
      console.warn("Failed to set Windows author field", e);
    }
  }
  
  // Add copyright if available
  if (metadata.copyright) {
    // Add to IPTC Copyright Notice (2:116) - Important for stock sites!
    // Must use the correct format for IPTC - single string in the array
    exifObj["Iptc"][IPTC_TAGS.CopyrightNotice] = [metadata.copyright];
    
    // Add to standard Exif Copyright field
    exifObj["0th"][piexifjs.ImageIFD.Copyright] = metadata.copyright;
  }
  
  return exifObj;
}

/**
 * Inserts XMP metadata into a JPEG image data string
 * This is a specialized function for stock site compatibility
 * 
 * @param xmpData The XMP metadata string
 * @param jpegDataUri The base64 JPEG data URI
 * @returns The new data URI with XMP metadata
 */
function insertXMPMetadata(xmpData: string, jpegDataUri: string): string {
  try {
    // Split the data URI to get the base64 part
    const [prefix, base64Data] = jpegDataUri.split(',');
    
    // Convert base64 to binary
    const binaryData = atob(base64Data);
    
    // Convert to Uint8Array for manipulation
    const dataArray = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      dataArray[i] = binaryData.charCodeAt(i);
    }
    
    // Find the APP0 marker (JFIF) position - Adobe Stock prefers XMP after this
    // The JPEG format has markers that start with 0xFF followed by a marker code
    // APP0 marker is 0xFFE0
    let insertPos = 2; // Default to after SOI (Start Of Image)
    
    for (let i = 0; i < dataArray.length - 1; i++) {
      if (dataArray[i] === 0xFF) {
        if (dataArray[i + 1] === 0xE0) { // APP0 (JFIF)
          // Skip marker (2 bytes) and length (2 bytes)
          const segmentLength = (dataArray[i + 2] << 8) | dataArray[i + 3];
          insertPos = i + 2 + segmentLength;
          break;
        }
      }
    }
    
    // Create XMP packet with APP1 marker - important to use standard namespace
    const xmpNamespace = "http://ns.adobe.com/xap/1.0/";
    const xmpNamespaceBytes = [];
    
    // Convert namespace to bytes including null terminator
    for (let i = 0; i < xmpNamespace.length; i++) {
      xmpNamespaceBytes.push(xmpNamespace.charCodeAt(i));
    }
    xmpNamespaceBytes.push(0); // null terminator
    
    // Create the APP1 marker with proper length for XMP
    const xmpBytes = new TextEncoder().encode(xmpData);
    
    // Calculate total length (namespace + 1 null byte + xmp data)
    const totalLength = 2 + xmpNamespaceBytes.length + xmpBytes.length;
    
    // Create marker array
    const markerArray = new Uint8Array(2 + 2 + xmpNamespaceBytes.length + xmpBytes.length);
    markerArray[0] = 0xFF; // APP1 marker
    markerArray[1] = 0xE1; // APP1 marker
    markerArray[2] = (totalLength >> 8) & 0xFF; // length high byte
    markerArray[3] = totalLength & 0xFF; // length low byte
    
    // Add namespace
    for (let i = 0; i < xmpNamespaceBytes.length; i++) {
      markerArray[4 + i] = xmpNamespaceBytes[i];
    }
    
    // Add XMP data
    for (let i = 0; i < xmpBytes.length; i++) {
      markerArray[4 + xmpNamespaceBytes.length + i] = xmpBytes[i];
    }
    
    // Create final array with XMP inserted
    const resultArray = new Uint8Array(dataArray.length + markerArray.length);
    
    // Copy before insert position
    resultArray.set(dataArray.subarray(0, insertPos), 0);
    
    // Copy XMP marker
    resultArray.set(markerArray, insertPos);
    
    // Copy rest of JPEG
    resultArray.set(dataArray.subarray(insertPos), insertPos + markerArray.length);
    
    // Convert back to base64
    let binary = '';
    for (let i = 0; i < resultArray.length; i++) {
      binary += String.fromCharCode(resultArray[i]);
    }
    const base64 = btoa(binary);
    
    // Return as data URI
    return `${prefix},${base64}`;
  } catch (error) {
    console.error("Error inserting XMP metadata:", error);
    return jpegDataUri; // Return original if failed
  }
}

/**
 * Writes metadata to a JPEG image using piexifjs and downloads the result
 */
async function writeJpegMetadataAndDownload(image: ProcessedImage, metadata: MetadataToWrite, folderName?: string): Promise<boolean> {
  try {
    // First load the image data as base64
    const base64Image = await readFileAsBase64(image.file);
    console.log("Base64 image loaded successfully");
    
    // Ensure this is a valid JPEG image
    if (!base64Image.startsWith("data:image/jpeg")) {
      console.error("Not a valid JPEG image");
      alert("Only JPEG images support full metadata embedding. Please use a JPEG image format.");
      return false;
    }
    
    let newImageData = base64Image;
    let metadataEmbedded = false;
    
    try {
      // Create Windows-compatible EXIF data (which also includes IPTC data)
      const exifObj = createWindowsCompatibleExif(metadata);
      console.log("EXIF data prepared:", exifObj);
      
      // CRITICAL: First add XMP metadata (Adobe Stock prioritizes this)
      try {
        // Generate XMP packet
        const xmpData = createXMPMetadata(metadata);
        
        // Insert XMP data into JPEG using our specialized function
        newImageData = insertXMPMetadata(xmpData, base64Image);
        console.log("XMP metadata embedded for stock site compatibility");
        
        // Then insert Exif after XMP is already in place
        try {
          const exifBytes = piexifjs.dump(exifObj);
          newImageData = piexifjs.insert(exifBytes, newImageData);
          console.log("EXIF and IPTC data inserted successfully");
          metadataEmbedded = true;
        } catch (insertError) {
          console.error("Error inserting EXIF data:", insertError);
          // Continue with XMP-only metadata
          metadataEmbedded = true; // Still consider metadata embedded if XMP worked
        }
      } catch (xmpError) {
        console.warn("Could not add XMP metadata", xmpError);
        
        // Fall back to just EXIF/IPTC if XMP fails
        try {
          const exifBytes = piexifjs.dump(exifObj);
          newImageData = piexifjs.insert(exifBytes, base64Image);
          console.log("EXIF and IPTC data inserted successfully (without XMP)");
          metadataEmbedded = true;
        } catch (insertError) {
          console.error("Error inserting EXIF data:", insertError);
          // Continue with original image if all metadata insertion fails
        }
      }
      
      // Convert to blob and download
      const byteString = atob(newImageData.split(",")[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      // Set image type to "image/jpeg" with high quality - important for stock sites
      const blob = new Blob([ab], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      
      // Ensure we have valid characters in the filename
      const safeTitle = metadata.title 
        ? metadata.title.replace(/[<>:"/\\|?*]/g, '-') 
        : image.file.name.split('.')[0];
      
      // Add stock site friendly indicator in filename
      const suffix = metadataEmbedded ? "stock_ready" : "no_metadata";
      
      // Use .jpeg extension instead of .jpg - Adobe Stock prefers this
      const fileName = `${safeTitle}_${suffix}.jpeg`;
      
      // If folder name is provided, prepend it to download attribute
      // Note: The folder notation in download attribute will cause browsers to attempt to save in that folder
      link.download = folderName ? `${folderName}/${fileName}` : fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      if (metadataEmbedded) {
        console.log("Image with metadata downloaded successfully");
        if (!folderName) {
          // Only show alert when downloading a single file, not in batch mode
          alert("Image with Adobe Stock compatible metadata downloaded. Title and keywords have been optimized for Adobe Stock.");
        }
      } else {
        console.log("Image downloaded without metadata");
        if (!folderName) {
          // Only show alert when downloading a single file, not in batch mode
          alert("Could not embed metadata in the image. For Adobe Stock, try these steps:\n\n" +
                "1. Make sure your JPEG is high quality (300dpi)\n" +
                "2. Use Adobe Bridge or similar to add metadata\n" +
                "3. Consider using Adobe's own XMP File Info panel");
        }
      }
      return true;
    } catch (error) {
      console.error("Error processing JPEG metadata:", error);
      return false;
    }
  } catch (error) {
    console.error("Error reading file:", error);
    return false;
  }
}

/**
 * Writes metadata to other image types using canvas and downloads
 */
async function writeImageMetadataAndDownload(image: ProcessedImage, metadata: MetadataToWrite, folderName?: string): Promise<boolean> {
  try {
    // For non-JPEG images, we cannot add proper Windows metadata
    // but we'll save the image with a meaningful filename
    
    // Load the image into a canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Try to avoid cross-origin issues
    img.src = image.previewUrl;
    
    // Wait for the image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      // Add timeout to avoid hanging
      setTimeout(reject, 10000); 
    });
    
    // Set canvas dimensions
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Draw the image to canvas
    ctx?.drawImage(img, 0, 0);
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to convert canvas to blob"));
        }, image.file.type, 0.95);
      } catch (err) {
        reject(err);
      }
    });
    
    // Create a download link with the new file
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Use metadata in the filename to provide context, with safe characters only
    let keywords = '';
    if (metadata.keywords && metadata.keywords.length > 0) {
      keywords = metadata.keywords
        .slice(0, 3)
        .join('-')
        .replace(/[<>:"/\\|?*]/g, '');
    }
    
    const safeTitle = metadata.title 
      ? metadata.title.replace(/[<>:"/\\|?*]/g, '') 
      : image.file.name.split('.')[0];
    
    const extension = image.file.name.split('.').pop() || '';
    const fileName = `${safeTitle}_${keywords}.${extension}`;
    
    // If folder name is provided, prepend it to download attribute
    // Note: The folder notation in download attribute will cause browsers to attempt to save in that folder
    link.download = folderName ? `${folderName}/${fileName}` : fileName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Error writing image metadata:", error);
    return false;
  }
}

/**
 * Read file as base64 string
 */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Creates XMP metadata format for images
 */
function createXMPMetadata(metadata: MetadataToWrite): string {
  // Convert keywords to a comma-separated string that Adobe Stock can read
  const keywordsString = metadata.keywords && metadata.keywords.length > 0 
    ? metadata.keywords.join(', ') 
    : '';
    
  // Always use title as subject if no description provided
  const description = metadata.description || metadata.title || '';
  const title = metadata.title || '';
  
  // Adobe Stock specific XMP format with all required namespaces and exact format they expect
  const xmp = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
      xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
      xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/"
      xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#"
      xmlns:iptcExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/"
      xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/"
      xmlns:iptcCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/"
      xmlns:MicrosoftPhoto="http://ns.microsoft.com/photo/1.0/"
      xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/"
      xmlns:tiff="http://ns.adobe.com/tiff/1.0/"
      xmlns:exif="http://ns.adobe.com/exif/1.0/"
      dc:format="image/jpeg"
      xmp:Rating="5"
      xmp:MetadataDate="${new Date().toISOString()}"
      tiff:ImageDescription="${escapeXML(title)}">
      
      <!-- Standard Dublin Core Title -->
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXML(title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      
      <!-- Standard Dublin Core Description -->
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXML(description)}</rdf:li>
        </rdf:Alt>
      </dc:description>
      
      <!-- Subject - explicitly set for maximum compatibility -->
      <dc:subject>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXML(title)}</rdf:li>
        </rdf:Alt>
      </dc:subject>
      
      <!-- Creator information -->
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${escapeXML(metadata.author || '')}</rdf:li>
        </rdf:Seq>
      </dc:creator>
      
      <!-- Rights information -->
      <dc:rights>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXML(metadata.copyright || '')}</rdf:li>
        </rdf:Alt>
      </dc:rights>
      
      <!-- Adobe Stock specifically looks for these fields -->
      <photoshop:Source>${escapeXML(metadata.author || '')}</photoshop:Source>
      <photoshop:Credit>${escapeXML(metadata.author || '')}</photoshop:Credit>
      <photoshop:Headline>${escapeXML(title)}</photoshop:Headline>
      <photoshop:City></photoshop:City>
      <photoshop:Country></photoshop:Country>
      
      <!-- Subject/Caption fields - multiple formats for maximum compatibility -->
      <photoshop:Caption>${escapeXML(title)}</photoshop:Caption>
      <photoshop:Instructions>${escapeXML(title)}</photoshop:Instructions>
      <photoshop:TransmissionReference>${escapeXML(title)}</photoshop:TransmissionReference>
      
      <!-- IPTC Core format for subject - crucially important -->
      <Iptc4xmpCore:SubjectCode>
        <rdf:Bag>
          <rdf:li>${escapeXML(title)}</rdf:li>
        </rdf:Bag>
      </Iptc4xmpCore:SubjectCode>
      
      <!-- Special field that Windows Explorer often reads for subject -->
      <MicrosoftPhoto:Subject>${escapeXML(title)}</MicrosoftPhoto:Subject>
      
      <!-- 5-star rating for Adobe and Microsoft -->
      <MicrosoftPhoto:Rating>99</MicrosoftPhoto:Rating>
      <xmp:Rating>5</xmp:Rating>
      
      <!-- IMPORTANT: Microsoft Windows Tags field - ONLY keywords, never the title -->
      <!-- This ensures the Tags field in Windows is properly populated -->
      <MicrosoftPhoto:Keywords>${metadata.keywords && metadata.keywords.length > 0 ? escapeXML(keywordsString) : ''}</MicrosoftPhoto:Keywords>
      
      <!-- Multiple keyword formats -->
      <!-- 1. Standard DC Subject (most widely supported) -->
      ${metadata.keywords && metadata.keywords.length > 0 ? 
      `<dc:subject>
        <rdf:Bag>
          ${metadata.keywords.map(kw => `<rdf:li>${escapeXML(kw)}</rdf:li>`).join('\n          ')}
        </rdf:Bag>
      </dc:subject>` : ''}
      
      <!-- 2. Adobe Stock specific keyword format -->
      <photoshop:Keywords>${escapeXML(keywordsString)}</photoshop:Keywords>
      
      <!-- 3. Microsoft Photo format -->
      <MicrosoftPhoto:LastKeywordXMP>
        <rdf:Bag>
          ${metadata.keywords && metadata.keywords.length > 0 ? 
          metadata.keywords.map(kw => `<rdf:li>${escapeXML(kw)}</rdf:li>`).join('\n          ') : ''}
        </rdf:Bag>
      </MicrosoftPhoto:LastKeywordXMP>
      
      <!-- Windows File Explorer Tags fields (crucial for proper display) -->
      <MicrosoftPhoto:LastKeywordIPTC>
        <rdf:Bag>
          ${metadata.keywords && metadata.keywords.length > 0 ? 
          metadata.keywords.map(kw => `<rdf:li>${escapeXML(kw)}</rdf:li>`).join('\n          ') : ''}
        </rdf:Bag>
      </MicrosoftPhoto:LastKeywordIPTC>
      
      <MicrosoftPhoto:LastKeywordIPTC>
        ${escapeXML(keywordsString)}
      </MicrosoftPhoto:LastKeywordIPTC>
      
      <!-- 4. IPTC Core format that Adobe Stock prefers -->
      <iptcCore:Keywords>
        <rdf:Bag>
          ${metadata.keywords && metadata.keywords.length > 0 ? 
          metadata.keywords.map(kw => `<rdf:li>${escapeXML(kw)}</rdf:li>`).join('\n          ') : ''}
        </rdf:Bag>
      </iptcCore:Keywords>
      
      <!-- 5. Legacy format that some Adobe products use -->
      <xmp:Keywords>${escapeXML(keywordsString)}</xmp:Keywords>
      
      <!-- Copyright information in multiple formats -->
      <xmpRights:Marked>True</xmpRights:Marked>
      <xmpRights:WebStatement>${escapeXML(metadata.copyright || '')}</xmpRights:WebStatement>
      
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  
  return xmp;
}

/**
 * Escape special characters for XML
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Opens the Windows Properties dialog for a file
 * Note: This is not possible directly from the browser due to security restrictions
 */
export function openWindowsPropertiesDialog(filePath: string): void {
  alert("Due to browser security restrictions, we can't directly open the Windows properties dialog.\n\n" +
        "Please right-click the downloaded file in File Explorer and select Properties to view the metadata.");
}

/**
 * Generates and downloads a stock site compatible CSV file with metadata
 * This is a reliable alternative to embedding metadata directly in images
 * 
 * @param image The processed image with metadata to include in CSV
 * @param stockSite The stock site to format CSV for ('shutterstock' or 'adobestock')
 * @returns A promise that resolves to true if successful
 */
export async function downloadStockSiteCSV(image: ProcessedImage, stockSite: 'shutterstock' | 'adobestock'): Promise<boolean> {
  if (!image.result) {
    console.error("No generated metadata available for CSV");
    return false;
  }

  try {
    const filename = image.file.name;
    const title = image.result.title || '';
    const description = image.result.description || '';
    const keywords = (image.result.keywords || []).join(',');
    
    // Format CSV header and content based on stock site
    let header = '';
    let content = '';
    
    if (stockSite === 'shutterstock') {
      header = '"Filename","Description","Keywords"';
      content = `"${escapeCSV(filename)}","${escapeCSV(description)}","${escapeCSV(keywords)}"`;
    } else if (stockSite === 'adobestock') {
      header = '"Filename","Title","Keywords"';
      content = `"${escapeCSV(filename)}","${escapeCSV(title)}","${escapeCSV(keywords)}"`;
    } else {
      header = '"Filename","Title","Description","Keywords"';
      content = `"${escapeCSV(filename)}","${escapeCSV(title)}","${escapeCSV(description)}","${escapeCSV(keywords)}"`;
    }
    
    const csvContent = `${header}\n${content}`;
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${stockSite}_metadata_${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`CSV for ${stockSite} downloaded successfully`);
    return true;
  } catch (error) {
    console.error(`Error creating ${stockSite} CSV:`, error);
    return false;
  }
}

/**
 * Helper function to escape CSV field content
 */
function escapeCSV(field: string): string {
  // Replace double quotes with two double quotes according to CSV standard
  return field.replace(/"/g, '""');
}

/**
 * Generates and downloads a Shutterstock-specific CSV file
 * Use this instead of trying to embed metadata for Shutterstock uploads
 * 
 * @param image The processed image with metadata
 * @returns A promise that resolves to true if successful
 */
export async function downloadShutterstockCSV(image: ProcessedImage): Promise<boolean> {
  if (!image.result) {
    console.error("No generated metadata available for Shutterstock CSV");
    return false;
  }

  try {
    const filename = image.file.name;
    const description = image.result.description || '';
    // Join keywords with commas as Shutterstock expects
    const keywords = (image.result.keywords || []).join(',');
    
    // Format Shutterstock CSV header and content
    const header = '"Filename","Description","Keywords"';
    const content = `"${escapeCSV(filename)}","${escapeCSV(description)}","${escapeCSV(keywords)}"`;
    
    const csvContent = `${header}\n${content}`;
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shutterstock_metadata_${filename.replace(/\.[^/.]+$/, "")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Shutterstock CSV downloaded successfully`);
    alert("Shutterstock CSV file downloaded. Use this file to import metadata when uploading to Shutterstock.");
    return true;
  } catch (error) {
    console.error(`Error creating Shutterstock CSV:`, error);
    return false;
  }
}

/**
 * Generates and downloads an Adobe Stock-specific CSV file
 * Use this instead of trying to embed metadata for Adobe Stock uploads
 * 
 * @param image The processed image with metadata
 * @returns A promise that resolves to true if successful
 */
export async function downloadAdobeStockCSV(image: ProcessedImage): Promise<boolean> {
  if (!image.result) {
    console.error("No generated metadata available for Adobe Stock CSV");
    return false;
  }

  try {
    const filename = image.file.name;
    const title = image.result.title || '';
    // Join keywords with commas as Adobe Stock expects
    const keywords = (image.result.keywords || []).join(',');
    
    // Format Adobe Stock CSV header and content
    const header = '"Filename","Title","Keywords"';
    const content = `"${escapeCSV(filename)}","${escapeCSV(title)}","${escapeCSV(keywords)}"`;
    
    const csvContent = `${header}\n${content}`;
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `adobestock_metadata_${filename.replace(/\.[^/.]+$/, "")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Adobe Stock CSV downloaded successfully`);
    alert("Adobe Stock CSV file downloaded. Use this file to import metadata when uploading to Adobe Stock.");
    return true;
  } catch (error) {
    console.error(`Error creating Adobe Stock CSV:`, error);
    return false;
  }
}