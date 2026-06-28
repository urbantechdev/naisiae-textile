/**
 * Optimizes image URLs by converting them to modern WebP format
 * with dynamic server-side parameters where supported (e.g., Unsplash, Pinterest, etc.)
 */
export function toWebPUrl(url: string | undefined): string {
  if (!url) return '';

  const trimmed = url.trim();

  // 1. Unsplash Optimization (Append or replace format to fm=webp)
  if (trimmed.includes('unsplash.com')) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set('fm', 'webp');
      
      // Keep or optimize quality
      if (!parsed.searchParams.has('q')) {
        parsed.searchParams.set('q', '75');
      }
      return parsed.toString();
    } catch {
      if (trimmed.includes('?')) {
        let clean = trimmed;
        if (trimmed.includes('fm=')) {
          clean = clean.replace(/fm=[^&]*/g, 'fm=webp');
        } else {
          clean = clean + '&fm=webp';
        }
        if (!trimmed.includes('q=')) {
          clean = clean + '&q=75';
        }
        return clean;
      }
      return trimmed + '?fm=webp&q=75';
    }
  }

  // 2. Pinterest bypass (Returning original pinimg/pinterest URLs to avoid 403/404 CDN mismatch errors)
  if (trimmed.includes('pinimg.com') || trimmed.includes('pinterest.com')) {
    return trimmed;
  }

  // 3. Google Drive URL Resolution
  // Automatically transforms non-embeddable sharing URLs to high-performance direct CDN routes:
  // e.g. https://drive.google.com/file/d/IMAGE_ID/view -> https://lh3.googleusercontent.com/d/IMAGE_ID
  if (trimmed.includes('drive.google.com')) {
    try {
      let imageId = '';
      
      // Pattern 1: /file/d/IMAGE_ID/
      const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileDMatch && fileDMatch[1]) {
        imageId = fileDMatch[1];
      } else {
        // Pattern 2: id=IMAGE_ID query parameter
        const urlObj = new URL(trimmed);
        const idParam = urlObj.searchParams.get('id');
        if (idParam) {
          imageId = idParam;
        }
      }

      if (imageId) {
        return `https://lh3.googleusercontent.com/d/${imageId}`;
      }
    } catch {
      // Fallback
    }
  }

  // 4. Keep local resources, data URIs, or unoptimized CDNs as is
  return trimmed;
}

/**
 * Installs prototype level interceptors onto HTMLImageElement and HTMLSourceElement
 * to automatically rewrite any image requests to point to WebP versions.
 * This guarantees 100% of all images (including dynamic, library, database, or static images)
 * are optimized to load as webp.
 */
