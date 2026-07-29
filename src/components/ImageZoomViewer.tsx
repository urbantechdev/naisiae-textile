import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ZoomIn, ZoomOut, RotateCcw, X, Maximize2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface ImageZoomViewerProps {
  src: string;
  alt: string;
  imageUrls?: string[];
  badge?: string;
  overlayChildren?: React.ReactNode;
  className?: string;
  aspectRatio?: string;
  objectFit?: 'contain' | 'cover';
}

export const ImageZoomViewer: React.FC<ImageZoomViewerProps> = ({
  src,
  alt,
  imageUrls = [],
  badge,
  overlayChildren,
  className = '',
  aspectRatio = 'aspect-square',
  objectFit = 'contain'
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isMobileZoomed, setIsMobileZoomed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1.8);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Deduplicate all gallery images
  const allImages = [src, ...(imageUrls || [])].filter((url, index, self) => url && self.indexOf(url) === index);
  const currentImage = allImages[activeImageIndex] || src;

  // Track mouse coordinates over the image for magnifying lens effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  };

  const handleTouchStart = () => {
    // Toggle mobile zoom on tap if not already zoomed
    setIsMobileZoomed(prev => !prev);
  };

  const zoomIn = () => setLightboxZoom(z => Math.min(z + 0.5, 3.5));
  const zoomOut = () => setLightboxZoom(z => Math.max(z - 0.4, 1));
  const resetZoom = () => {
    setLightboxZoom(1.8);
    setPanPos({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (lightboxZoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panPos.x, y: e.clientY - panPos.y };
  };

  const handleMouseDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPos({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const nextImage = () => {
    setActiveImageIndex(prev => (prev + 1) % allImages.length);
    resetZoom();
  };

  const prevImage = () => {
    setActiveImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);
    resetZoom();
  };

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      {/* Main Image Magnifier Container */}
      <div 
        className={`relative w-full ${aspectRatio} bg-slate-50/80 rounded-2xl lg:rounded-3xl overflow-hidden shadow-inner flex items-center justify-center group/zoom cursor-zoom-in border border-slate-200/60 select-none`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsMobileZoomed(false);
        }}
        onMouseMove={handleMouseMove}
        onClick={(e) => {
          // If clicked directly or tapped, open high-res full lightbox
          e.stopPropagation();
          setIsLightboxOpen(true);
        }}
        onTouchEnd={(e) => {
          // On mobile, first tap toggles lens, double tap or zoom button opens full lightbox
        }}
      >
        {/* Main Image with Precision Magnifying Lens Transformation */}
        <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
          <img 
            src={currentImage} 
            alt={alt}
            style={{
              transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
              transform: isHovered 
                ? 'scale(2.3)' 
                : isMobileZoomed 
                  ? 'scale(2.0)' 
                  : 'scale(1)',
              transition: isHovered ? 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 0.4s ease-out'
            }}
            className={`w-full h-full ${objectFit === 'contain' ? 'object-contain mix-blend-multiply' : 'object-cover'} pointer-events-none`}
          />

          {/* Optional Overlay (e.g., custom branding logo mockup) */}
          {overlayChildren}
        </div>

        {/* Badge Indicator */}
        {badge && (
          <div className="absolute top-3 left-3 z-20 px-3 py-1 bg-[#C8102E] text-white text-[9.5px] font-black uppercase tracking-wider rounded-full shadow-md">
            {badge}
          </div>
        )}

        {/* Floating Zoom Action Trigger Overlay */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="bg-white/90 hover:bg-white text-[#0A1628] hover:text-[#C8102E] px-3 py-1.5 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all border border-slate-200/80 hover:scale-105 active:scale-95"
            title="Click to Enlarge Fullscreen"
          >
            <ZoomIn size={14} className="text-[#C8102E]" />
            <span className="hidden sm:inline">Zoom HD</span>
          </button>
        </div>

        {/* Bottom Hover Guide Notice */}
        <div className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/75 via-black/40 to-transparent text-white transition-opacity duration-300 pointer-events-none flex items-center justify-between ${isHovered ? 'opacity-100' : 'opacity-0 sm:group-hover/zoom:opacity-100'}`}>
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wide">
            <Search size={13} className="text-[#C8961A]" />
            <span>{isHovered ? 'Move cursor to inspect detail' : 'Hover to magnify • Click to Enlarge'}</span>
          </div>
          <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-[8.5px] uppercase font-black tracking-widest">2.3x HD Lens</span>
        </div>
      </div>

      {/* Gallery Thumbnails Carousel */}
      {allImages.length > 1 && (
        <div className="flex items-center gap-2 mt-3 max-w-full overflow-x-auto scrollbar-hide py-1 px-1">
          {allImages.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex(idx);
              }}
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white ${
                activeImageIndex === idx 
                  ? 'border-[#C8961A] scale-105 shadow-md ring-2 ring-[#C8961A]/20' 
                  : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={url} className="w-full h-full object-cover" alt={`${alt} view ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen HD Zoom Lightbox Overlay */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div 
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none animate-in fade-in duration-200"
            onMouseMove={handleMouseDrag}
            onMouseUp={handleMouseUp}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between z-30 w-full max-w-6xl mx-auto text-white">
              <div className="flex items-center gap-2">
                <span className="bg-[#C8961A] text-[#0A1628] font-black text-[10px] uppercase px-2.5 py-1 rounded-full tracking-wider">
                  HD Texture Inspector
                </span>
                <h4 className="text-sm font-bold text-slate-200 truncate max-w-[200px] sm:max-w-md hidden sm:block">
                  {alt}
                </h4>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 p-1.5 rounded-full shadow-2xl">
                <button 
                  type="button"
                  onClick={zoomOut} 
                  disabled={lightboxZoom <= 1}
                  className="w-8 h-8 rounded-full hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center transition-colors text-white"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[11px] font-black px-2 min-w-[45px] text-center text-slate-200">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button 
                  type="button"
                  onClick={zoomIn}
                  disabled={lightboxZoom >= 3.5}
                  className="w-8 h-8 rounded-full hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center transition-colors text-white"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <div className="w-px h-4 bg-slate-700 mx-1" />
                <button 
                  type="button"
                  onClick={resetZoom}
                  className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-300 hover:text-white"
                  title="Reset Scale"
                >
                  <RotateCcw size={15} />
                </button>
                <button 
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#C8102E] hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg ml-1"
                  title="Close Fullscreen View"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Main Lightbox Canvas */}
            <div 
              className="relative flex-grow flex items-center justify-center w-full my-4 overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
            >
              <div 
                className="transition-transform duration-75 ease-out max-w-full max-h-full flex items-center justify-center"
                style={{
                  transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${lightboxZoom})`,
                }}
              >
                <img 
                  src={currentImage} 
                  alt={alt}
                  className="max-w-[85vw] max-h-[75vh] object-contain drop-shadow-2xl rounded-lg"
                  draggable={false}
                />
              </div>

              {/* Navigation Arrows if Multiple Images */}
              {allImages.length > 1 && (
                <>
                  <button 
                    type="button"
                    onClick={prevImage}
                    className="absolute left-4 z-30 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-black text-white border border-slate-700 flex items-center justify-center shadow-xl transition-transform hover:scale-110"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button 
                    type="button"
                    onClick={nextImage}
                    className="absolute right-4 z-30 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-black text-white border border-slate-700 flex items-center justify-center shadow-xl transition-transform hover:scale-110"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Lightbox Navigation & Hints */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 z-30 w-full max-w-6xl mx-auto text-slate-400 text-xs">
              <span className="text-[11px] font-semibold text-slate-300">
                💡 Drag to pan zoomed image • Scroll or use buttons to scale
              </span>

              {/* Thumbnail strip in lightbox */}
              {allImages.length > 1 && (
                <div className="flex gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl">
                  {allImages.map((url, idx) => (
                    <button
                      key={`lightbox-thumb-${idx}`}
                      type="button"
                      onClick={() => {
                        setActiveImageIndex(idx);
                        resetZoom();
                      }}
                      className={`w-10 h-10 rounded-lg overflow-hidden border transition-all ${
                        activeImageIndex === idx ? 'border-[#C8961A] scale-105' : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} className="w-full h-full object-cover" alt={`thumb ${idx}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
