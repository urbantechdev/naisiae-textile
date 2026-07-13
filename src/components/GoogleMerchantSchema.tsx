import React, { useEffect } from 'react';

interface ProductSchemaProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    category?: string;
    subCategory?: string;
    priceType?: string;
    stock?: number;
    active?: boolean;
    variants?: any;
    tags?: string[];
  } | null;
  currency?: string;
}

export function GoogleMerchantSchema({ product, currency = 'KES' }: ProductSchemaProps) {
  useEffect(() => {
    if (!product) {
      // Clean up previous script if product is deselected
      const existingScript = document.getElementById('google-merchant-product-schema');
      if (existingScript) {
        existingScript.remove();
      }
      return;
    }

    // Build absolute image URL
    let imageLink = product.imageUrl || '';
    if (imageLink && !imageLink.startsWith('http')) {
      const baseUrl = window.location.origin.includes('localhost') || window.location.origin.includes('run.app')
        ? window.location.origin 
        : 'https://naisiaetextiles.com';
      imageLink = `${baseUrl}${imageLink.startsWith('/') ? '' : '/'}${imageLink}`;
    } else if (!imageLink) {
      imageLink = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop';
    }

    // Sanitize description for Google Merchant compatibility
    // (Must be descriptive, clean, no promotional copy, phone numbers, or CTA keywords)
    let sanitizedDesc = (product.description || '').trim();
    sanitizedDesc = sanitizedDesc
      .replace(/(buy now|best price|free shipping|sale|promo|discount|special offer|whatsapp us|call now|\+254\d*)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (sanitizedDesc.split(/\s+/).length < 5) {
      sanitizedDesc = `${product.name} - high-quality institutional grade bespoke apparel. This premium garment features durable combed textile fibers, reinforced stitching, and anti-pilling materials engineered specifically for daily wear and outstanding durability. Certified school and corporate wear standard.`;
    }

    // Truncate to match Merchant Center limit
    sanitizedDesc = sanitizedDesc.substring(0, 4900);

    // Dynamic age group and gender inference (apparel specific)
    const nameLower = product.name.toLowerCase();
    const descLower = sanitizedDesc.toLowerCase();
    
    let ageGroup = 'adult';
    if (nameLower.includes('school') || nameLower.includes('primary') || nameLower.includes('high school') || nameLower.includes('pe') || nameLower.includes('kids') || nameLower.includes('junior') || descLower.includes('kids') || descLower.includes('school')) {
      ageGroup = 'kids';
    }

    let gender = 'unisex';
    if (nameLower.includes('women') || nameLower.includes('ladies') || nameLower.includes('girls') || descLower.includes('female')) {
      gender = 'female';
    } else if (nameLower.includes('men') || nameLower.includes('boys') || descLower.includes('male')) {
      gender = 'male';
    }

    // Parse size & color from variants
    let color = 'Assorted';
    let size = 'Standard';

    if (product.variants) {
      if (typeof product.variants === 'string') {
        const parts = product.variants.split(',');
        for (const part of parts) {
          const eqIdx = part.indexOf('=');
          if (eqIdx !== -1) {
            const attrs = part.substring(0, eqIdx).split('|');
            for (const attr of attrs) {
              const kv = attr.split(':');
              if (kv.length === 2) {
                const k = kv[0].trim().toLowerCase();
                const v = kv[1].trim();
                if (k === 'color' || k === 'style') color = v;
                if (k === 'size') size = v;
              }
            }
          }
        }
      } else if (Array.isArray(product.variants)) {
        const colorVar = product.variants.find((v: any) => (v.type || '').toLowerCase() === 'color' || (v.type || '').toLowerCase() === 'style');
        if (colorVar) color = colorVar.value || 'Assorted';
        const sizeVar = product.variants.find((v: any) => (v.type || '').toLowerCase() === 'size');
        if (sizeVar) size = sizeVar.value || 'Standard';
      }
    }

    // Build URL link
    const baseUrl = window.location.origin.includes('localhost') || window.location.origin.includes('run.app')
      ? window.location.origin 
      : 'https://naisiaetextiles.com';
    const productLink = `${baseUrl}/products/?product=${encodeURIComponent(product.id)}`;

    // Build Schema.org Product Payload
    const schemaPayload = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'id': product.id || `naisiae_${product.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      'name': product.name,
      'image': imageLink,
      'description': sanitizedDesc,
      'sku': `TX-${product.id}`,
      'mpn': `NAI-${product.id.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`,
      'brand': {
        '@type': 'Brand',
        'name': 'Naisiae Textiles'
      },
      'color': color,
      'size': size,
      'gender': gender,
      'ageGroup': ageGroup,
      'category': product.category || 'Apparel & Accessories > Clothing > Uniforms',
      'offers': {
        '@type': 'Offer',
        'url': productLink,
        'priceCurrency': currency,
        'price': product.price || 1200,
        'priceValidUntil': new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0],
        'itemCondition': 'https://schema.org/NewCondition',
        'availability': (product.active !== false && product.stock !== 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        'seller': {
          '@type': 'Organization',
          'name': 'Naisiae Textiles'
        }
      }
    };

    // Inject or update the script tag in document head
    let script = document.getElementById('google-merchant-product-schema') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-merchant-product-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schemaPayload, null, 2);

    return () => {
      // Clean up on component unmount or product change
      const existingScript = document.getElementById('google-merchant-product-schema');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [product, currency]);

  return null; // This component operates as a head-injector side effect
}
