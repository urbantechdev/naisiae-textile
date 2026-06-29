import React, { useState, useEffect, useRef } from 'react';
import { toWebPUrl } from '../utils/image';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  placeholderColor?: string;
  removeBg?: boolean;
}

// Global cache for processed images to prevent re-processing on re-renders
const processedCache = new Map<string, string>();

export function useBgRemovedSrc(src: string, enabled: boolean) {
  const [enabledState, setEnabledState] = useState(() => {
    return localStorage.getItem('auto_bg_remover') !== 'false';
  });
  const [displaySrc, setDisplaySrc] = useState(src);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleToggle = () => {
      setEnabledState(localStorage.getItem('auto_bg_remover') !== 'false');
    };
    window.addEventListener('autoBgRemoverChanged', handleToggle);
    return () => window.removeEventListener('autoBgRemoverChanged', handleToggle);
  }, []);

  const activeEnabled = enabled && enabledState;

  useEffect(() => {
    if (!src || !activeEnabled) {
      setDisplaySrc(src);
      return;
    }

    if (processedCache.has(src)) {
      setDisplaySrc(processedCache.get(src)!);
      return;
    }

    setIsProcessing(true);
    const img = new Image();
    
    // Attempt CORS so canvas operations don't throw security errors
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setDisplaySrc(src);
          setIsProcessing(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample corner pixels to detect the dominant background color (usually white/light grey)
        const samples = [
          { r: data[0], g: data[1], b: data[2] }, // Top-Left
          { r: data[(canvas.width - 1) * 4], g: data[(canvas.width - 1) * 4 + 1], b: data[(canvas.width - 1) * 4 + 2] }, // Top-Right
          { r: data[(canvas.height - 1) * canvas.width * 4], g: data[(canvas.height - 1) * canvas.width * 4 + 1], b: data[(canvas.height - 1) * canvas.width * 4 + 2] }, // Bottom-Left
          { r: data[((canvas.height - 1) * canvas.width + (canvas.width - 1)) * 4], g: data[((canvas.height - 1) * canvas.width + (canvas.width - 1)) * 4 + 1], b: data[((canvas.height - 1) * canvas.width + (canvas.width - 1)) * 4 + 2] } // Bottom-Right
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        let validSamples = 0;

        samples.forEach(s => {
          // If the corner is relatively bright (indicating a background), sample it
          if (s.r > 160 && s.g > 160 && s.b > 160) {
            bgR += s.r;
            bgG += s.g;
            bgB += s.b;
            validSamples++;
          }
        });

        // Compute dominant background color or default to near-white
        if (validSamples > 0) {
          bgR = Math.round(bgR / validSamples);
          bgG = Math.round(bgG / validSamples);
          bgB = Math.round(bgB / validSamples);
        } else {
          bgR = 255;
          bgG = 255;
          bgB = 255;
        }

        // Apply advanced chroma-key / color similarity filter with high-quality feathering
        const tolerance = 48; // Tolerance radius in 3D color space
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Compute Euclidean distance in RGB color space
          const diffR = r - bgR;
          const diffG = g - bgG;
          const diffB = b - bgB;
          const distance = Math.sqrt(diffR * diffR + diffG * diffG + diffB * diffB);

          // Also match any general bright pixels (to handle vignette or slight lighting variations)
          const isOffWhite = r > 218 && g > 218 && b > 218;

          if (distance < tolerance || isOffWhite) {
            // Feather the transparency edge based on distance
            const alphaFactor = Math.max(0, Math.min(1, (distance - (tolerance * 0.7)) / (tolerance * 0.3)));
            data[i + 3] = isOffWhite ? 0 : Math.round(data[i + 3] * alphaFactor);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const processed = canvas.toDataURL('image/png');
        processedCache.set(src, processed);
        setDisplaySrc(processed);
      } catch (err) {
        console.warn('Canvas background removal failed due to CORS or image format. Using CSS fallbacks.', err);
        setDisplaySrc(src);
      } finally {
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      setDisplaySrc(src);
      setIsProcessing(false);
    };
  }, [src, activeEnabled]);

  return { displaySrc, isProcessing };
}

export function LazyImage({ 
  src, 
  alt, 
  className = '', 
  wrapperClassName = '',
  placeholderColor = 'bg-slate-100/10', 
  removeBg = true,
  ...props 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  
  const optimizedSrc = toWebPUrl(src);
  const { displaySrc } = useBgRemovedSrc(optimizedSrc, removeBg);

  useEffect(() => {
    if (!window.IntersectionObserver) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: '200px', // Pre-load elements 200px before they reach the viewport
        threshold: 0.01 
      }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={imgRef} 
      className={`relative overflow-hidden w-full h-full ${wrapperClassName}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Visual placeholder / Elegant Skeleton */}
      {!isLoaded && (
        <div 
          className={`absolute inset-0 animate-pulse ${placeholderColor} z-10 w-full h-full`}
          style={{ contentVisibility: 'auto' }}
        />
      )}
      
      {shouldLoad && (
        <img
          src={displaySrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full transition-all duration-[800ms] ease-out ${
            isLoaded 
              ? 'opacity-100 scale-100 filter-none' 
              : 'opacity-0 scale-[1.03] blur-sm'
          } ${className}`}
          style={{
            // CSS blend mode fallback if dynamic canvas transparency is in progress or failed
            ...(removeBg && displaySrc === optimizedSrc ? { mixBlendMode: 'multiply' } : {})
          }}
          loading="lazy"
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
}
