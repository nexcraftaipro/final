
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

// Define the Star type
interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  speedY: number;
  rotation: number;
  speedRotation: number;
}

const StarCursor: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { theme } = useTheme();
  
  // Star colors - soft pastel versions for a bubble-like appearance
  const starColors = [
    '#8B5CF6', // Vivid Purple
    '#D946EF', // Magenta Pink
    '#F97316', // Bright Orange
    '#0EA5E9', // Ocean Blue
    '#FCD34D', // Yellow
    '#10B981', // Green
    '#F87171', // Red
  ];

  useEffect(() => {
    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Create new stars - create multiple smaller ones for a more delicate effect
      for (let i = 0; i < 2; i++) {
        const newStar: Star = {
          id: Date.now() + i,
          x: e.clientX + (Math.random() - 0.5) * 10,
          y: e.clientY + (Math.random() - 0.5) * 10,
          size: Math.random() * 6 + 2, // Size between 2-8px (smaller)
          color: starColors[Math.floor(Math.random() * starColors.length)],
          opacity: 0.8,
          speedY: Math.random() * 2 + 0.5, // Gentler falling speed
          rotation: Math.random() * 360, // Initial rotation
          speedRotation: (Math.random() - 0.5) * 6, // Gentler rotation speed
        };
        
        setStars(prevStars => [...prevStars, newStar]);
      }
    };
    
    // Add mouse move event listener
    window.addEventListener('mousemove', handleMouseMove);
    
    // Set an interval to animate the stars
    const intervalId = setInterval(() => {
      setStars(prevStars => 
        prevStars
          .map(star => ({
            ...star,
            y: star.y + star.speedY,
            x: star.x + (Math.random() - 0.5) * 0.5, // Slight horizontal drift for bubble effect
            opacity: star.opacity - 0.01, // Slower fade for longer trail
            rotation: star.rotation + star.speedRotation,
          }))
          .filter(star => star.opacity > 0) // Remove stars when they fade out completely
      );
    }, 16); // ~60fps
    
    // Clean up event listeners and intervals
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(intervalId);
    };
  }, []);
  
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {stars.map(star => (
        <div 
          key={star.id}
          className="absolute"
          style={{
            left: `${star.x}px`,
            top: `${star.y}px`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            transform: `rotate(${star.rotation}deg)`,
            transition: 'opacity 0.1s linear, transform 0.1s ease-out',
            pointerEvents: 'none',
          }}
        >
          {/* Use a circle for bubble-like appearance */}
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: star.color,
              boxShadow: `0 0 ${star.size/2}px ${star.color}`,
              filter: `blur(${star.size/6}px)`,
              border: theme === 'dark' ? '0.5px solid rgba(255,255,255,0.2)' : '0.5px solid rgba(0,0,0,0.1)'
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default StarCursor;
