import "./src/services/suppressLogs";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import compression from "compression";

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));

  // OpenHuman AI Chat Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid messages" });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing in environment variables");
        return res.status(500).json({ error: "AI service configuration missing. Please update secrets." });
      }

      // System instructions for Naisiae Textiles
      const systemInstruction = `
        You are the "OpenHuman Production Intelligence" - a high-performance AI agent integrated into the Naisiae Textiles platform. 
        Your goal is to provide expert manufacturing support, textile sourcing advice, and real-time production updates for Uhuru Market Uniforms.
        
        Key Knowledge Areas:
        1. Uniform Manufacturing: School uniforms (shirts, trousers, tunics, blazers), Hospital scrubs, Corporate branded wear, industrial overalls.
        2. Fabric Expertise: Polyester-cotton blends (PV), Heavy Drills, Twills, and specialized school fabrics.
        3. Branding: Embroidery, Screen printing, Heat press, Sublimation.
        4. Location: Based at Uhuru Market, Nairobi (Naisiae Textiles production floor).
        
        Guidelines:
        - Be professional, industrial, and highly efficient.
        - Use "Naisiae Sync Protocols" or "Production Stream" terminology to sound like an advanced industrial agent.
        - Encourage WhatsApp support (+254792021795) for custom bulk tender requirements.
        - Keep responses concise, authoritative, and focused on Nairobi's textile ecosystem.
      `;

      // Filter and Format messages to Gemini format (strictly alternating user/model)
      const chatMessages: any[] = [];
      let lastRole = '';
      const contextMessages = messages.slice(-10);

      for (const m of contextMessages) {
        const role = m.sender === 'user' ? 'user' : 'model';
        if (role !== lastRole && m.text) {
          chatMessages.push({
            role,
            parts: [{ text: m.text }]
          });
          lastRole = role;
        }
      }

      // Ensure first message is user
      if (chatMessages.length > 0 && chatMessages[0].role !== 'user') {
        chatMessages.shift();
      }

      if (chatMessages.length === 0) {
        return res.status(400).json({ error: "No valid message history" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatMessages,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Chat Error Detail:", error?.message || error);
      
      const errorMsg = error?.message || "";
      if (errorMsg.includes('API key not valid')) {
        res.status(500).json({ error: "AI Intelligence offline: Credentials rejected. Please ensure GEMINI_API_KEY is set in Secrets." });
      } else {
        res.status(500).json({ error: "Naisiae Sync Interrupted. Production AI recalibrating. Try direct support for now." });
      }
    }
  });

  // Competitive Pricing Suggestion Endpoint
  app.post("/api/ai/pricing-suggestion", async (req, res) => {
    const { productName, category } = req.body;
    if (!productName || !category) {
      return res.status(400).json({ error: "Missing productName or category" });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI service configuration missing. Please update secrets." });
      }

      const prompt = `Suggest a competitive market price for a product in Kenya (KES) with the following details:
Product Name: ${productName}
Category: ${category}

Research the typical market prices for this type of textile/apparel product in Kenya (Nairobi/Kiambu region).
Provide a suggested price that is slightly more competitive (slightly lower but still profitable) than established players like major uniform suppliers.

Return the response in JSON format.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedPrice: {
                type: Type.NUMBER,
                description: "The recommended selling price in KES.",
              },
              marketRange: {
                type: Type.OBJECT,
                properties: {
                  min: { type: Type.NUMBER, description: "Lower bound of market price." },
                  max: { type: Type.NUMBER, description: "Upper bound of market price." }
                },
                required: ["min", "max"]
              },
              reasoning: {
                type: Type.STRING,
                description: "Brief explanation of why this price is competitive.",
              },
            },
            required: ["suggestedPrice", "marketRange", "reasoning"],
          },
        },
      });

      res.json(JSON.parse(response.text?.trim() || "{}"));
    } catch (error: any) {
      console.error("Pricing Suggestion Error Detail:", error?.message || error);
      res.status(500).json({ error: "Failed to fetch pricing suggestion from AI." });
    }
  });

  // Product Details Generation Endpoint
  app.post("/api/ai/generate-product-details", async (req, res) => {
    const { base64Image, mimeType } = req.body;
    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: "Missing base64Image or mimeType" });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI service configuration missing. Please update secrets." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: `Analyze this image of a textile/apparel product and generate professional product details tailored for the Kenyan market. 
              Categories MUST be one of: 'School Uniforms', 'College Wear', 'Corporate Wear', 'Sports Kits', 'Healthcare', 'Hospitality', 'Branding & Print'.
              Provide a competitive price suggestion in Kenyan Shillings (KSH) based on local Nairobi wholesale/retail trends (e.g., School Sweaters: 800-1500, Shirts: 400-800, Trousers: 1000-1800).`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              subCategory: { type: Type.STRING },
              priceSuggestion: { type: Type.NUMBER },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["name", "description", "category", "priceSuggestion", "tags"],
          },
        },
      });

      res.json(JSON.parse(response.text?.trim() || "{}"));
    } catch (error: any) {
      console.error("Generate Product Details Error Detail:", error?.message || error);
      res.status(500).json({ error: "Failed to generate product details from AI." });
    }
  });

  // Generate Description Only Endpoint
  app.post("/api/ai/generate-description-only", async (req, res) => {
    const { name, category, tags } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: "Missing name or category" });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI service configuration missing. Please update secrets." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Create a professional, SEO-optimized marketing description for a product named "${name}" in the category "${category}". Tags: ${(tags || []).join(', ')}. Keep it concise but persuasive.`,
      });

      res.json({ text: response.text || "Failed to generate description" });
    } catch (error: any) {
      console.error("Generate Description Error Detail:", error?.message || error);
      res.status(500).json({ error: "Failed to generate description from AI." });
    }
  });

  // Generate Product Data from Text Endpoint
  app.post("/api/ai/generate-product-data-from-text", async (req, res) => {
    const { name, category } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: "Missing name or category" });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI service configuration missing. Please update secrets." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate realistic product details for the Kenyan uniform market: ${name} (Category: ${category}). 
        Provide a persuasive description highlighting durability, Kenyan market price suggestion in KSH, subCategory, and relevant tags.
        Prices should reflect Uhuru Market/Nairobi Industrial Area competitiveness.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              subCategory: { type: Type.STRING },
              priceSuggestion: { type: Type.NUMBER },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["description", "priceSuggestion", "tags"],
          },
        },
      });

      res.json(JSON.parse(response.text?.trim() || "{}"));
    } catch (error: any) {
      console.error("Generate Product Data from Text Error Detail:", error?.message || error);
      res.status(500).json({ error: "Failed to generate product details from AI." });
    }
  });

  // Analyze Batch Endpoint
  app.post("/api/ai/analyze-batch", async (req, res) => {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: "Missing or invalid products array" });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI service configuration missing. Please update secrets." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze these products for categorization consistency and name optimization: ${JSON.stringify(products.map(p => ({ n: p.name, c: p.category, sc: p.subCategory })))}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analyzedProducts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    originalName: { type: Type.STRING },
                    suggestedName: { type: Type.STRING },
                    suggestedCategory: { type: Type.STRING },
                    suggestedSubCategory: { type: Type.STRING },
                    suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    isIssueFound: { type: Type.BOOLEAN },
                    issueDescription: { type: Type.STRING }
                  }
                }
              }
            }
          },
        },
      });

      res.json(JSON.parse(response.text?.trim() || "{}"));
    } catch (error: any) {
      console.error("Analyze Batch Error Detail:", error?.message || error);
      res.status(500).json({ error: "Failed to analyze batch." });
    }
  });

  // API route to resolve social/short links (like Canva) to direct image URLs
  app.get("/api/resolve-image", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).json({ error: "Missing URL" });

    // Server-side instant bypass for Google Drive links
    if (targetUrl.includes('drive.google.com')) {
      let imageId = '';
      const fileDMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileDMatch && fileDMatch[1]) {
        imageId = fileDMatch[1];
      } else {
        try {
          const urlObj = new URL(targetUrl);
          const idParam = urlObj.searchParams.get('id');
          if (idParam) imageId = idParam;
        } catch {}
      }
      if (imageId) {
        return res.json({ resolvedUrl: `https://lh3.googleusercontent.com/d/${imageId}` });
      }
    }

    try {
      // Follow redirects to get the real page using a standard web browser User-Agent
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'follow'
      });
      
      const contentType = response.headers.get("content-type");
      if (contentType?.startsWith("image/")) {
         return res.json({ resolvedUrl: targetUrl });
      }

      const html = await response.text();
      
      // Look for og:image or twitter:image
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                           html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      
      if (ogImageMatch && ogImageMatch[1]) {
        return res.json({ resolvedUrl: ogImageMatch[1] });
      }

      const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
      if (twitterImageMatch && twitterImageMatch[1]) {
        return res.json({ resolvedUrl: twitterImageMatch[1] });
      }

      // Special handling for Canva embeds if redirect leads to a design page
      // Often the image is in a schema or more complex meta
      res.json({ resolvedUrl: targetUrl }); // Fallback
    } catch (error) {
      console.error("Link resolution error:", error);
      res.status(500).json({ error: "Failed to resolve URL" });
    }
  });

  // Dynamic Google Merchant Center RSS 2.0 Feed API
  const handleMerchantFeed = async (req: express.Request, res: express.Response) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');

    let productsList: any[] = [];
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      let projectId = "";
      let databaseId = "(default)";

      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        projectId = config.projectId;
        databaseId = config.firestoreDatabaseId || "(default)";
      } else {
        projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "";
        databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)";
      }

      if (projectId) {
        // Query live products with pageSize=300 to capture the whole catalog
        const productsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/products?pageSize=300`;
        const pResp = await fetch(productsUrl);
        const pData = await pResp.json();
        if (pData.documents) {
          productsList = pData.documents;
        }
      }
    } catch (e: any) {
      console.warn("Could not query products from Firestore for Merchant feed:", e.message);
    }

    // Helper functions for parsing Firestore typed fields safely
    const getVal = (field: any) => {
      if (!field) return undefined;
      if ('stringValue' in field) return field.stringValue;
      if ('integerValue' in field) return parseInt(field.integerValue, 10);
      if ('doubleValue' in field) return parseFloat(field.doubleValue);
      if ('booleanValue' in field) return field.booleanValue;
      return undefined;
    };

    const escapeXml = (unsafe: string): string => {
      if (!unsafe) return '';
      return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    const truncateDesc = (text: string, limit: number = 85): string => {
      if (!text) return "";
      if (text.length <= limit) return text;
      return text.substring(0, limit - 3) + "...";
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>${escapeXml("Naisiae Textiles | Google Merchant Product Feed")}</title>\n`;
    xml += `    <link>https://naisiaetextiles.com</link>\n`;
    xml += `    <description>${escapeXml("Premium Uhuru Market Uniforms in Nairobi. High school uniforms, college sweaters.")}</description>\n`;
    xml += `    <language>en-us</language>\n`;
    xml += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;

    productsList.forEach((doc: any) => {
      try {
        const fields = doc.fields || {};
        const isProductActive = fields.active ? getVal(fields.active) : true;
        
        // Skip inactive items to preserve healthy Google Merchant indexing scores
        if (isProductActive === false) return;

        const id = doc.name.split('/').pop() || '';
        const name = escapeXml(getVal(fields.name) || 'Premium Textiles Apparel');
        const rawDesc = getVal(fields.description) || `${name} manufactured at Naisiae Textiles in Uhuru Market, Nairobi. Industry-grade fabric constructed for daily wear.`;
        const desc = escapeXml(truncateDesc(rawDesc, 85));
        
        // Dynamic product detail page target
        const link = `https://naisiaetextiles.com/products/?product=${encodeURIComponent(id)}`;
        
        // Evaluate primary and secondary imaging links
        let imageUrl = getVal(fields.imageUrl);
        if (!imageUrl && fields.imageUrls) {
          // If imageUrls is a Map or array list structure, grab first element
          const urlsData = fields.imageUrls.arrayValue?.values || [];
          if (urlsData.length > 0) {
            imageUrl = urlsData[0].stringValue;
          }
        }
        // Fallback placeholder image matching our high-quality CDN assets
        if (!imageUrl) {
          imageUrl = "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80";
        }
        const cleanImageUrl = escapeXml(imageUrl);

        // Price configuration
        const priceVal = fields.price ? getVal(fields.price) : 1000;
        const cleanPrice = `${priceVal ? Number(priceVal) : 1000} KES`;

        // Category determination
        const category = getVal(fields.category) || 'School Uniforms';
        const subCategory = getVal(fields.subCategory) || 'Apparel';
        
        // Determine granular google classification
        let googleCategory = 'Apparel &amp; Accessories &gt; Clothing &gt; Uniforms';
        if (category.toLowerCase().includes('chef')) {
          googleCategory = 'Apparel &amp; Accessories &gt; Clothing &gt; Uniforms &gt; Food Service Uniforms';
        } else if (category.toLowerCase().includes('corporate') || category.toLowerCase().includes('branding')) {
          googleCategory = 'Apparel &amp; Accessories &gt; Clothing &gt; Office wear';
        }

        const stockCount = fields.stock ? Number(getVal(fields.stock)) : 100;
        const availability = stockCount > 0 ? 'in_stock' : 'out_of_stock';

        xml += `    <item>\n`;
        xml += `      <g:id>${escapeXml(id)}</g:id>\n`;
        xml += `      <g:title>${name}</g:title>\n`;
        xml += `      <g:description>${desc}</g:description>\n`;
        xml += `      <g:link>${escapeXml(link)}</g:link>\n`;
        xml += `      <g:image_link>${cleanImageUrl}</g:image_link>\n`;
        xml += `      <g:condition>new</g:condition>\n`;
        xml += `      <g:availability>${availability}</g:availability>\n`;
        xml += `      <g:price>${cleanPrice}</g:price>\n`;
        xml += `      <g:brand>Naisiae Textiles</g:brand>\n`;
        xml += `      <g:google_product_category>${googleCategory}</g:google_product_category>\n`;
        xml += `      <g:product_type>${escapeXml(category)} &gt; ${escapeXml(subCategory)}</g:product_type>\n`;
        xml += `      <g:shipping>\n`;
        xml += `        <g:country>KE</g:country>\n`;
        xml += `        <g:service>Standard Delivery</g:service>\n`;
        xml += `        <g:price>350 KES</g:price>\n`;
        xml += `      </g:shipping>\n`;
        xml += `    </item>\n`;
      } catch (itemErr: any) {
        console.warn("Error rendering item in merchant feed:", itemErr.message);
      }
    });

    xml += `  </channel>\n`;
    xml += `</rss>`;
    return res.status(200).send(xml);
  };

  // Bind Merchant Feed to all semantic pathways for absolute compatibility
  app.get("/api/google-merchant", handleMerchantFeed);
  app.get("/api/merchant-feed", handleMerchantFeed);
  app.get("/merchant-feed.xml", handleMerchantFeed);
  app.get("/google-merchant-feed.xml", handleMerchantFeed);

  // Google Business Review Redirects
  app.get([
    '/review', '/reviews', '/google-review', '/g-review',
    '/:country/review', '/:country/reviews', '/:country/google-review', '/:country/g-review'
  ], (req, res, next) => {
    const countryParam = req.params.country;
    const countries = ['ke', 'kenya', 'tz', 'tanzania', 'ug', 'uganda', 'et', 'ethiopia', 'cd', 'drc', 'congo'];
    if (countryParam && !countries.includes(countryParam.toLowerCase())) {
      return next();
    }
    res.redirect(302, 'https://g.page/r/CZb3o2nm3vRgEBM/review');
  });

  // Vite middleware for development initialization
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa", 
    });
    app.set('vite', vite);
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve src/assets folder in production to ensure dynamic image paths (/src/assets/images/...) are resolved correctly
    app.use('/src/assets', express.static(path.join(process.cwd(), 'src/assets'), {
      maxAge: '30d',
      etag: true
    }));
    // Serve static assets with aggressive cache headers and etags for instant reload
    app.use(express.static(distPath, {
      maxAge: '1y',
      etag: true,
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          // Instruct browsers never to cache HTML files so updates are received instantly
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.match(/\.(woff2?|eot|ttf|otf)$/)) {
          // JS, CSS, and web fonts are fully versioned and can be cached aggressively
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // Images and other static elements cached for 1 month
          res.setHeader('Cache-Control', 'public, max-age=2592000');
        }
      }
    }));
  }

  // Dynamic Sitemap.xml endpoint (Placed before catch-all SPA routing)
  app.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    
    let blogsList: any[] = [];
    let productsList: any[] = [];
    let projectId = "";
    let databaseId = "(default)";

    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");

      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        projectId = config.projectId;
        databaseId = config.firestoreDatabaseId || "(default)";
      } else {
        projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "";
        databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)";
      }

      if (projectId) {
        // Fetch blogs
        try {
          const blogsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/blogs`;
          const bResp = await fetch(blogsUrl);
          const bData = await bResp.json();
          if (bData.documents) {
            blogsList = bData.documents;
          }
        } catch (err) {
          console.warn("Could not query blogs for dynamic sitemap endpoint:", err);
        }

        // Fetch products
        try {
          const productsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/products`;
          const pResp = await fetch(productsUrl);
          const pData = await pResp.json();
          if (pData.documents) {
            productsList = pData.documents;
          }
        } catch (err) {
          console.warn("Could not query products for dynamic sitemap endpoint:", err);
        }
      }
    } catch (e) {
      console.warn("Could not retrieve firestore config for sitemap:");
    }

    const staticPages = [
      '',
      'about',
      'services',
      'products',
      'categories',
      'portfolio',
      'wholesale',
      'contact',
      'faq',
      'blog',
      'careers',
      'privacy',
      'terms',
      'shipping',
      'returns',
      'fabric-gallery',
      'uniform-simulator'
    ];

    const countries = [
      { prefix: '', isDefault: true }
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // 1. Static Pages with country prefixing and trailing slashes
    countries.forEach(({ prefix }) => {
      const countryPart = prefix ? `/${prefix}` : '';
      staticPages.forEach((page) => {
        const pagePart = page ? `/${page}` : '';
        let loc = '';
        if (!countryPart && !pagePart) {
          loc = 'https://naisiaetextiles.com/';
        } else {
          loc = `https://naisiaetextiles.com${countryPart}${pagePart}/`;
        }
        
        let priority = '0.50';
        let changefreq = 'weekly';

        if (page === '') {
          priority = '1.00';
          changefreq = 'daily';
        } else if (['services', 'products'].includes(page)) {
          priority = '0.90';
          changefreq = 'weekly';
        } else if (['categories', 'wholesale', 'fabric-gallery'].includes(page)) {
          priority = '0.85';
          changefreq = 'weekly';
        } else if (['portfolio', 'contact'].includes(page)) {
          priority = '0.80';
          changefreq = page === 'contact' ? 'monthly' : 'weekly';
        } else if (['about', 'blog'].includes(page)) {
          priority = '0.60';
          changefreq = page === 'about' ? 'monthly' : 'weekly';
        } else if (['faq', 'uniform-simulator'].includes(page)) {
          priority = '0.50';
          changefreq = 'monthly';
        } else if (['careers'].includes(page)) {
          priority = '0.40';
          changefreq = 'monthly';
        } else if (['privacy', 'terms', 'shipping', 'returns'].includes(page)) {
          priority = '0.10';
          changefreq = 'yearly';
        }

        xml += `  <url>\n`;
        xml += `    <loc>${loc}</loc>\n`;
        xml += `    <changefreq>${changefreq}</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        if (page === 'categories') {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>https://naisiaetextiles.com/src/assets/images/category_school_1782334810884.jpg</image:loc>\n`;
          xml += `      <image:title>School Uniforms - Naisiae Textiles</image:title>\n`;
          xml += `      <image:caption>Premium high-performance custom-tailored primary and secondary school uniforms manufactured at Uhuru Market, Nairobi, Kenya.</image:caption>\n`;
          xml += `    </image:image>\n`;
          xml += `    <image:image>\n`;
          xml += `      <image:loc>https://naisiaetextiles.com/src/assets/images/category_corporate_1782334824455.jpg</image:loc>\n`;
          xml += `      <image:title>Corporate Wear - Naisiae Textiles</image:title>\n`;
          xml += `      <image:caption>Expertly crafted corporate office wear, executive suits, custom blazers, and staff shirts.</image:caption>\n`;
          xml += `    </image:image>\n`;
          xml += `    <image:image>\n`;
          xml += `      <image:loc>https://naisiaetextiles.com/src/assets/images/category_medical_1782334767056.jpg</image:loc>\n`;
          xml += `      <image:title>Healthcare &amp; Medical Scrubs - Naisiae Textiles</image:title>\n`;
          xml += `      <image:caption>Comfortable and antibacterial medical scrubs, laboratory coats, and hospital uniform supply.</image:caption>\n`;
          xml += `    </image:image>\n`;
          xml += `    <image:image>\n`;
          xml += `      <image:loc>https://naisiaetextiles.com/src/assets/images/category_hospitality_1782334781502.jpg</image:loc>\n`;
          xml += `      <image:title>Hospitality &amp; Catering Uniforms - Naisiae Textiles</image:title>\n`;
          xml += `      <image:caption>Elegant hotel staff wear, chef coats, catering vests, and apron sets.</image:caption>\n`;
          xml += `    </image:image>\n`;
          xml += `    <image:image>\n`;
          xml += `      <image:loc>https://naisiaetextiles.com/src/assets/images/category_industrial_1782334796806.jpg</image:loc>\n`;
          xml += `      <image:title>Industrial &amp; Workwear Uniforms - Naisiae Textiles</image:title>\n`;
          xml += `      <image:caption>Heavy-duty dust coats, industrial overalls, security uniforms, and high-visibility safety clothing.</image:caption>\n`;
          xml += `    </image:image>\n`;
          xml += `    <image:image>\n`;
          xml += `      <image:loc>https://naisiaetextiles.com/src/assets/images/category_sports_1782334837561.jpg</image:loc>\n`;
          xml += `      <image:title>Sports Kits &amp; Branded Games Kits - Naisiae Textiles</image:title>\n`;
          xml += `      <image:caption>Custom-designed sublimation sports jerseys, school physical education kits, and tracksuits.</image:caption>\n`;
          xml += `    </image:image>\n`;
        }
        xml += `  </url>\n`;
      });
    });

    // 1b. Add explicit regional entry-points
    const regionalEntryPoints = [
      { loc: 'https://naisiaetextiles.com/tanzania/', changefreq: 'weekly', priority: '0.75' },
      { loc: 'https://naisiaetextiles.com/dr-congo/', changefreq: 'weekly', priority: '0.75' },
      { loc: 'https://naisiaetextiles.com/uganda/', changefreq: 'weekly', priority: '0.75' },
      { loc: 'https://naisiaetextiles.com/ethiopia/', changefreq: 'weekly', priority: '0.75' }
    ];

    regionalEntryPoints.forEach(region => {
      xml += `  <url>\n`;
      xml += `    <loc>${region.loc}</loc>\n`;
      xml += `    <changefreq>${region.changefreq}</changefreq>\n`;
      xml += `    <priority>${region.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // 2. Dynamic products with country prefixing and trailing slashes
    countries.forEach(({ prefix }) => {
      const countryPart = prefix ? `/${prefix}` : '';
      productsList.forEach((doc: any) => {
        try {
          const id = doc.name.split('/').pop();
          if (!id) return;
          const loc = `https://naisiaetextiles.com${countryPart}/product/${id}/`;
          xml += `  <url>\n`;
          xml += `    <loc>${loc}</loc>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.9</priority>\n`;
          xml += `  </url>\n`;
        } catch (err) {}
      });
    });

    // 3. Dynamic blog posts with country prefixing
    countries.forEach(({ prefix }) => {
      const countryPart = prefix ? `/${prefix}` : '';
      blogsList.forEach((doc: any) => {
        try {
          const fields = doc.fields;
          const slug = fields.slug?.stringValue || doc.name.split('/').pop();
          const loc = `https://naisiaetextiles.com${countryPart}/blog/?post=${slug}`;
          xml += `  <url>\n`;
          xml += `    <loc>${loc}</loc>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.7</priority>\n`;
          xml += `  </url>\n`;
        } catch (err) {}
      });
    });

    xml += `</urlset>`;
    return res.status(200).send(xml);
  });

  // Unified SEO & SPA Catch-all Middleware (Placed after static assets)
  app.get('*', async (req, res, next) => {
    // 1. Skip API routes
    if (req.path.startsWith('/api/')) return next();
    
    // 2. Skip static files (look for extensions) - Safety belt
    if (path.extname(req.path)) return next();

    try {
      const requestPath = req.path;
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      let projectId = "";
      let databaseId = "(default)";

      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        projectId = config.projectId;
        databaseId = config.firestoreDatabaseId || "(default)";
      } else {
        // Fallback to env vars if config file is missing
        projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "";
        databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)";
      }

      if (!projectId) {
        console.warn("Missing Project ID for SEO pre-fetching. Render will continue with defaults.");
        return next();
      }

      // Localized routing parameters mapping
      const countriesList = [
        { key: 'ke', name: 'Kenya', code: 'KE', phone: '+254792021795', currency: 'KES' },
        { key: 'kenya', name: 'Kenya', code: 'KE', phone: '+254792021795', currency: 'KES' },
        { key: 'tz', name: 'Tanzania', code: 'TZ', phone: '+255792021795', currency: 'TZS' },
        { key: 'tanzania', name: 'Tanzania', code: 'TZ', phone: '+255792021795', currency: 'TZS' },
        { key: 'cd', name: 'Democratic Republic of Congo', code: 'CD', phone: '+243792021795', currency: 'USD' },
        { key: 'drc', name: 'Democratic Republic of Congo', code: 'CD', phone: '+243792021795', currency: 'USD' },
        { key: 'congo', name: 'Democratic Republic of Congo', code: 'CD', phone: '+243792021795', currency: 'USD' },
        { key: 'ug', name: 'Uganda', code: 'UG', phone: '+256792021795', currency: 'UGX' },
        { key: 'uganda', name: 'Uganda', code: 'UG', phone: '+256792021795', currency: 'UGX' },
        { key: 'et', name: 'Ethiopia', code: 'ET', phone: '+251792021795', currency: 'ETB' },
        { key: 'ethiopia', name: 'Ethiopia', code: 'ET', phone: '+251792021795', currency: 'ETB' }
      ];

      let matchedCountry = countriesList[0]; // Default to Kenya
      let relativePath = requestPath;

      // Extract country prefix from path segments
      const pathSegments = requestPath.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const possiblePrefix = pathSegments[0].toLowerCase();
        const found = countriesList.find(c => c.key === possiblePrefix);
        if (found) {
          matchedCountry = found;
          relativePath = '/' + pathSegments.slice(1).join('/');
        }
      }

      // Normalize relativePath trailing slashes
      if (relativePath.endsWith('/') && relativePath !== '/') {
        relativePath = relativePath.slice(0, -1);
      }

      const countrySuffix = matchedCountry.code === 'KE' ? ' - Nairobi, DRC, TZ, UG, ETH' : ` in ${matchedCountry.name}`;
      const countryDescriptionSuffix = matchedCountry.code === 'KE' ? ', In Nairobi, DRC, TZ, UG, ETH' : ` in ${matchedCountry.name}`;

      let title = `Uhuru Market Uniforms${countrySuffix} | Naisiae Textiles`;
      let description = `Official Uhuru Market Uniforms by Naisiae Textiles. School uniforms, corporate wear, and industrial branding${countryDescriptionSuffix}.`;
      let imageUrl = "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&h=630&q=80";
      let type = "website";

      // 1. Pre-fetch Site Settings
      let siteSettings = {
        siteName: "Uhuru Market Uniforms",
        siteTagline: "Naisiae Textiles",
        siteLogo: "",
        sharingImage: "",
        sharingTitle: "",
        sharingDescription: ""
      };

      try {
        const settingsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/settings/site`;
        const settingsResponse = await fetch(settingsUrl);
        const settingsData = await settingsResponse.json();
        
        if (settingsData.fields) {
          siteSettings = {
            siteName: settingsData.fields.siteName?.stringValue || "Uhuru Market Uniforms",
            siteTagline: settingsData.fields.siteTagline?.stringValue || "Naisiae Textiles",
            siteLogo: settingsData.fields.siteLogo?.stringValue || "",
            sharingImage: settingsData.fields.sharingImage?.stringValue || "",
            sharingTitle: settingsData.fields.sharingTitle?.stringValue || "",
            sharingDescription: settingsData.fields.sharingDescription?.stringValue || ""
          };
        }
      } catch (e) {}

      // 2. Specific Route Logic
      let productInfo: any = null;
      if (relativePath.startsWith('/product/')) {
        const productId = relativePath.split('/')[2];
        if (productId) {
          try {
            const productUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/products/${productId}`;
            const pResp = await fetch(productUrl);
            const pData = await pResp.json();
            if (pData.fields) {
              productInfo = pData.fields;
              const name = pData.fields.name?.stringValue || "Uniform";
              const pPrice = pData.fields.price?.doubleValue || pData.fields.price?.integerValue || 0;
              title = `${name}${countrySuffix} | Uhuru Market Uniforms Shop`;
              description = pData.fields.description?.stringValue || description;
              imageUrl = pData.fields.imageUrl?.stringValue || imageUrl;
              type = "product";
              // Add keywords to title
              if (pPrice > 0) title = `${name} (${pPrice.toLocaleString()}/-)${countrySuffix} | Uhuru Market Uniforms`;
            }
          } catch (e) {}
        }
      } else if (relativePath === '/' || relativePath === '') {
        title = siteSettings.sharingTitle || `Uhuru Market Uniforms${countrySuffix} | Naisiae Textiles`;
        description = siteSettings.sharingDescription || description;
        imageUrl = siteSettings.sharingImage || siteSettings.siteLogo || imageUrl;
      } else if (relativePath === '/products') {
        title = `Uhuru Market Uniforms | Our Uniform Products${countrySuffix}`;
        description = `Browse our full catalog of custom-tailored garments${countryDescriptionSuffix}. High-quality primary & secondary school uniforms, games kits, and specialized corporate wear.`;
      } else if (relativePath === '/categories') {
        title = `Uhuru Market Uniforms | Uniform Categories & Options${countrySuffix}`;
        description = `Explore our uniform manufacturing categories${countryDescriptionSuffix} including Education, Hospitality, Medical, Security, and Corporate branding solutions.`;
      } else if (relativePath === '/services') {
        title = `Uhuru Market Uniforms | Bulk Manufacturing & Branding Services${countrySuffix}`;
        description = `From heavy-duty industrial stitching to custom embroidery and screen printing${countryDescriptionSuffix}. Discover our mass-scale textile production capabilities.`;
      } else if (relativePath === '/portfolio') {
        title = `Uhuru Market Uniforms | Our Work & Past Projects${countrySuffix}`;
        description = `See examples of bulk uniform orders we have successfully delivered${countryDescriptionSuffix}. Check out our design quality and finished tailoring work.`;
      } else if (relativePath === '/contact') {
        title = `Uhuru Market Uniforms | Contact Us & Visit Workshop${countrySuffix}`;
        description = `Get a custom apparel supply quote today. Visit us at Uhuru Market Along Jogoo Road, Nairobi, or call us directly at ${matchedCountry.phone}.`;
      } else if (relativePath === '/about') {
        title = `Uhuru Market Uniforms | Our Story & Manufacturing Heritage${countrySuffix}`;
        description = `Learn about Naisiae Textiles' premium uniform craftsmanship, raw material grading & community-driven production${countryDescriptionSuffix}.`;
      } else if (relativePath === '/wholesale') {
        title = `Uhuru Market Uniforms | Institutional Bulk Orders & Wholesale Request${countrySuffix}`;
        description = `Request contract pricing on high-volume uniform supply for schools, hospitals, security agencies, and hospitality brands${countryDescriptionSuffix}. Min. 50 units.`;
      } else if (relativePath === '/checkout') {
        title = `Uhuru Market Uniforms | Review Bulk Sourcing & Checkout${countrySuffix}`;
        description = `Step-by-step verification of your wholesale inquiries, customizable branding preferences, and secure client profile syncing${countryDescriptionSuffix}.`;
      } else if (relativePath === '/privacy') {
        title = `Uhuru Market Uniforms | Privacy Policy${countrySuffix}`;
        description = `We respect and safeguard our clients' organizational and personal details under data protection regulations${countryDescriptionSuffix}.`;
      } else if (relativePath === '/terms') {
        title = `Uhuru Market Uniforms | Terms of Service & Manufacturing Contracts${countrySuffix}`;
        description = `Understand bulk order production terms, factory SLA timelines, quality inspection standards, and contract invoicing procedures${countryDescriptionSuffix}.`;
      } else if (relativePath === '/shipping') {
        title = `Uhuru Market Uniforms | Shipping, Nationwide Logistics & Pickup${countrySuffix}`;
        description = `Find shipping estimates, prompt direct courier networks, and convenient self-pickup instructions${countryDescriptionSuffix}.`;
      } else if (relativePath === '/returns') {
        title = `Uhuru Market Uniforms | Returns Policy & Quality Guarantee${countrySuffix}`;
        description = `Read our terms for size corrections, fitting alterations, and manufacturing defect policies under our comprehensive quality assurance program${countryDescriptionSuffix}.`;
      } else if (relativePath === '/blog' || relativePath === '/blog/') {
        title = `Uhuru Market Uniforms | Industry Guides & Sourcing Logbook${countrySuffix}`;
        description = `Expert advice and detailed logbooks on uniform fabrics, embroidery quality parameters, and direct-factory school uniform procurement${countryDescriptionSuffix}.`;
      } else if (relativePath === '/faq' || relativePath === '/faq/') {
        title = `Uhuru Market Uniforms | Frequently Asked Questions & Support${countrySuffix}`;
        description = `Read answers about minimum order quantities (MOQs), fabric choices, corporate customization, and regional supply queries${countryDescriptionSuffix}.`;
      } else if (relativePath === '/careers' || relativePath === '/careers/') {
        title = `Uhuru Market Uniforms | Careers & Tailoring Opportunities${countrySuffix}`;
        description = `Join our production team. Inspect open sewing, embroidery machine operations, and quality inspection roles${countryDescriptionSuffix}.`;
      } else if (relativePath.startsWith('/admin')) {
        title = `Admin Core${countrySuffix} | Uhuru Market Uniforms Management`;
        description = "Management gateway for Naisiae Sync Protocols.";
      }

      // JSON-LD Structured Data Graph List
      const schemasList: any[] = [];

      let canonicalPath = requestPath;
      if (!canonicalPath.endsWith('/')) {
        canonicalPath += '/';
      }
      const canonicalUrl = `https://naisiaetextiles.com${canonicalPath}`;

      // 1. WebPage Schema for every single page
      const webPageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": title,
        "description": description,
        "isPartOf": {
          "@type": "WebSite",
          "@id": "https://naisiaetextiles.com/#website",
          "name": "Uhuru Market Uniforms (Naisiae Textiles)",
          "url": "https://naisiaetextiles.com/"
        }
      };
      schemasList.push(webPageSchema);

      // 2. BreadcrumbList Schema for every single page
      const breadcrumbs = [
        { name: "Home", item: "https://naisiaetextiles.com/" }
      ];

      if (requestPath !== '/') {
        const segments = requestPath.split('/').filter(Boolean);
        let currPath = '';
        segments.forEach((seg) => {
          currPath += `/${seg}`;
          let formattedName = seg.charAt(0).toUpperCase() + seg.slice(1);
          if (seg === 'faq') formattedName = "FAQ";
          if (seg === 'wholesale') formattedName = "Bulk Wholesale";
          breadcrumbs.push({
            name: formattedName,
            item: `https://naisiaetextiles.com${currPath}/`
          });
        });
      }

      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((b, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": b.name,
          "item": b.item
        }))
      };
      schemasList.push(breadcrumbSchema);

      // 3. LocalBusiness base schema
      const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Uhuru Market Uniforms (Naisiae Textiles)",
        "image": siteSettings.siteLogo || imageUrl,
        "@id": "https://naisiaetextiles.com/#localbusiness",
        "url": "https://naisiaetextiles.com/",
        "telephone": "+254792021795",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Uhuru Market, Jogoo Road",
          "addressLocality": "Nairobi",
          "addressCountry": "KE"
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
          ],
          "opens": "08:00",
          "closes": "18:00"
        },
        "sameAs": [
          "https://facebook.com/naisiaetextiles",
          "https://instagram.com/naisiaetextiles"
        ]
      };
      schemasList.push(localBusinessSchema);

      // 4. Offer catalogs or Specific Schemas
      if (type === 'product' && productInfo) {
        const pPrice = productInfo.price?.doubleValue || productInfo.price?.integerValue || 0;
        const productSchema = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": productInfo.name?.stringValue || "School Uniform",
          "description": productInfo.description?.stringValue || description,
          "image": imageUrl,
          "sku": requestPath.split('/')[2],
          "brand": {
            "@type": "Brand",
            "name": "UHURU MARKET UNIFORMS"
          },
          "offers": {
            "@type": "Offer",
            "url": canonicalUrl,
            "priceCurrency": "KES",
            "price": pPrice,
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {
              "@type": "Organization",
              "name": siteSettings.siteName
            }
          }
        };
        schemasList.push(productSchema);
      }

      // 5. Service Schema for /services/
      if (requestPath === '/services' || requestPath === '/services/') {
        const serviceSchema = {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Uniform Manufacturing & Industrial Branding",
          "serviceType": "Apparel Sourcing",
          "provider": {
            "@type": "LocalBusiness",
            "name": "Uhuru Market Uniforms (Naisiae Textiles)",
            "image": siteSettings.siteLogo || imageUrl,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Uhuru Market, Jogoo Road",
              "addressLocality": "Nairobi",
              "addressCountry": "KE"
            },
            "telephone": "+254792021795"
          },
          "areaServed": "Kenya",
          "description": "Premium industrial embroidery, high-speed custom stitching, and pattern grading for schools, healthcare centers, and security agencies."
        };
        schemasList.push(serviceSchema);
      }

      // 6. BlogPosting Schema for /blog
      if (requestPath === '/blog' || requestPath.startsWith('/blog')) {
        const blogSchema = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl
          },
          "headline": title.split('|')[0].trim(),
          "description": description,
          "image": imageUrl,
          "author": {
            "@type": "Organization",
            "name": "Naisiae Textiles Development Team"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Uhuru Market Uniforms (Naisiae Textiles)",
            "logo": {
              "@type": "ImageObject",
              "url": "https://naisiaetextiles.com/logo.png"
            }
          },
          "datePublished": "2026-06-07T00:00:00Z"
        };
        schemasList.push(blogSchema);
      }

      // 7. FAQPage Schema for /faq
      if (requestPath === '/faq' || requestPath === '/faq/') {
        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is your Minimum Order Quantity (MOQ) for bulk orders?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our standard minimum order quantity for custom institutional uniforms, hospital scrubs, and corporate wear is 50 units. This allows us to offer direct-factory rates."
              }
            },
            {
              "@type": "Question",
              "name": "Where is Naisiae Textiles located within Uhuru Market?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We are proudly located at the heart of Uhuru Market along Jogoo Road, Nairobi, Kenya. Visitors are welcome for fittings."
              }
            },
            {
              "@type": "Question",
              "name": "Do you offer custom school embroidery?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, we specialize in high-density computerized embroidery and active sportswear screen printing."
              }
            }
          ]
        };
        schemasList.push(faqSchema);
      }

      // 8. JobPosting Schema for /careers
      if (requestPath === '/careers' || requestPath === '/careers/') {
        const jobSchema = {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Industrial Tailoring Specialist (Lead Cutter)",
          "description": "Draft master patterns, optimize heavy fabric cutting blocks, and supervise assembly lines at Uhuru Market production floor.",
          "datePosted": "2026-06-07",
          "hiringOrganization": {
            "@type": "Organization",
            "name": "Naisiae Textiles",
            "sameAs": "https://naisiaetextiles.com/"
          },
          "jobLocation": {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Uhuru Market, Jogoo Road",
              "addressLocality": "Nairobi",
              "addressCountry": "KE"
            }
          },
          "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "KES",
            "value": {
              "@type": "QuantitativeValue",
              "minValue": 35000,
              "maxValue": 45000,
              "unitText": "MONTH"
            }
          },
          "employmentType": "FULL_TIME"
        };
        schemasList.push(jobSchema);
      }

      // 3. Serve and Transform HTML
      const indexHtmlPath = process.env.NODE_ENV === "production" 
        ? path.join(process.cwd(), "dist/index.html")
        : path.join(process.cwd(), "index.html");
      
      if (!fs.existsSync(indexHtmlPath)) return next();
      
      let html = fs.readFileSync(indexHtmlPath, "utf-8");
      
      const logoUrl = siteSettings.siteLogo;
      const preloadTags = logoUrl ? `<link rel="preload" as="image" href="${logoUrl}" fetchpriority="high">` : "";
      const injectSettings = `<script>window.__PRELOADED_SETTINGS__ = ${JSON.stringify(siteSettings)};</script>`;
      const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(schemasList.length === 1 ? schemasList[0] : schemasList)}</script>`;
      const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
      
      // We use a clean and complete replacement strategy to avoid duplicate headers or metadata.
      // Remove any previously declared meta elements and social cards in index.html template first
      html = html.replace(/<title>.*?<\/title>/, "");
      html = html.replace(/<meta name="description".*?\/>/, "");
      html = html.replace(/<meta name="keywords".*?\/>/, "");
      html = html.replace(/<meta name="robots".*?\/>/, "");
      html = html.replace(/<link rel="canonical".*?\/>/, "");
      html = html.replace(/<meta property="og:.*?\/>/g, "");
      html = html.replace(/<meta name="twitter:.*?\/>/g, "");
      html = html.replace(/<meta property="twitter:.*?\/>/g, "");
      
      const isPrivatePath = relativePath === '/checkout' || relativePath === '/login' || relativePath.startsWith('/admin');
      const robotsDirective = isPrivatePath 
        ? 'noindex, nofollow, noarchive' 
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

      const combinedMeta = `
        <title>${title}</title>
        <meta name="description" content="${description}" />
        <meta name="keywords" content="Uhuru Market Uniforms, School Uniforms Nairobi, Naisiae Textiles, Industrial Uniforms Kenya, Hospital Scrubs Nairobi, Corporate Wear Kenya, Uhuru Market Textile hub, Best school uniforms Nairobi" />
        <meta name="robots" content="${robotsDirective}" />
        ${canonicalTag}
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:site_name" content="Uhuru Market Uniforms" />
        <meta property="og:url" content="${canonicalUrl}" />
        <meta property="og:type" content="${type}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${imageUrl}" />
        <meta name="author" content="Naisiae Textiles" />
        <meta name="geo.region" content="${matchedCountry.code === 'KE' ? 'KE-110' : matchedCountry.code}" />
        <meta name="geo.placename" content="${matchedCountry.code === 'KE' ? 'Nairobi' : matchedCountry.name}" />
        ${preloadTags}
        ${injectSettings}
        ${jsonLdScript}
      `;
      
      // Inject into head
      html = html.replace(/<head>/, `<head>\n${combinedMeta}`);

      // 4. Dynamic Static Real HTML Prerendering into <div id="root"> for web crawlers
      const renderHeader = `
        <header style="padding: 20px; background: #0E121C; border-bottom: 1px solid rgba(255,255,255,0.05); font-family: sans-serif;">
          <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
            <a href="/" style="font-size: 20px; font-weight: bold; color: #fff; text-decoration: none;">UHURU MARKET UNIFORMS</a>
            <nav style="display: flex; gap: 20px;">
              <a href="/products/" style="color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px;">Products</a>
              <a href="/services/" style="color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px;">Services</a>
              <a href="/portfolio/" style="color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px;">Portfolio</a>
              <a href="/blog/" style="color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px;">Logbook</a>
              <a href="/faq/" style="color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px;">FAQ</a>
              <a href="/careers/" style="color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px;">Careers</a>
              <a href="/contact/" style="color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px;">Contact</a>
            </nav>
          </div>
        </header>
      `;

      const renderFooter = `
        <footer style="padding: 40px 20px; background: #0E121C; color: rgba(255,255,255,0.5); border-top: 1px solid rgba(255,255,255,0.05); font-size: 12px; text-align: center; line-height: 1.6; font-family: sans-serif;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <p style="font-weight: bold; color: #fff; margin-bottom: 5px;">Uhuru Market Uniforms (Naisiae Textiles) - ${matchedCountry.name} Hub</p>
            <p>Physical Address: Uhuru Market along Jogoo Road, Nairobi, Kenya (Regional Shipping to ${matchedCountry.name})</p>
            <p>Sourcing Desk Phone: ${matchedCountry.phone} | Email: naisiaetext@gmail.com</p>
            <p style="margin-top: 15px;">&copy; 2026 Naisiae Textiles. All rights reserved. High-fidelity Regionalized Prerendering.</p>
          </div>
        </footer>
      `;

      let mainContent = "";

      if (relativePath === '/' || relativePath === '') {
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; font-family: sans-serif; color: #fff; text-align: left;">
            <section style="margin-bottom: 60px;">
              <h1 style="font-size: 48px; font-weight: 900; line-height: 1.1; margin-bottom: 20px;">UHURU MARKET UNIFORMS & Institutional Apparel</h1>
              <p style="font-size: 18px; color: rgba(255,255,255,0.7); line-height: 1.6; max-width: 800px; margin-bottom: 30px;">
                Official Uhuru Market Uniforms by Naisiae Textiles. The premier bulk uniform manufacturer along Jogoo Road, Nairobi. Bypassing middle-men to supply high-performance school uniforms, computerized embroidery, screen-printed games kits, medical hospital scrubs, and workwear jackets at factory rates in ${matchedCountry.name}.
              </p>
              <div style="display: flex; gap: 15px;">
                <a href="/products/" style="background: #C8102E; color: #fff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Browse Catalog</a>
                <a href="/wholesale/" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Wholesale Requests</a>
              </div>
            </section>

            <section style="margin-bottom: 60px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 30px; border-radius: 20px;">
                <h2 style="font-size: 20px; color: #C8961A; margin-bottom: 10px;">Primary & Secondary Uniforms</h2>
                <p style="font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.5;">Made with heavy-duty fibers, pre-shrunk, fade-resistant. Tailored for active daily classroom and playground wear, distributed across ${matchedCountry.name}.</p>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 30px; border-radius: 20px;">
                <h2 style="font-size: 20px; color: #C8961A; margin-bottom: 10px;">Industrial Embroidery</h2>
                <p style="font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.5;">High-density computerized badge stitches, hospital scrubs branding, and company logo alignments that outlast the garment.</p>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 30px; border-radius: 20px;">
                <h2 style="font-size: 20px; color: #C8961A; margin-bottom: 10px;">Direct Sourcing & Tenders</h2>
                <p style="font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.5;">Direct procurement desk supplying school boards and public organizations with tender-grade materials across ${matchedCountry.name}.</p>
              </div>
            </section>
          </main>
        `;
      } else if (relativePath === '/products' || relativePath === '/products/') {
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; color: #fff; font-family: sans-serif;">
            <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">Our Uniform Catalog for ${matchedCountry.name}</h1>
            <p style="color: rgba(255,255,255,0.6); margin-bottom: 40px;">Direct-factory institutional uniforms tailored at Naisiae Textiles workshop with direct supply to ${matchedCountry.name}.</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px;">
              <article style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                <h3>Standard Primary School Shirt</h3>
                <p>Combed polyester-cotton blend, reinforced collar stitching.</p>
              </article>
              <article style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                <h3>Classic Secondary School Blazer</h3>
                <p>Heavy twill fabric with front computerized badge embroidery.</p>
              </article>
              <article style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                <h3>Premium Hospital Scrubs Suit</h3>
                <p>Chemical resistant microfiber layout with tailored side-pockets.</p>
              </article>
            </div>
          </main>
        `;
      } else if (relativePath === '/services' || relativePath === '/services/') {
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; color: #fff; font-family: sans-serif;">
            <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">Industrial Branding & Sourcing Services in ${matchedCountry.name}</h1>
            <p style="color: rgba(255,255,255,0.6); margin-bottom: 40px;">Professional apparel services on massive scales with extreme speed.</p>
            <ul>
              <li><strong>Bulk Sourcing & Manufacturing:</strong> Sourcing high-tensile threads, buttons and raw textures directly.</li>
              <li><strong>Computerized Embroidery:</strong> Speed and accuracy on badge embroidery.</li>
              <li><strong>Logo Screen Printing:</strong> Excellent plastisol ink stamping with vibrant colors.</li>
            </ul>
          </main>
        `;
      } else if (relativePath === '/faq' || relativePath === '/faq/') {
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; color: #fff; font-family: sans-serif;">
            <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 15px;">Frequently Asked Questions</h1>
            <p style="color: rgba(255,255,255,0.6); margin-bottom: 40px;">Answers on MOQs, clothing specs, and delivery channels to ${matchedCountry.name}.</p>
            <div>
              <div style="margin-bottom: 25px;">
                <h3 style="color: #C8961A;">What is the Minimum Order Quantity (MOQ)?</h3>
                <p>Our MOQ is 50 pieces for corporate apparel, school blazers, and scrubs supply.</p>
              </div>
              <div style="margin-bottom: 25px;">
                <h3 style="color: #C8961A;">Where are you located?</h3>
                <p>Uhuru Market along Jogoo Road, Nairobi, Kenya (Supporting shipping to ${matchedCountry.name}).</p>
              </div>
            </div>
          </main>
        `;
      } else if (relativePath === '/blog' || relativePath.startsWith('/blog')) {
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; color: #fff; font-family: sans-serif;">
            <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 15px;">Naisiae Logbook & Sourcing Guides</h1>
            <p style="color: rgba(255,255,255,0.6); margin-bottom: 40px;">Expert insights on school apparel planning and uniform fabrics in ${matchedCountry.name}.</p>
            <div>
              <h3>How to Choose High Performance School Fabric Blends</h3>
              <p>Polyester and cotton blending details and wear longevity parameters.</p>
            </div>
          </main>
        `;
      } else if (relativePath === '/careers' || relativePath === '/careers/') {
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; color: #fff; font-family: sans-serif;">
            <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 15px;">Tailoring Careers at Naisiae Textiles</h1>
            <p style="color: rgba(255,255,255,0.6); margin-bottom: 40px;">Inspect our open professional vacancies inside Uhuru Market Nairobi.</p>
          </main>
        `;
      } else {
        // Basic fallback for other pages
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; color: #fff; font-family: sans-serif;">
            <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 15px;">${title}</h1>
            <p style="color: rgba(255,255,255,0.7); line-height: 1.6;">${description}</p>
          </main>
        `;
      }

      const prerenderedContent = `
        ${renderHeader}
        ${mainContent}
        ${renderFooter}
      `;

      // Match the PRERENDER comment tags inside #root in index.html for a 100% accurate replacement
      html = html.replace(/<!--PRERENDER_START-->[\s\S]*?<!--PRERENDER_END-->/, prerenderedContent);
      
      // Dev transformations - CRITICAL for React mounting in dev
      if (process.env.NODE_ENV !== "production" && app.get('vite')) {
        const vite = app.get('vite');
        html = await vite.transformIndexHtml(req.originalUrl, html);
      }
      
      return res.send(html);
    } catch (e) {
      console.error("SEO Catch-all error:", e);
      next();
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // 5. Automatic background trigger to listen to Firestore 'blogs' changes and regenerate sitemap.xml dynamically
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      // Dynamically import client Firebase SDK to set up a polled monitor on port startup
      const { initializeApp } = await import("firebase/app");
      const { getFirestore, collection, getDocs, updateDoc, doc } = await import("firebase/firestore");
      
      const firebaseApp = initializeApp(firebaseConfig);
      const fsDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

      // Automated Price/Stock Migration from PDF
      const migrateProductsFromPdf = async () => {
        try {
          console.log("[PDF Price Sync] Accessing products collection for sync...");
          const snapshot = await getDocs(collection(fsDb, "products"));
          console.log(`[PDF Price Sync] Scanning ${snapshot.size} live products for layout updates...`);

          const mappings = [
            { match: /cardigan/i, category: /college/i, price: 1500, stock: 100 },
            { match: /sweater/i, category: /school/i, price: 1000, stock: 2000 },
            { match: /trouser/i, category: /school/i, price: 800, stock: 100 },
            { match: /shirt/i, category: /school/i, price: 500, stock: 50 },
            { match: /dress/i, category: /college/i, price: 1500, stock: 50 },
            { match: /apron/i, category: /college/i, price: 500, stock: 20 },
            { match: /sleepover/i, category: /college/i, price: 1000, stock: 100 },
            { match: /leg warmer/i, category: /school/i, price: 300, stock: 100 },
            { match: /scarf|scarfs/i, category: /school/i, price: 300, stock: 100 },
            { match: /muffin/i, category: /school/i, price: 300, stock: 200 },
            { match: /sock/i, category: /school/i, price: 200, stock: 200 },
            { match: /tie/i, category: /school/i, price: 100, stock: 100 },
            { match: /trouser/i, category: /chef/i, price: 1000, stock: 100 },
            { match: /chef jacket/i, category: /chef/i, price: 800, stock: 20 },
            { match: /labcoat/i, category: /college/i, price: 800, stock: 20 },
            { match: /blazer/i, category: /school/i, price: 2500, stock: 20 },
            { match: /tracksuit/i, category: /school/i, price: 1200, stock: 200 },
            { match: /fleece|jacket/i, category: /school/i, price: 1700, stock: 300 }
          ];

          let updatedCount = 0;
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const prodName = data.name || "";
            const prodCategory = data.category || "";

            // Find matching rule
            const rule = mappings.find(m => 
              m.match.test(prodName) && 
              (!m.category || m.category.test(prodCategory))
            );

            if (rule) {
              console.log(`[PDF Price Sync] Matching product found: "${prodName}". Old Price: ${data.price || 0}, New Price: ${rule.price}, Stock: ${rule.stock}`);
              await updateDoc(doc(fsDb, "products", docSnap.id), {
                price: rule.price,
                stock: rule.stock,
                updatedAt: new Date()
              });
              updatedCount++;
            }
          }
          console.log(`[PDF Price Sync] Complete! Successfully aligned ${updatedCount} products with current pricing model.`);
        } catch (migrationErr: any) {
          console.error("[PDF Price Sync] Pricing update check warning:", migrationErr.message);
        }
      };

      // Run product prices/stock updates initially on service wake-up
      migrateProductsFromPdf();
      
      console.log("[Sitemap Trigger] Registering automatic non-streaming polling trigger on 'blogs'...");
      let lastBlogCount = -1;
      let lastBlogIds = "";

      const checkBlogsAndGenerateSitemap = async () => {
        try {
          const snapshot = await getDocs(collection(fsDb, "blogs"));
          const currentCount = snapshot.size;
          const currentIds = snapshot.docs.map(doc => doc.id).sort().join(",");
          
          if (currentCount !== lastBlogCount || currentIds !== lastBlogIds) {
            console.log("[Sitemap Trigger] Database state change detected! Regenerating sitemap.xml...");
            lastBlogCount = currentCount;
            lastBlogIds = currentIds;
            
            const { exec } = await import("child_process");
            exec("npx tsx scripts/generate-sitemap.ts", (err, stdout, stderr) => {
              if (err) {
                console.error("[Sitemap Trigger] Error executing generate-sitemap script:", err);
              } else {
                console.log("[Sitemap Trigger] Sitemap generated successfully:", stdout.trim());
              }
            });
          }
        } catch (snapshotErr: any) {
          console.warn("[Sitemap Trigger] Query warning (possibly network or rules issues):", snapshotErr.message);
        }
      };

      // Run initially to generate immediately on startup
      checkBlogsAndGenerateSitemap();
      
      // Check every 5 minutes - completely eliminates long-lived idle gRPC stream timeout error notices
      setInterval(checkBlogsAndGenerateSitemap, 5 * 60 * 1000);

      // 6. Automatic background trigger to listen to Firestore 'products' changes and regenerate merchant-feed.xml dynamically
      console.log("[Merchant Feed Trigger] Registering automatic non-streaming polling trigger on 'products'...");
      let lastProductCount = -1;
      let lastProductIds = "";

      const checkProductsAndGenerateFeed = async () => {
        try {
          const snapshot = await getDocs(collection(fsDb, "products"));
          const currentCount = snapshot.size;
          // Map document IDs and updated timestamps if present to detect fine-grained changes
          const currentIds = snapshot.docs.map(doc => {
            const data = doc.data();
            const tag = data.updatedAt ? String(data.updatedAt.seconds || data.updatedAt) : "";
            return `${doc.id}:${tag}`;
          }).sort().join(",");
          
          if (currentCount !== lastProductCount || currentIds !== lastProductIds) {
            console.log("[Merchant Feed Trigger] Database product changes detected! Regenerating merchant feed...");
            lastProductCount = currentCount;
            lastProductIds = currentIds;
            
            const { exec } = await import("child_process");
            exec("npx tsx scripts/generate-merchant-feed.ts", (err, stdout, stderr) => {
              if (err) {
                console.error("[Merchant Feed Trigger] Error executing generate-merchant-feed script:", err);
              } else {
                console.log("[Merchant Feed Trigger] Merchant feed generated successfully:", stdout.trim());
              }
            });
          }
        } catch (snapshotErr: any) {
          console.warn("[Merchant Feed Trigger] Query warning (possibly network or rules issues):", snapshotErr.message);
        }
      };

      // Run initially on startup
      checkProductsAndGenerateFeed();
      setInterval(checkProductsAndGenerateFeed, 5 * 60 * 1000);
    } else {
      console.warn("[Sitemap Trigger] firebase-applet-config.json not found. Automated trigger skipped.");
    }
  } catch (triggerError: any) {
    console.error("[Sitemap Trigger] Non-blocking initialize failure:", triggerError.message);
  }
}

startServer();
