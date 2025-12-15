import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OwlMascotProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'happy' | 'excited' | 'thinking' | 'sleepy';
  greeting?: string;
}

const OwlMascot: React.FC<OwlMascotProps> = ({ 
  className, 
  size = 'md', 
  mood = 'happy',
  greeting 
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  const handleClick = () => {
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 500);
  };

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  };

  const moodColors = {
    happy: 'from-lavender to-peach',
    excited: 'from-sunshine to-peach',
    thinking: 'from-sky to-lavender',
    sleepy: 'from-lavender-light to-mint-light',
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        onClick={handleClick}
        className={cn(
          "relative cursor-pointer transition-transform duration-200 hover:scale-110",
          sizes[size],
          isWiggling && "wiggle"
        )}
      >
        {/* Owl body */}
        <div className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br shadow-soft",
          moodColors[mood]
        )}>
          {/* Ears */}
          <div className="absolute -top-2 left-3 w-4 h-6 bg-gradient-to-br from-lavender to-peach rounded-full transform -rotate-12" />
          <div className="absolute -top-2 right-3 w-4 h-6 bg-gradient-to-br from-lavender to-peach rounded-full transform rotate-12" />
          
          {/* Face circle */}
          <div className="absolute inset-3 rounded-full bg-background/90 flex items-center justify-center">
            {/* Eyes container */}
            <div className="flex gap-2 items-center">
              {/* Left eye */}
              <div className="relative w-5 h-5 bg-foreground/90 rounded-full flex items-center justify-center">
                <div 
                  className={cn(
                    "w-2 h-2 bg-background rounded-full transition-all duration-100",
                    isBlinking && "h-0.5"
                  )} 
                />
                {mood === 'excited' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-sunshine rounded-full animate-pulse" />
                )}
              </div>
              
              {/* Right eye */}
              <div className="relative w-5 h-5 bg-foreground/90 rounded-full flex items-center justify-center">
                <div 
                  className={cn(
                    "w-2 h-2 bg-background rounded-full transition-all duration-100",
                    isBlinking && "h-0.5"
                  )} 
                />
                {mood === 'excited' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-sunshine rounded-full animate-pulse" />
                )}
              </div>
            </div>
            
            {/* Beak */}
            <div className="absolute bottom-3 w-3 h-2 bg-peach rounded-full" />
          </div>
          
          {/* Blush */}
          <div className="absolute bottom-5 left-4 w-3 h-2 bg-coral/40 rounded-full" />
          <div className="absolute bottom-5 right-4 w-3 h-2 bg-coral/40 rounded-full" />
        </div>
        
        {/* Floating hearts for excited mood */}
        {mood === 'excited' && (
          <>
            <span className="absolute -top-4 -right-2 text-lg animate-bounce delay-100">💕</span>
            <span className="absolute -top-2 -left-4 text-sm animate-bounce delay-300">✨</span>
          </>
        )}
        
        {/* Z's for sleepy mood */}
        {mood === 'sleepy' && (
          <span className="absolute -top-2 -right-2 text-lg">💤</span>
        )}
        
        {/* Sparkle for thinking mood */}
        {mood === 'thinking' && (
          <span className="absolute -top-4 right-0 text-lg animate-pulse">💡</span>
        )}
      </div>
      
      {/* Speech bubble */}
      {greeting && (
        <div className="relative bg-card rounded-2xl px-4 py-2 shadow-card border-2 border-border max-w-48 text-center fade-in-up">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-card border-l-2 border-t-2 border-border rotate-45" />
          <p className="text-sm font-medium text-foreground relative z-10">{greeting}</p>
        </div>
      )}
    </div>
  );
};

export default OwlMascot;
