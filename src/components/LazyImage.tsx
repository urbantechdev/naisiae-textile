import React, { useState, useEffect, useRef } from 'react';
import { toWebPUrl } from '../utils/image';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  placeholderColor?: string;
}

export function LazyImage({ 
  src, 
  alt, 
  className = '', 
  wrapperClassName = '',
  placeholderColor = 'bg-slate-100/10', 
  ...props 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const optimizedSrc = toWebPUrl(src);


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
          src={optimizedSrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full transition-all duration-[800ms] ease-out ${
            isLoaded 
              ? 'opacity-100 scale-100 filter-none' 
              : 'opacity-0 scale-[1.03] blur-sm'
          } ${className}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
}