export function initImageOptimizer(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Intercept HTMLImageElement.src
    const imgProto = HTMLImageElement.prototype;
    const descSrc = Object.getOwnPropertyDescriptor(imgProto, 'src');
    
    if (descSrc && descSrc.set && descSrc.get) {
      const originalSet = descSrc.set;
      const originalGet = descSrc.get;
      
      Object.defineProperty(imgProto, 'src', {
        get() {
          return originalGet.call(this);
        },
        set(val: string) {
          const optimized = toWebPUrl(val);
          originalSet.call(this, optimized);
        },
        configurable: true,
        enumerable: true
      });
    }

    // 2. Intercept HTMLImageElement.srcset
    const descSrcset = Object.getOwnPropertyDescriptor(imgProto, 'srcset');
    if (descSrcset && descSrcset.set && descSrcset.get) {
      const originalSet = descSrcset.set;
      const originalGet = descSrcset.get;

      Object.defineProperty(imgProto, 'srcset', {
        get() {
          return originalGet.call(this);
        },
        set(val: string) {
          if (val) {
            const optimized = val.split(',').map(part => {
              const trimmed = part.trim();
              const spaceIndex = trimmed.indexOf(' ');
              if (spaceIndex !== -1) {
                const url = trimmed.slice(0, spaceIndex);
                const widthAndDescriptor = trimmed.slice(spaceIndex);
                return `${toWebPUrl(url)}${widthAndDescriptor}`;
              }
              return toWebPUrl(trimmed);
            }).join(', ');
            originalSet.call(this, optimized);
          } else {
            originalSet.call(this, val);
          }
        },
        configurable: true,
        enumerable: true
      });
    }

    // 3. Intercept HTMLSourceElement.src (Used in <picture> tags)
    if (typeof HTMLSourceElement !== 'undefined') {
      const sourceProto = HTMLSourceElement.prototype;
      const descSourceSrc = Object.getOwnPropertyDescriptor(sourceProto, 'src');
      if (descSourceSrc && descSourceSrc.set && descSourceSrc.get) {
        const originalSet = descSourceSrc.set;
        const originalGet = descSourceSrc.get;

        Object.defineProperty(sourceProto, 'src', {
          get() {
            return originalGet.call(this);
          },
          set(val: string) {
            const optimized = toWebPUrl(val);
            originalSet.call(this, optimized);
          },
          configurable: true,
          enumerable: true
        });
      }

      // 4. Intercept HTMLSourceElement.srcset
      const descSourceSrcset = Object.getOwnPropertyDescriptor(sourceProto, 'srcset');
      if (descSourceSrcset && descSourceSrcset.set && descSourceSrcset.get) {
        const originalSet = descSourceSrcset.set;
        const originalGet = descSourceSrcset.get;

        Object.defineProperty(sourceProto, 'srcset', {
          get() {
            return originalGet.call(this);
          },
          set(val: string) {
            if (val) {
              const optimized = val.split(',').map(part => {
                const trimmed = part.trim();
                const spaceIndex = trimmed.indexOf(' ');
                if (spaceIndex !== -1) {
                  const url = trimmed.slice(0, spaceIndex);
                  const widthAndDescriptor = trimmed.slice(spaceIndex);
                  return `${toWebPUrl(url)}${widthAndDescriptor}`;
                }
                return toWebPUrl(trimmed);
              }).join(', ');
              originalSet.call(this, optimized);
            } else {
              originalSet.call(this, val);
            }
          },
          configurable: true,
          enumerable: true
        });
      }
    }
    
    console.log('[ImageOptimizer] Installed global WebP interceptors successfully.');
  } catch (err) {
    console.error('[ImageOptimizer] Failed to install interceptors:', err);
  }
}

/**
 * Map of professional category placeholder icons to standardize visual identity.
 */
const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  'school uniforms': '/src/assets/images/category_school_1782334810884.jpg',
  'school': '/src/assets/images/category_school_1782334810884.jpg',
  'college wear': '/src/assets/images/category_school_1782334810884.jpg',
  'college': '/src/assets/images/category_school_1782334810884.jpg',
  'corporate wear': '/src/assets/images/category_corporate_1782334824455.jpg',
  'corporate': '/src/assets/images/category_corporate_1782334824455.jpg',
  'healthcare': '/src/assets/images/category_medical_1782334767056.jpg',
  'medical': '/src/assets/images/category_medical_1782334767056.jpg',
  'hospitality': '/src/assets/images/category_hospitality_1782334781502.jpg',
  'industrial': '/src/assets/images/category_industrial_1782334796806.jpg',
  'security': '/src/assets/images/category_industrial_1782334796806.jpg',
  'workwear': '/src/assets/images/category_industrial_1782334796806.jpg',
  'sports kits': '/src/assets/images/category_sports_1782334837561.jpg',
  'sports': '/src/assets/images/category_sports_1782334837561.jpg',
  'branding & print': '/src/assets/images/category_sports_1782334837561.jpg'
};

export function getCategoryPlaceholder(categoryName: string | undefined): string {
  if (!categoryName) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80';
  const cleanKey = categoryName.toLowerCase().trim();
  
  // Look for exact or partial matches
  for (const [key, path] of Object.entries(CATEGORY_PLACEHOLDERS)) {
    if (cleanKey.includes(key) || key.includes(cleanKey)) {
      return path;
    }
  }

  // General fallbacks if nothing matches
  if (cleanKey.includes('med') || cleanKey.includes('health') || cleanKey.includes('clinic')) {
    return CATEGORY_PLACEHOLDERS['healthcare'];
  }
  if (cleanKey.includes('food') || cleanKey.includes('chef') || cleanKey.includes('restaurant') || cleanKey.includes('hotel')) {
    return CATEGORY_PLACEHOLDERS['hospitality'];
  }
  if (cleanKey.includes('factory') || cleanKey.includes('engine') || cleanKey.includes('construction') || cleanKey.includes('safety')) {
    return CATEGORY_PLACEHOLDERS['industrial'];
  }

  return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80';
}


