
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
  pulse: boolean;
  trail: boolean;
}

const StarCursor: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { theme } = useTheme();
  
  // Enhanced color palette with more vibrant options
  const starColors = [
    '#8B5CF6', // Vivid Purple
    '#D946EF', // Magenta Pink
    '#F97316', // Bright Orange
    '#0EA5E9', // Ocean Blue
    '#FCD34D', // Yellow
    '#10B981', // Green
    '#F87171', // Red
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#EC4899', // Pink
  ];

  useEffect(() => {
    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Create new stars with enhanced properties
      for (let i = 0; i < 4; i++) { // Increased number of stars for more density
        // Add randomization to make the effect more dynamic
        const randomSpeed = Math.random() * 2 + 0.3;
        const randomSize = Math.random() * 5 + 1; // Smaller stars (1-6px)
        const isTrail = Math.random() > 0.7; // Some stars have trails
        
        const newStar: Star = {
          id: Date.now() + i,
          x: e.clientX + (Math.random() - 0.5) * 25, // More spread
          y: e.clientY + (Math.random() - 0.5) * 25,
          size: randomSize,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          opacity: 0.9,
          speedY: randomSpeed, 
          rotation: Math.random() * 360,
          speedRotation: (Math.random() - 0.5) * 12,
          pulse: Math.random() > 0.7, // 30% chance of pulsing
          trail: isTrail,
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
          .map(star => {
            // Enhanced movement patterns
            const horizontalMovement = star.trail 
              ? Math.sin(Date.now() / 800 + star.id) * 1.2 // Sinusoidal movement for trail stars
              : (Math.random() - 0.5) * 0.8; // Random drift for regular stars
            
            return {
              ...star,
              y: star.y + star.speedY,
              x: star.x + horizontalMovement,
              // Slower fade for a more lasting effect
              opacity: star.opacity - (star.trail ? 0.005 : 0.01),
              rotation: star.rotation + star.speedRotation,
            };
          })
          .filter(star => star.opacity > 0) // Remove stars when they fade out
      );
    }, 16); // ~60fps
    
    // Add custom cursor style
    document.body.style.cursor = 'none';
    
    // Clean up event listeners and intervals
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(intervalId);
      document.body.style.cursor = 'auto';
    };
  }, []);
  
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Custom cursor */}
      <div 
        className="fixed w-8 h-8 pointer-events-none z-[60] transform -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <div className="w-full h-full relative">
          <div className="absolute inset-0 rounded-full border-2 border-white animate-pulse-subtle"></div>
          <div className="absolute w-2 h-2 bg-white rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
      
      {stars.map(star => (
        <div 
          key={star.id}
          className={`absolute ${star.pulse ? 'star-pulse' : ''}`}
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
          {/* Enhanced bubble appearance with improved glow */}
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: star.color,
              boxShadow: `0 0 ${star.size * 1.5}px ${star.color}`,
              filter: `blur(${star.size/7}px)`,
              border: theme === 'dark' 
                ? '0.5px solid rgba(255,255,255,0.4)' 
                : '0.5px solid rgba(255,255,255,0.6)'
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default StarCursor;
