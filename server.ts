import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
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
        model: "gemini-3-flash-preview",
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

  // API route to resolve social/short links (like Canva) to direct image URLs
  app.get("/api/resolve-image", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).json({ error: "Missing URL" });

    try {
      // Follow redirects to get the real page
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
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

      let title = "UHURU MARKET UNIFORMS | Official Naisiae Textiles Nairobi";
      let description = "Direct manufacturing of high-quality Uhuru Market Uniforms. Premium school uniforms, hospital scrubs, and corporate wear from Nairobi's textile hub. Bulk institution orders welcome.";
      let imageUrl = "https://naisiaetextiles.com/og-image.jpg";
      let type = "website";

      // 1. Pre-fetch Site Settings
      let siteSettings = {
        siteName: "Uhuru Market Uniforms",
        siteTagline: "Naisiae Textiles Nairobi",
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
            siteTagline: settingsData.fields.siteTagline?.stringValue || "Naisiae Textiles Nairobi",
            siteLogo: settingsData.fields.siteLogo?.stringValue || "",
            sharingImage: settingsData.fields.sharingImage?.stringValue || "",
            sharingTitle: settingsData.fields.sharingTitle?.stringValue || "",
            sharingDescription: settingsData.fields.sharingDescription?.stringValue || ""
          };
        }
      } catch (e) {}

      // 2. Specific Route Logic
      let productInfo: any = null;
      if (requestPath.startsWith('/product/')) {
        const productId = requestPath.split('/')[2];
        if (productId) {
          try {
            const productUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/products/${productId}`;
            const pResp = await fetch(productUrl);
            const pData = await pResp.json();
            if (pData.fields) {
              productInfo = pData.fields;
              const name = pData.fields.name?.stringValue || "Uniform";
              const pPrice = pData.fields.price?.doubleValue || pData.fields.price?.integerValue || 0;
              title = `${name} | Uhuru Market Uniforms Shop`;
              description = pData.fields.description?.stringValue || description;
              imageUrl = pData.fields.imageUrl?.stringValue || imageUrl;
              type = "product";
              // Add keywords to title
              if (pPrice > 0) title = `${name} (${pPrice.toLocaleString()}/-) | Uhuru Market Uniforms Kenya`;
            }
          } catch (e) {}
        }
      } else if (requestPath === '/') {
        title = siteSettings.sharingTitle || `${siteSettings.siteName} | ${siteSettings.siteTagline}`;
        description = siteSettings.sharingDescription || description;
        imageUrl = siteSettings.sharingImage || siteSettings.siteLogo || imageUrl;
      } else if (requestPath === '/products') {
        title = "Uniform Catalog | Uhuru Market Uniforms Nairobi";
        description = "Full industrial catalog of custom-tailored Uhuru Market Uniforms. Premium garments for primary, secondary schools and institutions.";
      } else if (requestPath === '/categories') {
        title = "Clothing Categories | Uhuru Market Uniforms";
        description = "Industrial categories: Education, Hospitality, Medical, and Corporate branding in Uhuru Market, Nairobi.";
      } else if (requestPath === '/services') {
        title = "Manufacturing Services | Uhuru Market Uniforms";
        description = "Bulk textile production, industrial embroidery and custom branding services at Uhuru Market, Nairobi.";
      } else if (requestPath === '/portfolio') {
        title = "Our Projects | Uhuru Market Uniforms Portfolio";
        description = "Successful mass-scale uniform deliveries to top institutions by Uhuru Market Uniforms.";
      } else if (requestPath === '/contact') {
        title = "Contact Us | Uhuru Market Uniforms Support";
        description = "Order Uhuru Market Uniforms. Call +254792021795 or visit our production floor in Nairobi.";
      } else if (requestPath === '/about') {
        title = "About Uhuru Market Uniforms | Naisiae Textiles";
        description = "The leading institutional uniform manufacturer at Uhuru Market Nairobi. Precision, quality, and heritage.";
      } else if (requestPath === '/wholesale') {
        title = "Wholesale & Tenders | Uhuru Market Uniforms";
        description = "Specialized bulk pricing for schools and hospitals. Direct factory-rates from Uhuru Market.";
      } else if (requestPath.startsWith('/admin')) {
        title = "Admin Core | Uhuru Market Uniforms Management";
        description = "Management gateway for Naisiae Sync Protocols.";
      }

      // JSON-LD Structured Data
      let jsonLd: any = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Uhuru Market Uniforms (Naisiae Textiles)",
        "image": siteSettings.siteLogo || imageUrl,
        "@id": "https://naisiaetextiles.com",
        "url": "https://naisiaetextiles.com",
        "telephone": "+254792021795",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Uhuru Market",
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

      if (type === 'product' && productInfo) {
        const pPrice = productInfo.price?.doubleValue || productInfo.price?.integerValue || 0;
        jsonLd = {
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
            "url": `https://naisiaetextiles.com${requestPath}`,
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
      const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
      const canonical = `<link rel="canonical" href="https://naisiaetextiles.com${requestPath}" />`;
      
      // We use a more careful replacement strategy:
      // Remove standard tags first if they exist
      html = html.replace(/<title>.*?<\/title>/, "");
      html = html.replace(/<meta name="description".*?\/>/, "");
      html = html.replace(/<link rel="canonical".*?\/>/, "");
      html = html.replace(/<meta property="og:title".*?\/>/g, "");
      html = html.replace(/<meta property="og:description".*?\/>/g, "");
      html = html.replace(/<meta property="og:image".*?\/>/g, "");
      
      const combinedMeta = `
        <title>${title}</title>
        <meta name="description" content="${description}" />
        <meta name="keywords" content="Uhuru Market Uniforms, School Uniforms Nairobi, Naisiae Textiles, Industrial Uniforms Kenya, Hospital Scrubs Nairobi, Corporate Wear Kenya, Uhuru Market Textile hub, Best school uniforms Nairobi" />
        ${canonical}
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:site_name" content="Uhuru Market Uniforms" />
        <meta property="og:url" content="https://naisiaetextiles.com${requestPath}" />
        <meta property="og:type" content="${type}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${imageUrl}" />
        <meta name="author" content="Naisiae Textiles" />
        <meta name="geo.region" content="KE-110" />
        <meta name="geo.placename" content="Nairobi" />
        <meta name="geo.position" content="-1.286389;36.817222" />
        <meta name="ICBM" content="-1.286389, 36.817222" />
        ${preloadTags}
        ${injectSettings}
        ${jsonLdScript}
      `;
      
      // Inject into head
      html = html.replace(/<head>/, `<head>\n${combinedMeta}`);

      // 4. Inject H1 into root for SEO crawlers (will be replaced by React on hydration)
      const seoH1 = `<h1 style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;">${title}</h1>`;
      html = html.replace(/<div id="root"><\/div>/, `<div id="root">${seoH1}</div>`);
      
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
}

startServer();
