
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
}

const StarCursor: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { theme } = useTheme();
  
  // Star colors - vibrant colors with neon feel
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
      
      // Create new stars - create multiple smaller ones with varying properties
      for (let i = 0; i < 3; i++) {
        const newStar: Star = {
          id: Date.now() + i,
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          size: Math.random() * 5 + 2, // Size between 2-7px
          color: starColors[Math.floor(Math.random() * starColors.length)],
          opacity: 0.9,
          speedY: Math.random() * 2 + 0.5, // Varied falling speed
          rotation: Math.random() * 360, // Initial rotation
          speedRotation: (Math.random() - 0.5) * 10, // More varied rotation
          pulse: Math.random() > 0.7, // Some stars will pulse
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
            x: star.x + (Math.sin(Date.now() / 1000 + star.id) * 0.7), // Sinusoidal horizontal movement
            opacity: star.opacity - 0.01, // Fade out
            rotation: star.rotation + star.speedRotation,
          }))
          .filter(star => star.opacity > 0) // Remove stars when they fade out
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
          {/* Enhanced bubble appearance with glow */}
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: star.color,
              boxShadow: `0 0 ${star.size}px ${star.color}`,
              filter: `blur(${star.size/8}px)`,
              border: theme === 'dark' ? '0.5px solid rgba(255,255,255,0.3)' : '0.5px solid rgba(255,255,255,0.5)'
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default StarCursor;
