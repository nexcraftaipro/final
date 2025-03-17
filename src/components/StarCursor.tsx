
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
  
  // Star colors
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
      
      // Create a new star with random properties
      const newStar: Star = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 12 + 4, // Size between 4-16px
        color: starColors[Math.floor(Math.random() * starColors.length)],
        opacity: 1,
        speedY: Math.random() * 3 + 1, // Falling speed
        rotation: Math.random() * 360, // Initial rotation
        speedRotation: (Math.random() - 0.5) * 10, // Rotation speed
      };
      
      setStars(prevStars => [...prevStars, newStar]);
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
            opacity: star.opacity - 0.015,
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
            transition: 'opacity 0.05s linear',
            pointerEvents: 'none',
          }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" 
              fill={star.color}
              stroke={theme === 'dark' ? '#ffffff40' : '#00000020'} 
              strokeWidth="0.5"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default StarCursor;
