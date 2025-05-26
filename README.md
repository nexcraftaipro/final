# PixCraftAI

A powerful AI-assisted tool for creating metadata for your images and videos. Works with multiple platforms including Freepik, Shutterstock, and Adobe Stock.

## Features

- Generate metadata from images with AI
- Process video files and extract metadata
- Export to CSV for different platforms
- Customize metadata fields
- Process multiple images at once
- AI-powered title, description and keyword generation
- SVG-to-PNG conversion for Gemini API compatibility
- Embed metadata directly into image files for Windows File Explorer

## Technologies Used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Gemini AI
- piexifjs (for EXIF metadata embedding)

## Development

To run this project locally:

```sh
# Install dependencies
npm i

# Start the development server
npm run dev
```

## Recent Updates

- **File Metadata Integration**: Added functionality to embed AI-generated metadata directly into image files. Now users can save titles, descriptions, and keywords directly into JPEG files, making them visible in Windows File Explorer properties dialog.

- **Vecteezy Comma Removal**: Added functionality to automatically remove commas from descriptions in Vecteezy metadata to prevent CSV formatting issues. This ensures cleaner and more compatible CSV exports for the Vecteezy platform.

- **Video Support**: Added video file processing capability! The app now extracts thumbnails from video files for analysis and generates appropriate metadata. Video metadata is exported in a special format: Filename,Title,Keywords,Category.

- **SVG Support**: Added SVG-to-PNG conversion functionality to resolve compatibility issues with the Gemini API. The app now automatically converts SVG files to PNG format before sending them to the API, while preserving the original SVG file in the UI.

## Deployment

This project can be deployed to any static hosting service like Netlify, Vercel, or GitHub Pages.

## File Metadata Support

The application now supports writing metadata directly to files:

- **JPEG files**: Full metadata support with embedded EXIF data that appears in Windows File Explorer
- **Other image formats**: Basic support with metadata-enriched filenames
- **Access**: Use the "Save Metadata" button next to each processed image or in the Properties dialog

Note: Due to browser security restrictions, files with embedded metadata need to be downloaded and saved to your computer.
