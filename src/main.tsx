import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupVideoDebug } from './utils/videoDebug'

// Initialize video debugging in development
if (import.meta.env.DEV) {
  setupVideoDebug();
}

createRoot(document.getElementById("root")!).render(<App />);
