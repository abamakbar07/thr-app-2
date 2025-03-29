'use client';

import { motion } from 'framer-motion';

interface LoadingOverlayProps {
  message?: string;
  isFullScreen?: boolean;
  transparent?: boolean;
}

export function LoadingOverlay({ 
  message = 'Loading...', 
  isFullScreen = false,
  transparent = false
}: LoadingOverlayProps) {
  return (
    <div className={`
      ${isFullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-10'} 
      ${transparent ? 'bg-white/60' : 'bg-white/90'} 
      backdrop-blur-sm flex flex-col items-center justify-center
    `}>
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-16 mb-3">
          {/* Outer spinner */}
          <motion.div 
            className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity, 
              ease: "linear"
            }}
          />
          
          {/* Middle spinner */}
          <motion.div 
            className="absolute inset-2 border-4 border-t-transparent border-r-purple-500 border-b-transparent border-l-transparent rounded-full"
            animate={{ rotate: -360 }}
            transition={{ 
              duration: 1.6, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
          
          {/* Inner spinner */}
          <motion.div 
            className="absolute inset-4 border-4 border-t-transparent border-r-transparent border-b-green-500 border-l-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
          
          {/* Center dot with pulse effect */}
          <motion.div 
            className="absolute inset-6 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          />
        </div>
        
        <motion.p 
          className="text-gray-700 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
} 