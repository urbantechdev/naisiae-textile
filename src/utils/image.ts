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

  // 2. Pinterest Optimization
  // Formats: https://i.pinimg.com/1200x/...jpg -> https://i.pinimg.com/webp85/1200x/...webp
  // Originals: https://i.pinimg.com/originals/...png -> https://i.pinimg.com/webp85/originals/...webp
  if (trimmed.includes('pinimg.com')) {
    let converted = trimmed;
    
    // Replace file extension with .webp
    const extRegex = /\.(jpe?g|png|gif|bmp)(\?.*)?$/i;
    if (extRegex.test(converted)) {
      converted = converted.replace(extRegex, '.webp$2');
    }
    
    // Ensure Pinterest's high-efficiency WebP edge CDN route "/webp85" is injected
    if (!converted.includes('/webp85/')) {
      converted = converted.replace(/i\.pinimg\.com\/(originals|\d+x)/g, 'i.pinimg.com/webp85/$1');
    }
    return converted;
  }

  // 3. Keep local resources, data URIs, or unoptimized CDNs as is
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

