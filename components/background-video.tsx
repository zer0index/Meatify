'use client';

import { useState } from 'react';

interface BackgroundVideoProps {
  enableToggle?: boolean;
}

export default function BackgroundVideo({ enableToggle = false }: BackgroundVideoProps) {
  const [isVisible, setIsVisible] = useState(true);
  return (
    <>      {/* Background Video Container */}
      {isVisible && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed top-0 left-0 w-screen h-screen object-cover -z-10 opacity-100"
          style={{ 
            filter: 'brightness(0.6) contrast(1.2)',
            minWidth: '100vw',
            minHeight: '100vh'
          }}
        >
          <source src="/videos/fire.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Development Toggle Button */}
      {enableToggle && (
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="fixed top-4 right-4 z-50 px-3 py-1 bg-black/50 text-white rounded text-sm hover:bg-black/70 transition-colors"
          aria-label={isVisible ? 'Hide background video' : 'Show background video'}
        >
          {isVisible ? '🎥 Hide Video' : '🎥 Show Video'}
        </button>
      )}
    </>
  );
}