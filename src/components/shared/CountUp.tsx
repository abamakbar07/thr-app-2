'use client';

import { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
  formatted?: string;
}

export default function CountUp({ 
  value, 
  duration = 1000, 
  formatter = (val: number) => val.toString(),
  formatted
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const previousValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset animation when value changes
    previousValueRef.current = count;
    startTimeRef.current = null;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Animate the count
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Calculate the current value using easing function
      const currentValue = previousValueRef.current + 
        (value - previousValueRef.current) * easeOutQuart(progress);
      
      setCount(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);
  
  // Ease out quart function for smooth animation
  const easeOutQuart = (x: number): number => {
    return 1 - Math.pow(1 - x, 4);
  };
  
  // If formatted is provided, use it with a percentage of completion
  // Otherwise use the formatter function with the animated count
  if (formatted) {
    // For formatted values, we just show the final value
    // No animation for formatted values to avoid issues with formatting during animation
    return <>{formatted}</>;
  }
  
  return <>{formatter(count)}</>;
} 