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

  // Dynamic Sitemap.xml endpoint (Placed before catch-all SPA routing)
  app.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    
    let blogsList: any[] = [];
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
        const blogsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/blogs`;
        const bResp = await fetch(blogsUrl);
        const bData = await bResp.json();
        if (bData.documents) {
          blogsList = bData.documents;
        }
      }
    } catch (e) {
      console.warn("Could not query blogs for sitemap live generation:");
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
      'returns'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static Pages with trailing slashes
    staticPages.forEach((page) => {
      const slash = page === '' ? '' : '/';
      xml += `  <url>\n`;
      xml += `    <loc>https://naisiaetextiles.com/${page}${slash}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Dynamic blog posts with trailing slashes
    blogsList.forEach((doc: any) => {
      try {
        const fields = doc.fields;
        const slug = fields.slug?.stringValue || doc.name.split('/').pop();
        xml += `  <url>\n`;
        xml += `    <loc>https://naisiaetextiles.com/blog/?post=${slug}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      } catch (err) {}
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

      let title = "UHURU MARKET UNIFORMS & Institutional Apparel | Naisiae Textiles Nairobi";
      let description = "Official Uhuru Market Uniforms by Naisiae Textiles. Premium school, corporate & medical uniform manufacturing in Nairobi, Kenya at direct factory rates.";
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
      } else if (requestPath === '/blog' || requestPath === '/blog/') {
        title = "Industry Guides & Sourcing Logbook | Uhuru Market Uniforms";
        description = "Expert advice and detailed logbooks on uniform fabrics, embroidery quality parameters, and direct-factory school uniform procurement in Kenya.";
      } else if (requestPath === '/faq' || requestPath === '/faq/') {
        title = "FAQ & Help Desk | Uhuru Market Uniforms Nairobi";
        description = "Find responses to bulk minimum order volumes, customizable fabric selections, and Tender bids matching Uhuru Market Nairobi specifications.";
      } else if (requestPath === '/careers' || requestPath === '/careers/') {
        title = "Staff Careers & Opportunities | Uhuru Market Uniforms";
        description = "Join our production team in Nairobi. Examine open straight sew machine operators, cutters, and quality check inspectors vacancies.";
      } else if (requestPath.startsWith('/admin')) {
        title = "Admin Core | Uhuru Market Uniforms Management";
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
        ${canonicalTag}
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:site_name" content="Uhuru Market Uniforms" />
        <meta property="og:url" content="${canonicalUrl}" />
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
            <p style="font-weight: bold; color: #fff; margin-bottom: 5px;">Uhuru Market Uniforms (Naisiae Textiles)</p>
            <p>Physical Address: Uhuru Market along Jogoo Road, Nairobi, Kenya</p>
            <p>Sourcing Desk Phone: +254 792 021 795 | Email: naisiaetext@gmail.com</p>
            <p style="margin-top: 15px;">&copy; 2026 Naisiae Textiles. All rights reserved. High-fidelity Prerendering Delivery.</p>
          </div>
        </footer>
      `;

      let mainContent = "";

      if (requestPath === '/' || requestPath === '') {
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; font-family: sans-serif; color: #fff; text-align: left;">
            <section style="margin-bottom: 60px;">
              <h1 style="font-size: 48px; font-weight: 900; line-height: 1.1; margin-bottom: 20px;">UHURU MARKET UNIFORMS & Institutional Apparel</h1>
              <p style="font-size: 18px; color: rgba(255,255,255,0.7); line-height: 1.6; max-width: 800px; margin-bottom: 30px;">
                Official Uhuru Market Uniforms by Naisiae Textiles. The premier bulk uniform manufacturer along Jogoo Road, Nairobi. Bypassing middle-men to supply high-performance school uniforms, computerized embroidery, screen-printed games kits, medical hospital scrubs, and workwear jackets at factory rates.
              </p>
              <div style="display: flex; gap: 15px;">
                <a href="/products/" style="background: #C8102E; color: #fff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Browse Catalog</a>
                <a href="/wholesale/" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Wholesale Requests</a>
              </div>
            </section>

            <section style="margin-bottom: 60px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 30px; border-radius: 20px;">
                <h2 style="font-size: 20px; color: #C8961A; margin-bottom: 10px;">Primary & Secondary Uniforms</h2>
                <p style="font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.5;">Made with heavy-duty fibers, pre-shrunk, fade-resistant. Tailored for active daily classroom and playground wear.</p>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 30px; border-radius: 20px;">
                <h2 style="font-size: 20px; color: #C8961A; margin-bottom: 10px;">Industrial Embroidery</h2>
                <p style="font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.5;">High-density computerized badge stitches, hospital scrubs branding, and company logo alignments that outlast the garment.</p>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 30px; border-radius: 20px;">
                <h2 style="font-size: 20px; color: #C8961A; margin-bottom: 10px;">Direct Sourcing & Tenders</h2>
                <p style="font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.5;">Direct procurement desk supplying school boards and public organizations with tender-grade materials across Kenya.</p>
              </div>
            </section>
          </main>
        `;
      } else if (requestPath === '/products' || requestPath === '/products/') {
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; color: #fff; font-family: sans-serif;">
            <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">Our Uniform Catalog</h1>
            <p style="color: rgba(255,255,255,0.6); margin-bottom: 40px;">Direct-factory institutional uniforms tailored at Naisiae Textiles workshop inside Uhuru Market Nairobi.</p>
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
      } else if (requestPath === '/services' || requestPath === '/services/') {
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; color: #fff; font-family: sans-serif;">
            <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 10px;">Industrial Branding & Sourcing Services</h1>
            <p style="color: rgba(255,255,255,0.6); margin-bottom: 40px;">Professional apparel services on massive scales with extreme speed.</p>
            <ul>
              <li><strong>Bulk Sourcing & Manufacturing:</strong> Sourcing high-tensile threads, buttons and raw textures directly.</li>
              <li><strong>Computerized Embroidery:</strong> Speed and accuracy on badge embroidery.</li>
              <li><strong>Logo Screen Printing:</strong> Excellent plastisol ink stamping with vibrant colors.</li>
            </ul>
          </main>
        `;
      } else if (requestPath === '/faq' || requestPath === '/faq/') {
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; color: #fff; font-family: sans-serif;">
            <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 15px;">Frequently Asked Questions</h1>
            <p style="color: rgba(255,255,255,0.6); margin-bottom: 40px;">Answers on MOQs, clothing specs, and delivery channels.</p>
            <div>
              <div style="margin-bottom: 25px;">
                <h3 style="color: #C8961A;">What is the Minimum Order Quantity (MOQ)?</h3>
                <p>Our MOQ is 50 pieces for corporate apparel, school blazers, and scrubs supply.</p>
              </div>
              <div style="margin-bottom: 25px;">
                <h3 style="color: #C8961A;">Where are you located?</h3>
                <p>Uhuru Market along Jogoo Road, Nairobi, Kenya.</p>
              </div>
            </div>
          </main>
        `;
      } else if (requestPath === '/blog' || requestPath.startsWith('/blog')) {
        mainContent = `
          <main style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; color: #fff; font-family: sans-serif;">
            <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 15px;">Naisiae Logbook & Sourcing Guides</h1>
            <p style="color: rgba(255,255,255,0.6); margin-bottom: 40px;">Expert insights on school apparel planning and uniform fabrics in Nairobi.</p>
            <div>
              <h3>How to Choose High Performance School Fabric Blends</h3>
              <p>Polyester and cotton blending details and wear longevity parameters.</p>
            </div>
          </main>
        `;
      } else if (requestPath === '/careers' || requestPath === '/careers/') {
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

      html = html.replace(/<div id="root"><\/div>/, `<div id="root">${prerenderedContent}</div>`);
      
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
      const { getFirestore, collection, getDocs } = await import("firebase/firestore");
      
      const firebaseApp = initializeApp(firebaseConfig);
      const fsDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      
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
    } else {
      console.warn("[Sitemap Trigger] firebase-applet-config.json not found. Automated trigger skipped.");
    }
  } catch (triggerError: any) {
    console.error("[Sitemap Trigger] Non-blocking initialize failure:", triggerError.message);
  }
}

startServer();
