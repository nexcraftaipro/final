# Meta CSV Generator Pro

A powerful CSV generator for creating metadata for your images and videos. Works with multiple platforms including Freepik, Shutterstock, and Adobe Stock.

## Features

- Generate metadata from images with AI
- Process video files and extract metadata
- Export to CSV for different platforms
- Customize metadata fields
- Process multiple images at once
- AI-powered title, description and keyword generation
- SVG-to-PNG conversion for Gemini API compatibility

## Technologies Used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Gemini AI

## Development

To run this project locally:

```sh
# Install dependencies
npm i

# Start the development server
npm run dev
```

## Recent Updates

- **Video Support**: Added video file processing capability! The app now extracts thumbnails from video files for analysis and generates appropriate metadata. Video metadata is exported in a special format: Filename,Title,Keywords,Category.

- **SVG Support**: Added SVG-to-PNG conversion functionality to resolve compatibility issues with the Gemini API. The app now automatically converts SVG files to PNG format before sending them to the API, while preserving the original SVG file in the UI.

## Deployment

This project can be deployed to any static hosting service like Netlify, Vercel, or GitHub Pages.
