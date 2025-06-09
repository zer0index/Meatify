'use client';

import { useState } from 'react';

export default function TestVideoPage() {
  const [opacity, setOpacity] = useState(0.5);

  return (
    <div className="min-h-screen bg-white relative">
      <h1 className="text-2xl font-bold p-4 relative z-10">Video Test Page</h1>
      
      <div className="fixed top-4 right-4 z-50 bg-black text-white p-4 rounded">
        <div>Opacity: {Math.round(opacity * 100)}%</div>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-32"
        />
      </div>

      {/* Direct video test */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover"
        style={{ 
          opacity: opacity,
          zIndex: -1
        }}
      >
        <source src="/videos/fire.mp4" type="video/mp4" />
        Video not supported
      </video>
      
      <div className="relative z-10 p-8">
        <p>This page tests the fire video background directly.</p>
        <p>You should see fire behind this text.</p>
        <p>Use the opacity slider to adjust visibility.</p>
      </div>
    </div>
  );
}
